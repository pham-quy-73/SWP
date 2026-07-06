import mongoose from 'mongoose';

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
  sku: {
    type: String,
    trim: true,
    default: '' // Nâng cấp: Bổ sung mã SKU
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
  discountPrice: {
    type: Number,
    min: 0 // Nâng cấp: Bổ sung giá khuyến mãi riêng cho biến thể
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