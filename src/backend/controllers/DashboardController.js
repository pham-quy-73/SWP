import Order from '../models/Order.js';
import Product from '../models/Product.js';

class DashboardController {
  /**
   * Lấy số liệu thống kê doanh thu và hoạt động cho Dashboard
   */
  async getDashboardStats(req, res, next) {
    try {
      // 1. Tính tổng doanh thu từ các đơn hàng COMPLETED
      const completedOrders = await Order.find({ status: 'COMPLETED' });
      const revenue = completedOrders.reduce((sum, order) => sum + order.total_amount, 0);

      // 2. Tính doanh thu tháng này và tháng trước để tính tăng trưởng
      const now = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

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

      // 3. Đơn hàng đang xử lý (không phải COMPLETED, CANCELLED, REFUNDED)
      const activeOrders = await Order.countDocuments({
        status: { $in: ['PENDING', 'AWAITING_VERIFICATION', 'CONFIRMED'] }
      });

      // 4. Đơn hàng phát sinh hôm nay
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const ordersToday = await Order.countDocuments({
        created_at: { $gte: startOfToday }
      });

      // 5. Số vật phẩm sắp hết hàng (tồn kho dưới 10)
      const lowStockItems = await Product.countDocuments({
        status: 'ACTIVE',
        stock_quantity: { $lt: 10 }
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
