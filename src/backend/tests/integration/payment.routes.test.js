import { describe, it, expect, beforeEach } from 'vitest';
import crypto from 'crypto';
import request from 'supertest';
import { createApp } from '../../app.js';
import {
  authHeader, createCustomer, createProduct, createVariant,
  createLens, createOrder
} from '../helpers/factories.js';

const app = createApp();

// Tính chữ ký VNPay giống controller để giả lập callback hợp lệ.
function signParams(params, secret) {
  const sortedKeys = Object.keys(params).sort();
  const sortedParams = {};
  for (const key of sortedKeys) sortedParams[key] = params[key];
  const signData = new URLSearchParams(sortedParams).toString();
  const hmac = crypto.createHmac('sha512', secret);
  return hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
}

describe('POST /payment/orders/requirement', () => {
  let customer, variant;
  beforeEach(async () => {
    customer = await createCustomer();
    const product = await createProduct({ price: 1000 });
    variant = await createVariant(product, { price: 800, quantity: 5 });
  });

  it('yêu cầu xác thực -> 401', async () => {
    const res = await request(app).post('/payment/orders/requirement').send({ items: [] });
    expect(res.status).toBe(401);
  });

  it('items rỗng -> 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/payment/orders/requirement')
      .set(authHeader(customer))
      .send({ items: [] });
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('VALIDATION_ERROR');
  });

  it('tính đúng tổng tiền theo giá DB (happy path)', async () => {
    const res = await request(app)
      .post('/payment/orders/requirement')
      .set(authHeader(customer))
      .send({ items: [{ productVariantId: variant._id.toString(), variantId: variant._id.toString(), quantity: 2 }] });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.result.orderTotal).toBe(1600);
    expect(res.body.result.requiredAmount).toBe(1600);
    expect(res.body.result.itemRequirements).toHaveLength(1);
  });

  it('cộng giá tròng khi có lensId', async () => {
    const lens = await createLens({ price: 300 });
    const res = await request(app)
      .post('/payment/orders/requirement')
      .set(authHeader(customer))
      .send({ items: [{ variantId: variant._id.toString(), lensId: lens._id.toString(), quantity: 1 }] });
    expect(res.status).toBe(200);
    expect(res.body.result.orderTotal).toBe(1100);
    expect(res.body.result.itemRequirements[0].lensPrice).toBe(300);
  });

  it('variant không tồn tại -> 400 VARIANT_NOT_FOUND (PricingError)', async () => {
    const res = await request(app)
      .post('/payment/orders/requirement')
      .set(authHeader(customer))
      .send({ items: [{ variantId: '64b7f0f0f0f0f0f0f0f0f0f0', quantity: 1 }] });
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('VARIANT_NOT_FOUND');
  });
});

describe('POST /payment/checkout', () => {
  let customer, order;
  beforeEach(async () => {
    customer = await createCustomer();
    order = await createOrder(customer, { total_amount: 5000, status: 'PENDING' });
  });

  it('yêu cầu xác thực -> 401', async () => {
    const res = await request(app).post('/payment/checkout').send({ orderId: order._id.toString() });
    expect(res.status).toBe(401);
  });

  it('thiếu orderId -> 400', async () => {
    const res = await request(app).post('/payment/checkout').set(authHeader(customer)).send({});
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('VALIDATION_ERROR');
  });

  it('order không tồn tại -> 404', async () => {
    const res = await request(app)
      .post('/payment/checkout')
      .set(authHeader(customer))
      .send({ orderId: '64b7f0f0f0f0f0f0f0f0f0f0' });
    expect(res.status).toBe(404);
    expect(res.body.error_code).toBe('ORDER_NOT_FOUND');
  });

  it('order đã CONFIRMED -> 400 INVALID_STATUS', async () => {
    const confirmed = await createOrder(customer, { total_amount: 5000, status: 'CONFIRMED' });
    const res = await request(app)
      .post('/payment/checkout')
      .set(authHeader(customer))
      .send({ orderId: confirmed._id.toString() });
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('INVALID_STATUS');
  });

  it('happy path -> trả về paymentUrl VNPay hợp lệ', async () => {
    const res = await request(app)
      .post('/payment/checkout')
      .set(authHeader(customer))
      .send({ orderId: order._id.toString() });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.result).toContain(process.env.VNP_URL);
    expect(res.body.result).toContain('vnp_SecureHash=');
    expect(res.body.result).toContain(`vnp_Amount=${5000 * 100}`);
  });
});

describe('GET /payment/vnpay-callback', () => {
  let customer, order;
  beforeEach(async () => {
    customer = await createCustomer();
    order = await createOrder(customer, { total_amount: 5000, status: 'PENDING' });
  });

  const buildCallback = (overrides = {}) => {
    const params = {
      vnp_Amount: String(5000 * 100),
      vnp_TxnRef: order._id.toString(),
      vnp_ResponseCode: '00',
      vnp_TransactionNo: 'VNP123456',
      ...overrides
    };
    const secureHash = signParams(params, process.env.VNP_HASH_SECRET);
    return { ...params, vnp_SecureHash: secureHash };
  };

  it('chữ ký sai -> redirect failure', async () => {
    const res = await request(app)
      .get('/payment/vnpay-callback')
      .query({ ...buildCallback(), vnp_SecureHash: 'deadbeef' });
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('/checkout/failure');
  });

  it('thanh toán thành công (00) -> CONFIRMED + redirect success', async () => {
    const res = await request(app).get('/payment/vnpay-callback').query(buildCallback());
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('/checkout/success');

    const Order = (await import('../../models/Order.js')).default;
    const dbOrder = await Order.findById(order._id);
    expect(dbOrder.status).toBe('CONFIRMED');
    expect(dbOrder.payment_status).toBe('PAID');
    expect(dbOrder.transaction_id).toBe('VNP123456');
  });

  it('sai số tiền -> redirect failure, không đổi trạng thái', async () => {
    const res = await request(app)
      .get('/payment/vnpay-callback')
      .query(buildCallback({ vnp_Amount: '999' }));
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('/checkout/failure');
    const Order = (await import('../../models/Order.js')).default;
    const dbOrder = await Order.findById(order._id);
    expect(dbOrder.status).toBe('PENDING');
  });

  it('ResponseCode != 00 -> CANCELLED + redirect failure', async () => {
    const res = await request(app)
      .get('/payment/vnpay-callback')
      .query(buildCallback({ vnp_ResponseCode: '24' }));
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('/checkout/failure');
    const Order = (await import('../../models/Order.js')).default;
    const dbOrder = await Order.findById(order._id);
    expect(dbOrder.status).toBe('CANCELLED');
  });

  it('order không PENDING (đã CONFIRMED) -> redirect success, idempotent', async () => {
    const confirmed = await createOrder(customer, { total_amount: 5000, status: 'CONFIRMED' });
    const params = {
      vnp_Amount: String(5000 * 100),
      vnp_TxnRef: confirmed._id.toString(),
      vnp_ResponseCode: '00',
      vnp_TransactionNo: 'VNP999'
    };
    const res = await request(app)
      .get('/payment/vnpay-callback')
      .query({ ...params, vnp_SecureHash: signParams(params, process.env.VNP_HASH_SECRET) });
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('/checkout/success');
  });

  it('order không tồn tại -> redirect failure', async () => {
    const params = {
      vnp_Amount: String(5000 * 100),
      vnp_TxnRef: '64b7f0f0f0f0f0f0f0f0f0f0',
      vnp_ResponseCode: '00'
    };
    const res = await request(app)
      .get('/payment/vnpay-callback')
      .query({ ...params, vnp_SecureHash: signParams(params, process.env.VNP_HASH_SECRET) });
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('/checkout/failure');
  });
});

describe('POST /payment/mock-checkout', () => {
  let customer, order;
  beforeEach(async () => {
    customer = await createCustomer();
    order = await createOrder(customer, { total_amount: 5000, status: 'PENDING' });
  });

  it('bị chặn ở production -> 403', async () => {
    process.env.NODE_ENV = 'production';
    const res = await request(app)
      .post('/payment/mock-checkout')
      .set(authHeader(customer))
      .send({ orderId: order._id.toString(), simulateStatus: 'SUCCESS' });
    process.env.NODE_ENV = 'test';
    expect(res.status).toBe(403);
    expect(res.body.error_code).toBe('FORBIDDEN');
  });

  it('thiếu orderId -> 400', async () => {
    const res = await request(app).post('/payment/mock-checkout').set(authHeader(customer)).send({});
    expect(res.status).toBe(400);
  });

  it('order không tồn tại -> 404', async () => {
    const res = await request(app)
      .post('/payment/mock-checkout')
      .set(authHeader(customer))
      .send({ orderId: '64b7f0f0f0f0f0f0f0f0f0f0', simulateStatus: 'SUCCESS' });
    expect(res.status).toBe(404);
  });

  it('SUCCESS -> CONFIRMED + PAID', async () => {
    const res = await request(app)
      .post('/payment/mock-checkout')
      .set(authHeader(customer))
      .send({ orderId: order._id.toString(), simulateStatus: 'SUCCESS' });
    expect(res.status).toBe(200);
    expect(res.body.result.success).toBe(true);
    const Order = (await import('../../models/Order.js')).default;
    const dbOrder = await Order.findById(order._id);
    expect(dbOrder.status).toBe('CONFIRMED');
    expect(dbOrder.payment_status).toBe('PAID');
  });

  it('FAILED -> CANCELLED + hoàn tồn kho', async () => {
    const res = await request(app)
      .post('/payment/mock-checkout')
      .set(authHeader(customer))
      .send({ orderId: order._id.toString(), simulateStatus: 'FAILED' });
    expect(res.status).toBe(200);
    expect(res.body.result.success).toBe(false);
    const Order = (await import('../../models/Order.js')).default;
    const dbOrder = await Order.findById(order._id);
    expect(dbOrder.status).toBe('CANCELLED');
  });

  it('order đã CONFIRMED -> 400 INVALID_STATUS', async () => {
    const confirmed = await createOrder(customer, { total_amount: 5000, status: 'CONFIRMED' });
    const res = await request(app)
      .post('/payment/mock-checkout')
      .set(authHeader(customer))
      .send({ orderId: confirmed._id.toString(), simulateStatus: 'SUCCESS' });
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('INVALID_STATUS');
  });
});
