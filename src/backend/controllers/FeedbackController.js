import Feedback from '../models/Feedback.js';
import Order from '../models/Order.js';

class FeedbackController {
  /**
   * Tạo đánh giá mới cho sản phẩm trong đơn hàng
   */
  async createFeedback(req, res, next) {
    try {
      let { order_id, orderId, product_id, productId, rating, comment } = req.body;

      if (req.body.feedback) {
        try {
          const parsed = typeof req.body.feedback === 'string' ? JSON.parse(req.body.feedback) : req.body.feedback;
          orderId = parsed.orderId || parsed.order_id || orderId;
          productId = parsed.productId || parsed.product_id || productId;
          rating = parsed.rating ?? rating;
          comment = parsed.comment ?? comment;
        } catch (e) {
          console.error('Lỗi parse json feedback field:', e);
        }
      }

      const targetOrderId = order_id || orderId;
      const targetProductId = product_id || productId;

      if (!targetOrderId || !targetProductId || rating === undefined || rating === null) {
        return res.status(400).json({
          error_code: 'VALIDATION_ERROR',
          message: 'Vui lòng cung cấp mã đơn hàng, mã sản phẩm và số sao đánh giá'
        });
      }

      // Kiểm tra đơn hàng thuộc về user
      const order = await Order.findOne({ _id: targetOrderId, user_id: req.user._id });
      if (!order) {
        return res.status(404).json({
          error_code: 'ORDER_NOT_FOUND',
          message: 'Không tìm thấy đơn hàng hoặc bạn không có quyền đánh giá đơn này'
        });
      }

      // Helper map feedback object cho Frontend
      const mapFeedback = (f) => {
        const obj = typeof f.toObject === 'function' ? f.toObject() : f;
        return {
          ...obj,
          feedbackId: obj._id ? obj._id.toString() : '',
          orderId: obj.order_id ? (obj.order_id._id ? obj.order_id._id.toString() : obj.order_id.toString()) : '',
          productId: obj.product_id ? (obj.product_id._id ? obj.product_id._id.toString() : obj.product_id.toString()) : '',
          imageUrls: obj.images || []
        };
      };

      // Kiểm tra nếu đã có đánh giá trước đó -> Tự động chuyển sang Cập nhật thay vì báo lỗi 400
      let existing = await Feedback.findOne({
        user_id: req.user._id,
        order_id: targetOrderId,
        product_id: targetProductId
      });

      let imageUrls = [];
      if (req.files && req.files.length > 0) {
        imageUrls = req.files.map(file => `/uploads/${file.filename}`);
      }

      if (existing) {
        existing.rating = Number(rating);
        if (comment !== undefined) existing.comment = comment;
        if (imageUrls.length > 0) existing.images = [...existing.images, ...imageUrls];
        await existing.save();

        return res.status(200).json({
          code: 0,
          message: 'Cập nhật đánh giá thành công',
          result: mapFeedback(existing)
        });
      }

      const feedback = new Feedback({
        user_id: req.user._id,
        order_id: targetOrderId,
        product_id: targetProductId,
        rating: Number(rating),
        comment: comment || '',
        images: imageUrls
      });

      await feedback.save();

      return res.status(201).json({
        code: 0,
        message: 'Gửi đánh giá thành công',
        result: mapFeedback(feedback)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy danh sách đánh giá của tôi
   */
  async getMyFeedbacks(req, res, next) {
    try {
      const feedbacks = await Feedback.find({ user_id: req.user._id })
        .populate('product_id', 'name price thumbnail image_url')
        .sort({ createdAt: -1 });

      const mapped = feedbacks.map(f => {
        const obj = f.toObject();
        return {
          ...obj,
          feedbackId: obj._id ? obj._id.toString() : '',
          orderId: obj.order_id ? (obj.order_id._id ? obj.order_id._id.toString() : obj.order_id.toString()) : '',
          productId: obj.product_id ? (obj.product_id._id ? obj.product_id._id.toString() : obj.product_id.toString()) : '',
          imageUrls: obj.images || []
        };
      });

      return res.status(200).json({
        code: 0,
        result: mapped
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy danh sách đánh giá theo sản phẩm
   */
  async getProductFeedbacks(req, res, next) {
    try {
      const { productId } = req.params;
      const feedbacks = await Feedback.find({ product_id: productId })
        .populate('user_id', 'first_name last_name avatar_url username')
        .sort({ createdAt: -1 });

      return res.status(200).json({
        code: 0,
        result: feedbacks
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy danh sách đánh giá theo đơn hàng
   */
  async getFeedbackByOrder(req, res, next) {
    try {
      const { orderId } = req.params;
      const feedbacks = await Feedback.find({ order_id: orderId, user_id: req.user._id })
        .populate('product_id', 'name price thumbnail image_url');

      return res.status(200).json({
        code: 0,
        result: feedbacks
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy chi tiết 1 đánh giá
   */
  async getFeedbackDetail(req, res, next) {
    try {
      const { feedbackId } = req.params;
      const feedback = await Feedback.findById(feedbackId)
        .populate('product_id', 'name price thumbnail image_url');

      if (!feedback) {
        return res.status(404).json({ error_code: 'NOT_FOUND', message: 'Không tìm thấy đánh giá' });
      }

      return res.status(200).json({ code: 0, result: feedback });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cập nhật đánh giá
   */
  async updateFeedback(req, res, next) {
    try {
      const { feedbackId } = req.params;
      let { rating, comment } = req.body;

      if (req.body.feedback) {
        try {
          const parsed = typeof req.body.feedback === 'string' ? JSON.parse(req.body.feedback) : req.body.feedback;
          rating = parsed.rating ?? rating;
          comment = parsed.comment ?? comment;
        } catch (e) {}
      }

      const feedback = await Feedback.findOne({ _id: feedbackId, user_id: req.user._id });
      if (!feedback) {
        return res.status(404).json({ error_code: 'NOT_FOUND', message: 'Không tìm thấy đánh giá hoặc không có quyền sửa' });
      }

      if (rating) feedback.rating = Number(rating);
      if (comment !== undefined) feedback.comment = comment;

      if (req.files && req.files.length > 0) {
        const newImages = req.files.map(file => `/uploads/${file.filename}`);
        feedback.images = [...feedback.images, ...newImages];
      }

      await feedback.save();

      return res.status(200).json({
        code: 0,
        message: 'Cập nhật đánh giá thành công',
        result: feedback
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Xóa đánh giá
   */
  async deleteFeedback(req, res, next) {
    try {
      const { feedbackId } = req.params;
      const feedback = await Feedback.findOneAndDelete({ _id: feedbackId, user_id: req.user._id });

      if (!feedback) {
        return res.status(404).json({ error_code: 'NOT_FOUND', message: 'Không tìm thấy đánh giá hoặc không có quyền xóa' });
      }

      return res.status(200).json({
        code: 0,
        message: 'Xóa đánh giá thành công'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new FeedbackController();
