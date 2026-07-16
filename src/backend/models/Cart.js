import mongoose from 'mongoose';

const CartSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  // NÂNG CẤP: Phải biết chính xác khách chọn Gọng màu gì, size gì
  variant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductVariant',
    required: true
  },
  // NÂNG CẤP: Lưu thêm ID của Tròng kính (nếu khách có chọn mua kèm)
  lens_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  }
}, {
  timestamps: true
});

export default mongoose.model('Cart', CartSchema);