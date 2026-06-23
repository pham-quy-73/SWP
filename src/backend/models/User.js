import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, default: null },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    phone: { type: String, default: null },
    dob: { type: Date, default: null },
    avatar_url: { type: String, default: null },
    google_id: { type: String, unique: true, sparse: true },
    is_email_verified: { type: Boolean, default: false },
    verify_token: { type: String, default: null },
    verify_token_expires: { type: Date, default: null },
    role: { type: String, enum: ['CUSTOMER', 'SALE', 'MANAGER', 'SHIPPER', 'ADMIN'], default: 'CUSTOMER' },
    deleted_at: { type: Date, default: null }
  },
  { timestamps: true }
);

userSchema.index({ verify_token: 1 });

userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;