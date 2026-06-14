import mongoose from 'mongoose';

/**
 * @typedef {Object} Payment
 * @property {mongoose.Types.ObjectId} order_id
 * @property {number} amount
 * @property {string} method
 * @property {string} status - Trạng thái thanh toán (ví dụ: PAID, UNPAID, FAILED)
 * @property {string} transaction_id
 */
const PaymentSchema = new mongoose.Schema({
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
  method: {
    type: String,
    required: true,
    default: 'VNPAY'
  },
  status: {
    type: String,
    required: true,
    enum: ['UNPAID', 'PAID', 'FAILED'],
    default: 'UNPAID'
  },
  transaction_id: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export default mongoose.model('Payment', PaymentSchema);
