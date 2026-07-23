import mongoose from 'mongoose';

// Đơn kính (prescription) chỉ áp dụng khi item có gắn tròng (lens_id).
// Không đặt required để không phá vỡ các đơn "gọng only" hiện có.
const PrescriptionSchema = new mongoose.Schema({
  od_sphere:   { type: Number, default: 0 }, // SPH mắt phải
  od_cylinder: { type: Number, default: 0 }, // CYL mắt phải
  od_axis:     { type: Number, default: 0 }, // Trục mắt phải
  od_add:      { type: Number, default: 0 }, // ADD mắt phải
  od_pd:       { type: Number, default: 0 }, // PD mắt phải
  os_sphere:   { type: Number, default: 0 }, // SPH mắt trái
  os_cylinder: { type: Number, default: 0 }, // CYL mắt trái
  os_axis:     { type: Number, default: 0 }, // Trục mắt trái
  os_add:      { type: Number, default: 0 }, // ADD mắt trái
  os_pd:       { type: Number, default: 0 }, // PD mắt trái
  note:        { type: String, default: '' },
  imageUrl:    { type: String, default: '' } // Đường dẫn ảnh đơn kính
}, { _id: false });

const OrderItemSchema = new mongoose.Schema({
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  // Đảm bảo trường này có mặt trong Schema
  variant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductVariant'
  },
  lens_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lens',
    default: null
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unit_price: {
    type: Number,
    required: true
  },
  prescription: {
    type: PrescriptionSchema,
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.model('OrderItem', OrderItemSchema);