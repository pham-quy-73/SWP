import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  // Đảm bảo trường này có mặt trong Schema
  variant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductVariant' 
  },
  lens_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unit_price: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('OrderItem', OrderItemSchema);