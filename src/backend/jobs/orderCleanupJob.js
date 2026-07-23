import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import ProductVariant from '../models/ProductVariant.js';

/**
 * Quét & tự động hủy các đơn PENDING quá hạn 15 phút, hoàn trả tồn kho.
 * Tách thành hàm thuần để có thể kiểm thử độc lập (không phụ thuộc setInterval).
 *
 * Điều kiện hủy (tránh race với khách đang thanh toán trên trang VNPay):
 * - Chỉ hủy đơn chưa thanh toán (payment_status: UNPAID).
 * - Đơn quá 15 phút kể từ khi tạo, VÀ nếu khách đã bấm tạo link thanh toán
 *   (payment_initiated_at) thì phải quá 30 phút kể từ lần tạo link gần nhất
 *   — phiên thanh toán VNPay có hạn ~15 phút, cộng thêm biên an toàn.
 * @returns {Promise<number>} số đơn đã bị hủy tự động
 */
export async function cleanupExpiredOrders() {
  const now = Date.now();
  const createdCutoff = new Date(now - 15 * 60 * 1000);       // tạo đơn > 15 phút trước
  const paymentCutoff = new Date(now - 30 * 60 * 1000);       // tạo link thanh toán > 30 phút trước
  const expiredOrders = await Order.find({
    status: 'PENDING',
    payment_status: 'UNPAID',
    created_at: { $lt: createdCutoff },
    $or: [
      { payment_initiated_at: null },
      { payment_initiated_at: { $exists: false } },
      { payment_initiated_at: { $lt: paymentCutoff } }
    ]
  });

  if (expiredOrders.length === 0) return 0;

  console.log(`[Cleaner] Tìm thấy ${expiredOrders.length} đơn hàng PENDING hết hạn thanh toán. Tiến hành hủy tự động...`);
  for (const order of expiredOrders) {
    // Hoàn lại số lượng tồn kho cho sản phẩm
    const items = await OrderItem.find({ order_id: order._id });
    for (const item of items) {
      if (item.variant_id) {
        await ProductVariant.findByIdAndUpdate(item.variant_id, {
          $inc: { quantity: item.quantity }
        });
      }
    }
    order.status = 'CANCELLED';
    // Ghi history với note nhận diện được là hủy-do-hết-hạn (callback thanh toán
    // về muộn sẽ dựa vào dấu vết này để phục hồi đơn nếu tiền đã thu).
    order.status_history.push({
      from_status: 'PENDING',
      to_status: 'CANCELLED',
      note: 'AUTO_EXPIRED: Hệ thống tự động hủy do quá hạn thanh toán, đã hoàn kho'
    });
    await order.save();
    console.log(`[Cleaner] Đã tự động hủy đơn hàng #${order._id.toString().slice(-6).toUpperCase()} và trả lại kho.`);
  }
  return expiredOrders.length;
}

/**
 * Khởi tạo background job quét định kỳ mỗi 5 phút.
 * @returns {NodeJS.Timeout} handle của interval để có thể clear khi cần.
 */
export function startOrderStatusCleanupJob() {
  console.log('[Cleaner] Background job dọn dẹp đơn hàng PENDING quá hạn đã được khởi tạo.');
  return setInterval(async () => {
    try {
      await cleanupExpiredOrders();
    } catch (err) {
      console.error('[Cleaner Error] Lỗi xảy ra trong quá trình dọn dẹp tự động:', err);
    }
  }, 5 * 60 * 1000);
}
