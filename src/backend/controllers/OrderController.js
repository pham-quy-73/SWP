import mongoose from 'mongoose';
import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import ProductVariant from '../models/ProductVariant.js'; // BỔ SUNG: Model Biến thể để trừ kho
import { priceOrderItem, PricingError } from '../services/PricingService.js';

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

      // Helper: chuẩn hóa & validate prescription payload từ Client.
      // Chỉ chấp nhận đơn kính khi item có gắn tròng (lensId). Nếu không có lens,
      // prescription bị bỏ qua để tránh dữ liệu rác cho các đơn gọng-only.
      const uploadedFileUrl = req.file ? `/uploads/${req.file.filename}` : '';

      const normalizePrescription = (p) => {
        if (!p || typeof p !== 'object') return null;
        const num = (v) => {
          const n = parseFloat(v);
          return Number.isFinite(n) ? n : 0;
        };
        const axis = (v) => {
          const n = Math.round(parseFloat(v));
          if (!Number.isFinite(n)) return 0;
          if (n < 0 || n > 180) return 0; // AXIS chỉ hợp lệ trong [0..180]
          return n;
        };

        const isThisItemUsingImage = p.hasImage || (typeof p.imageUrl === 'string' && p.imageUrl.startsWith('data:'));
        const itemImageUrl = isThisItemUsingImage ? uploadedFileUrl : '';

        return {
          od_sphere:   num(p.odSphere ?? p.od_sphere),
          od_cylinder: num(p.odCylinder ?? p.od_cylinder),
          od_axis:     axis(p.odAxis ?? p.od_axis),
          od_add:      num(p.odAdd ?? p.od_add),
          od_pd:       num(p.odPd ?? p.od_pd),
          os_sphere:   num(p.osSphere ?? p.os_sphere),
          os_cylinder: num(p.osCylinder ?? p.os_cylinder),
          os_axis:     axis(p.osAxis ?? p.os_axis),
          os_add:      num(p.osAdd ?? p.os_add),
          os_pd:       num(p.osPd ?? p.os_pd),
          note:        typeof p.note === 'string' ? p.note.trim().slice(0, 500) : '',
          imageUrl:    itemImageUrl
        };
      };

      // Lỗi nghiệp vụ (validation) phát sinh trong transaction: ném ra để rollback,
      // sau đó bắt lại ở ngoài để trả đúng mã HTTP thay vì để errorHandler nuốt.
      class OrderValidationError extends Error {
        constructor(status, body) {
          super(body.message);
          this.status = status;
          this.body = body;
        }
      }

      // Bọc toàn bộ luồng tạo đơn (trừ kho + tạo Order + tạo OrderItem) trong một
      // transaction để đảm bảo tính nguyên tử: hoặc thành công trọn vẹn, hoặc rollback
      // toàn bộ (tránh trừ kho mà không có đơn, hoặc đơn thiếu item).
      // Lưu ý: withTransaction yêu cầu MongoDB chạy ở chế độ replica set.
      let createdOrder = null;

      // Hàm helper đóng gói tất cả các thao tác nghiệp vụ cần bảo đảm tính toàn vẹn (hoặc chạy có txn hoặc không)
      const executeCreation = async (session) => {
        let totalAmount = 0;
        const orderItemsToCreate = [];

        for (const item of items) {
          // Định giá qua PricingService (nguồn giá dùng chung với báo giá checkout)
          const { variant, finalUnitPrice } = await priceOrderItem(item, session);

          // Kiểm tra số lượng tồn kho
          if (variant.quantity < item.quantity) {
            throw new OrderValidationError(400, {
              error_code: 'OUT_OF_STOCK',
              message: `Phiên bản màu "${variant.colorName}" chỉ còn ${variant.quantity} sản phẩm, không đủ đáp ứng số lượng ${item.quantity}.`
            });
          }

          totalAmount += finalUnitPrice * item.quantity;
          const prescription = item.lensId ? normalizePrescription(item.prescription) : null;

          orderItemsToCreate.push({
            product_id: variant.productId._id,
            variant_id: variant._id,
            lens_id: item.lensId || null,
            quantity: item.quantity,
            unit_price: finalUnitPrice,
            prescription
          });
        }

        // 2. TRỪ TỒN KHO AN TOÀN BẰNG $inc
        for (const itemToCreate of orderItemsToCreate) {
          await ProductVariant.findByIdAndUpdate(
            itemToCreate.variant_id,
            { $inc: { quantity: -itemToCreate.quantity } },
            { session }
          );
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
          bank_info: orderInfo.bankInfo || { bank_name: '', bank_account_number: '', account_holder_name: '' },
          status_history: [{
            from_status: '',
            to_status: 'PENDING',
            note: 'Đơn hàng được khởi tạo mới'
          }]
        });
        await order.save({ session });

        // 4. Lưu danh sách OrderItem
        for (const itemToCreate of orderItemsToCreate) {
          const orderItem = new OrderItem({
            order_id: order._id,
            product_id: itemToCreate.product_id,
            variant_id: itemToCreate.variant_id,
            lens_id: itemToCreate.lens_id,
            quantity: itemToCreate.quantity,
            unit_price: itemToCreate.unit_price,
            prescription: itemToCreate.prescription
          });
          await orderItem.save({ session });
        }

        return order;
      };

      try {
        const session = await mongoose.startSession();
        try {
          await session.withTransaction(async () => {
            createdOrder = await executeCreation(session);
          });
        } catch (txnError) {
          // Fallback: Khi MongoDB local/standalone không có Replica Set hỗ trợ transaction (code = 20 hoặc message)
          if (txnError.message.includes('Transaction numbers') || txnError.code === 20) {
            console.warn('[DB Warning] MongoDB is running in standalone mode. Executing order creation without transaction.');
            createdOrder = await executeCreation(null);
          } else {
            throw txnError;
          }
        } finally {
          await session.endSession();
        }
      } catch (txErr) {
        // OrderValidationError (tồn kho…) và PricingError (variant/lens sai) cùng mang { status, body }.
        if (txErr instanceof OrderValidationError || txErr instanceof PricingError) {
          return res.status(txErr.status).json(txErr.body);
        }
        throw txErr; // lỗi hệ thống khác -> đẩy xuống catch ngoài -> errorHandler
      }

      return res.status(201).json({
        code: 0,
        message: 'Tạo đơn hàng thành công',
        result: {
          orderId: createdOrder._id,
          order: createdOrder
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
            .populate('variant_id')
            .populate('lens_id');

          const mappedItems = items.map(item => {
            const prod = item.product_id || {};
            const variant = item.variant_id || {};
            const lens = item.lens_id || {};

            const productName = prod.name || 'Sản phẩm đã xóa';
            const colorName = variant.colorName || 'Mặc định';
            const sizeLabel = variant.sizeLabel || (variant.lensWidthMm ? `${variant.lensWidthMm}-${variant.bridgeWidthMm}-${variant.templeLengthMm}` : '');
            const rawImg = (variant.imageUrl && variant.imageUrl[0]) 
              ? variant.imageUrl[0] 
              : (Array.isArray(prod.imageUrl) ? prod.imageUrl[0] : (prod.imageUrl || prod.image || ''));

            let prescription = item.prescription ? (item.prescription.toObject ? item.prescription.toObject() : item.prescription) : null;
            if (prescription) {
              const odSph = prescription.od_sphere ?? prescription.odSphere ?? 0;
              const odCyl = prescription.od_cylinder ?? prescription.odCylinder ?? 0;
              const osSph = prescription.os_sphere ?? prescription.osSphere ?? 0;
              const osCyl = prescription.os_cylinder ?? prescription.osCylinder ?? 0;
              if (!prescription.imageUrl && order.prescription_image && odSph === 0 && odCyl === 0 && osSph === 0 && osCyl === 0) {
                prescription.imageUrl = order.prescription_image;
              }
            }

            return {
              orderItemId: item._id,
              productId: prod._id || null,
              productName: productName,
              brand: prod.brand || '',
              colorName: colorName,
              variantName: colorName !== 'Mặc định' ? colorName : '',
              sizeLabel,
              sku: variant.sku || '',
              imageUrl: rawImg,
              lensId: lens._id || null,
              lensName: lens.name || null,
              lensBrand: lens.brand || '',
              lensPrice: lens.price || 0,
              prescription,
              quantity: item.quantity || 1,
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
            prescription_text: order.prescription_text || '',
            prescription_image: order.prescription_image || '',
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
      const { reason } = req.body || {};
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

      const prevStatus = order.status;
      order.status = 'CANCELLED';
      const cancelNote = reason ? `Khách hàng hủy đơn. Lý do: ${reason}` : 'Khách hàng chủ động hủy đơn hàng';
      order.status_history.push({
        from_status: prevStatus,
        to_status: 'CANCELLED',
        updated_by: req.user._id,
        note: cancelNote
      });

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
   * Manager / Admin từ chối yêu cầu hủy đơn hàng và phục hồi trạng thái cũ
   */
  async rejectCancellation(req, res, next) {
    try {
      const { id, orderId } = req.params;
      const targetId = id || orderId;
      const { reason } = req.body || {};
      const order = await Order.findById(targetId);

      if (!order) {
        return res.status(404).json({ error_code: 'ORDER_NOT_FOUND', message: 'Không tìm thấy đơn hàng' });
      }

      if (order.status !== 'CANCELLED') {
        return res.status(400).json({ error_code: 'INVALID_STATUS', message: 'Đơn hàng không ở trạng thái bị hủy' });
      }

      // Tìm trạng thái hợp lệ gần nhất trước khi CANCELLED (hoặc mặc định CONFIRMED)
      const validPreviousHist = [...(order.status_history || [])].reverse().find(h => h.to_status && h.to_status !== 'CANCELLED');
      const targetStatus = validPreviousHist ? validPreviousHist.to_status : 'CONFIRMED';

      // Trừ lại kho sản phẩm do trước đó đã + kho khi cancel
      const items = await OrderItem.find({ order_id: order._id });
      for (const item of items) {
        if (item.variant_id) {
          await ProductVariant.findByIdAndUpdate(item.variant_id, {
            $inc: { quantity: -item.quantity }
          });
        }
      }

      const prevStatus = order.status;
      order.status = targetStatus;
      const rejectNote = reason ? `Manager từ chối hủy. Lý do: ${reason}` : 'Manager từ chối yêu cầu hủy đơn';
      order.status_history.push({
        from_status: prevStatus,
        to_status: targetStatus,
        updated_by: req.user._id,
        note: rejectNote
      });

      await order.save();

      return res.status(200).json({
        code: 0,
        message: 'Từ chối yêu cầu hủy đơn hàng thành công',
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
      const order = await Order.findById(id)
        .populate('user_id', 'username email first_name last_name phone')
        .populate('status_history.updated_by', 'username email first_name last_name');

      if (!order) {
        return res.status(404).json({ error_code: 'ORDER_NOT_FOUND', message: 'Không tìm thấy đơn hàng' });
      }

      if (req.user.role === 'CUSTOMER' && order.user_id._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error_code: 'FORBIDDEN', message: 'Bạn không có quyền xem chi tiết đơn hàng này' });
      }

      const items = await OrderItem.find({ order_id: id }).populate('product_id').populate('variant_id').populate('lens_id');

      const mappedItems = items.map(item => {
        const itemObj = item.toObject ? item.toObject() : item;
        let p = itemObj.prescription;
        if (p) {
          const odSph = p.od_sphere ?? p.odSphere ?? 0;
          const odCyl = p.od_cylinder ?? p.odCylinder ?? 0;
          const osSph = p.os_sphere ?? p.osSphere ?? 0;
          const osCyl = p.os_cylinder ?? p.osCylinder ?? 0;
          if (!p.imageUrl && order.prescription_image && odSph === 0 && odCyl === 0 && osSph === 0 && osCyl === 0) {
            p.imageUrl = order.prescription_image;
          }
        }
        return {
          ...itemObj,
          prescription: p
        };
      });

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
          items: mappedItems
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
      const nextStatus = status.toUpperCase();
      if (!allowedStatuses.includes(nextStatus)) {
        return res.status(400).json({ error_code: 'VALIDATION_ERROR', message: 'Trạng thái đơn hàng không hợp lệ' });
      }

      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({ error_code: 'ORDER_NOT_FOUND', message: 'Không tìm thấy đơn hàng' });
      }

      const currentStatus = order.status.toUpperCase();
      const userRole = req.user?.role?.toUpperCase() || 'MANAGER';
      const userId = req.user?._id;

      // Định nghĩa State Machine dành cho MANAGER
      const VALID_TRANSITIONS = {
        'PENDING': ['CANCELLED'],
        'AWAITING_VERIFICATION': ['CONFIRMED', 'CANCELLED'],
        'CONFIRMED': ['COMPLETED', 'CANCELLED'],
        'COMPLETED': [],
        'CANCELLED': [],
        'REFUNDED': []
      };

      if (currentStatus !== nextStatus) {
        let isOverride = false;
        let note = req.body.note || '';

        // 1. Kiểm tra phân quyền chuyển đổi
        if (userRole === 'ADMIN') {
          // ADMIN được phép bypass state machine (override)
          isOverride = true;
          note = note || `ADMIN override chuyển đổi trạng thái từ ${currentStatus} sang ${nextStatus}`;
          console.warn(`[SECURITY AUDIT] Admin (ID: ${userId}) has forced status override on Order ${order._id}: ${currentStatus} -> ${nextStatus}`);
        } else {
          // MANAGER bắt buộc phải tuân theo State Machine
          const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];
          if (!allowedTransitions.includes(nextStatus)) {
            return res.status(400).json({
              error_code: 'INVALID_TRANSITION',
              message: `Không được phép tự ý chuyển trạng thái đơn hàng từ ${currentStatus} sang ${nextStatus}.`
            });
          }

          // Cấm MANAGER chuyển thẳng sang REFUNDED thủ công
          if (nextStatus === 'REFUNDED') {
            return res.status(400).json({
              error_code: 'FORBIDDEN_TRANSITION',
              message: 'Trạng thái REFUNDED chỉ được phép cập nhật tự động từ luồng hoàn tiền.'
            });
          }
        }

        // 2. Ghi nhận lịch sử trạng thái mới
        order.status_history.push({
          from_status: currentStatus,
          to_status: nextStatus,
          updated_by: userId,
          updated_at: new Date(),
          is_override: isOverride,
          note: note || `Đã chuyển đổi trạng thái thành ${nextStatus}`
        });

        order.status = nextStatus;
        await order.save();
      }

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