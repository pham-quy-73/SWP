import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import ProductVariant from '../models/ProductVariant.js';
import { priceOrderItem, PricingError } from '../services/PricingService.js';
import { getClientBaseUrl } from '../utils/clientUrl.js';
import crypto from 'crypto';

/**
 * Xác thực chữ ký HMAC-SHA512 của VNPay trên query params.
 * @returns {{ valid: boolean, params: Object }} params đã loại bỏ SecureHash
 */
const verifyVnpSignature = (query, secretKey) => {
  const vnp_Params = { ...query };
  const secureHash = vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHashType'];

  const sortedParams = {};
  for (const key of Object.keys(vnp_Params).sort()) {
    sortedParams[key] = vnp_Params[key];
  }

  const signData = new URLSearchParams(sortedParams).toString();
  const signed = crypto.createHmac('sha512', secretKey)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');

  return { valid: secureHash === signed, params: vnp_Params };
};

/** Đơn có chứa tròng kính / đơn thuốc -> sau thanh toán cần kỹ thuật viên xác minh. */
const orderHasPrescription = async (order) => {
  const items = await OrderItem.find({ order_id: order._id });
  return items.some(item =>
    item.lens_id ||
    (item.prescription && (
      item.prescription.od_sphere || item.prescription.od_cylinder ||
      item.prescription.os_sphere || item.prescription.os_cylinder ||
      item.prescription.note
    ))
  ) || !!order.prescription_image;
};

/**
 * Phục hồi đơn đã bị cleanup job tự hủy (AUTO_EXPIRED) khi thanh toán hợp lệ
 * về muộn: trừ lại kho (có điều kiện $gte để không làm kho âm) rồi đưa đơn về
 * trạng thái sau-thanh-toán. Nếu kho đã bị đơn khác mua mất, giữ nguyên
 * CANCELLED nhưng ghi nhận PAID để lọt vào danh sách "đơn hủy đã thanh toán"
 * (RefundController.getCancelledPaidOrders) cho manager hoàn tiền.
 */
const recoverAutoExpiredOrder = async (order, txnNo) => {
  const items = await OrderItem.find({ order_id: order._id });

  const redecremented = [];
  let outOfStockItem = null;
  for (const item of items) {
    if (!item.variant_id) continue;
    const updated = await ProductVariant.findOneAndUpdate(
      { _id: item.variant_id, quantity: { $gte: item.quantity } },
      { $inc: { quantity: -item.quantity } },
      { new: true }
    );
    if (!updated) { outOfStockItem = item; break; }
    redecremented.push(item);
  }

  if (outOfStockItem) {
    // Không đủ kho để phục hồi: hoàn lại các variant vừa trừ, giữ CANCELLED
    // nhưng đánh dấu PAID để đi vào luồng hoàn tiền thủ công của manager.
    for (const item of redecremented) {
      await ProductVariant.findByIdAndUpdate(item.variant_id, {
        $inc: { quantity: item.quantity }
      });
    }
    order.payment_status = 'PAID';
    order.transaction_id = txnNo;
    order.paid_at = new Date();
    order.status_history.push({
      from_status: 'CANCELLED',
      to_status: 'CANCELLED',
      note: `PAYMENT_AFTER_EXPIRY_NO_STOCK: Thanh toán VNPay về muộn (Mã GD: ${txnNo}) nhưng tồn kho không còn đủ để phục hồi đơn. Cần hoàn tiền cho khách.`
    });
    await order.save();
    return { outcome: 'RECOVERED_NO_STOCK' };
  }

  const nextStatus = (await orderHasPrescription(order)) ? 'AWAITING_VERIFICATION' : 'CONFIRMED';
  order.status = nextStatus;
  order.payment_status = 'PAID';
  order.transaction_id = txnNo;
  order.paid_at = new Date();
  order.status_history.push({
    from_status: 'CANCELLED',
    to_status: nextStatus,
    note: `Phục hồi đơn bị tự hủy quá hạn: thanh toán VNPay hợp lệ về muộn (Mã GD: ${txnNo}), đã trừ lại tồn kho.`
  });
  await order.save();
  return { outcome: 'RECOVERED' };
};

/**
 * [DÙNG CHUNG IPN + ReturnURL] Chốt kết quả thanh toán VNPay cho một đơn.
 * Idempotent: gọi lặp (IPN retry, user refresh ReturnURL) không đổi trạng thái thêm.
 *
 * @returns {{ outcome: 'SUCCESS'|'FAILED'|'RECOVERED'|'RECOVERED_NO_STOCK'|'ALREADY_PAID'|'ALREADY_FINALIZED'|'AMOUNT_MISMATCH' }}
 */
const settleVnpayResult = async (order, vnp_Params) => {
  const responseCode = vnp_Params['vnp_ResponseCode'];
  const txnNo = vnp_Params['vnp_TransactionNo'] || '';

  // Đối chiếu số tiền: VNPay gửi vnp_Amount = số tiền * 100.
  // Không tin số tiền từ callback; phải khớp với total_amount đã lưu ở DB.
  const expectedAmount = Math.round(order.total_amount * 100);
  const paidAmount = parseInt(vnp_Params['vnp_Amount'], 10);
  if (!Number.isFinite(paidAmount) || paidAmount !== expectedAmount) {
    console.error(`VNPay amount mismatch for order ${order._id}: expected ${expectedAmount}, got ${vnp_Params['vnp_Amount']}.`);
    return { outcome: 'AMOUNT_MISMATCH' };
  }

  // Đơn đã được chốt trước đó (IPN và ReturnURL cùng về, hoặc user refresh).
  if (order.status !== 'PENDING') {
    // CONFIRMED/AWAITING_VERIFICATION/COMPLETED chỉ đạt được sau khi thanh toán
    // -> coi là đã trả tiền dù payment_status có thể chưa đồng bộ (dữ liệu cũ).
    if (order.payment_status === 'PAID' ||
        ['CONFIRMED', 'AWAITING_VERIFICATION', 'COMPLETED'].includes(order.status)) {
      return { outcome: 'ALREADY_PAID' };
    }

    // Ca đặc biệt: đơn bị cleanup job tự hủy vì quá hạn, nhưng khách THẬT SỰ đã
    // trả tiền (thanh toán về muộn) -> phục hồi đơn thay vì nuốt tiền của khách.
    const wasAutoExpired = order.status === 'CANCELLED' &&
      (order.status_history || []).some(h =>
        h.to_status === 'CANCELLED' && typeof h.note === 'string' && h.note.startsWith('AUTO_EXPIRED')
      );
    if (responseCode === '00' && wasAutoExpired) {
      return recoverAutoExpiredOrder(order, txnNo);
    }

    return { outcome: 'ALREADY_FINALIZED' };
  }

  if (responseCode === '00') {
    const prevStatus = order.status;
    const nextStatus = (await orderHasPrescription(order)) ? 'AWAITING_VERIFICATION' : 'CONFIRMED';
    const statusNote = nextStatus === 'AWAITING_VERIFICATION'
      ? `Thanh toán thành công qua VNPay (Chờ kỹ thuật viên xác minh đơn kính - Mã GD: ${txnNo})`
      : `Thanh toán thành công qua VNPay (Mã GD: ${txnNo})`;

    order.status = nextStatus;
    order.payment_status = 'PAID';
    order.transaction_id = txnNo;
    order.paid_at = new Date();
    order.status_history.push({
      from_status: prevStatus,
      to_status: nextStatus,
      note: statusNote
    });
    await order.save();
    return { outcome: 'SUCCESS' };
  }

  // Giao dịch không thành công -> hủy đơn VÀ hoàn trả tồn kho
  // (đồng nhất với mockCheckout / cancelOrder / cleanup job).
  const items = await OrderItem.find({ order_id: order._id });
  for (const item of items) {
    if (item.variant_id) {
      await ProductVariant.findByIdAndUpdate(item.variant_id, {
        $inc: { quantity: item.quantity }
      });
    }
  }

  const prevStatus = order.status;
  order.status = 'CANCELLED';
  order.payment_status = 'UNPAID';
  order.status_history.push({
    from_status: prevStatus,
    to_status: 'CANCELLED',
    note: `Thanh toán thất bại qua VNPay (ResponseCode: ${responseCode}), đã hoàn kho`
  });
  await order.save();
  return { outcome: 'FAILED' };
};

class PaymentController {
  /**
   * Tính toán yêu cầu thanh toán (Cho khách hàng lúc checkout)
   *
   * [CHÍNH SÁCH THANH TOÁN] Hệ thống chỉ hỗ trợ thanh toán trước 100% cho MỌI
   * loại đơn (chỉ gọng lẫn gọng + tròng). Các field paymentPercentage /
   * remainingPaymentTotal tồn tại vì FE (OrderSummary) render chúng, nhưng giá
   * trị luôn cố định 1.0 / 0 — KHÔNG phải hệ thống hỗ trợ trả một phần.
   * Khác biệt giữa hai loại đơn chỉ nằm ở trạng thái SAU thanh toán:
   * chỉ gọng -> CONFIRMED, có tròng/toa thuốc -> AWAITING_VERIFICATION.
   */
  async getPaymentRequirement(req, res, next) {
    try {
      const { items } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error_code: 'VALIDATION_ERROR', message: 'Không có sản phẩm để tính toán' });
      }
      if (items.length > 50) {
        return res.status(400).json({ error_code: 'VALIDATION_ERROR', message: 'Không được vượt quá 50 dòng sản phẩm' });
      }

      let orderTotal = 0;
      const itemRequirements = [];

      for (const item of items) {
        // Cùng quy tắc quantity với createOrder: số nguyên >= 1 — chặn báo giá
        // âm/NaN do client gửi quantity bậy.
        const qty = Number(item.quantity);
        if (!Number.isInteger(qty) || qty < 1) {
          return res.status(400).json({
            error_code: 'VALIDATION_ERROR',
            message: `Số lượng sản phẩm không hợp lệ: ${item.quantity}`
          });
        }

        // Định giá theo giá DB qua PricingService (dùng chung với createOrder)
        // để số tiền báo lúc checkout khớp số tiền tính thật khi tạo đơn.
        const { basePrice, lensPrice, finalUnitPrice } = await priceOrderItem(item);
        const itemTotal = finalUnitPrice * qty;
        orderTotal += itemTotal;

        itemRequirements.push({
          productVariantId: item.productVariantId,
          lensId: item.lensId || null,
          unitPrice: basePrice,
          lensPrice,
          itemTotal,
          paymentPercentage: 1.0, // Luôn 1.0 — chính sách thanh toán trước 100% (xem doc đầu hàm)
          requiredPayment: itemTotal
        });
      }

      return res.status(200).json({
        code: 0,
        result: {
          orderTotal,
          requiredAmount: orderTotal,
          requiredPaymentTotal: orderTotal,
          remainingPaymentTotal: 0, // Luôn 0 — không hỗ trợ trả một phần
          itemRequirements
        }
      });
    } catch (error) {
      if (error instanceof PricingError) {
        return res.status(error.status).json(error.body);
      }
      next(error);
    }
  }

  /**
   * Khởi tạo link thanh toán VNPay (Cho khách hàng)
   */
  async checkout(req, res, next) {
    try {
      const orderId = req.query.orderId || req.body.orderId;
      if (!orderId) {
        return res.status(400).json({ error_code: 'VALIDATION_ERROR', message: 'Thiếu mã đơn hàng' });
      }

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ error_code: 'ORDER_NOT_FOUND', message: 'Không tìm thấy đơn hàng' });
      }

      // Chống IDOR: khách hàng chỉ được thanh toán đơn của chính mình.
      if (req.user.role === 'CUSTOMER' && order.user_id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error_code: 'FORBIDDEN', message: 'Bạn không có quyền thanh toán đơn hàng này' });
      }

      // Chỉ đơn PENDING mới được tạo link thanh toán:
      // - CONFIRMED/AWAITING_VERIFICATION/COMPLETED: đã thanh toán -> chặn trả tiền 2 lần.
      // - CANCELLED/REFUNDED: kho đã hoàn -> nếu để khách trả tiền sẽ mất tiền vô đơn chết.
      if (order.status !== 'PENDING') {
        return res.status(400).json({
          error_code: 'INVALID_STATUS',
          message: order.payment_status === 'PAID'
            ? 'Đơn hàng này đã được thanh toán.'
            : 'Đơn hàng không còn ở trạng thái chờ thanh toán.'
        });
      }

      const tmnCode = process.env.VNP_TMN_CODE;
      const secretKey = process.env.VNP_HASH_SECRET;
      const vnpUrl = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
      // VNPay redirect về đúng endpoint callback của backend: /api/payment/vnpay-callback.
      // Bắt buộc cấu hình qua VNP_RETURN_URL (khác host/port theo môi trường) — không hard-code.
      const returnUrl = process.env.VNP_RETURN_URL;

      if (!tmnCode || !secretKey || !returnUrl) {
        console.error('VNPay is not fully configured (VNP_TMN_CODE / VNP_HASH_SECRET / VNP_RETURN_URL).');
        return res.status(500).json({ error_code: 'CONFIG_ERROR', message: 'Cổng thanh toán chưa được cấu hình.' });
      }

      const date = new Date();
      // Format YYYYMMDDHHmmss
      const createDate = date.getFullYear().toString() +
        (date.getMonth() + 1).toString().padStart(2, '0') +
        date.getDate().toString().padStart(2, '0') +
        date.getHours().toString().padStart(2, '0') +
        date.getMinutes().toString().padStart(2, '0') +
        date.getSeconds().toString().padStart(2, '0');

      const ipAddr = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

      const vnp_Params = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: tmnCode,
        vnp_Locale: 'vn',
        vnp_CurrCode: 'VND',
        vnp_TxnRef: order._id.toString(),
        vnp_OrderInfo: `Thanh toan don hang ${order._id.toString()}`,
        vnp_OrderType: 'other',
        vnp_Amount: order.total_amount * 100, // VNPay expects amount multiplied by 100 (in cents)
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate
      };

      // Sort alphabetically by keys
      const sortedKeys = Object.keys(vnp_Params).sort();
      const sortedParams = {};
      for (const key of sortedKeys) {
        sortedParams[key] = vnp_Params[key];
      }

      const signData = new URLSearchParams(sortedParams).toString();
      const hmac = crypto.createHmac('sha512', secretKey);
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

      const paymentUrl = `${vnpUrl}?${signData}&vnp_SecureHash=${signed}`;

      // Đánh dấu khách vừa mở phiên thanh toán: cleanup job sẽ chừa đơn này
      // thêm 30 phút kể từ lúc tạo link (phiên VNPay có hạn riêng ~15 phút).
      order.payment_initiated_at = new Date();
      await order.save();

      return res.status(200).json({
        code: 0,
        result: paymentUrl
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ReturnURL từ VNPay: kênh HIỂN THỊ cho khách sau khi rời trang VNPay.
   * Vẫn chốt kết quả (settle) phòng khi IPN chưa kịp về, nhưng nguồn xác nhận
   * chính là IPN (vnpayIpn) — settle idempotent nên hai kênh không giẫm nhau.
   */
  async vnpayCallback(req, res, next) {
    try {
      const clientUrl = getClientBaseUrl();
      const secretKey = process.env.VNP_HASH_SECRET;

      if (!secretKey) {
        console.error('VNPay hash secret is not configured (VNP_HASH_SECRET).');
        return res.redirect(`${clientUrl}/checkout/failure`);
      }

      // 1. Kiểm tra tính hợp lệ của chữ ký
      const { valid, params: vnp_Params } = verifyVnpSignature(req.query, secretKey);
      if (!valid) {
        console.error('VNPay secure hash validation failed.');
        return res.redirect(`${clientUrl}/checkout/failure`);
      }

      const orderId = vnp_Params['vnp_TxnRef'];
      const order = await Order.findById(orderId).populate('user_id');
      if (!order) {
        console.error(`Order with ID ${orderId} not found in callback.`);
        return res.redirect(`${clientUrl}/checkout/failure`);
      }

      const userEmail = order.user_id?.email || '';

      // 2. Chốt kết quả thanh toán (idempotent, dùng chung với IPN)
      const { outcome } = await settleVnpayResult(order, vnp_Params);

      if (['SUCCESS', 'RECOVERED', 'ALREADY_PAID'].includes(outcome)) {
        return res.redirect(`${clientUrl}/checkout/success?orderId=${orderId}&email=${userEmail}`);
      }
      return res.redirect(`${clientUrl}/checkout/failure`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * IPN (Instant Payment Notification) từ VNPay: kênh XÁC NHẬN server-to-server,
   * là nguồn sự thật chính về kết quả thanh toán (khách đóng trình duyệt trước
   * khi redirect về ReturnURL thì vẫn có IPN chốt đơn).
   * Response phải theo spec VNPay: JSON { RspCode, Message } — VNPay sẽ retry
   * khi không nhận được RspCode '00'/'02'/... hợp lệ.
   */
  async vnpayIpn(req, res) {
    try {
      const secretKey = process.env.VNP_HASH_SECRET;
      if (!secretKey) {
        console.error('VNPay hash secret is not configured (VNP_HASH_SECRET).');
        return res.status(200).json({ RspCode: '99', Message: 'Config error' });
      }

      const { valid, params: vnp_Params } = verifyVnpSignature(req.query, secretKey);
      if (!valid) {
        return res.status(200).json({ RspCode: '97', Message: 'Invalid signature' });
      }

      const orderId = vnp_Params['vnp_TxnRef'];
      let order = null;
      try {
        order = await Order.findById(orderId);
      } catch {
        order = null; // orderId không phải ObjectId hợp lệ
      }
      if (!order) {
        return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
      }

      const { outcome } = await settleVnpayResult(order, vnp_Params);

      switch (outcome) {
        case 'AMOUNT_MISMATCH':
          return res.status(200).json({ RspCode: '04', Message: 'Invalid amount' });
        case 'ALREADY_PAID':
        case 'ALREADY_FINALIZED':
          return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
        default:
          // SUCCESS / FAILED / RECOVERED / RECOVERED_NO_STOCK: đã ghi nhận kết quả
          return res.status(200).json({ RspCode: '00', Message: 'Confirm success' });
      }
    } catch (error) {
      console.error('[VNPay IPN] Unexpected error:', error);
      return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
    }
  }

  /**
   * Mô phỏng thanh toán VNPay (Cho môi trường local/test)
   */
  async mockCheckout(req, res, next) {
    try {
      // Chỉ cho phép mô phỏng thanh toán ở môi trường dev; chặn hoàn toàn ở production.
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error_code: 'FORBIDDEN', message: 'Chức năng mô phỏng thanh toán không khả dụng.' });
      }

      const { orderId, simulateStatus } = req.body;
      if (!orderId) {
        return res.status(400).json({ error_code: 'VALIDATION_ERROR', message: 'Thiếu mã đơn hàng' });
      }

      const order = await Order.findById(orderId).populate('user_id');
      if (!order) {
        return res.status(404).json({ error_code: 'ORDER_NOT_FOUND', message: 'Không tìm thấy đơn hàng' });
      }

      // Chống IDOR: khách hàng chỉ được mô phỏng thanh toán đơn của chính mình
      // (nhánh FAILURE sẽ hủy đơn — không thể để user khác kích hoạt).
      const orderOwnerId = order.user_id?._id ? order.user_id._id.toString() : order.user_id?.toString();
      if (req.user.role === 'CUSTOMER' && orderOwnerId !== req.user._id.toString()) {
        return res.status(403).json({ error_code: 'FORBIDDEN', message: 'Bạn không có quyền thanh toán đơn hàng này' });
      }

      if (order.status === 'COMPLETED' || order.status === 'CONFIRMED' || order.status === 'AWAITING_VERIFICATION') {
        return res.status(400).json({ error_code: 'INVALID_STATUS', message: 'Đơn hàng này đã được thanh toán hoặc đang xử lý.' });
      }

      const userEmail = order.user_id?.email || '';

      if (simulateStatus === 'SUCCESS') {
        const prevStatus = order.status;

        // Kiểm tra xem đơn hàng có chứa tròng kính / đơn thuốc hay không
        const items = await OrderItem.find({ order_id: order._id });
        const hasPrescription = items.some(item =>
          item.lens_id ||
          (item.prescription && (
            item.prescription.od_sphere || item.prescription.od_cylinder ||
            item.prescription.os_sphere || item.prescription.os_cylinder ||
            item.prescription.note
          ))
        ) || !!order.prescription_image;

        const nextStatus = hasPrescription ? 'AWAITING_VERIFICATION' : 'CONFIRMED';
        const statusNote = hasPrescription
          ? `Giả lập giao dịch thanh toán thành công (Chờ kỹ thuật viên xác minh đơn kính)`
          : `Giả lập giao dịch thanh toán thành công`;

        order.status = nextStatus;
        order.payment_status = 'PAID';
        order.transaction_id = 'MOCK_TXN_' + Date.now();
        order.paid_at = new Date();
        order.status_history.push({
          from_status: prevStatus,
          to_status: nextStatus,
          note: statusNote
        });
        await order.save();
        return res.status(200).json({
          code: 0,
          result: {
            success: true,
            redirectUrl: `/checkout/success?orderId=${orderId}&email=${userEmail}`
          }
        });
      } else {
        // Giao dịch không thành công -> Hủy đơn và trả lại tồn kho
        const items = await OrderItem.find({ order_id: order._id });
        for (const item of items) {
          if (item.variant_id) {
            await ProductVariant.findByIdAndUpdate(item.variant_id, {
              $inc: { quantity: item.quantity }
            });
          }
        }
        
        const prevStatus = order.status;
        order.status = 'CANCELLED';
        order.payment_status = 'UNPAID';
        order.status_history.push({
          from_status: prevStatus,
          to_status: 'CANCELLED',
          note: 'Giả lập giao dịch thanh toán thất bại'
        });
        await order.save();
        return res.status(200).json({
          code: 0,
          result: {
            success: false,
            redirectUrl: `/checkout/failure`
          }
        });
      }
    } catch (error) {
      next(error);
    }
  }
}

export default new PaymentController();
