import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import Order from '../../models/Order.js';
import OrderItem from '../../models/OrderItem.js';
import ProductVariant from '../../models/ProductVariant.js';
import {
  authHeader, createCustomer, createManager, createAdmin,
  createProduct, createVariant, createLens, createOrder, createOrderItem
} from '../helpers/factories.js';

const app = createApp();

describe('POST /orders/create', () => {
  it('không đăng nhập -> 401', async () => {
    const res = await request(app).post('/orders/create').send({});
    expect(res.status).toBe(401);
  });

  it('đơn hàng rỗng -> 400 VALIDATION_ERROR', async () => {
    const user = await createCustomer();
    const res = await request(app).post('/orders/create').set(authHeader(user))
      .field('orderInfo', JSON.stringify({ items: [] }));
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('VALIDATION_ERROR');
  });

  it('tạo đơn thành công, trừ tồn kho', async () => {
    const user = await createCustomer();
    const product = await createProduct({ price: 1000 });
    const variant = await createVariant(product, { price: 1000, quantity: 10 });

    const orderInfo = {
      recipientName: 'Nguyen A', phoneNumber: '0900000000', deliveryAddress: '1 St',
      items: [{ variantId: variant._id.toString(), quantity: 2 }]
    };
    const res = await request(app).post('/orders/create').set(authHeader(user))
      .field('orderInfo', JSON.stringify(orderInfo));

    expect(res.status).toBe(201);
    expect(res.body.code).toBe(0);
    expect(res.body.result.order.total_amount).toBe(2000);

    const reloaded = await ProductVariant.findById(variant._id);
    expect(reloaded.quantity).toBe(8);
    const items = await OrderItem.find({ order_id: res.body.result.orderId });
    expect(items).toHaveLength(1);
  });

  it('vượt tồn kho -> 400 OUT_OF_STOCK', async () => {
    const user = await createCustomer();
    const product = await createProduct();
    const variant = await createVariant(product, { quantity: 1 });
    const orderInfo = { items: [{ variantId: variant._id.toString(), quantity: 5 }] };
    const res = await request(app).post('/orders/create').set(authHeader(user))
      .field('orderInfo', JSON.stringify(orderInfo));
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('OUT_OF_STOCK');
  });

  it('variant không tồn tại -> 400 VARIANT_NOT_FOUND', async () => {
    const user = await createCustomer();
    const orderInfo = { items: [{ variantId: '64b7f0000000000000000000', quantity: 1 }] };
    const res = await request(app).post('/orders/create').set(authHeader(user))
      .field('orderInfo', JSON.stringify(orderInfo));
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('VARIANT_NOT_FOUND');
  });

  it('tính giá gồm tròng kính (lens)', async () => {
    const user = await createCustomer();
    const product = await createProduct({ price: 1000 });
    const variant = await createVariant(product, { price: 1000, quantity: 5 });
    const lens = await createLens({ price: 500 });
    const orderInfo = {
      items: [{ variantId: variant._id.toString(), lensId: lens._id.toString(), quantity: 1,
        prescription: { odSphere: -1.5, osSphere: -2, note: 'test' } }]
    };
    const res = await request(app).post('/orders/create').set(authHeader(user))
      .field('orderInfo', JSON.stringify(orderInfo));
    expect(res.status).toBe(201);
    expect(res.body.result.order.total_amount).toBe(1500);
    const items = await OrderItem.find({ order_id: res.body.result.orderId });
    expect(items[0].prescription.od_sphere).toBe(-1.5);
  });
});

describe('GET /orders/me', () => {
  it('trả về đơn của chính user', async () => {
    const user = await createCustomer();
    await createOrder(user, { total_amount: 1000 });
    const res = await request(app).get('/orders/me').set(authHeader(user));
    expect(res.status).toBe(200);
    expect(res.body.result.items).toHaveLength(1);
    expect(res.body.result.totalItems).toBe(1);
  });

  it('lọc theo status', async () => {
    const user = await createCustomer();
    await createOrder(user, { status: 'PENDING' });
    await createOrder(user, { status: 'COMPLETED' });
    const res = await request(app).get('/orders/me?status=completed').set(authHeader(user));
    expect(res.status).toBe(200);
    expect(res.body.result.items).toHaveLength(1);
  });
});

describe('PUT /orders/:id/cancel', () => {
  it('hủy đơn PENDING, hoàn tồn kho', async () => {
    const user = await createCustomer();
    const product = await createProduct();
    const variant = await createVariant(product, { quantity: 8 });
    const order = await createOrder(user, { status: 'PENDING' });
    await createOrderItem(order, { product_id: product._id, variant_id: variant._id, quantity: 2 });

    const res = await request(app).put(`/orders/${order._id}/cancel`).set(authHeader(user));
    expect(res.status).toBe(200);
    expect(res.body.result.status).toBe('CANCELLED');
    expect((await ProductVariant.findById(variant._id)).quantity).toBe(10);
  });

  it('không phải chủ đơn -> 403', async () => {
    const owner = await createCustomer();
    const other = await createCustomer();
    const order = await createOrder(owner, { status: 'PENDING' });
    const res = await request(app).put(`/orders/${order._id}/cancel`).set(authHeader(other));
    expect(res.status).toBe(403);
  });

  it('đơn COMPLETED không hủy được -> 400', async () => {
    const user = await createCustomer();
    const order = await createOrder(user, { status: 'COMPLETED' });
    const res = await request(app).put(`/orders/${order._id}/cancel`).set(authHeader(user));
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('INVALID_STATUS');
  });

  it('đơn không tồn tại -> 404', async () => {
    const user = await createCustomer();
    const res = await request(app).put('/orders/64b7f0000000000000000000/cancel').set(authHeader(user));
    expect(res.status).toBe(404);
  });
});

describe('GET /orders (manager)', () => {
  it('customer bị chặn -> 403', async () => {
    const user = await createCustomer();
    const res = await request(app).get('/orders').set(authHeader(user));
    expect(res.status).toBe(403);
  });

  it('manager xem tất cả đơn', async () => {
    const manager = await createManager();
    const user = await createCustomer();
    await createOrder(user);
    await createOrder(user, { status: 'COMPLETED' });
    const res = await request(app).get('/orders').set(authHeader(manager));
    expect(res.status).toBe(200);
    expect(res.body.result).toHaveLength(2);
  });

  it('lọc theo status', async () => {
    const manager = await createManager();
    const user = await createCustomer();
    await createOrder(user, { status: 'PENDING' });
    await createOrder(user, { status: 'COMPLETED' });
    const res = await request(app).get('/orders?status=pending').set(authHeader(manager));
    expect(res.body.result).toHaveLength(1);
  });
});

describe('GET /orders/:id', () => {
  it('manager xem chi tiết đơn', async () => {
    const manager = await createManager();
    const user = await createCustomer();
    const order = await createOrder(user);
    const res = await request(app).get(`/orders/${order._id}`).set(authHeader(manager));
    expect(res.status).toBe(200);
    expect(res.body.result.orderId).toBeDefined();
  });

  it('customer không xem được đơn người khác -> 403', async () => {
    const owner = await createCustomer();
    const other = await createCustomer();
    const order = await createOrder(owner);
    const res = await request(app).get(`/orders/${order._id}`).set(authHeader(other));
    expect(res.status).toBe(403);
  });
});

describe('PUT /orders/:id/status', () => {
  it('manager chuyển trạng thái hợp lệ AWAITING_VERIFICATION -> CONFIRMED', async () => {
    const manager = await createManager();
    const user = await createCustomer();
    const order = await createOrder(user, { status: 'AWAITING_VERIFICATION' });
    const res = await request(app).put(`/orders/${order._id}/status`).set(authHeader(manager)).send({ status: 'CONFIRMED' });
    expect(res.status).toBe(200);
    expect(res.body.result.status).toBe('CONFIRMED');
  });

  it('manager chuyển trạng thái không hợp lệ -> 400 INVALID_TRANSITION', async () => {
    const manager = await createManager();
    const user = await createCustomer();
    const order = await createOrder(user, { status: 'PENDING' });
    const res = await request(app).put(`/orders/${order._id}/status`).set(authHeader(manager)).send({ status: 'COMPLETED' });
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('INVALID_TRANSITION');
  });

  it('manager không được chuyển sang REFUNDED -> 400 (INVALID_TRANSITION)', async () => {
    // REFUNDED không nằm trong VALID_TRANSITIONS của bất kỳ trạng thái nào nên
    // manager luôn bị chặn ở bước kiểm tra state-machine (INVALID_TRANSITION)
    // trước khi tới nhánh FORBIDDEN_TRANSITION (nhánh này thực chất là dead code).
    const manager = await createManager();
    const user = await createCustomer();
    const order = await createOrder(user, { status: 'CONFIRMED' });
    const res = await request(app).put(`/orders/${order._id}/status`).set(authHeader(manager)).send({ status: 'REFUNDED' });
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('INVALID_TRANSITION');
  });

  it('admin override chuyển trạng thái bất kỳ', async () => {
    const admin = await createAdmin();
    const user = await createCustomer();
    const order = await createOrder(user, { status: 'PENDING' });
    const res = await request(app).put(`/orders/${order._id}/status`).set(authHeader(admin)).send({ status: 'COMPLETED' });
    expect(res.status).toBe(200);
    expect(res.body.result.status).toBe('COMPLETED');
  });

  it('thiếu status -> 400', async () => {
    const manager = await createManager();
    const user = await createCustomer();
    const order = await createOrder(user);
    const res = await request(app).put(`/orders/${order._id}/status`).set(authHeader(manager)).send({});
    expect(res.status).toBe(400);
  });
});

describe('DELETE /orders/:id', () => {
  it('chỉ admin được xóa', async () => {
    const manager = await createManager();
    const user = await createCustomer();
    const order = await createOrder(user);
    const res = await request(app).delete(`/orders/${order._id}`).set(authHeader(manager));
    expect(res.status).toBe(403);
  });

  it('admin xóa đơn và các order item', async () => {
    const admin = await createAdmin();
    const user = await createCustomer();
    const order = await createOrder(user);
    await createOrderItem(order, { product_id: (await createProduct())._id });
    const res = await request(app).delete(`/orders/${order._id}`).set(authHeader(admin));
    expect(res.status).toBe(200);
    expect(await Order.findById(order._id)).toBeNull();
    expect(await OrderItem.find({ order_id: order._id })).toHaveLength(0);
  });

  it('đơn không tồn tại -> 404', async () => {
    const admin = await createAdmin();
    const res = await request(app).delete('/orders/64b7f0000000000000000000').set(authHeader(admin));
    expect(res.status).toBe(404);
  });
});
