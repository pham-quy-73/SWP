import mongoose from 'mongoose';

/**
 * @typedef {Object} Refund
 * @property {mongoose.Types.ObjectId} order_id
 * @property {number} amount
 * @property {string} reason
 * @property {string} status - PENDING, COMPLETED
 */
const RefundSchema = new mongoose.Schema({
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED'],
    default: 'PENDING'
  }
}, {
  timestamps: true
});

export default mongoose.model('Refund', RefundSchema);
