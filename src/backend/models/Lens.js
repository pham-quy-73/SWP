import mongoose from 'mongoose';

const LensSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  material: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  discountPrice: {
    type: Number,
    min: 0 // Giá khuyến mãi của tròng kính (PricingService ưu tiên khi > 0)
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE'
  }
}, {
  timestamps: true
});

export default mongoose.model('Lens', LensSchema);
