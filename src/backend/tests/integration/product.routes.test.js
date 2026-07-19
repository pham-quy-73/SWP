import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import Product from '../../models/Product.js';
import ProductVariant from '../../models/ProductVariant.js';
import {
  authHeader, createAdmin, createManager, createCustomer,
  createProduct, createLens, createVariant
} from '../helpers/factories.js';

const app = createApp();

describe('GET /api/products', () => {
  it('khách chỉ thấy sản phẩm ACTIVE, không thấy LENS', async () => {
    await createProduct({ name: 'Active Frame', status: 'ACTIVE', category: 'FRAME' });
    await createProduct({ name: 'Inactive Frame', status: 'INACTIVE', category: 'FRAME' });
    await createLens({ name: 'Some Lens', status: 'ACTIVE' });

    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    const names = res.body.result.items.map((p) => p.name);
    expect(names).toContain('Active Frame');
    expect(names).not.toContain('Inactive Frame');
    expect(names).not.toContain('Some Lens');
  });

  it('staff xem status=ALL thấy cả INACTIVE', async () => {
    const manager = await createManager();
    await createProduct({ name: 'Active Frame', status: 'ACTIVE' });
    await createProduct({ name: 'Inactive Frame', status: 'INACTIVE' });

    const res = await request(app)
      .get('/api/products?status=ALL')
      .set(authHeader(manager));
    expect(res.status).toBe(200);
    const names = res.body.result.items.map((p) => p.name);
    expect(names).toContain('Inactive Frame');
  });

  it('lọc theo search khớp tên', async () => {
    await createProduct({ name: 'RayBan Aviator' });
    await createProduct({ name: 'Gucci Round' });
    const res = await request(app).get('/api/products?search=RayBan');
    expect(res.status).toBe(200);
    expect(res.body.result.items).toHaveLength(1);
    expect(res.body.result.items[0].name).toBe('RayBan Aviator');
  });

  it('phân trang trả totalElements/totalPages', async () => {
    for (let i = 0; i < 3; i++) await createProduct({ name: `P${i}` });
    const res = await request(app).get('/api/products?page=1&limit=2');
    expect(res.status).toBe(200);
    expect(res.body.result.totalElements).toBe(3);
    expect(res.body.result.totalPages).toBe(2);
  });
});

describe('GET /api/products/:id', () => {
  it('trả về sản phẩm ACTIVE', async () => {
    const p = await createProduct({ status: 'ACTIVE' });
    const res = await request(app).get(`/api/products/${p._id}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(p._id.toString());
  });

  it('khách không xem được INACTIVE -> 404', async () => {
    const p = await createProduct({ status: 'INACTIVE' });
    const res = await request(app).get(`/api/products/${p._id}`);
    expect(res.status).toBe(404);
  });

  it('id sai định dạng -> 400 INVALID_ID', async () => {
    const res = await request(app).get('/api/products/not-a-valid-id');
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('INVALID_ID');
  });

  it('id không tồn tại -> 404', async () => {
    const res = await request(app).get('/api/products/64b7f0000000000000000000');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/products (tạo sản phẩm)', () => {
  it('không đăng nhập -> 401', async () => {
    const res = await request(app).post('/api/products').send({ name: 'X' });
    expect(res.status).toBe(401);
  });

  it('customer không đủ quyền -> 403', async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .post('/api/products')
      .set(authHeader(customer))
      .field('name', 'X').field('brand', 'B').field('price', '100');
    expect(res.status).toBe(403);
  });

  it('manager tạo thành công -> 201', async () => {
    const manager = await createManager();
    const res = await request(app)
      .post('/api/products')
      .set(authHeader(manager))
      .field('name', 'New Frame').field('brand', 'BrandX').field('price', '1500').field('category', 'FRAME');
    expect(res.status).toBe(201);
    expect(res.body.result.name).toBe('New Frame');
    const inDb = await Product.findById(res.body.result._id);
    expect(inDb).not.toBeNull();
  });

  it('thiếu trường bắt buộc -> 400 VALIDATION_ERROR', async () => {
    const manager = await createManager();
    const res = await request(app)
      .post('/api/products')
      .set(authHeader(manager))
      .field('name', 'Only Name');
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('VALIDATION_ERROR');
  });
});

describe('PUT /api/products/:id', () => {
  it('manager cập nhật thành công', async () => {
    const manager = await createManager();
    const p = await createProduct({ name: 'Old', price: 100 });
    const res = await request(app)
      .put(`/api/products/${p._id}`)
      .set(authHeader(manager))
      .field('product', JSON.stringify({ name: 'Updated', price: 200 }));
    expect(res.status).toBe(200);
    expect(res.body.result.name).toBe('Updated');
    expect(res.body.result.price).toBe(200);
  });

  it('không tồn tại -> 404', async () => {
    const manager = await createManager();
    const res = await request(app)
      .put('/api/products/64b7f0000000000000000000')
      .set(authHeader(manager))
      .field('product', JSON.stringify({ name: 'X' }));
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/products/:id', () => {
  it('manager xóa sản phẩm + cascade variants', async () => {
    const manager = await createManager();
    const p = await createProduct();
    await createVariant(p);
    const res = await request(app)
      .delete(`/api/products/${p._id}`)
      .set(authHeader(manager));
    expect(res.status).toBe(200);
    expect(await Product.findById(p._id)).toBeNull();
    expect(await ProductVariant.countDocuments({ productId: p._id })).toBe(0);
  });

  it('không tồn tại -> 404', async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .delete('/api/products/64b7f0000000000000000000')
      .set(authHeader(admin));
    expect(res.status).toBe(404);
  });
});

describe('Product Variants', () => {
  it('GET danh sách biến thể', async () => {
    const p = await createProduct();
    await createVariant(p, { colorName: 'Red' });
    const res = await request(app).get(`/api/products/${p._id}/variants`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.result).toHaveLength(1);
  });

  it('POST tạo biến thể (manager)', async () => {
    const manager = await createManager();
    const p = await createProduct();
    const res = await request(app)
      .post(`/api/products/${p._id}/variants`)
      .set(authHeader(manager))
      .field('variant', JSON.stringify({ colorName: 'Blue', lensWidthMm: 50, bridgeWidthMm: 18, templeLengthMm: 140, price: 999, quantity: 5 }));
    expect(res.status).toBe(201);
    expect(res.body.result.colorName).toBe('Blue');
  });

  it('POST biến thể cho sản phẩm không tồn tại -> 404', async () => {
    const manager = await createManager();
    const res = await request(app)
      .post('/api/products/64b7f0000000000000000000/variants')
      .set(authHeader(manager))
      .field('variant', JSON.stringify({ colorName: 'Blue' }));
    expect(res.status).toBe(404);
  });

  it('PUT cập nhật biến thể', async () => {
    const manager = await createManager();
    const p = await createProduct();
    const v = await createVariant(p, { price: 100 });
    const res = await request(app)
      .put(`/api/products/${p._id}/variants/${v._id}`)
      .set(authHeader(manager))
      .field('variant', JSON.stringify({ price: 250, quantity: 20 }));
    expect(res.status).toBe(200);
    expect(res.body.result.price).toBe(250);
  });

  it('DELETE biến thể', async () => {
    const manager = await createManager();
    const p = await createProduct();
    const v = await createVariant(p);
    const res = await request(app)
      .delete(`/api/products/${p._id}/variants/${v._id}`)
      .set(authHeader(manager));
    expect(res.status).toBe(200);
    expect(await ProductVariant.findById(v._id)).toBeNull();
  });

  it('DELETE biến thể không tồn tại -> 404', async () => {
    const manager = await createManager();
    const p = await createProduct();
    const res = await request(app)
      .delete(`/api/products/${p._id}/variants/64b7f0000000000000000000`)
      .set(authHeader(manager));
    expect(res.status).toBe(404);
  });
});
