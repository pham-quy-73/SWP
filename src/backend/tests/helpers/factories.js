import jwt from 'jsonwebtoken';
import User from '../../models/User.js';
import Product from '../../models/Product.js';
import ProductVariant from '../../models/ProductVariant.js';
import Order from '../../models/Order.js';
import OrderItem from '../../models/OrderItem.js';
import Address from '../../models/Address.js';
import Refund from '../../models/Refund.js';

let seq = 0;
const uniq = () => `${Date.now().toString(36)}${(seq++).toString(36)}`;

/**
 * Tạo JWT hợp lệ cho user (khớp payload authMiddleware mong đợi: { id, role }).
 */
export function makeToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

export function authHeader(user) {
  return { Authorization: `Bearer ${makeToken(user)}` };
}

/**
 * Tạo user trong DB. Mật khẩu mặc định 'password123' (đã hash qua pre-save hook).
 * is_email_verified mặc định true để login/authenticate qua được.
 */
export async function createUser(overrides = {}) {
  const u = uniq();
  const data = {
    username: overrides.username || `user_${u}`,
    email: overrides.email || `user_${u}@example.com`,
    password: overrides.password !== undefined ? overrides.password : 'password123',
    first_name: overrides.first_name || 'Test',
    last_name: overrides.last_name || 'User',
    role: overrides.role || 'CUSTOMER',
    is_email_verified: overrides.is_email_verified !== undefined ? overrides.is_email_verified : true,
    ...overrides
  };
  return User.create(data);
}

export const createCustomer = (o = {}) => createUser({ role: 'CUSTOMER', ...o });
export const createManager = (o = {}) => createUser({ role: 'MANAGER', ...o });
export const createAdmin = (o = {}) => createUser({ role: 'ADMIN', ...o });

export async function createProduct(overrides = {}) {
  const data = {
    name: overrides.name || `Product ${uniq()}`,
    brand: overrides.brand || 'TestBrand',
    price: overrides.price !== undefined ? overrides.price : 1000,
    category: overrides.category || 'FRAME',
    status: overrides.status || 'ACTIVE',
    ...overrides
  };
  return Product.create(data);
}

export async function createLens(overrides = {}) {
  return createProduct({ category: 'LENS', name: `Lens ${uniq()}`, price: 500, ...overrides });
}

export async function createVariant(product, overrides = {}) {
  const data = {
    productId: product?._id || overrides.productId,
    sku: overrides.sku || `SKU-${uniq()}`,
    colorName: overrides.colorName || 'Black',
    lensWidthMm: overrides.lensWidthMm !== undefined ? overrides.lensWidthMm : 52,
    bridgeWidthMm: overrides.bridgeWidthMm !== undefined ? overrides.bridgeWidthMm : 18,
    templeLengthMm: overrides.templeLengthMm !== undefined ? overrides.templeLengthMm : 140,
    price: overrides.price !== undefined ? overrides.price : 1000,
    quantity: overrides.quantity !== undefined ? overrides.quantity : 10,
    status: overrides.status || 'ACTIVE',
    ...overrides
  };
  return ProductVariant.create(data);
}

export async function createOrder(user, overrides = {}) {
  const data = {
    user_id: user?._id || overrides.user_id,
    status: overrides.status || 'PENDING',
    total_amount: overrides.total_amount !== undefined ? overrides.total_amount : 1000,
    payment_status: overrides.payment_status || 'UNPAID',
    ...overrides
  };
  return Order.create(data);
}

export async function createOrderItem(order, overrides = {}) {
  const data = {
    order_id: order?._id || overrides.order_id,
    product_id: overrides.product_id,
    variant_id: overrides.variant_id,
    lens_id: overrides.lens_id || null,
    quantity: overrides.quantity !== undefined ? overrides.quantity : 1,
    unit_price: overrides.unit_price !== undefined ? overrides.unit_price : 1000,
    ...overrides
  };
  return OrderItem.create(data);
}

export async function createAddress(user, overrides = {}) {
  const data = {
    user_id: user?._id || overrides.user_id,
    recipient_name: overrides.recipient_name || 'Nguyen Van A',
    phone_number: overrides.phone_number || '0900000000',
    delivery_address: overrides.delivery_address || '123 Test Street',
    is_default: overrides.is_default || false,
    ...overrides
  };
  return Address.create(data);
}

export async function createRefund(order, overrides = {}) {
  const data = {
    order_id: order?._id || overrides.order_id,
    amount: overrides.amount !== undefined ? overrides.amount : 1000,
    reason: overrides.reason || 'Test refund',
    status: overrides.status || 'PENDING',
    ...overrides
  };
  return Refund.create(data);
}
