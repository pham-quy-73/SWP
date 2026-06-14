import mongoose from 'mongoose';

/**
 * @typedef {Object} OrderItem
 * @property {mongoose.Types.ObjectId} order_id
 * @property {mongoose.Types.ObjectId} product_id
 * @property {number} quantity
 * @property {number} unit_price
 */
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
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unit_price: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

export default mongoose.model('OrderItem', OrderItemSchema);
