import mongoose from 'mongoose';

/**
 * @typedef {Object} User
 * @property {string} username
 * @property {string} password
 * @property {string} role - 'CUSTOMER', 'SALE', 'ADMIN'
 * @property {string} email
 * @property {string} phone
 */
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['CUSTOMER', 'SALE', 'ADMIN'],
    default: 'CUSTOMER'
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('User', UserSchema);
