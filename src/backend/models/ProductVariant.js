import mongoose from 'mongoose';

/**
 * @typedef {Object} ProductVariant
 * @property {mongoose.Types.ObjectId} productId
 * @property {string} colorName
 * @property {string} frameFinish
 * @property {number} lensWidthMm
 * @property {number} bridgeWidthMm
 * @property {number} templeLengthMm
 * @property {string} sizeLabel
 * @property {number} price
 * @property {number} quantity
 * @property {string} status - ACTIVE, INACTIVE
 * @property {string} orderItemType - IN_STOCK, PRE_ORDER
 */

const VariantImageSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true,
    trim: true
  }
});

const ProductVariantSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  colorName: {
    type: String,
    default: ''
  },
  frameFinish: {
    type: String,
    default: ''
  },
  lensWidthMm: {
    type: Number,
    required: true
  },
  bridgeWidthMm: {
    type: Number,
    required: true
  },
  templeLengthMm: {
    type: Number,
    required: true
  },
  sizeLabel: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE'
  },
  orderItemType: {
    type: String,
    enum: ['IN_STOCK', 'PRE_ORDER'],
    default: 'IN_STOCK'
  },
  imageUrl: { type: [VariantImageSchema], default: [] }
}, {
  timestamps: true
});

export default mongoose.model('ProductVariant', ProductVariantSchema);
