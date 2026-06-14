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
  }
}, {
  timestamps: true
});

export default mongoose.model('Product', ProductSchema);
