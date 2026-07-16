import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import ProductVariant from '../models/ProductVariant.js';
import { priceOrderItem, PricingError } from '../services/PricingService.js';
import crypto from 'crypto';

class PaymentController {
  /**
   * Tính toán yêu cầu thanh toán (Cho khách hàng lúc checkout)
   */
  async getPaymentRequirement(req, res, next) {
    try {
      const { items } = req.body;
      if (!items || items.length === 0) {
        return res.status(400).json({ error_code: 'VALIDATION_ERROR', message: 'Không có sản phẩm để tính toán' });
      }

      let orderTotal = 0;
      const itemRequirements = [];

      for (const item of items) {
        // Định giá theo giá DB qua PricingService (dùng chung với createOrder)
        // để số tiền báo lúc checkout khớp số tiền tính thật khi tạo đơn.
        const { basePrice, lensPrice, finalUnitPrice } = await priceOrderItem(item);
        const itemTotal = finalUnitPrice * item.quantity;
        orderTotal += itemTotal;

        itemRequirements.push({
          productVariantId: item.productVariantId,
          lensId: item.lensId || null,
          unitPrice: basePrice,
          lensPrice,
          itemTotal,
          paymentPercentage: 1.0, // Thanh toán trước 100% cho hàng có sẵn
          requiredPayment: itemTotal
        });
      }

      return res.status(200).json({
        code: 0,
        result: {
          orderTotal,
          requiredAmount: orderTotal,
          requiredPaymentTotal: orderTotal,
          remainingPaymentTotal: 0,
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

      if (order.status === 'COMPLETED' || order.status === 'CONFIRMED') {
        return res.status(400).json({ error_code: 'INVALID_STATUS', message: 'Đơn hàng này đã được thanh toán hoặc hoàn thành.' });
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

      return res.status(200).json({
        code: 0,
        result: paymentUrl
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Callback xử lý phản hồi từ VNPay
   */
  async vnpayCallback(req, res, next) {
    try {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const secretKey = process.env.VNP_HASH_SECRET;

      if (!secretKey) {
        console.error('VNPay hash secret is not configured (VNP_HASH_SECRET).');
        return res.redirect(`${clientUrl}/checkout/failure`);
      }
      const vnp_Params = { ...req.query };
      const secureHash = vnp_Params['vnp_SecureHash'];

      delete vnp_Params['vnp_SecureHash'];
      delete vnp_Params['vnp_SecureHashType'];

      // Sort alphabetically by keys
      const sortedKeys = Object.keys(vnp_Params).sort();
      const sortedParams = {};
      for (const key of sortedKeys) {
        sortedParams[key] = vnp_Params[key];
      }

      const signData = new URLSearchParams(sortedParams).toString();
      const hmac = crypto.createHmac('sha512', secretKey);
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

      // 1. Kiểm tra tính hợp lệ của chữ ký
      if (secureHash !== signed) {
        console.error('VNPay secure hash validation failed.');
        return res.redirect(`${clientUrl}/checkout/failure`);
      }

      const orderId = vnp_Params['vnp_TxnRef'];
      const responseCode = vnp_Params['vnp_ResponseCode'];

      const order = await Order.findById(orderId).populate('user_id');
      if (!order) {
        console.error(`Order with ID ${orderId} not found in callback.`);
        return res.redirect(`${clientUrl}/checkout/failure`);
      }

      const userEmail = order.user_id?.email || '';

      // 2. Chống double-processing: chỉ xử lý đơn đang chờ thanh toán (PENDING).
      // Nếu đơn đã CONFIRMED/CANCELLED thì bỏ qua (callback lặp / user refresh),
      // điều hướng theo trạng thái hiện tại mà không cập nhật lại.
      if (order.status !== 'PENDING') {
        if (order.status === 'CONFIRMED' || order.status === 'COMPLETED') {
          return res.redirect(`${clientUrl}/checkout/success?orderId=${orderId}&email=${userEmail}`);
        }
        return res.redirect(`${clientUrl}/checkout/failure`);
      }

      // 3. Đối chiếu số tiền: VNPay gửi vnp_Amount = số tiền * 100.
      // Không tin số tiền từ callback; phải khớp với total_amount đã lưu ở DB.
      const expectedAmount = Math.round(order.total_amount * 100);
      const paidAmount = parseInt(vnp_Params['vnp_Amount'], 10);
      if (!Number.isFinite(paidAmount) || paidAmount !== expectedAmount) {
        console.error(`VNPay amount mismatch for order ${orderId}: expected ${expectedAmount}, got ${vnp_Params['vnp_Amount']}.`);
        return res.redirect(`${clientUrl}/checkout/failure`);
      }

      // 4. Kiểm tra ResponseCode ('00' là thành công)
      if (responseCode === '00') {
        const prevStatus = order.status;
        order.status = 'CONFIRMED';
        order.payment_status = 'PAID';
        order.transaction_id = vnp_Params['vnp_TransactionNo'] || '';
        order.paid_at = new Date();
        order.status_history.push({
          from_status: prevStatus,
          to_status: 'CONFIRMED',
          note: `Thanh toán thành công qua VNPay (Mã GD: ${order.transaction_id})`
        });
        await order.save();
        return res.redirect(`${clientUrl}/checkout/success?orderId=${orderId}&email=${userEmail}`);
      } else {
        // Giao dịch không thành công
        const prevStatus = order.status;
        order.status = 'CANCELLED';
        order.payment_status = 'UNPAID';
        order.status_history.push({
          from_status: prevStatus,
          to_status: 'CANCELLED',
          note: `Thanh toán thất bại qua VNPay (ResponseCode: ${responseCode})`
        });
        await order.save();
        return res.redirect(`${clientUrl}/checkout/failure`);
      }
    } catch (error) {
      next(error);
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

      if (order.status === 'COMPLETED' || order.status === 'CONFIRMED') {
        return res.status(400).json({ error_code: 'INVALID_STATUS', message: 'Đơn hàng này đã được thanh toán hoặc hoàn thành.' });
      }

      const userEmail = order.user_id?.email || '';

      if (simulateStatus === 'SUCCESS') {
        const prevStatus = order.status;
        order.status = 'CONFIRMED';
        order.payment_status = 'PAID';
        order.transaction_id = 'MOCK_TXN_' + Date.now();
        order.paid_at = new Date();
        order.status_history.push({
          from_status: prevStatus,
          to_status: 'CONFIRMED',
          note: `Giả lập giao dịch thanh toán thành công (Mã GD: ${order.transaction_id})`
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
