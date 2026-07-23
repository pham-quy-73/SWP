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
  },
  payment_status: {
    type: String,
    enum: ['UNPAID', 'PAID'],
    default: 'UNPAID'
  },
  transaction_id: {
    type: String,
    default: ''
  },
  paid_at: {
    type: Date
  },
  // Thời điểm gần nhất khách khởi tạo link thanh toán VNPay. Cleanup job dựa vào
  // đây để gia hạn cửa sổ hủy tự động (khách đang ở trang VNPay thì không hủy vội).
  payment_initiated_at: {
    type: Date
  },
  status_history: [{
    from_status: { type: String, default: '' },
    to_status: { type: String, required: true },
    updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updated_at: { type: Date, default: Date.now },
    is_override: { type: Boolean, default: false },
    note: { type: String, default: '' }
  }]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export default mongoose.model('Order', OrderSchema);

