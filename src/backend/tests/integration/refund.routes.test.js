import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import Order from '../../models/Order.js';
import Refund from '../../models/Refund.js';
import ProductVariant from '../../models/ProductVariant.js';
import {
  authHeader, createCustomer, createManager, createAdmin,
  createProduct, createVariant, createOrder, createOrderItem, createRefund
} from '../helpers/factories.js';

const app = createApp();

describe('Refund routes (/api/refund)', () => {
  describe('auth & role guard', () => {
    it('không token -> 401', async () => {
      const res = await request(app).get('/api/refund/ready');
      expect(res.status).toBe(401);
    });

    it('CUSTOMER bị chặn -> 403', async () => {
      const customer = await createCustomer();
      const res = await request(app).get('/api/refund/ready').set(authHeader(customer));
      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/refund/variant/:variantId/in-activate', () => {
    it('MANAGER vô hiệu hóa biến thể -> 200 INACTIVE', async () => {
      const manager = await createManager();
      const product = await createProduct();
      const variant = await createVariant(product);
      const res = await request(app)
        .patch(`/api/refund/variant/${variant._id}/in-activate`)
        .set(authHeader(manager));
      expect(res.status).toBe(200);
      expect(res.body.result.status).toBe('INACTIVE');
    });

    it('biến thể không tồn tại -> 404', async () => {
      const manager = await createManager();
      const res = await request(app)
        .patch('/api/refund/variant/64b64c1f2f1a2b3c4d5e6f70/in-activate')
        .set(authHeader(manager));
      expect(res.status).toBe(404);
      expect(res.body.error_code).toBe('VARIANT_NOT_FOUND');
    });
  });

  describe('GET /api/refund/affected-orders/:variantId', () => {
    it('trả về đơn hàng bị ảnh hưởng (CANCELLED + PAID + đang xử lý)', async () => {
      const manager = await createManager();
      const customer = await createCustomer();
      const product = await createProduct();
      const variant = await createVariant(product);
      // Đơn PENDING chứa sản phẩm cha, đã thanh toán
      const order = await createOrder(customer, { status: 'PENDING', payment_status: 'PAID' });
      await createOrderItem(order, { product_id: product._id, variant_id: variant._id });

      const res = await request(app)
        .get(`/api/refund/affected-orders/${variant._id}`)
        .set(authHeader(manager));
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.result)).toBe(true);
      expect(res.body.result.length).toBe(1);
      expect(res.body.result[0].order.orderId).toBe(order._id.toString());
    });

    it('biến thể không tồn tại -> 404', async () => {
      const manager = await createManager();
      const res = await request(app)
        .get('/api/refund/affected-orders/64b64c1f2f1a2b3c4d5e6f70')
        .set(authHeader(manager));
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/refund/create-batch', () => {
    it('thiếu orderIds -> 400', async () => {
      const manager = await createManager();
      const res = await request(app)
        .post('/api/refund/create-batch')
        .set(authHeader(manager))
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error_code).toBe('VALIDATION_ERROR');
    });

    it('orderIds rỗng -> 400', async () => {
      const manager = await createManager();
      const res = await request(app)
        .post('/api/refund/create-batch')
        .set(authHeader(manager))
        .send({ orderIds: [] });
      expect(res.status).toBe(400);
    });

    it('tạo refund PENDING và hủy đơn (PAID -> hoàn đúng số tiền)', async () => {
      const manager = await createManager();
      const customer = await createCustomer();
      const order = await createOrder(customer, { status: 'CONFIRMED', payment_status: 'PAID', total_amount: 5000 });

      const res = await request(app)
        .post('/api/refund/create-batch')
        .set(authHeader(manager))
        .send({ orderIds: [order._id.toString()] });
      expect(res.status).toBe(200);
      expect(res.body.result.length).toBe(1);
      expect(res.body.result[0].amount).toBe(5000);
      expect(res.body.result[0].status).toBe('PENDING');

      const updated = await Order.findById(order._id);
      expect(updated.status).toBe('CANCELLED');
    });

    it('đơn UNPAID -> refund amount = 0', async () => {
      const manager = await createManager();
      const customer = await createCustomer();
      const order = await createOrder(customer, { status: 'PENDING', payment_status: 'UNPAID', total_amount: 3000 });

      const res = await request(app)
        .post('/api/refund/create-batch')
        .set(authHeader(manager))
        .send({ orderIds: [order._id.toString()] });
      expect(res.status).toBe(200);
      expect(res.body.result[0].amount).toBe(0);
    });

    it('bỏ qua orderId không tồn tại (không tạo refund)', async () => {
      const manager = await createManager();
      const res = await request(app)
        .post('/api/refund/create-batch')
        .set(authHeader(manager))
        .send({ orderIds: ['64b64c1f2f1a2b3c4d5e6f70'] });
      expect(res.status).toBe(200);
      expect(res.body.result.length).toBe(0);
    });
  });

  describe('GET /api/refund/ready', () => {
    it('liệt kê refund PENDING kèm order', async () => {
      const manager = await createManager();
      const customer = await createCustomer();
      const order = await createOrder(customer, { status: 'CANCELLED', payment_status: 'PAID', total_amount: 2000 });
      await createRefund(order, { amount: 2000, status: 'PENDING' });

      const res = await request(app).get('/api/refund/ready').set(authHeader(manager));
      expect(res.status).toBe(200);
      expect(res.body.result.length).toBe(1);
      expect(res.body.result[0].amount).toBe(2000);
    });

    it('bỏ qua refund có order_id null (populate không ra)', async () => {
      const manager = await createManager();
      // Refund trỏ tới order không tồn tại -> order_id populate = null -> bị lọc
      await Refund.create({ order_id: '64b64c1f2f1a2b3c4d5e6f70', amount: 100, reason: 'orphan', status: 'PENDING' });
      const res = await request(app).get('/api/refund/ready').set(authHeader(manager));
      expect(res.status).toBe(200);
      expect(res.body.result.length).toBe(0);
    });
  });

  describe('POST /api/refund/:refundId/refund-checkout', () => {
    it('hoàn tất refund -> order REFUNDED', async () => {
      const manager = await createManager();
      const customer = await createCustomer();
      const order = await createOrder(customer, { status: 'CANCELLED', payment_status: 'PAID', total_amount: 2000 });
      const refund = await createRefund(order, { amount: 2000, status: 'PENDING' });

      const res = await request(app)
        .post(`/api/refund/${refund._id}/refund-checkout`)
        .set(authHeader(manager));
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Hoàn tiền thành công');

      const updatedRefund = await Refund.findById(refund._id);
      expect(updatedRefund.status).toBe('COMPLETED');
      const updatedOrder = await Order.findById(order._id);
      expect(updatedOrder.status).toBe('REFUNDED');
      expect(updatedOrder.payment_status).toBe('UNPAID');
    });

    it('refund không tồn tại -> 404', async () => {
      const manager = await createManager();
      const res = await request(app)
        .post('/api/refund/64b64c1f2f1a2b3c4d5e6f70/refund-checkout')
        .set(authHeader(manager));
      expect(res.status).toBe(404);
      expect(res.body.error_code).toBe('REFUND_NOT_FOUND');
    });
  });

  describe('GET /api/orders/cancelled/paid (RefundController)', () => {
    it('liệt kê đơn CANCELLED + PAID', async () => {
      const manager = await createManager();
      const customer = await createCustomer();
      await createOrder(customer, { status: 'CANCELLED', payment_status: 'PAID', total_amount: 1500 });
      await createOrder(customer, { status: 'CANCELLED', payment_status: 'UNPAID' });

      const res = await request(app).get('/api/orders/cancelled/paid').set(authHeader(manager));
      expect(res.status).toBe(200);
      expect(res.body.result.totalElements).toBe(1);
      expect(res.body.result.items[0].paidAmount).toBe(1500);
    });

    it('ADMIN cũng truy cập được', async () => {
      const admin = await createAdmin();
      const res = await request(app).get('/api/orders/cancelled/paid').set(authHeader(admin));
      expect(res.status).toBe(200);
    });

    it('khách chỉ có username (thiếu tên) -> customerName fallback về username', async () => {
      const manager = await createManager();
      const customer = await createCustomer({ username: 'khachle' });
      await customer.collection.updateOne({ _id: customer._id }, { $unset: { first_name: '', last_name: '' } });
      await createOrder(customer, { status: 'CANCELLED', payment_status: 'PAID', total_amount: 800, recipient_name: '' });
      const res = await request(app).get('/api/orders/cancelled/paid').set(authHeader(manager));
      expect(res.status).toBe(200);
      expect(res.body.result.items[0].recipientName).toBe('khachle');
    });
  });

  describe('customerName fallback ở luồng refund', () => {
    it('getReadyRefunds dùng username khi thiếu tên', async () => {
      const manager = await createManager();
      const customer = await createCustomer({ username: 'nouser' });
      await customer.collection.updateOne({ _id: customer._id }, { $unset: { first_name: '', last_name: '' } });
      const order = await createOrder(customer, { status: 'CANCELLED', payment_status: 'PAID', total_amount: 500, recipient_name: '' });
      await createRefund(order, { amount: 500, status: 'PENDING' });
      const res = await request(app).get('/api/refund/ready').set(authHeader(manager));
      expect(res.status).toBe(200);
      expect(res.body.result[0].order.recipientName).toBe('nouser');
    });

    it('getAffectedOrders trả đơn bị ảnh hưởng bởi biến thể ngừng bán', async () => {
      const manager = await createManager();
      const customer = await createCustomer({ first_name: 'An', last_name: 'Le' });
      const product = await createProduct();
      const variant = await createVariant(product);
      const order = await createOrder(customer, { status: 'CANCELLED', payment_status: 'PAID', total_amount: 1000 });
      await createOrderItem(order, { product_id: product._id, variant_id: variant._id });
      // đơn đang xử lý cùng sản phẩm
      const active = await createOrder(customer, { status: 'PENDING', total_amount: 1000 });
      await createOrderItem(active, { product_id: product._id, variant_id: variant._id });
      const res = await request(app).get(`/api/refund/affected-orders/${variant._id}`).set(authHeader(manager));
      expect(res.status).toBe(200);
      expect(res.body.result.length).toBeGreaterThanOrEqual(1);
      expect(res.body.result[0].order.recipientName).toContain('An');
    });
  });
});
