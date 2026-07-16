import mongoose from 'mongoose';

const AddressSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    label: {
      type: String,
      default: '',
      trim: true
    },
    recipient_name: {
      type: String,
      required: true,
      trim: true
    },
    phone_number: {
      type: String,
      required: true,
      trim: true
    },
    delivery_address: {
      type: String,
      required: true,
      trim: true
    },
    is_default: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

AddressSchema.index({ user_id: 1, is_default: -1, updatedAt: -1 });

export default mongoose.model('Address', AddressSchema);
