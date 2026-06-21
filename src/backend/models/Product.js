import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  brand: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  image_url: {
    type: String,
    required: true
  },
  image_public_id: {
    type: String,
    required: true
  },
  stock_quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: 'stock_quantity phải là số nguyên'
    }
  },
  description: {
    type: String,
    default: ''
  },
  deleted_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.model('Product', ProductSchema);
