import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import Product from '../models/Product.js';

class OrderController {
  /**
   * Tạo đơn hàng mới từ giỏ hàng (cho Customer)
   */
  async createOrder(req, res, next) {
    try {
      const orderInfo = typeof req.body.orderInfo === 'string' 
        ? JSON.parse(req.body.orderInfo) 
        : req.body.orderInfo;

      if (!orderInfo || !orderInfo.items || orderInfo.items.length === 0) {
        return res.status(400).json({ error_code: 'VALIDATION_ERROR', message: 'Đơn hàng phải chứa ít nhất một sản phẩm' });
      }

      const items = orderInfo.items;
      let totalAmount = 0;
      const orderItemsToCreate = [];

      // 1. Kiểm tra tồn kho và tính tổng tiền
      for (const item of items) {
        const product = await Product.findById(item.productVariantId);
        if (!product) {
          return res.status(400).json({ error_code: 'PRODUCT_NOT_FOUND', message: `Sản phẩm với ID ${item.productVariantId} không tồn tại` });
        }

        if (product.stock_quantity < item.quantity) {
          return res.status(400).json({
            error_code: 'OUT_OF_STOCK',
            message: `Sản phẩm "${product.name}" chỉ còn ${product.stock_quantity} cái trong kho, không đủ đáp ứng số lượng ${item.quantity}.`
          });
        }

        const price = product.discountPrice !== undefined ? product.discountPrice : product.price;
        totalAmount += price * item.quantity;

        orderItemsToCreate.push({
          product_id: product._id,
          quantity: item.quantity,
          unit_price: price
        });
      }

      // 2. Trừ tồn kho sản phẩm
      for (const item of items) {
        await Product.findByIdAndUpdate(item.productVariantId, {
          $inc: { stock_quantity: -item.quantity }
        });
      }

      // 3. Tạo đối tượng Order
      const order = new Order({
        user_id: req.user._id,
        status: 'PENDING',
        total_amount: totalAmount,
        recipient_name: orderInfo.recipientName,
        phone_number: orderInfo.phoneNumber,
        delivery_address: orderInfo.deliveryAddress,
        prescription_text: '',
        prescription_image: req.file ? `/uploads/${req.file.filename}` : '',
        bank_info: orderInfo.bankInfo || { bank_name: '', bank_account_number: '', account_holder_name: '' }
      });
      await order.save();

      // 4. Lưu danh sách OrderItem
      for (const itemToCreate of orderItemsToCreate) {
        const orderItem = new OrderItem({
          order_id: order._id,
          product_id: itemToCreate.product_id,
          quantity: itemToCreate.quantity,
          unit_price: itemToCreate.unit_price
        });
        await orderItem.save();
      }

      return res.status(201).json({
        code: 0,
        message: 'Tạo đơn hàng thành công',
        result: {
          orderId: order._id,
          order
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy lịch sử đơn hàng của người dùng (cho Customer)
   */
  async myOrders(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 0;
      const size = parseInt(req.query.size) || 10;
      const { status } = req.query;

      const query = { user_id: req.user._id };
      if (status) {
        query.status = status.toUpperCase();
      }

      const totalItems = await Order.countDocuments(query);
      const totalPages = Math.ceil(totalItems / size);

      const orders = await Order.find(query)
        .sort({ created_at: -1 })
        .skip(page * size)
        .limit(size);

      const ordersWithItems = [];
      for (const order of orders) {
        const items = await OrderItem.find({ order_id: order._id }).populate('product_id');

        const mappedItems = items.map(item => ({
          orderItemId: item._id,
          productId: item.product_id?._id,
          productName: item.product_id?.name,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          totalPrice: item.unit_price * item.quantity,
          orderItemType: 'IN_STOCK'
        }));

        ordersWithItems.push({
          orderId: order._id,
          orderName: `Đơn hàng #${order._id.toString().slice(-6).toUpperCase()}`,
          orderStatus: order.status,
          deliveryAddress: order.delivery_address,
          totalAmount: order.total_amount,
          finalTotalAfterRefund: order.total_amount,
          remainingAmount: order.status === 'PENDING' ? order.total_amount : 0,
          items: mappedItems,
          createdAt: order.created_at
        });
      }

      return res.status(200).json({
        code: 0,
        result: {
          items: ordersWithItems,
          totalItems,
          page,
          size,
          totalPages
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Hủy đơn hàng (dành cho Customer hủy khi đơn PENDING)
   */
  async cancelOrder(req, res, next) {
    try {
      const { id } = req.params;
      const order = await Order.findById(id);

      if (!order) {
        return res.status(404).json({ error_code: 'ORDER_NOT_FOUND', message: 'Không tìm thấy đơn hàng' });
      }

      if (req.user.role === 'CUSTOMER' && order.user_id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error_code: 'FORBIDDEN', message: 'Bạn không có quyền thực hiện hành động này' });
      }

      if (order.status !== 'PENDING') {
        return res.status(400).json({ error_code: 'INVALID_STATUS', message: 'Chỉ có thể hủy đơn hàng ở trạng thái Chờ xử lý' });
      }

      // Hoàn lại số lượng tồn kho sản phẩm
      const items = await OrderItem.find({ order_id: order._id });
      for (const item of items) {
        await Product.findByIdAndUpdate(item.product_id, {
          $inc: { stock_quantity: item.quantity }
        });
      }

      order.status = 'CANCELLED';
      await order.save();

      return res.status(200).json({
        code: 0,
        message: 'Hủy đơn hàng thành công',
        result: order
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy toàn bộ danh sách đơn hàng (cho Manager/Admin)
   */
  async getAllOrders(req, res, next) {
    try {
      const { status } = req.query;
      const query = {};

      if (status) {
        query.status = status.toUpperCase();
      }

      // Populate user_id để hiển thị thông tin tên, email khách hàng
      const orders = await Order.find(query)
        .populate('user_id', 'username email first_name last_name phone')
        .sort({ created_at: -1 });

      return res.status(200).json({
        code: 0,
        result: orders
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy thông tin chi tiết của một đơn hàng kèm danh sách sản phẩm trong đơn
   */
  async getOrderById(req, res, next) {
    try {
      const { id } = req.params;
      const order = await Order.findById(id).populate('user_id', 'username email first_name last_name phone');
      
      if (!order) {
        return res.status(404).json({ error_code: 'ORDER_NOT_FOUND', message: 'Không tìm thấy đơn hàng' });
      }

      // Kiểm tra phân quyền: Khách hàng chỉ xem được đơn hàng của chính họ
      if (req.user.role === 'CUSTOMER' && order.user_id._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error_code: 'FORBIDDEN', message: 'Bạn không có quyền xem chi tiết đơn hàng này' });
      }

      // Lấy thêm danh sách sản phẩm thuộc đơn hàng này
      const items = await OrderItem.find({ order_id: id }).populate('product_id');

      return res.status(200).json({
        code: 0,
        result: {
          ...order.toObject(),
          orderId: order._id,
          recipientName: order.recipient_name,
          phoneNumber: order.phone_number,
          deliveryAddress: order.delivery_address,
          totalAmount: order.total_amount,
          orderStatus: order.status,
          order,
          items
        }
      });
    } catch (error) {
      next(error);
    }
  }



  /**
   * Cập nhật trạng thái đơn hàng (cho Manager/Admin)
   */
  async updateOrderStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error_code: 'VALIDATION_ERROR', message: 'Thiếu trạng thái đơn hàng' });
      }

      const allowedStatuses = ['PENDING', 'AWAITING_VERIFICATION', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REFUNDED'];
      if (!allowedStatuses.includes(status.toUpperCase())) {
        return res.status(400).json({ error_code: 'VALIDATION_ERROR', message: 'Trạng thái đơn hàng không hợp lệ' });
      }

      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({ error_code: 'ORDER_NOT_FOUND', message: 'Không tìm thấy đơn hàng' });
      }

      order.status = status.toUpperCase();
      await order.save();

      return res.status(200).json({
        code: 0,
        message: 'Cập nhật trạng thái đơn hàng thành công',
        result: order
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Xóa đơn hàng (chỉ Admin được xóa)
   */
  async deleteOrder(req, res, next) {
    try {
      const { id } = req.params;
      const order = await Order.findByIdAndDelete(id);
      if (!order) {
        return res.status(404).json({ error_code: 'ORDER_NOT_FOUND', message: 'Không tìm thấy đơn hàng' });
      }
      
      // Xóa đồng thời các OrderItem để giải phóng bộ nhớ
      await OrderItem.deleteMany({ order_id: id });

      return res.status(200).json({
        code: 0,
        message: 'Đơn hàng và các sản phẩm liên quan đã được xóa thành công'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new OrderController();

