import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import Product from '../../models/Product.js';
import {
  authHeader, createAdmin, createCustomer,
  createOrder, createOrderItem, createProduct, createLens
} from '../helpers/factories.js';

const app = createApp();

describe('GET /api/dashboard/revenue — best sellers', () => {
  it('thống kê top gọng kính bán chạy theo tổng số lượng', async () => {
    const admin = await createAdmin();
    const user = await createCustomer();
    const hot = await createProduct({ name: 'Gọng Hot', brand: 'BrandA', imageUrl: [{ imageUrl: '/uploads/hot.png' }] });
    const cold = await createProduct({ name: 'Gọng Ế', brand: 'BrandB' });
    const order = await createOrder(user, { status: 'COMPLETED' });
    await createOrderItem(order, { product_id: hot._id, quantity: 7, unit_price: 1000 });
    await createOrderItem(order, { product_id: cold._id, quantity: 2, unit_price: 500 });

    const res = await request(app).get('/api/dashboard/revenue').set(authHeader(admin));
    expect(res.status).toBe(200);
    const { topProducts, totalItemsSold } = res.body.result.bestSellers;
    expect(topProducts).toHaveLength(2);
    // Sắp xếp giảm dần theo totalSold
    expect(topProducts[0].name).toBe('Gọng Hot');
    expect(topProducts[0].totalSold).toBe(7);
    expect(topProducts[0].totalRevenue).toBe(7000);
    // imageUrl là subdocument đầu tiên trong mảng ảnh
    expect(topProducts[0].imageUrl.imageUrl).toBe('/uploads/hot.png');
    expect(totalItemsSold).toBe(2); // 2 dòng OrderItem
  });

  it('đơn CANCELLED không được tính vào best sellers', async () => {
    const admin = await createAdmin();
    const user = await createCustomer();
    const p = await createProduct();
    const cancelled = await createOrder(user, { status: 'CANCELLED' });
    await createOrderItem(cancelled, { product_id: p._id, quantity: 9 });

    const res = await request(app).get('/api/dashboard/revenue').set(authHeader(admin));
    expect(res.status).toBe(200);
    expect(res.body.result.bestSellers.topProducts).toHaveLength(0);
    expect(res.body.result.bestSellers.totalItemsSold).toBe(0);
  });

  it('sản phẩm đã bị xóa -> fallback "Sản phẩm đã xóa"', async () => {
    const admin = await createAdmin();
    const user = await createCustomer();
    const p = await createProduct();
    const order = await createOrder(user, { status: 'COMPLETED' });
    await createOrderItem(order, { product_id: p._id, quantity: 3 });
    // Xóa hẳn product khỏi DB -> populate trả null
    await Product.findByIdAndDelete(p._id);

    const res = await request(app).get('/api/dashboard/revenue').set(authHeader(admin));
    expect(res.status).toBe(200);
    const top = res.body.result.bestSellers.topProducts[0];
    expect(top.productId).toBeNull();
    expect(top.name).toBe('Sản phẩm đã xóa');
    expect(top.category).toBe('FRAME');
  });

  it('thống kê top tròng kính + tỷ lệ đơn cắt tròng', async () => {
    const admin = await createAdmin();
    const user = await createCustomer();
    const frame = await createProduct();
    // Dashboard populate lens qua model Product nên tạo Product thường đóng vai tròng
    const lens = await createProduct({ name: 'Tròng Essilor', price: 800, brand: 'Essilor' });
    const order = await createOrder(user, { status: 'COMPLETED' });
    // 1 item có tròng, 1 item chỉ gọng -> ratio 50%
    await createOrderItem(order, { product_id: frame._id, lens_id: lens._id, quantity: 2 });
    await createOrderItem(order, { product_id: frame._id, quantity: 1 });

    const res = await request(app).get('/api/dashboard/revenue').set(authHeader(admin));
    expect(res.status).toBe(200);
    const { topLenses, prescriptionRatio } = res.body.result.bestSellers;
    expect(topLenses).toHaveLength(1);
    expect(topLenses[0].name).toBe('Tròng Essilor');
    expect(topLenses[0].brand).toBe('Essilor');
    expect(topLenses[0].price).toBe(800);
    expect(topLenses[0].totalSold).toBe(2);
    expect(prescriptionRatio).toBe(50);
  });

  it('tròng kính đã bị xóa -> fallback "Tròng kính mặc định"', async () => {
    const admin = await createAdmin();
    const user = await createCustomer();
    const frame = await createProduct();
    const lens = await createProduct({ name: 'Sẽ xóa', price: 500 });
    const order = await createOrder(user, { status: 'COMPLETED' });
    await createOrderItem(order, { product_id: frame._id, lens_id: lens._id, quantity: 1 });
    await Product.findByIdAndDelete(lens._id);

    const res = await request(app).get('/api/dashboard/revenue').set(authHeader(admin));
    expect(res.status).toBe(200);
    const topLens = res.body.result.bestSellers.topLenses[0];
    expect(topLens.lensId).toBeNull();
    expect(topLens.name).toBe('Tròng kính mặc định');
    expect(topLens.price).toBe(0);
  });

  it('sản phẩm không có ảnh -> imageUrl là undefined/rỗng, không crash', async () => {
    const admin = await createAdmin();
    const user = await createCustomer();
    const p = await createProduct(); // imageUrl mặc định []
    const order = await createOrder(user, { status: 'COMPLETED' });
    await createOrderItem(order, { product_id: p._id, quantity: 1 });

    const res = await request(app).get('/api/dashboard/revenue').set(authHeader(admin));
    expect(res.status).toBe(200);
    const top = res.body.result.bestSellers.topProducts[0];
    expect(top.totalSold).toBe(1);
    expect(top.imageUrl == null || top.imageUrl === '').toBe(true);
  });
});
