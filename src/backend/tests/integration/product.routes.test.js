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

describe('GET /api/products (bộ lọc nâng cao)', () => {
  it('lọc theo brand (không phân biệt hoa thường)', async () => {
    await createProduct({ name: 'A', brand: 'RayBan' });
    await createProduct({ name: 'B', brand: 'Gucci' });
    const res = await request(app).get('/api/products?brand=rayban');
    expect(res.status).toBe(200);
    expect(res.body.result.items).toHaveLength(1);
    expect(res.body.result.items[0].brand).toBe('RayBan');
  });

  it('lọc theo gender (chuẩn hóa hoa)', async () => {
    await createProduct({ name: 'M', gender: 'MALE' });
    await createProduct({ name: 'F', gender: 'FEMALE' });
    const res = await request(app).get('/api/products?gender=male');
    expect(res.status).toBe(200);
    expect(res.body.result.items.every((p) => p.gender === 'MALE')).toBe(true);
  });

  it('lọc theo khoảng giá minPrice/maxPrice', async () => {
    await createProduct({ name: 'Cheap', price: 100 });
    await createProduct({ name: 'Mid', price: 500 });
    await createProduct({ name: 'Pricey', price: 5000 });
    const res = await request(app).get('/api/products?minPrice=200&maxPrice=1000');
    expect(res.status).toBe(200);
    const names = res.body.result.items.map((p) => p.name);
    expect(names).toEqual(['Mid']);
  });

  it('sắp xếp price-asc', async () => {
    await createProduct({ name: 'High', price: 900 });
    await createProduct({ name: 'Low', price: 100 });
    const res = await request(app).get('/api/products?sortBy=price-asc');
    expect(res.status).toBe(200);
    expect(res.body.result.items[0].price).toBeLessThanOrEqual(res.body.result.items[1].price);
  });

  it('lọc theo shape và frameMaterial', async () => {
    await createProduct({ name: 'RoundMetal', shape: 'ROUND', frameMaterial: 'METAL' });
    await createProduct({ name: 'SquarePlastic', shape: 'SQUARE', frameMaterial: 'PLASTIC' });
    const res = await request(app).get('/api/products?shape=ROUND&frameMaterial=METAL');
    expect(res.status).toBe(200);
    expect(res.body.result.items).toHaveLength(1);
    expect(res.body.result.items[0].name).toBe('RoundMetal');
  });

  it('khách truy vấn category=LENS vẫn xem được tròng kính', async () => {
    await createLens({ name: 'Progressive Lens' });
    const res = await request(app).get('/api/products?category=LENS');
    expect(res.status).toBe(200);
    expect(res.body.result.items.map((p) => p.name)).toContain('Progressive Lens');
  });

  it('staff lọc theo status cụ thể (INACTIVE)', async () => {
    const admin = await createAdmin();
    await createProduct({ name: 'ActiveOne', status: 'ACTIVE' });
    await createProduct({ name: 'InactiveOne', status: 'INACTIVE' });
    const res = await request(app).get('/api/products?status=INACTIVE').set(authHeader(admin));
    expect(res.status).toBe(200);
    expect(res.body.result.items.map((p) => p.name)).toEqual(['InactiveOne']);
  });
});

describe('POST /api/products (nhánh field JSON)', () => {
  it('nhận product JSON qua field và ép kiểu số', async () => {
    const manager = await createManager();
    const res = await request(app)
      .post('/api/products')
      .set(authHeader(manager))
      .field('product', JSON.stringify({
        name: 'JSON Frame', brand: 'B', price: '1500', discountPrice: '1200', weightGram: '30',
        imageUrl: ['http://img/a.jpg']
      }));
    expect(res.status).toBe(201);
    expect(res.body.result.price).toBe(1500);
    expect(res.body.result.discountPrice).toBe(1200);
    expect(res.body.result.imageUrl[0].imageUrl).toBe('http://img/a.jpg');
  });

  it('không có ảnh -> gán ảnh mặc định', async () => {
    const manager = await createManager();
    const res = await request(app)
      .post('/api/products')
      .set(authHeader(manager))
      .field('product', JSON.stringify({ name: 'No Image', brand: 'B', price: 100 }));
    expect(res.status).toBe(201);
    expect(res.body.result.imageUrl).toHaveLength(1);
    expect(res.body.result.imageUrl[0].imageUrl).toContain('unsplash');
  });

  it('tạo sản phẩm kèm upload ảnh', async () => {
    const manager = await createManager();
    const res = await request(app)
      .post('/api/products')
      .set(authHeader(manager))
      .field('product', JSON.stringify({ name: 'Uploaded', brand: 'B', price: 100 }))
      .attach('files', Buffer.from('89504e470d0a1a0a', 'hex'), { filename: 'p.png', contentType: 'image/png' });
    expect(res.status).toBe(201);
    expect(res.body.result.imageUrl.some((i) => i.imageUrl.includes('/uploads/'))).toBe(true);
  });

  it('gửi trực tiếp JSON (không qua field product) kèm discountPrice/weightGram', async () => {
    const manager = await createManager();
    const res = await request(app)
      .post('/api/products')
      .set(authHeader(manager))
      .send({ name: 'Direct', brand: 'B', price: 2000, discountPrice: 1500, weightGram: 25 });
    expect(res.status).toBe(201);
    expect(res.body.result.discountPrice).toBe(1500);
    expect(res.body.result.weightGram).toBe(25);
  });

  it('thiếu trường bắt buộc -> 400 VALIDATION_ERROR', async () => {
    const manager = await createManager();
    const res = await request(app)
      .post('/api/products')
      .set(authHeader(manager))
      .send({ name: 'Chỉ có tên' });
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/products (tìm kiếm & chi tiết)', () => {
  it('search khớp name hoặc brand (escape regex)', async () => {
    await createProduct({ name: 'Aviator Classic', brand: 'RayBan' });
    await createProduct({ name: 'Wayfarer', brand: 'Gucci' });
    const res = await request(app).get('/api/products?search=aviator');
    expect(res.status).toBe(200);
    expect(res.body.result.items.map((p) => p.name)).toContain('Aviator Classic');
  });

  it('staff xem được sản phẩm INACTIVE theo id', async () => {
    const manager = await createManager();
    const product = await createProduct({ status: 'INACTIVE' });
    const res = await request(app).get(`/api/products/${product._id}`).set(authHeader(manager));
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(product._id.toString());
  });

  it('khách xem sản phẩm INACTIVE -> 404', async () => {
    const product = await createProduct({ status: 'INACTIVE' });
    const res = await request(app).get(`/api/products/${product._id}`);
    expect(res.status).toBe(404);
  });

  it('áp dụng đầy đủ bộ lọc + sort price-asc', async () => {
    await createProduct({ name: 'F1', brand: 'BrandZ', price: 500, gender: 'MALE', shape: 'ROUND', frameMaterial: 'METAL', frameType: 'FULL_RIM' });
    await createProduct({ name: 'F2', brand: 'BrandZ', price: 1500, gender: 'MALE', shape: 'ROUND', frameMaterial: 'METAL', frameType: 'FULL_RIM' });
    const res = await request(app).get('/api/products?brand=brandz&gender=MALE&shape=ROUND&frameMaterial=METAL&frameType=FULL_RIM&minPrice=100&maxPrice=1000&sortBy=price-asc');
    expect(res.status).toBe(200);
    expect(res.body.result.items.every((p) => p.price <= 1000)).toBe(true);
  });

  it('staff lọc theo status cụ thể', async () => {
    const manager = await createManager();
    await createProduct({ status: 'INACTIVE', name: 'InactiveOne' });
    const res = await request(app).get('/api/products?status=INACTIVE').set(authHeader(manager));
    expect(res.status).toBe(200);
    expect(res.body.result.items.every((p) => p.status === 'INACTIVE')).toBe(true);
  });
});

describe('DELETE /api/products/:id (dọn ảnh cục bộ)', () => {
  it('xóa sản phẩm có ảnh /uploads/ + biến thể', async () => {
    const manager = await createManager();
    const product = await createProduct({ imageUrl: [{ imageUrl: '/uploads/nonexistent-local.png' }, { imageUrl: 'http://external/x.jpg' }] });
    await createVariant(product, { imageUrl: [{ imageUrl: '/uploads/variant-local.png' }] });
    const res = await request(app).delete(`/api/products/${product._id}`).set(authHeader(manager));
    expect(res.status).toBe(200);
    expect(await createProduct).toBeDefined();
  });

  it('sản phẩm không tồn tại -> 404', async () => {
    const manager = await createManager();
    const res = await request(app).delete('/api/products/64b7f0000000000000000000').set(authHeader(manager));
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/products/:id (cập nhật ảnh)', () => {
  it('thay danh sách ảnh + upload ảnh mới, dọn ảnh cũ', async () => {
    const manager = await createManager();
    const product = await createProduct({ imageUrl: [{ imageUrl: '/uploads/old-local.png' }] });
    const res = await request(app)
      .put(`/api/products/${product._id}`)
      .set(authHeader(manager))
      .field('product', JSON.stringify({ imageUrl: ['http://keep/a.jpg'], price: '2500' }))
      .attach('files', Buffer.from('89504e470d0a1a0a', 'hex'), { filename: 'fresh.png', contentType: 'image/png' });
    expect(res.status).toBe(200);
    expect(res.body.result.price).toBe(2500);
    expect(res.body.result.imageUrl).toHaveLength(2);
  });

  it('không truyền imageUrl -> giữ nguyên ảnh cũ', async () => {
    const manager = await createManager();
    const product = await createProduct({ name: 'KeepImg' });
    const res = await request(app)
      .put(`/api/products/${product._id}`)
      .set(authHeader(manager))
      .field('product', JSON.stringify({ name: 'KeepImg Renamed' }));
    expect(res.status).toBe(200);
    expect(res.body.result.name).toBe('KeepImg Renamed');
  });

  it('sản phẩm không tồn tại -> 404', async () => {
    const manager = await createManager();
    const res = await request(app)
      .put('/api/products/64b7f0000000000000000000')
      .set(authHeader(manager))
      .field('product', JSON.stringify({ name: 'X' }));
    expect(res.status).toBe(404);
  });
});
