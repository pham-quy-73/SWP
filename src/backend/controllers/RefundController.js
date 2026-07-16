import Refund from '../models/Refund.js';
import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import ProductVariant from '../models/ProductVariant.js';

class RefundController {
  /**
   * Lấy danh sách các đơn hàng đã CANCELLED nhưng đã thanh toán thành công (status = PAID)
   */
  async getCancelledPaidOrders(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 0;
      const size = parseInt(req.query.size) || 10;

      // Tìm các đơn hàng CANCELLED nhưng đã thanh toán thành công.
      // Dữ liệu thanh toán nằm trực tiếp trên Order, không cần truy vấn bảng Payment.
      const query = {
        payment_status: 'PAID',
        status: 'CANCELLED'
      };

      const totalElements = await Order.countDocuments(query);
      const totalPages = Math.ceil(totalElements / size);

      const orders = await Order.find(query)
        .populate('user_id', 'username email first_name last_name phone')
        .sort({ created_at: -1 })
        .skip(page * size)
        .limit(size);

      // Map dữ liệu đầu ra khớp với interface của frontend
      const mappedOrders = orders.map(o => {
        const userObj = o.user_id || {};
        const customerName = userObj.first_name || userObj.last_name
          ? `${userObj.first_name || ''} ${userObj.last_name || ''}`.trim()
          : userObj.username || 'Ẩn danh';

        // Lấy số tiền đã thanh toán trực tiếp từ tổng giá trị đơn hàng
        const paidAmount = o.total_amount;

        return {
          orderId: o._id,
          _id: o._id,
          recipientName: o.recipient_name || customerName,
          phoneNumber: o.phone_number || userObj.phone || '',
          totalAmount: o.total_amount,
          paidAmount: paidAmount,
          orderStatus: o.status,
          deliveryAddress: o.delivery_address,
          user_id: userObj,
          createdAt: o.created_at
        };
      });

      return res.status(200).json({
        code: 0,
        result: {
          items: mappedOrders,
          page,
          size,
          totalElements,
          totalPages
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bước 1: Vô hiệu hóa biến thể (ProductVariant)
   */
  async inActivateVariant(req, res, next) {
    try {
      const { variantId } = req.params;
      const variant = await ProductVariant.findByIdAndUpdate(
        variantId,
        { status: 'INACTIVE' },
        { new: true }
      );

      if (!variant) {
        return res.status(404).json({ error_code: 'VARIANT_NOT_FOUND', message: 'Không tìm thấy biến thể' });
      }

      return res.status(200).json({
        code: 0,
        message: 'Vô hiệu hóa biến thể thành công',
        result: variant
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bước 2: Lấy danh sách các đơn hàng bị ảnh hưởng do biến thể bị dừng bán
   * (Các đơn hàng có trạng thái PENDING, AWAITING_VERIFICATION, CONFIRMED và chứa sản phẩm cha)
   */
  async getAffectedOrders(req, res, next) {
    try {
      const { variantId } = req.params;

      const variant = await ProductVariant.findById(variantId);
      if (!variant) {
        return res.status(404).json({ error_code: 'VARIANT_NOT_FOUND', message: 'Không tìm thấy biến thể' });
      }

      // 1. Tìm các đơn hàng CANCELLED và đã được thanh toán (payment_status = PAID)
      const query = {
        status: 'CANCELLED',
        payment_status: 'PAID'
      };

      // Tìm tất cả các items của sản phẩm cha
      const orderItems = await OrderItem.find({ product_id: variant.productId });
      const orderIds = orderItems.map(item => item.order_id);

      // Tìm các đơn hàng đang xử lý
      const orders = await Order.find({
        _id: { $in: orderIds },
        status: { $in: ['PENDING', 'AWAITING_VERIFICATION', 'CONFIRMED'] }
      }).populate('user_id', 'username email first_name last_name phone');

      // Định dạng dữ liệu trả về kiểu RefundItem cho frontend
      const affectedItems = orders.map(o => {
        const userObj = o.user_id || {};
        const customerName = userObj.first_name || userObj.last_name
          ? `${userObj.first_name || ''} ${userObj.last_name || ''}`.trim()
          : userObj.username || 'Ẩn danh';

        // ADR-003: số tiền đã thanh toán lấy từ thông tin nhúng trên Order.
        const paidAmount = o.total_amount;

        return {
          order: {
            orderId: o._id,
            _id: o._id,
            recipientName: o.recipient_name || customerName,
            phoneNumber: o.phone_number || userObj.phone || '',
            totalAmount: o.total_amount,
            paidAmount: paidAmount,
            status: o.status,
            deliveryAddress: o.delivery_address,
            user_id: userObj
          }
        };
      });

      return res.status(200).json({
        code: 0,
        result: affectedItems
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bước 3: Tạo lô hoàn tiền (createBatch) cho danh sách orderIds
   */
  async createBatch(req, res, next) {
    try {
      const { orderIds } = req.body;
      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ error_code: 'VALIDATION_ERROR', message: 'Thiếu danh sách mã đơn hàng' });
      }

      const createdRefunds = [];

      for (const orderId of orderIds) {
        // Tìm thông tin order để biết số tiền cần hoàn
        const order = await Order.findById(orderId);
        if (!order) continue;

        // Hoàn đúng số tiền của đơn hàng nếu đã thanh toán
        const refundAmount = order.payment_status === 'PAID' ? order.total_amount : 0;

        // Thay đổi status của đơn hàng thành CANCELLED để tránh trùng lặp
        const prevStatus = order.status;
        order.status = 'CANCELLED';
        order.status_history.push({
          from_status: prevStatus,
          to_status: 'CANCELLED',
          updated_by: req.user?._id || null,
          note: 'Hủy đơn hàng phục vụ tiến trình hoàn tiền hàng loạt'
        });
        await order.save();

        // Tạo bản ghi Refund PENDING
        const refund = new Refund({
          order_id: orderId,
          amount: refundAmount,
          reason: 'Manager initiated batch refund due to product removal or customer cancellation request.',
          status: 'PENDING'
        });
        await refund.save();
        createdRefunds.push(refund);
      }

      return res.status(200).json({
        code: 0,
        result: createdRefunds
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bước 4: Lấy danh sách hoàn tiền PENDING sẵn sàng xử lý (getReadyRefunds)
   */
  async getReadyRefunds(req, res, next) {
    try {
      const refunds = await Refund.find({ status: 'PENDING' })
        .populate({
          path: 'order_id',
          populate: { path: 'user_id', select: 'username email first_name last_name phone' }
        });

      // Map thành định dạng RefundItem cho React:
      const mappedRefunds = refunds.map(r => {
        const o = r.order_id;
        if (!o) return null;

        const userObj = o.user_id || {};
        const customerName = userObj.first_name || userObj.last_name
          ? `${userObj.first_name || ''} ${userObj.last_name || ''}`.trim()
          : userObj.username || 'Ẩn danh';

        return {
          _id: r._id,
          refundId: r._id,
          amount: r.amount,
          reason: r.reason,
          status: r.status,
          order: {
            _id: o._id,
            orderId: o._id,
            recipientName: o.recipient_name || customerName,
            phoneNumber: o.phone_number || userObj.phone || '',
            totalAmount: o.total_amount,
            paidAmount: r.amount, // Số tiền refund chính là số tiền đã thanh toán
            status: o.status,
            deliveryAddress: o.delivery_address,
            user_id: userObj,
            bank_info: o.bank_info,
            bankInfo: o.bank_info
          }
        };
      }).filter(Boolean);

      return res.status(200).json({
        code: 0,
        result: mappedRefunds
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bước 5: Xác nhận hoàn tiền (checkoutRefund)
   * Trả về kết quả hoàn tiền thành công (hoặc mock url cổng VNPay nếu cần)
   */
  async checkoutRefund(req, res, next) {
    try {
      const { refundId } = req.params;
      const refund = await Refund.findById(refundId);

      if (!refund) {
        return res.status(404).json({ error_code: 'REFUND_NOT_FOUND', message: 'Không tìm thấy yêu cầu hoàn tiền' });
      }

      // Đánh dấu hoàn tất
      refund.status = 'COMPLETED';
      await refund.save();

      // Cập nhật trạng thái Order thành REFUNDED.
      // Cập nhật trạng thái thanh toán của Order sang UNPAID để ghi nhận hoàn trả
      const order = await Order.findById(refund.order_id);
      if (order) {
        const prevStatus = order.status;
        order.status = 'REFUNDED';
        order.payment_status = 'UNPAID';
        order.status_history.push({
          from_status: prevStatus,
          to_status: 'REFUNDED',
          updated_by: req.user?._id || null,
          note: `Hoàn tiền thành công. Mã yêu cầu hoàn: ${refundId}`
        });
        await order.save();
      }

      return res.status(200).json({
        code: 0,
        message: 'Hoàn tiền thành công',
        result: null // Frontend kiểm tra nếu không phải url bắt đầu bằng 'http' thì báo thành công trực tiếp
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new RefundController();
