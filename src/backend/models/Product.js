import mongoose from 'mongoose';

/**
 * @typedef {Object} Product
 * @property {string} name
 * @property {string} brand
 * @property {number} price
 * @property {string} image
 * @property {number} stock_quantity
 * @property {string} description
 */
const productSchema = new mongoose.Schema({
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
  image: {
    type: String,
    default: ''
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
  // Thêm trường xóa mềm bắt buộc theo luật DATA-01
  deleted_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Thêm chỉ mục (Index) bắt buộc theo luật ARCH-04 để tối ưu tìm kiếm
productSchema.index({ name: 1, brand: 1 });

export default mongoose.model('Product', productSchema);