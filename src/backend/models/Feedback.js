import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      default: ''
    },
    images: [{
      type: String
    }]
  },
  { timestamps: true }
);

feedbackSchema.index({ user_id: 1, order_id: 1, product_id: 1 });

const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;
