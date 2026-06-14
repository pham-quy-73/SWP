import mongoose from 'mongoose';

/**
 * @typedef {Object} Verification
 * @property {mongoose.Types.ObjectId} order_id
 * @property {mongoose.Types.ObjectId} verified_by - Người duyệt (Sale)
 * @property {string} status - APPROVE, REJECT
 * @property {string} note
 */
const VerificationSchema = new mongoose.Schema({
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  verified_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['APPROVE', 'REJECT'],
    required: true
  },
  note: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export default mongoose.model('Verification', VerificationSchema);
