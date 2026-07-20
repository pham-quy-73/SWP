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

      // 6. THỐNG KÊ SẢN PHẨM BÁN CHẠY (BEST SELLERS)
      const validOrders = await Order.find({ status: { $ne: 'CANCELLED' } }).select('_id');
      const validOrderIds = validOrders.map(o => o._id);

      // Top Gọng kính bán chạy
      const topProductAgg = await OrderItem.aggregate([
        { $match: { order_id: { $in: validOrderIds } } },
        {
          $group: {
            _id: '$product_id',
            totalSold: { $sum: '$quantity' },
            totalRevenue: { $sum: { $multiply: ['$unit_price', '$quantity'] } }
          }
        },
        { $sort: { totalSold: -1 } },
        { $limit: 5 }
      ]);

      const topProducts = await Product.populate(topProductAgg, {
        path: '_id',
        select: 'name brand imageUrl category'
      });

      const formattedTopProducts = topProducts.map(p => {
        const prodObj = p._id || {};
        const rawImg = Array.isArray(prodObj.imageUrl) ? prodObj.imageUrl[0] : (prodObj.imageUrl || '');
        return {
          productId: prodObj._id || null,
          name: prodObj.name || 'Sản phẩm đã xóa',
          brand: prodObj.brand || '',
          imageUrl: rawImg,
          category: prodObj.category || 'FRAME',
          totalSold: p.totalSold,
          totalRevenue: p.totalRevenue
        };
      });

      // Top Tròng kính được chọn nhiều nhất
      const topLensAgg = await OrderItem.aggregate([
        { $match: { order_id: { $in: validOrderIds }, lens_id: { $ne: null } } },
        {
          $group: {
            _id: '$lens_id',
            totalSold: { $sum: '$quantity' }
          }
        },
        { $sort: { totalSold: -1 } },
        { $limit: 3 }
      ]);

      const topLenses = await Product.populate(topLensAgg, {
        path: '_id',
        select: 'name brand price'
      });

      const formattedTopLenses = topLenses.map(l => {
        const lensObj = l._id || {};
        return {
          lensId: lensObj._id || null,
          name: lensObj.name || 'Tròng kính mặc định',
          brand: lensObj.brand || '',
          price: lensObj.price || 0,
          totalSold: l.totalSold
        };
      });

      // Tỷ lệ đơn có cắt tròng kính thuốc vs chỉ mua gọng
      const totalItemsCount = await OrderItem.countDocuments({ order_id: { $in: validOrderIds } });
      const lensItemsCount = await OrderItem.countDocuments({ order_id: { $in: validOrderIds }, lens_id: { $ne: null } });
      const prescriptionRatio = totalItemsCount > 0 ? parseFloat(((lensItemsCount / totalItemsCount) * 100).toFixed(1)) : 0;

      return res.status(200).json({
        code: 1000,
        message: 'Success',
        result: {
          revenue,
          revenueGrowth,
          activeOrders,
          ordersToday,
          returnPending: 0,
          lowStockItems,
          bestSellers: {
            topProducts: formattedTopProducts,
            topLenses: formattedTopLenses,
            prescriptionRatio,
            totalItemsSold: totalItemsCount
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DashboardController();