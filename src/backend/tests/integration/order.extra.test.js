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

/** Payload tạo đơn tối thiểu hợp lệ */
const orderInfoOf = (items, extra = {}) => ({
  orderInfo: {
    items,
    recipientName: 'Nguyen Van A',
    phoneNumber: '0900000001',
    deliveryAddress: '123 Đường Test, Hà Nội',
    ...extra
  }
});

describe('POST /orders/create — validate biên', () => {
  let customer, variant;
  async function setup() {
    customer = await createCustomer();
    const product = await createProduct();
    variant = await createVariant(product, { price: 1000, quantity: 100 });
  }

  it('quá 50 dòng sản phẩm -> 400', async () => {
    await setup();
    const items = Array.from({ length: 51 }, () => ({ variantId: variant._id.toString(), quantity: 1 }));
    const res = await request(app)
      .post('/orders/create')
      .set(authHeader(customer))
      .send(orderInfoOf(items));
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('50');
  });

  it('đúng 50 dòng (biên trên) -> 201', async () => {
    await setup();
    const items = Array.from({ length: 50 }, () => ({ variantId: variant._id.toString(), quantity: 1 }));
    const res = await request(app)
      .post('/orders/create')
      .set(authHeader(customer))
      .send(orderInfoOf(items));
    expect(res.status).toBe(201);
    // Trừ kho đủ 50
    expect((await ProductVariant.findById(variant._id)).quantity).toBe(50);
  });

  it('tên người nhận quá 100 ký tự -> 400', async () => {
    await setup();
    const res = await request(app)
      .post('/orders/create')
      .set(authHeader(customer))
      .send(orderInfoOf(
        [{ variantId: variant._id.toString(), quantity: 1 }],
        { recipientName: 'A'.repeat(101) }
      ));
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('100');
  });

  it('địa chỉ quá 300 ký tự -> 400', async () => {
    await setup();
    const res = await request(app)
      .post('/orders/create')
      .set(authHeader(customer))
      .send(orderInfoOf(
        [{ variantId: variant._id.toString(), quantity: 1 }],
        { deliveryAddress: 'B'.repeat(301) }
      ));
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('300');
  });

  it('số tài khoản ngân hàng chứa chữ -> 400', async () => {
    await setup();
    const res = await request(app)
      .post('/orders/create')
      .set(authHeader(customer))
      .send(orderInfoOf(
        [{ variantId: variant._id.toString(), quantity: 1 }],
        { bankInfo: { bankName: 'VCB', bankAccountNumber: 'ABC123', accountHolderName: 'NGUYEN VAN A' } }
      ));
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('tài khoản');
  });

  it('bank_info hợp lệ (camelCase) được lưu vào đơn', async () => {
    await setup();
    const res = await request(app)
      .post('/orders/create')
      .set(authHeader(customer))
      .send(orderInfoOf(
        [{ variantId: variant._id.toString(), quantity: 1 }],
        { bankInfo: { bankName: 'VCB', bankAccountNumber: '00123456', accountHolderName: 'NGUYEN VAN A' } }
      ));
    expect(res.status).toBe(201);
    const order = await Order.findById(res.body.result.orderId);
    expect(order.bank_info.bank_name).toBe('VCB');
    expect(order.bank_info.bank_account_number).toBe('00123456');
  });

  it('quantity = 0 -> 400, quantity âm -> 400, quantity thập phân -> 400', async () => {
    await setup();
    for (const bad of [0, -1, 1.5]) {
      const res = await request(app)
        .post('/orders/create')
        .set(authHeader(customer))
        .send(orderInfoOf([{ variantId: variant._id.toString(), quantity: bad }]));
      expect(res.status).toBe(400);
      expect(res.body.error_code).toBe('VALIDATION_ERROR');
    }
  });

  it('orderInfo là JSON string (multipart style) -> vẫn parse được', async () => {
    await setup();
    const res = await request(app)
      .post('/orders/create')
      .set(authHeader(customer))
      .send({
        orderInfo: JSON.stringify({
          items: [{ variantId: variant._id.toString(), quantity: 1 }],
          recipientName: 'Nguyen Van A',
          phoneNumber: '0900000001',
          deliveryAddress: '123 Test'
        })
      });
    expect(res.status).toBe(201);
  });

  it('CYL khác 0 nhưng thiếu AXIS -> 400 (rule phụ thuộc chéo)', async () => {
    await setup();
    const lens = await createLens();
    const res = await request(app)
      .post('/orders/create')
      .set(authHeader(customer))
      .send(orderInfoOf([{
        variantId: variant._id.toString(),
        lensId: lens._id.toString(),
        quantity: 1,
        prescription: { odSphere: -2, odCylinder: -1.5 } // thiếu odAxis
      }]));
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('AXIS');
  });

  it('SPH/CYL/ADD/PD vượt ngưỡng -> 400 kèm thông báo từng trường', async () => {
    await setup();
    const lens = await createLens();
    const res = await request(app)
      .post('/orders/create')
      .set(authHeader(customer))
      .send(orderInfoOf([{
        variantId: variant._id.toString(),
        lensId: lens._id.toString(),
        quantity: 1,
        prescription: { odSphere: 25, osCylinder: -7, odAdd: 5, osPd: 50, odAxis: 90 }
      }]));
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('SPH');
    expect(res.body.message).toContain('CYL');
    expect(res.body.message).toContain('ADD');
    expect(res.body.message).toContain('PD');
  });

  it('prescription toàn 0 và không có ảnh -> 400 (yêu cầu ít nhất 1 thông số)', async () => {
    await setup();
    const lens = await createLens();
    const res = await request(app)
      .post('/orders/create')
      .set(authHeader(customer))
      .send(orderInfoOf([{
        variantId: variant._id.toString(),
        lensId: lens._id.toString(),
        quantity: 1,
        prescription: { odSphere: 0, osSphere: 0 }
      }]));
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('ít nhất một thông số');
  });

  it('prescription giá trị biên hợp lệ (SPH ±20, CYL ±6, AXIS 1/180, ADD 0.75/4, PD 20/40) -> 201', async () => {
    await setup();
    const lens = await createLens();
    const res = await request(app)
      .post('/orders/create')
      .set(authHeader(customer))
      .send(orderInfoOf([{
        variantId: variant._id.toString(),
        lensId: lens._id.toString(),
        quantity: 1,
        prescription: {
          odSphere: -20, odCylinder: -6, odAxis: 1, odAdd: 0.75, odPd: 20,
          osSphere: 20, osCylinder: 6, osAxis: 180, osAdd: 4, osPd: 40
        }
      }]));
    expect(res.status).toBe(201);
    const item = await OrderItem.findOne({ order_id: res.body.result.orderId });
    expect(item.prescription.od_sphere).toBe(-20);
    expect(item.prescription.os_axis).toBe(180);
    expect(item.prescription.os_pd).toBe(40);
  });
});

describe('PUT /orders/:id/cancel — kèm lý do', () => {
  it('hủy kèm reason -> lưu vào status_history', async () => {
    const customer = await createCustomer();
    const order = await createOrder(customer, { status: 'PENDING' });
    const res = await request(app)
      .put(`/orders/${order._id}/cancel`)
      .set(authHeader(customer))
      .send({ reason: 'Đặt nhầm màu' });
    expect(res.status).toBe(200);
    const dbOrder = await Order.findById(order._id);
    expect(dbOrder.status).toBe('CANCELLED');
    expect(dbOrder.status_history.at(-1).note).toContain('Đặt nhầm màu');
  });

  it('manager hủy hộ đơn của khách được phép (không bị chặn IDOR)', async () => {
    const customer = await createCustomer();
    const manager = await createManager();
    const order = await createOrder(customer, { status: 'CONFIRMED' });
    const res = await request(app)
      .put(`/orders/${order._id}/cancel`)
      .set(authHeader(manager))
      .send({});
    expect(res.status).toBe(200);
    expect((await Order.findById(order._id)).status).toBe('CANCELLED');
  });
});

describe('PUT /orders/:id/reject-cancel (manager từ chối hủy)', () => {
  async function cancelledOrderWithHistory(prevStatus = 'CONFIRMED') {
    const customer = await createCustomer();
    const order = await createOrder(customer, {
      status: 'CANCELLED',
      status_history: [
        { from_status: 'PENDING', to_status: prevStatus, note: 'Đã thanh toán' },
        { from_status: prevStatus, to_status: 'CANCELLED', note: 'Khách xin hủy' }
      ]
    });
    return { customer, order };
  }

  it('customer bị chặn -> 403', async () => {
    const { customer, order } = await cancelledOrderWithHistory();
    const res = await request(app)
      .put(`/orders/${order._id}/reject-cancel`)
      .set(authHeader(customer))
      .send({});
    expect(res.status).toBe(403);
  });

  it('đơn không tồn tại -> 404', async () => {
    const manager = await createManager();
    const res = await request(app)
      .put('/orders/64b7f0000000000000000000/reject-cancel')
      .set(authHeader(manager))
      .send({});
    expect(res.status).toBe(404);
  });

  it('đơn không ở CANCELLED -> 400 INVALID_STATUS', async () => {
    const customer = await createCustomer();
    const manager = await createManager();
    const order = await createOrder(customer, { status: 'CONFIRMED' });
    const res = await request(app)
      .put(`/orders/${order._id}/reject-cancel`)
      .set(authHeader(manager))
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('INVALID_STATUS');
  });

  it('phục hồi về trạng thái trước khi hủy + trừ lại kho + ghi lý do', async () => {
    const { order } = await cancelledOrderWithHistory('CONFIRMED');
    const manager = await createManager();
    const product = await createProduct();
    const variant = await createVariant(product, { quantity: 10 });
    await createOrderItem(order, { product_id: product._id, variant_id: variant._id, quantity: 4 });

    const res = await request(app)
      .put(`/orders/${order._id}/reject-cancel`)
      .set(authHeader(manager))
      .send({ reason: 'Đơn đã vào gia công' });
    expect(res.status).toBe(200);
    const dbOrder = await Order.findById(order._id);
    expect(dbOrder.status).toBe('CONFIRMED');
    expect(dbOrder.status_history.at(-1).note).toContain('Đơn đã vào gia công');
    // Kho bị trừ lại 4 (10 -> 6) vì lúc hủy đã hoàn kho
    expect((await ProductVariant.findById(variant._id)).quantity).toBe(6);
  });

  it('không có history trước CANCELLED -> mặc định phục hồi về CONFIRMED', async () => {
    const customer = await createCustomer();
    const manager = await createManager();
    const order = await createOrder(customer, { status: 'CANCELLED', status_history: [] });
    const res = await request(app)
      .put(`/orders/${order._id}/reject-cancel`)
      .set(authHeader(manager))
      .send({});
    expect(res.status).toBe(200);
    expect((await Order.findById(order._id)).status).toBe('CONFIRMED');
  });
});

describe('PUT /orders/:id/status — đồng bộ tồn kho', () => {
  it('manager chuyển CONFIRMED -> CANCELLED: hoàn kho', async () => {
    const customer = await createCustomer();
    const manager = await createManager();
    const product = await createProduct();
    const variant = await createVariant(product, { quantity: 5 });
    const order = await createOrder(customer, { status: 'CONFIRMED' });
    await createOrderItem(order, { product_id: product._id, variant_id: variant._id, quantity: 3 });

    const res = await request(app)
      .put(`/orders/${order._id}/status`)
      .set(authHeader(manager))
      .send({ status: 'CANCELLED' });
    expect(res.status).toBe(200);
    expect((await ProductVariant.findById(variant._id)).quantity).toBe(8);
  });

  it('admin override CANCELLED -> CONFIRMED: trừ lại kho + đánh dấu is_override', async () => {
    const customer = await createCustomer();
    const admin = await createAdmin();
    const product = await createProduct();
    const variant = await createVariant(product, { quantity: 8 });
    const order = await createOrder(customer, { status: 'CANCELLED' });
    await createOrderItem(order, { product_id: product._id, variant_id: variant._id, quantity: 3 });

    const res = await request(app)
      .put(`/orders/${order._id}/status`)
      .set(authHeader(admin))
      .send({ status: 'CONFIRMED' });
    expect(res.status).toBe(200);
    expect((await ProductVariant.findById(variant._id)).quantity).toBe(5);
    const dbOrder = await Order.findById(order._id);
    expect(dbOrder.status_history.at(-1).is_override).toBe(true);
  });

  it('status viết thường vẫn được chấp nhận (toUpperCase)', async () => {
    const customer = await createCustomer();
    const manager = await createManager();
    const order = await createOrder(customer, { status: 'CONFIRMED' });
    const res = await request(app)
      .put(`/orders/${order._id}/status`)
      .set(authHeader(manager))
      .send({ status: 'completed' });
    expect(res.status).toBe(200);
    expect((await Order.findById(order._id)).status).toBe('COMPLETED');
  });
});

describe('GET /orders/:id — map prescription image fallback', () => {
  it('item có prescription toàn 0 + đơn có ảnh toa -> gán imageUrl từ order', async () => {
    const customer = await createCustomer();
    const product = await createProduct();
    const lens = await createLens();
    const order = await createOrder(customer, {
      status: 'AWAITING_VERIFICATION',
      prescription_image: '/uploads/toa.png'
    });
    await createOrderItem(order, {
      product_id: product._id,
      lens_id: lens._id,
      quantity: 1,
      prescription: { od_sphere: 0, od_cylinder: 0, os_sphere: 0, os_cylinder: 0 }
    });

    const res = await request(app).get(`/orders/${order._id}`).set(authHeader(customer));
    expect(res.status).toBe(200);
    expect(res.body.result.items[0].prescription.imageUrl).toBe('/uploads/toa.png');
    // Alias camelCase cho FE
    expect(res.body.result.orderStatus).toBe('AWAITING_VERIFICATION');
    expect(res.body.result.totalAmount).toBe(order.total_amount);
  });

  it('customer xem đơn của chính mình được phép', async () => {
    const customer = await createCustomer();
    const order = await createOrder(customer, { status: 'PENDING' });
    const res = await request(app).get(`/orders/${order._id}`).set(authHeader(customer));
    expect(res.status).toBe(200);
    expect(res.body.result.orderId).toBe(order._id.toString());
  });
});
