import mongoose from 'mongoose';

/**
 * Schema phụ cho mảng hình ảnh của sản phẩm kính
 */
const ImageSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true,
    trim: true
  }
});

/**
 * @typedef {Object} Product
 * @property {string} name
 * @property {string} brand
 * @property {number} price
 * @property {number} [discountPrice]
 * @property {Array<{imageUrl: string}>} imageUrl
 * @property {number} stock_quantity
 * @property {string} description
 * @property {string} category
 * @property {string} frameType
 * @property {string} gender
 * @property {string} shape
 * @property {string} frameMaterial
 * @property {string} hingeType
 * @property {string} nosePadType
 * @property {number} weightGram
 * @property {string} status
 */
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
  stock_quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['FRAME', 'SUNGLASSES', 'ACCESSORIES'],
    required: true,
    default: 'FRAME'
  },
  frameType: {
    type: String,
    enum: ['Full-Rim', 'Semi-Rimless', 'Rimless', 'Other'],
    default: 'Full-Rim'
  },
  gender: {
    type: String,
    enum: ['MALE', 'FEMALE', 'UNISEX'],
    default: 'UNISEX'
  },
  shape: {
    type: String,
    default: ''
  },
  frameMaterial: {
    type: String,
    default: ''
  },
  hingeType: {
    type: String,
    default: 'Standard'
  },
  nosePadType: {
    type: String,
    default: 'Fixed'
  },
  weightGram: {
    type: Number,
    min: 0,
    default: 0
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE'
  }
}, {
  timestamps: true
});

export default mongoose.model('Product', ProductSchema);

