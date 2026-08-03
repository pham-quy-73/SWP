import { describe, it, expect, beforeEach } from 'vitest';
import crypto from 'crypto';
import request from 'supertest';
import { createApp } from '../../app.js';
import Order from '../../models/Order.js';
import ProductVariant from '../../models/ProductVariant.js';
import {
  authHeader, createCustomer, createManager, createProduct, createVariant,
  createLens, createOrder, createOrderItem
} from '../helpers/factories.js';

const app = createApp();

// Tính chữ ký VNPay giống controller để giả lập callback/IPN hợp lệ.
function signParams(params, secret) {
  const sortedKeys = Object.keys(params).sort();
  const sortedParams = {};
  for (const key of sortedKeys) sortedParams[key] = params[key];
  const signData = new URLSearchParams(sortedParams).toString();
  const hmac = crypto.createHmac('sha512', secret);
  return hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
}

function signedQuery(params) {
  return { ...params, vnp_SecureHash: signParams(params, process.env.VNP_HASH_SECRET) };
}

describe('GET /payment/vnpay-ipn', () => {
  let customer, order;
  beforeEach(async () => {
    customer = await createCustomer();
    order = await createOrder(customer, { total_amount: 5000, status: 'PENDING' });
  });

  const baseParams = (overrides = {}) => ({
    vnp_Amount: String(5000 * 100),
    vnp_TxnRef: order._id.toString(),
    vnp_ResponseCode: '00',
    vnp_TransactionNo: 'IPN001',
    ...overrides
  });

  it('thiếu VNP_HASH_SECRET -> RspCode 99', async () => {
    const saved = process.env.VNP_HASH_SECRET;
    delete process.env.VNP_HASH_SECRET;
    const res = await request(app).get('/payment/vnpay-ipn').query({ vnp_TxnRef: 'x' });
    process.env.VNP_HASH_SECRET = saved;
    expect(res.status).toBe(200);
    expect(res.body.RspCode).toBe('99');
  });

  it('chữ ký sai -> RspCode 97', async () => {
    const res = await request(app)
      .get('/payment/vnpay-ipn')
      .query({ ...baseParams(), vnp_SecureHash: 'deadbeef' });
    expect(res.status).toBe(200);
    expect(res.body.RspCode).toBe('97');
  });

  it('order không tồn tại -> RspCode 01', async () => {
    const res = await request(app)
      .get('/payment/vnpay-ipn')
      .query(signedQuery(baseParams({ vnp_TxnRef: '64b7f0f0f0f0f0f0f0f0f0f0' })));
    expect(res.status).toBe(200);
    expect(res.body.RspCode).toBe('01');
  });

  it('vnp_TxnRef không phải ObjectId -> RspCode 01 (nhánh catch findById)', async () => {
    const res = await request(app)
      .get('/payment/vnpay-ipn')
      .query(signedQuery(baseParams({ vnp_TxnRef: 'not-an-objectid' })));
    expect(res.status).toBe(200);
    expect(res.body.RspCode).toBe('01');
  });

  it('sai số tiền -> RspCode 04, đơn giữ PENDING', async () => {
    const res = await request(app)
      .get('/payment/vnpay-ipn')
      .query(signedQuery(baseParams({ vnp_Amount: '123' })));
    expect(res.status).toBe(200);
    expect(res.body.RspCode).toBe('04');
    expect((await Order.findById(order._id)).status).toBe('PENDING');
  });

  it('thanh toán thành công -> RspCode 00 + đơn CONFIRMED', async () => {
    const res = await request(app)
      .get('/payment/vnpay-ipn')
      .query(signedQuery(baseParams()));
    expect(res.status).toBe(200);
    expect(res.body.RspCode).toBe('00');
    const dbOrder = await Order.findById(order._id);
    expect(dbOrder.status).toBe('CONFIRMED');
    expect(dbOrder.payment_status).toBe('PAID');
    expect(dbOrder.transaction_id).toBe('IPN001');
  });

  it('IPN retry sau khi đã PAID -> RspCode 02 (idempotent)', async () => {
    await request(app).get('/payment/vnpay-ipn').query(signedQuery(baseParams()));
    const res = await request(app)
      .get('/payment/vnpay-ipn')
      .query(signedQuery(baseParams()));
    expect(res.body.RspCode).toBe('02');
    // Chỉ 1 lần chuyển trạng thái trong history
    const dbOrder = await Order.findById(order._id);
    const paidTransitions = dbOrder.status_history.filter(h => h.to_status === 'CONFIRMED');
    expect(paidTransitions).toHaveLength(1);
  });

  it('đơn CANCELLED thường (không AUTO_EXPIRED) + code 00 -> RspCode 02 ALREADY_FINALIZED', async () => {
    const cancelled = await createOrder(customer, {
      total_amount: 5000,
      status: 'CANCELLED',
      status_history: [{ from_status: 'PENDING', to_status: 'CANCELLED', note: 'Khách tự hủy' }]
    });
    const res = await request(app)
      .get('/payment/vnpay-ipn')
      .query(signedQuery(baseParams({ vnp_TxnRef: cancelled._id.toString() })));
    expect(res.body.RspCode).toBe('02');
    expect((await Order.findById(cancelled._id)).status).toBe('CANCELLED');
  });

  it('khách hủy trên VNPay (code 24) -> RspCode 00, đơn giữ PENDING', async () => {
    const res = await request(app)
      .get('/payment/vnpay-ipn')
      .query(signedQuery(baseParams({ vnp_ResponseCode: '24' })));
    expect(res.body.RspCode).toBe('00');
    expect((await Order.findById(order._id)).status).toBe('PENDING');
  });

  it('giao dịch thất bại (code 51) -> RspCode 00, đơn CANCELLED + hoàn kho', async () => {
    const product = await createProduct();
    const variant = await createVariant(product, { quantity: 3 });
    await createOrderItem(order, { product_id: product._id, variant_id: variant._id, quantity: 2 });

    const res = await request(app)
      .get('/payment/vnpay-ipn')
      .query(signedQuery(baseParams({ vnp_ResponseCode: '51' })));
    expect(res.body.RspCode).toBe('00');
    expect((await Order.findById(order._id)).status).toBe('CANCELLED');
    // Kho được cộng trả lại 2
    expect((await ProductVariant.findById(variant._id)).quantity).toBe(5);
  });

  it('đơn có tròng kính -> AWAITING_VERIFICATION sau thanh toán', async () => {
    const product = await createProduct();
    const lens = await createLens();
    await createOrderItem(order, { product_id: product._id, lens_id: lens._id, quantity: 1 });

    const res = await request(app)
      .get('/payment/vnpay-ipn')
      .query(signedQuery(baseParams()));
    expect(res.body.RspCode).toBe('00');
    expect((await Order.findById(order._id)).status).toBe('AWAITING_VERIFICATION');
  });
});

describe('Phục hồi đơn AUTO_EXPIRED khi thanh toán về muộn', () => {
  let customer, order, product, variant;
  beforeEach(async () => {
    customer = await createCustomer();
    product = await createProduct();
    variant = await createVariant(product, { quantity: 10 });
    // Đơn đã bị cleanup job tự hủy: note bắt đầu bằng AUTO_EXPIRED
    order = await createOrder(customer, {
      total_amount: 5000,
      status: 'CANCELLED',
      status_history: [{
        from_status: 'PENDING',
        to_status: 'CANCELLED',
        note: 'AUTO_EXPIRED: Đơn quá hạn thanh toán, hệ thống tự hủy và hoàn kho'
      }]
    });
    await createOrderItem(order, { product_id: product._id, variant_id: variant._id, quantity: 2 });
  });

  const paidParams = () => signedQuery({
    vnp_Amount: String(5000 * 100),
    vnp_TxnRef: order._id.toString(),
    vnp_ResponseCode: '00',
    vnp_TransactionNo: 'LATE_TXN'
  });

  it('còn đủ kho -> phục hồi đơn CONFIRMED + trừ lại kho', async () => {
    const res = await request(app).get('/payment/vnpay-ipn').query(paidParams());
    expect(res.body.RspCode).toBe('00');
    const dbOrder = await Order.findById(order._id);
    expect(dbOrder.status).toBe('CONFIRMED');
    expect(dbOrder.payment_status).toBe('PAID');
    expect(dbOrder.transaction_id).toBe('LATE_TXN');
    // Kho bị trừ lại 2 (10 -> 8)
    expect((await ProductVariant.findById(variant._id)).quantity).toBe(8);
  });

  it('đơn có tròng kính -> phục hồi về AWAITING_VERIFICATION', async () => {
    const lens = await createLens();
    await createOrderItem(order, { product_id: product._id, lens_id: lens._id, quantity: 1 });
    const res = await request(app).get('/payment/vnpay-ipn').query(paidParams());
    expect(res.body.RspCode).toBe('00');
    expect((await Order.findById(order._id)).status).toBe('AWAITING_VERIFICATION');
  });

  it('hết kho -> giữ CANCELLED nhưng đánh dấu PAID để manager hoàn tiền', async () => {
    // Kho chỉ còn 1, đơn cần 2 -> không phục hồi được
    await ProductVariant.findByIdAndUpdate(variant._id, { quantity: 1 });
    const res = await request(app).get('/payment/vnpay-ipn').query(paidParams());
    expect(res.body.RspCode).toBe('00');
    const dbOrder = await Order.findById(order._id);
    expect(dbOrder.status).toBe('CANCELLED');
    expect(dbOrder.payment_status).toBe('PAID');
    // Kho không bị trừ (rollback về 1)
    expect((await ProductVariant.findById(variant._id)).quantity).toBe(1);
    const lastNote = dbOrder.status_history.at(-1).note;
    expect(lastNote).toContain('PAYMENT_AFTER_EXPIRY_NO_STOCK');
  });

  it('nhiều item, item sau hết kho -> hoàn lại kho item đã trừ trước đó', async () => {
    const variant2 = await createVariant(product, { colorName: 'Silver', quantity: 0 });
    await createOrderItem(order, { product_id: product._id, variant_id: variant2._id, quantity: 3 });

    const res = await request(app).get('/payment/vnpay-ipn').query(paidParams());
    expect(res.body.RspCode).toBe('00');
    const dbOrder = await Order.findById(order._id);
    expect(dbOrder.status).toBe('CANCELLED');
    expect(dbOrder.payment_status).toBe('PAID');
    // variant 1 đã bị trừ 2 rồi hoàn lại -> vẫn 10
    expect((await ProductVariant.findById(variant._id)).quantity).toBe(10);
    expect((await ProductVariant.findById(variant2._id)).quantity).toBe(0);
  });

  it('phục hồi qua ReturnURL (callback) -> redirect success', async () => {
    const res = await request(app).get('/payment/vnpay-callback').query(paidParams());
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('/checkout/success');
    expect((await Order.findById(order._id)).status).toBe('CONFIRMED');
  });
});

describe('POST /payment/checkout — IDOR & config', () => {
  it('customer thanh toán đơn của người khác -> 403 FORBIDDEN', async () => {
    const owner = await createCustomer();
    const order = await createOrder(owner, { total_amount: 1000, status: 'PENDING' });
    const attacker = await createCustomer();
    const res = await request(app)
      .post('/payment/checkout')
      .set(authHeader(attacker))
      .send({ orderId: order._id.toString() });
    expect(res.status).toBe(403);
    expect(res.body.error_code).toBe('FORBIDDEN');
  });

  it('manager được thanh toán hộ đơn của khách (không bị chặn IDOR)', async () => {
    const owner = await createCustomer();
    const order = await createOrder(owner, { total_amount: 1000, status: 'PENDING' });
    const manager = await createManager();
    const res = await request(app)
      .post('/payment/checkout')
      .set(authHeader(manager))
      .send({ orderId: order._id.toString() });
    expect(res.status).toBe(200);
    expect(res.body.result).toContain('vnp_SecureHash=');
  });

  it('orderId qua query param cũng được chấp nhận', async () => {
    const customer = await createCustomer();
    const order = await createOrder(customer, { total_amount: 1000, status: 'PENDING' });
    const res = await request(app)
      .post(`/payment/checkout?orderId=${order._id.toString()}`)
      .set(authHeader(customer))
      .send({});
    expect(res.status).toBe(200);
    // Đánh dấu thời điểm mở phiên thanh toán cho cleanup job
    expect((await Order.findById(order._id)).payment_initiated_at).toBeTruthy();
  });

  it('thiếu cấu hình VNPay -> 500 CONFIG_ERROR', async () => {
    const customer = await createCustomer();
    const order = await createOrder(customer, { total_amount: 1000, status: 'PENDING' });
    const saved = process.env.VNP_TMN_CODE;
    delete process.env.VNP_TMN_CODE;
    const res = await request(app)
      .post('/payment/checkout')
      .set(authHeader(customer))
      .send({ orderId: order._id.toString() });
    process.env.VNP_TMN_CODE = saved;
    expect(res.status).toBe(500);
    expect(res.body.error_code).toBe('CONFIG_ERROR');
  });
});

describe('GET /payment/vnpay-callback — nhánh phụ', () => {
  it('thiếu VNP_HASH_SECRET -> redirect failure', async () => {
    const saved = process.env.VNP_HASH_SECRET;
    delete process.env.VNP_HASH_SECRET;
    const res = await request(app).get('/payment/vnpay-callback').query({ vnp_TxnRef: 'x' });
    process.env.VNP_HASH_SECRET = saved;
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('/checkout/failure');
  });

  it('đơn CANCELLED thường + code 00 -> ALREADY_FINALIZED -> redirect failure', async () => {
    const customer = await createCustomer();
    const cancelled = await createOrder(customer, {
      total_amount: 2000,
      status: 'CANCELLED',
      status_history: [{ from_status: 'PENDING', to_status: 'CANCELLED', note: 'Khách tự hủy' }]
    });
    const res = await request(app).get('/payment/vnpay-callback').query(signedQuery({
      vnp_Amount: String(2000 * 100),
      vnp_TxnRef: cancelled._id.toString(),
      vnp_ResponseCode: '00',
      vnp_TransactionNo: 'X1'
    }));
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('/checkout/failure');
  });

  it('đơn có prescription_image -> AWAITING_VERIFICATION sau thanh toán', async () => {
    const customer = await createCustomer();
    const order = await createOrder(customer, {
      total_amount: 3000,
      status: 'PENDING',
      prescription_image: '/uploads/toa-thuoc.png'
    });
    const res = await request(app).get('/payment/vnpay-callback').query(signedQuery({
      vnp_Amount: String(3000 * 100),
      vnp_TxnRef: order._id.toString(),
      vnp_ResponseCode: '00',
      vnp_TransactionNo: 'RX1'
    }));
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('/checkout/success');
    expect((await Order.findById(order._id)).status).toBe('AWAITING_VERIFICATION');
  });
});

describe('POST /payment/mock-checkout — nhánh phụ', () => {
  it('customer mô phỏng thanh toán đơn người khác -> 403 (IDOR)', async () => {
    const owner = await createCustomer();
    const order = await createOrder(owner, { total_amount: 1000, status: 'PENDING' });
    const attacker = await createCustomer();
    const res = await request(app)
      .post('/payment/mock-checkout')
      .set(authHeader(attacker))
      .send({ orderId: order._id.toString(), simulateStatus: 'SUCCESS' });
    expect(res.status).toBe(403);
  });

  it('SUCCESS với đơn có tròng -> AWAITING_VERIFICATION', async () => {
    const customer = await createCustomer();
    const order = await createOrder(customer, { total_amount: 1000, status: 'PENDING' });
    const product = await createProduct();
    const lens = await createLens();
    await createOrderItem(order, { product_id: product._id, lens_id: lens._id, quantity: 1 });

    const res = await request(app)
      .post('/payment/mock-checkout')
      .set(authHeader(customer))
      .send({ orderId: order._id.toString(), simulateStatus: 'SUCCESS' });
    expect(res.status).toBe(200);
    expect(res.body.result.success).toBe(true);
    expect((await Order.findById(order._id)).status).toBe('AWAITING_VERIFICATION');
  });

  it('FAILED với item có variant -> hoàn kho', async () => {
    const customer = await createCustomer();
    const order = await createOrder(customer, { total_amount: 1000, status: 'PENDING' });
    const product = await createProduct();
    const variant = await createVariant(product, { quantity: 4 });
    await createOrderItem(order, { product_id: product._id, variant_id: variant._id, quantity: 3 });

    const res = await request(app)
      .post('/payment/mock-checkout')
      .set(authHeader(customer))
      .send({ orderId: order._id.toString(), simulateStatus: 'FAILED' });
    expect(res.status).toBe(200);
    expect((await ProductVariant.findById(variant._id)).quantity).toBe(7);
  });
});
