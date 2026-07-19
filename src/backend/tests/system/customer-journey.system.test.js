import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../app.js';
import User from '../../models/User.js';
import {
  createManager, createAdmin, createProduct, createLens, createVariant
} from '../helpers/factories.js';

/**
 * SYSTEM / END-TO-END TESTS
 * -------------------------------------------------------------------------
 * Khác với integration test (kiểm thử từng route riêng lẻ), nhóm test này đi
 * xuyên suốt nhiều phân hệ như một người dùng thật: qua đúng các endpoint HTTP
 * công khai, dùng token lấy từ luồng đăng nhập thật, không "đi tắt" bằng factory
 * cho các bước cốt lõi của hành trình.
 *
 * Mục tiêu: xác nhận các phân hệ (Auth, Catalog, Address, Order, Payment,
 * Refund, Dashboard) ghép nối đúng với nhau đầu-cuối.
 */
const app = createApp();

// Đăng ký -> kích hoạt email -> đăng nhập, trả về { token, user } như client thật nhận được.
async function signupVerifyLogin({ username, email, password = 'secret123' }) {
  const reg = await request(app).post('/api/auth/register').send({
    username, email, password, first_name: 'E2E', last_name: 'Tester'
  });
  expect(reg.status).toBe(201);

  // Lấy token kích hoạt từ DB (email đã bị mock ở tests/setup.js nên không gửi thật).
  const created = await User.findOne({ email: email.toLowerCase() });
  expect(created.is_email_verified).toBe(false);

  const verify = await request(app).get('/api/auth/verify-email').query({ token: created.verify_token });
  expect(verify.status).toBe(302); // redirect về client kèm ?verified=true

  const login = await request(app).post('/api/auth/login').send({ username, password });
  expect(login.status).toBe(200);
  expect(login.body.token).toBeDefined();
  return { token: login.body.token, user: login.body.user };
}

const bearer = (token) => ({ Authorization: `Bearer ${token}` });

// Ký token cho user tạo bằng factory (manager/admin) — dùng chung secret test.
function signManagerToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

describe('[SYSTEM] Hành trình khách hàng: đăng ký → mua hàng → thanh toán → xem đơn', () => {
  it('đi trọn vòng đời một đơn hàng gọng + tròng và thanh toán mô phỏng thành công', async () => {
    // --- 1. Nhân viên (manager) dựng catalog: sản phẩm gọng + biến thể + tròng ---
    const manager = await createManager();
    const frame = await createProduct({ name: 'Gọng E2E', brand: 'OpticX', price: 1200, category: 'FRAME' });
    const variant = await createVariant(frame, { colorName: 'Đen', price: 1200, quantity: 5 });
    const lens = await createLens({ name: 'Tròng chống ánh sáng xanh', price: 300 });
    void manager;

    // --- 2. Khách đăng ký, kích hoạt, đăng nhập ---
    const { token, user } = await signupVerifyLogin({ username: 'buyer01', email: 'buyer01@e2e.com' });
    expect(user.role).toBe('CUSTOMER');

    // --- 3. Khách duyệt catalog qua API công khai ---
    const catalog = await request(app).get('/api/products?search=E2E');
    expect(catalog.status).toBe(200);
    expect(catalog.body.result.items.some((p) => p.name === 'Gọng E2E')).toBe(true);

    // --- 4. Khách lưu địa chỉ giao hàng ---
    const addr = await request(app).post('/api/addresses').set(bearer(token)).send({
      recipientName: 'E2E Tester', phoneNumber: '0900123456', deliveryAddress: '99 Đường Test, Q1'
    });
    expect(addr.status).toBe(201);
    expect(addr.body.result.is_default).toBe(true); // địa chỉ đầu tiên -> mặc định

    // --- 5. Khách xem báo giá trước khi đặt (payment requirement) ---
    const quoteItems = [{ productVariantId: variant._id.toString(), lensId: lens._id.toString(), quantity: 2 }];
    const quote = await request(app).post('/api/payment/orders/requirement').set(bearer(token)).send({ items: quoteItems });
    expect(quote.status).toBe(200);
    // (1200 gọng + 300 tròng) * 2 = 3000
    expect(quote.body.result.orderTotal).toBe(3000);

    // --- 6. Khách tạo đơn hàng ---
    const orderInfo = {
      items: [{
        variantId: variant._id.toString(),
        lensId: lens._id.toString(),
        quantity: 2,
        prescription: { odSphere: -1.5, osSphere: -1.75, odAxis: 90, note: 'Giao giờ hành chính' }
      }],
      deliveryAddress: '99 Đường Test, Q1'
    };
    const created = await request(app).post('/orders/create').set(bearer(token))
      .field('orderInfo', JSON.stringify(orderInfo));
    expect(created.status).toBe(201);
    const orderId = created.body.result.orderId;
    expect(orderId).toBeDefined();

    // Số tiền đơn khớp báo giá, và kho đã bị trừ 2 (còn 3)
    expect(created.body.result.order.total_amount).toBe(3000);
    const { default: ProductVariant } = await import('../../models/ProductVariant.js');
    expect((await ProductVariant.findById(variant._id)).quantity).toBe(3);

    // --- 7. Khách thanh toán qua cổng mô phỏng (SUCCESS) ---
    const pay = await request(app).post('/payment/mock-checkout').set(bearer(token))
      .send({ orderId, simulateStatus: 'SUCCESS' });
    expect(pay.status).toBe(200);
    expect(pay.body.result.success).toBe(true);

    // --- 8. Khách xem lại đơn: đã CONFIRMED + PAID ---
    const myOrders = await request(app).get('/orders/me').set(bearer(token));
    expect(myOrders.status).toBe(200);
    const found = myOrders.body.result.items.find((o) => o.orderId === orderId);
    expect(found).toBeDefined();
    expect(found.orderStatus).toBe('CONFIRMED');
    expect(found.items[0].lensName).toBe('Tròng chống ánh sáng xanh');
    expect(found.items[0].prescription.od_sphere).toBe(-1.5);
  });

  it('chặn thanh toán mô phỏng thất bại: đơn bị hủy và hoàn trả tồn kho', async () => {
    const frame = await createProduct({ name: 'Gọng Fail', price: 1000 });
    const variant = await createVariant(frame, { price: 1000, quantity: 4 });
    const { token } = await signupVerifyLogin({ username: 'buyer02', email: 'buyer02@e2e.com' });

    const created = await request(app).post('/orders/create').set(bearer(token))
      .field('orderInfo', JSON.stringify({ items: [{ variantId: variant._id.toString(), quantity: 1 }] }));
    expect(created.status).toBe(201);
    const orderId = created.body.result.orderId;

    const { default: ProductVariant } = await import('../../models/ProductVariant.js');
    expect((await ProductVariant.findById(variant._id)).quantity).toBe(3); // đã trừ

    const pay = await request(app).post('/payment/mock-checkout').set(bearer(token))
      .send({ orderId, simulateStatus: 'FAILED' });
    expect(pay.status).toBe(200);
    expect(pay.body.result.success).toBe(false);

    // Đơn bị hủy, kho được hoàn lại về 4
    expect((await ProductVariant.findById(variant._id)).quantity).toBe(4);
    const myOrders = await request(app).get('/orders/me').set(bearer(token));
    const found = myOrders.body.result.items.find((o) => o.orderId === orderId);
    expect(found.orderStatus).toBe('CANCELLED');
  });

  it('từ chối đặt đơn khi vượt tồn kho (đầu-cuối)', async () => {
    const frame = await createProduct({ name: 'Gọng hiếm', price: 500 });
    const variant = await createVariant(frame, { price: 500, quantity: 1 });
    const { token } = await signupVerifyLogin({ username: 'buyer03', email: 'buyer03@e2e.com' });

    const created = await request(app).post('/orders/create').set(bearer(token))
      .field('orderInfo', JSON.stringify({ items: [{ variantId: variant._id.toString(), quantity: 5 }] }));
    expect(created.status).toBe(400);
    expect(created.body.error_code).toBe('OUT_OF_STOCK');

    // Kho không bị trừ khi đơn thất bại
    const { default: ProductVariant } = await import('../../models/ProductVariant.js');
    expect((await ProductVariant.findById(variant._id)).quantity).toBe(1);
  });
});

describe('[SYSTEM] Hành trình hủy đơn đã thanh toán → hoàn tiền (manager)', () => {
  it('khách hủy đơn đã thanh toán, manager xử lý hoàn tiền trọn luồng', async () => {
    // Dựng catalog + khách mua + thanh toán thành công
    const frame = await createProduct({ name: 'Gọng hoàn tiền', price: 2000 });
    const variant = await createVariant(frame, { price: 2000, quantity: 3 });
    const { token: customerToken } = await signupVerifyLogin({ username: 'refundbuyer', email: 'refundbuyer@e2e.com' });

    const created = await request(app).post('/orders/create').set(bearer(customerToken))
      .field('orderInfo', JSON.stringify({ items: [{ variantId: variant._id.toString(), quantity: 1 }] }));
    const orderId = created.body.result.orderId;

    await request(app).post('/payment/mock-checkout').set(bearer(customerToken))
      .send({ orderId, simulateStatus: 'SUCCESS' });

    // Khách hủy đơn đã thanh toán
    const cancel = await request(app).put(`/orders/${orderId}/cancel`).set(bearer(customerToken));
    expect([200, 201]).toContain(cancel.status);

    // Manager thấy đơn trong danh sách "đã hủy nhưng đã thanh toán"
    const manager = await createManager();
    const managerLogin = { Authorization: `Bearer ${signManagerToken(manager)}` };
    const cancelledPaid = await request(app).get('/api/orders/cancelled/paid').set(managerLogin);
    expect(cancelledPaid.status).toBe(200);
    const target = cancelledPaid.body.result.items.find((o) => String(o.orderId) === String(orderId));
    expect(target).toBeDefined();
    expect(target.paidAmount).toBe(2000);

    // Manager tạo lô hoàn tiền
    const batch = await request(app).post('/api/refund/create-batch').set(managerLogin)
      .send({ orderIds: [orderId] });
    expect(batch.status).toBe(200);
    expect(batch.body.result.length).toBe(1);
    const refundId = batch.body.result[0]._id;

    // Manager xem danh sách sẵn sàng xử lý và xác nhận hoàn tiền
    const ready = await request(app).get('/api/refund/ready').set(managerLogin);
    expect(ready.status).toBe(200);
    expect(ready.body.result.some((r) => String(r.refundId) === String(refundId))).toBe(true);

    const checkout = await request(app).post(`/api/refund/${refundId}/refund-checkout`).set(managerLogin);
    expect(checkout.status).toBe(200);

    // Đơn chuyển REFUNDED, thanh toán về UNPAID
    const { default: Order } = await import('../../models/Order.js');
    const finalOrder = await Order.findById(orderId);
    expect(finalOrder.status).toBe('REFUNDED');
    expect(finalOrder.payment_status).toBe('UNPAID');
  });
});

describe('[SYSTEM] Kiểm soát truy cập theo vai trò xuyên phân hệ', () => {
  it('khách không được chạm route quản trị; admin/manager được', async () => {
    const { token: customerToken } = await signupVerifyLogin({ username: 'plainuser', email: 'plainuser@e2e.com' });

    // Khách bị chặn: dashboard, danh sách user, tất cả đơn
    expect((await request(app).get('/api/dashboard/revenue').set(bearer(customerToken))).status).toBe(403);
    expect((await request(app).get('/api/users').set(bearer(customerToken))).status).toBe(403);
    expect((await request(app).get('/api/orders').set(bearer(customerToken))).status).toBe(403);

    // Admin xem được dashboard + danh sách user
    const admin = await createAdmin();
    const adminHeader = { Authorization: `Bearer ${signManagerToken(admin)}` };
    expect((await request(app).get('/api/dashboard/revenue').set(adminHeader)).status).toBe(200);
    expect((await request(app).get('/api/users').set(adminHeader)).status).toBe(200);
  });

  it('không có token -> 401 ở route yêu cầu đăng nhập', async () => {
    expect((await request(app).get('/orders/me')).status).toBe(401);
    expect((await request(app).get('/api/addresses')).status).toBe(401);
  });
});
