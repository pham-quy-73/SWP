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
  let cancelledCount = 0;
  for (const order of expiredOrders) {
    // Hủy đơn bằng cập nhật CÓ ĐIỀU KIỆN (atomic) — đóng vai trò "khóa":
    // chỉ thành công nếu đơn VẪN còn PENDING + UNPAID ngay tại thời điểm update.
    // Tránh race khi chạy nhiều instance (hoàn kho trùng) hoặc khi VNPay callback
    // vừa cập nhật đơn thành PAID giữa lúc find() và lúc hủy.
    // Note AUTO_EXPIRED giữ nguyên để callback về muộn nhận diện & phục hồi đơn.
    const claimed = await Order.findOneAndUpdate(
      { _id: order._id, status: 'PENDING', payment_status: 'UNPAID' },
      {
        $set: { status: 'CANCELLED' },
        $push: {
          status_history: {
            from_status: 'PENDING',
            to_status: 'CANCELLED',
            note: 'AUTO_EXPIRED: Hệ thống tự động hủy do quá hạn thanh toán, đã hoàn kho'
          }
        }
      },
      { returnDocument: 'after' }
    );

    // claimed === null: instance khác đã hủy trước, hoặc khách vừa thanh toán
    // → bỏ qua, KHÔNG hoàn kho để tránh cộng trùng.
    if (!claimed) continue;

    // Chỉ bên "thắng" khóa mới hoàn lại tồn kho — đảm bảo hoàn đúng 1 lần.
    const items = await OrderItem.find({ order_id: order._id });
    for (const item of items) {
      if (item.variant_id) {
        await ProductVariant.findByIdAndUpdate(item.variant_id, {
          $inc: { quantity: item.quantity }
        });
      }
    }
    cancelledCount++;
    console.log(`[Cleaner] Đã tự động hủy đơn hàng #${order._id.toString().slice(-6).toUpperCase()} và trả lại kho.`);
  }
  return cancelledCount;
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
