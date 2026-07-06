import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import Product from '../models/Product.js';
import ProductVariant from '../models/ProductVariant.js'; // BỔ SUNG: Model Biến thể để trừ kho

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

      for (const item of items) {
        // THÊM: Kiểm tra tất cả các tên trường có thể được gửi từ Frontend
        const targetVariantId = item.variantId || item.productVariantId || item.productId;

        // Log để debug nếu lỗi vẫn xảy ra
        console.log("Đang tìm variantId:", targetVariantId);

        const variant = await ProductVariant.findById(targetVariantId).populate('productId');
        if (!variant) {
          // Nếu không tìm thấy, trả về thông báo rõ ràng hơn
          return res.status(400).json({
            error_code: 'VARIANT_NOT_FOUND',
            message: `Không tìm thấy biến thể với ID: ${targetVariantId}`
          });
        }

        // Tồn kho nằm ở trường 'quantity' của ProductVariant
        if (variant.quantity < item.quantity) {
          return res.status(400).json({
            error_code: 'OUT_OF_STOCK',
            message: `Phiên bản màu "${variant.colorName}" chỉ còn ${variant.quantity} sản phẩm, không đủ đáp ứng số lượng ${item.quantity}.`
          });
        }

        // Tính tiền: (Giá gọng + giá tròng) * số lượng
        const basePrice = variant.discountPrice !== undefined ? variant.discountPrice : variant.price;
        const lensPrice = item.lensPrice || 0;
        const finalUnitPrice = basePrice + lensPrice;

        totalAmount += finalUnitPrice * item.quantity;

        orderItemsToCreate.push({
          product_id: variant.productId._id, // Lưu sp gốc để dễ truy xuất
          variant_id: variant._id,           // Đã thêm: ID Biến thể
          lens_id: item.lensId || null,      // Đã thêm: ID Tròng kính
          quantity: item.quantity,
          unit_price: finalUnitPrice
        });
      }

      // 2. TRỪ TỒN KHO AN TOÀN BẰNG $inc
      for (const itemToCreate of orderItemsToCreate) {
        await ProductVariant.findByIdAndUpdate(itemToCreate.variant_id, {
          $inc: { quantity: -itemToCreate.quantity }
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
          variant_id: itemToCreate.variant_id,
          lens_id: itemToCreate.lens_id,
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
        try {
          const items = await OrderItem.find({ order_id: order._id })
            .populate('product_id')
            .populate('variant_id');

          const mappedItems = items.map(item => {
            // SIÊU AN TOÀN: Kiểm tra kỹ từng lớp trước khi lấy dữ liệu
            const productName = item.product_id ? item.product_id.name : 'Sản phẩm đã xóa';
            const colorName = item.variant_id ? item.variant_id.colorName : 'Mặc định';

            return {
              orderItemId: item._id,
              productId: item.product_id ? item.product_id._id : null,
              productName: productName,
              colorName: colorName,
              quantity: item.quantity || 1, // Mặc định là 1 nếu lỗi
              unitPrice: item.unit_price || 0,
              totalPrice: (item.unit_price || 0) * (item.quantity || 1),
              orderItemType: 'IN_STOCK'
            };
          });

          // Tránh trường hợp order._id bị lỗi toString()
          const safeOrderId = order._id ? order._id.toString() : 'UNKNOWN';
          const shortId = safeOrderId !== 'UNKNOWN' ? safeOrderId.slice(-6).toUpperCase() : 'N/A';

          ordersWithItems.push({
            orderId: order._id,
            orderName: `Đơn hàng #${shortId}`,
            orderStatus: order.status || 'PENDING',
            deliveryAddress: order.delivery_address || 'Chưa cập nhật',
            totalAmount: order.total_amount || 0,
            finalTotalAfterRefund: order.total_amount || 0,
            remainingAmount: order.status === 'PENDING' ? (order.total_amount || 0) : 0,
            items: mappedItems,
            createdAt: order.created_at || new Date()
          });
        } catch (itemError) {
          console.error(`[Lỗi xử lý đơn hàng ${order._id}]:`, itemError.message);
          // Vẫn push một bản ghi trống để UI không bị vỡ
          ordersWithItems.push({
            orderId: order._id,
            orderName: 'Đơn hàng lỗi dữ liệu',
            orderStatus: order.status || 'ERROR',
            totalAmount: order.total_amount || 0,
            items: [],
            createdAt: order.created_at || new Date()
          });
        }
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
      console.error("[Lỗi API myOrders]:", error);
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

      if (!['PENDING', 'AWAITING_VERIFICATION', 'CONFIRMED'].includes(order.status)) {
        return res.status(400).json({ error_code: 'INVALID_STATUS', message: 'Không thể hủy đơn hàng ở trạng thái hiện tại' });
      }

      // HOÀN LẠI TỒN KHO SẢN PHẨM (Dùng $inc để cộng số lượng)
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

      if (req.user.role === 'CUSTOMER' && order.user_id._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error_code: 'FORBIDDEN', message: 'Bạn không có quyền xem chi tiết đơn hàng này' });
      }

      const items = await OrderItem.find({ order_id: id }).populate('product_id').populate('variant_id').populate('lens_id');

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