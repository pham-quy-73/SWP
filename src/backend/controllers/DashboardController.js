import Order from '../models/Order.js';
import Product from '../models/Product.js';
import ProductVariant from '../models/ProductVariant.js';

class DashboardController {
  async getDashboardStats(req, res, next) {
    try {
      // 1. Tính tổng doanh thu từ các đơn hàng COMPLETED
      const completedOrders = await Order.find({ status: 'COMPLETED' });
      const revenue = completedOrders.reduce((sum, order) => sum + order.total_amount, 0);

      // --- CHUẨN HÓA MÚI GIỜ VIỆT NAM (GMT+7) ---
      const now = new Date();
      const VN_OFFSET = 7 * 60 * 60 * 1000;
      
      const vnNow = new Date(now.getTime() + VN_OFFSET);
      const currentYear = vnNow.getUTCFullYear();
      const currentMonth = vnNow.getUTCMonth(); 
      const currentDate = vnNow.getUTCDate();

      const startOfThisMonth = new Date(Date.UTC(currentYear, currentMonth, 1) - VN_OFFSET);
      const startOfLastMonth = new Date(Date.UTC(currentYear, currentMonth - 1, 1) - VN_OFFSET);
      const endOfLastMonth = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59, 999) - VN_OFFSET);
      const startOfToday = new Date(Date.UTC(currentYear, currentMonth, currentDate) - VN_OFFSET);
      // ------------------------------------------

      // 2. Tính doanh thu tháng này và tháng trước
      const thisMonthOrders = await Order.find({
        status: 'COMPLETED',
        created_at: { $gte: startOfThisMonth }
      });
      const thisMonthRevenue = thisMonthOrders.reduce((sum, order) => sum + order.total_amount, 0);

      const lastMonthOrders = await Order.find({
        status: 'COMPLETED',
        created_at: { $gte: startOfLastMonth, $lte: endOfLastMonth }
      });
      const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + order.total_amount, 0);

      let revenueGrowth = 0;
      if (lastMonthRevenue > 0) {
        revenueGrowth = parseFloat((((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(2));
      } else if (thisMonthRevenue > 0) {
        revenueGrowth = 100;
      }

      // 3. Đơn hàng đang xử lý
      const activeOrders = await Order.countDocuments({
        status: { $in: ['PENDING', 'AWAITING_VERIFICATION', 'CONFIRMED'] }
      });

      // 4. Đơn hàng phát sinh hôm nay
      const ordersToday = await Order.countDocuments({
        created_at: { $gte: startOfToday }
      });

      // 5. Số vật phẩm sắp hết hàng (tồn kho dưới 10) — tồn kho nằm ở ProductVariant.quantity
      const lowStockItems = await ProductVariant.countDocuments({
        status: 'ACTIVE',
        quantity: { $lt: 10 }
      });

      return res.status(200).json({
        code: 1000,
        message: 'Success',
        result: {
          revenue,
          revenueGrowth,
          activeOrders,
          ordersToday,
          returnPending: 0,
          lowStockItems
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DashboardController();