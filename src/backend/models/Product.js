import mongoose from 'mongoose';

const ImageSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true,
    trim: true
  }
});

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
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
    min: 0
  },
  imageUrl: {
    type: [ImageSchema],
    default: []
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['FRAME', 'SUNGLASSES', 'LENS'],
    required: true,
    default: 'FRAME'
  },
  // Các trường của Gọng kính được thả lỏng, tự do nhận chuỗi rỗng khi tạo Tròng kính
  frameType: { type: String, default: '' },
  gender: { type: String, default: '' },
  shape: { type: String, default: '' },
  frameMaterial: { type: String, default: '' },
  hingeType: { type: String, default: '' },
  nosePadType: { type: String, default: '' },
  weightGram: { type: Number, min: 0, default: 0 },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE'
  }
}, {
  timestamps: true
});

export default mongoose.model('Product', ProductSchema);