import mongoose from 'mongoose';

/**
 * @typedef {Object} Order
 * @property {mongoose.Types.ObjectId} user_id
 * @property {string} status - Trạng thái đơn hàng (PENDING, AWAITING_VERIFICATION, CONFIRMED, COMPLETED, CANCELLED, REFUNDED)
 * @property {number} total_amount
 * @property {string} prescription_text
 * @property {string} prescription_image
 * @property {Date} created_at
 */
const OrderSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'AWAITING_VERIFICATION', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REFUNDED'],
    default: 'PENDING'
  },
  total_amount: {
    type: Number,
    required: true,
    min: 0
  },
  prescription_text: {
    type: String,
    default: ''
  },
  prescription_image: {
    type: String,
    default: ''
  },
  recipient_name: {
    type: String,
    default: ''
  },
  phone_number: {
    type: String,
    default: ''
  },
  delivery_address: {
    type: String,
    default: ''
  },
  bank_info: {
    bank_name: { type: String, default: '' },
    bank_account_number: { type: String, default: '' },
    account_holder_name: { type: String, default: '' }
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export default mongoose.model('Order', OrderSchema);

