import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import ProductVariant from '../models/ProductVariant.js';

/**
 * Quét & tự động hủy các đơn PENDING quá hạn 15 phút, hoàn trả tồn kho.
 * Tách thành hàm thuần để có thể kiểm thử độc lập (không phụ thuộc setInterval).
 * @returns {Promise<number>} số đơn đã bị hủy tự động
 */
export async function cleanupExpiredOrders() {
  const expirationTime = new Date(Date.now() - 15 * 60 * 1000); // 15 phút trước
  const expiredOrders = await Order.find({
    status: 'PENDING',
    created_at: { $lt: expirationTime }
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
