import mongoose from 'mongoose';

/**
 * @typedef {Object} Cart
 * @property {mongoose.Types.ObjectId} user_id
 * @property {mongoose.Types.ObjectId} product_id
 * @property {number} quantity
 */
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
