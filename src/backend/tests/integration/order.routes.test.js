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

describe('GET /orders/me (kèm order item populate)', () => {
  it('map đầy đủ item có product/variant/lens', async () => {
    const user = await createCustomer();
    const product = await createProduct({ name: 'Frame X' });
    const variant = await createVariant(product, { colorName: 'Black' });
    const lens = await createLens({ name: 'Blue Lens' });
    const order = await createOrder(user, { total_amount: 1000 });
    await createOrderItem(order, {
      product_id: product._id, variant_id: variant._id, lens_id: lens._id,
      quantity: 2, unit_price: 500
    });
    const res = await request(app).get('/orders/me').set(authHeader(user));
    expect(res.status).toBe(200);
    const item = res.body.result.items[0].items[0];
    expect(item.productName).toBe('Frame X');
    expect(item.colorName).toBe('Black');
    expect(item.lensName).toBe('Blue Lens');
    expect(item.totalPrice).toBe(1000);
  });

  it('phân trang qua page/size', async () => {
    const user = await createCustomer();
    await createOrder(user);
    await createOrder(user);
    const res = await request(app).get('/orders/me?page=0&size=1').set(authHeader(user));
    expect(res.status).toBe(200);
    expect(res.body.result.items).toHaveLength(1);
    expect(res.body.result.totalPages).toBe(2);
  });

  it('item tham chiếu sản phẩm/biến thể/tròng đã xóa -> dùng giá trị fallback', async () => {
    const user = await createCustomer();
    const order = await createOrder(user, { total_amount: 0 });
    // order item trỏ tới các id không còn tồn tại -> populate trả null
    await createOrderItem(order, {
      product_id: '64b7f0000000000000000000',
      variant_id: '64b7f0000000000000000001',
      lens_id: '64b7f0000000000000000002',
      quantity: 1, unit_price: 0
    });
    const res = await request(app).get('/orders/me').set(authHeader(user));
    expect(res.status).toBe(200);
    const item = res.body.result.items[0].items[0];
    expect(item.productName).toBe('Sản phẩm đã xóa');
    expect(item.colorName).toBe('Mặc định');
    expect(item.lensName).toBeNull();
    expect(item.productId).toBeNull();
  });

  it('lọc đơn theo status trong myOrders', async () => {
    const user = await createCustomer();
    await createOrder(user, { status: 'PENDING' });
    await createOrder(user, { status: 'COMPLETED' });
    const res = await request(app).get('/orders/me?status=completed').set(authHeader(user));
    expect(res.status).toBe(200);
    expect(res.body.result.items).toHaveLength(1);
    expect(res.body.result.items[0].orderStatus).toBe('COMPLETED');
  });
});

describe('POST /orders/create (chuẩn hóa prescription)', () => {
  it('từ chối AXIS ngoài [1..180] và số không hợp lệ với lỗi 400', async () => {
    const user = await createCustomer();
    const product = await createProduct({ price: 1000 });
    const variant = await createVariant(product, { price: 1000, quantity: 5 });
    const lens = await createLens({ price: 200 });
    const orderInfo = {
      items: [{
        variantId: variant._id.toString(), lensId: lens._id.toString(), quantity: 1,
        prescription: { odAxis: 999, osAxis: -50, odSphere: 'abc', osSphere: -1.25, note: '  test note  ' }
      }]
    };
    const res = await request(app).post('/orders/create').set(authHeader(user))
      .field('orderInfo', JSON.stringify(orderInfo));
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /orders/create (validate shipping info)', () => {
  it('từ chối số điện thoại người nhận không hợp lệ', async () => {
    const user = await createCustomer();
    const product = await createProduct({ price: 1000 });
    const variant = await createVariant(product, { price: 1000, quantity: 5 });
    const orderInfo = {
      items: [{ variantId: variant._id.toString(), quantity: 1 }],
      recipientName: 'Nguyen A',
      phoneNumber: '12345',
      deliveryAddress: '123 Test Street'
    };
    const res = await request(app).post('/orders/create').set(authHeader(user))
      .send({ orderInfo });
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('VALIDATION_ERROR');
    expect(res.body.message).toContain('Số điện thoại không hợp lệ');
  });

  it('từ chối địa chỉ giao hàng quá ngắn', async () => {
    const user = await createCustomer();
    const product = await createProduct({ price: 1000 });
    const variant = await createVariant(product, { price: 1000, quantity: 5 });
    const orderInfo = {
      items: [{ variantId: variant._id.toString(), quantity: 1 }],
      recipientName: 'Nguyen A',
      phoneNumber: '0900000000',
      deliveryAddress: '123'
    };
    const res = await request(app).post('/orders/create').set(authHeader(user))
      .send({ orderInfo });
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('VALIDATION_ERROR');
    expect(res.body.message).toContain('Địa chỉ giao hàng phải dài ít nhất 5 ký tự');
  });
});

describe('POST /orders/create (biến thể input)', () => {
  it('nhận orderInfo dạng object (JSON body, không phải string field)', async () => {
    const user = await createCustomer();
    const product = await createProduct({ price: 1000 });
    const variant = await createVariant(product, { price: 1000, quantity: 5 });
    const res = await request(app)
      .post('/orders/create')
      .set(authHeader(user))
      .send({ orderInfo: { items: [{ variantId: variant._id.toString(), quantity: 1 }] } });
    expect(res.status).toBe(201);
  });

  it('prescription snake_case + note không phải string -> chuẩn hóa', async () => {
    const user = await createCustomer();
    const product = await createProduct({ price: 1000 });
    const variant = await createVariant(product, { price: 1000, quantity: 5 });
    const lens = await createLens({ price: 200 });
    const orderInfo = {
      items: [{
        variantId: variant._id.toString(), lensId: lens._id.toString(), quantity: 1,
        prescription: { od_sphere: -2.5, os_axis: 90, od_pd: 32, note: 12345 }
      }]
    };
    const res = await request(app).post('/orders/create').set(authHeader(user))
      .field('orderInfo', JSON.stringify(orderInfo));
    expect(res.status).toBe(201);
    const items = await OrderItem.find({ order_id: res.body.result.orderId });
    expect(items[0].prescription.od_sphere).toBe(-2.5);
    expect(items[0].prescription.os_axis).toBe(90);
    expect(items[0].prescription.note).toBe('');
  });

  it('prescription null -> bỏ qua', async () => {
    const user = await createCustomer();
    const product = await createProduct({ price: 1000 });
    const variant = await createVariant(product, { price: 1000, quantity: 5 });
    const res = await request(app).post('/orders/create').set(authHeader(user))
      .field('orderInfo', JSON.stringify({ items: [{ variantId: variant._id.toString(), quantity: 1, prescription: 'not-an-object' }] }));
    expect(res.status).toBe(201);
  });
});

describe('PUT /orders/:id/status (nhánh biên)', () => {
  it('status không hợp lệ -> 400 VALIDATION_ERROR', async () => {
    const manager = await createManager();
    const user = await createCustomer();
    const order = await createOrder(user);
    const res = await request(app).put(`/orders/${order._id}/status`).set(authHeader(manager)).send({ status: 'BLAH' });
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('VALIDATION_ERROR');
  });

  it('đơn không tồn tại -> 404', async () => {
    const manager = await createManager();
    const res = await request(app).put('/orders/64b7f0000000000000000000/status').set(authHeader(manager)).send({ status: 'CONFIRMED' });
    expect(res.status).toBe(404);
  });

  it('cùng trạng thái -> không đổi, trả 200', async () => {
    const manager = await createManager();
    const user = await createCustomer();
    const order = await createOrder(user, { status: 'PENDING' });
    const res = await request(app).put(`/orders/${order._id}/status`).set(authHeader(manager)).send({ status: 'PENDING' });
    expect(res.status).toBe(200);
  });

  it('manager chuyển hợp lệ kèm note tùy chỉnh', async () => {
    const manager = await createManager();
    const user = await createCustomer();
    const order = await createOrder(user, { status: 'CONFIRMED' });
    const res = await request(app).put(`/orders/${order._id}/status`).set(authHeader(manager)).send({ status: 'COMPLETED', note: 'Đã giao xong' });
    expect(res.status).toBe(200);
    expect(res.body.result.status).toBe('COMPLETED');
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

  it('đơn không tồn tại -> 404', async () => {
    const manager = await createManager();
    const res = await request(app).get('/orders/64b7f0000000000000000000').set(authHeader(manager));
    expect(res.status).toBe(404);
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

describe('PUT /orders/:id/items/:itemId/prescription (KTV sửa đơn kính)', () => {
  const rx = {
    odSphere: -2.25, odCylinder: -0.5, odAxis: 90, odAdd: 0, odPd: 31,
    osSphere: -2.0, osCylinder: -0.75, osAxis: 85, osAdd: 0, osPd: 31,
    note: 'KTV đã đối chiếu lại với khách'
  };

  async function setupLensOrder(status = 'AWAITING_VERIFICATION') {
    const user = await createCustomer();
    const product = await createProduct();
    const variant = await createVariant(product);
    const lens = await createLens();
    const order = await createOrder(user, { status, payment_status: 'PAID' });
    const item = await createOrderItem(order, {
      product_id: product._id,
      variant_id: variant._id,
      lens_id: lens._id,
      prescription: { od_sphere: -1, os_sphere: -1 }
    });
    return { user, order, item };
  }

  it('customer không được sửa -> 403', async () => {
    const { user, order, item } = await setupLensOrder();
    const res = await request(app)
      .put(`/orders/${order._id}/items/${item._id}/prescription`)
      .set(authHeader(user))
      .send({ prescription: rx });
    expect(res.status).toBe(403);
  });

  it('manager sửa thành công khi đơn AWAITING_VERIFICATION + ghi audit history', async () => {
    const manager = await createManager();
    const { order, item } = await setupLensOrder();
    const res = await request(app)
      .put(`/orders/${order._id}/items/${item._id}/prescription`)
      .set(authHeader(manager))
      .send({ prescription: rx, note: 'Khách đọc nhầm SPH' });

    expect(res.status).toBe(200);
    const reloadedItem = await OrderItem.findById(item._id);
    expect(reloadedItem.prescription.od_sphere).toBe(-2.25);
    expect(reloadedItem.prescription.od_axis).toBe(90);
    expect(reloadedItem.prescription.note).toBe('KTV đã đối chiếu lại với khách');

    const reloadedOrder = await Order.findById(order._id);
    // Trạng thái không đổi, nhưng có audit entry mới
    expect(reloadedOrder.status).toBe('AWAITING_VERIFICATION');
    const lastHist = reloadedOrder.status_history[reloadedOrder.status_history.length - 1];
    expect(lastHist.note).toContain('KTV cập nhật đơn kính');
    expect(lastHist.note).toContain('Khách đọc nhầm SPH');
  });

  it('từ chối AXIS ngoài [1..180] hoặc số không hợp lệ với lỗi 400', async () => {
    const manager = await createManager();
    const { order, item } = await setupLensOrder();
    const res = await request(app)
      .put(`/orders/${order._id}/items/${item._id}/prescription`)
      .set(authHeader(manager))
      .send({ prescription: { ...rx, odAxis: 250, osSphere: 'abc' } });

    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('VALIDATION_ERROR');
  });

  it('đơn không ở AWAITING_VERIFICATION -> 400 INVALID_STATUS', async () => {
    const manager = await createManager();
    const { order, item } = await setupLensOrder('CONFIRMED');
    const res = await request(app)
      .put(`/orders/${order._id}/items/${item._id}/prescription`)
      .set(authHeader(manager))
      .send({ prescription: rx });
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('INVALID_STATUS');
  });

  it('item không gắn tròng -> 400 NO_LENS', async () => {
    const manager = await createManager();
    const user = await createCustomer();
    const product = await createProduct();
    const order = await createOrder(user, { status: 'AWAITING_VERIFICATION', payment_status: 'PAID' });
    const frameOnlyItem = await createOrderItem(order, { product_id: product._id });
    const res = await request(app)
      .put(`/orders/${order._id}/items/${frameOnlyItem._id}/prescription`)
      .set(authHeader(manager))
      .send({ prescription: rx });
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('NO_LENS');
  });

  it('item không thuộc đơn -> 404 ITEM_NOT_FOUND', async () => {
    const manager = await createManager();
    const { order } = await setupLensOrder();
    const { item: otherItem } = await setupLensOrder();
    const res = await request(app)
      .put(`/orders/${order._id}/items/${otherItem._id}/prescription`)
      .set(authHeader(manager))
      .send({ prescription: rx });
    expect(res.status).toBe(404);
    expect(res.body.error_code).toBe('ITEM_NOT_FOUND');
  });

  it('thiếu payload prescription -> 400 VALIDATION_ERROR', async () => {
    const manager = await createManager();
    const { order, item } = await setupLensOrder();
    const res = await request(app)
      .put(`/orders/${order._id}/items/${item._id}/prescription`)
      .set(authHeader(manager))
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('VALIDATION_ERROR');
  });
});
