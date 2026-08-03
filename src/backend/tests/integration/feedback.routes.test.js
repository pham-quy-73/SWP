import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import Feedback from '../../models/Feedback.js';
import {
  authHeader, createCustomer, createProduct, createOrder
} from '../helpers/factories.js';

const app = createApp();

// PNG 1x1 tối thiểu để test upload ảnh feedback
const PNG = Buffer.from('89504e470d0a1a0a', 'hex');

/** Tạo sẵn bộ ba user + product + order thuộc user đó */
async function setupOwnOrder() {
  const user = await createCustomer();
  const product = await createProduct();
  const order = await createOrder(user, { status: 'COMPLETED' });
  return { user, product, order };
}

describe('POST /api/feedbacks', () => {
  it('không đăng nhập -> 401', async () => {
    const res = await request(app).post('/api/feedbacks').send({});
    expect(res.status).toBe(401);
  });

  it('thiếu order_id/product_id/rating -> 400 VALIDATION_ERROR', async () => {
    const user = await createCustomer();
    const res = await request(app)
      .post('/api/feedbacks')
      .set(authHeader(user))
      .send({ comment: 'thiếu dữ liệu' });
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('VALIDATION_ERROR');
  });

  it('rating = null -> 400 (nhánh rating === null)', async () => {
    const { user, product, order } = await setupOwnOrder();
    const res = await request(app)
      .post('/api/feedbacks')
      .set(authHeader(user))
      .send({ order_id: order._id, product_id: product._id, rating: null });
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('VALIDATION_ERROR');
  });

  it('đơn hàng không tồn tại -> 404 ORDER_NOT_FOUND', async () => {
    const user = await createCustomer();
    const product = await createProduct();
    const res = await request(app)
      .post('/api/feedbacks')
      .set(authHeader(user))
      .send({ order_id: '64b7f0000000000000000000', product_id: product._id, rating: 5 });
    expect(res.status).toBe(404);
    expect(res.body.error_code).toBe('ORDER_NOT_FOUND');
  });

  it('đơn hàng của user khác -> 404 (không có quyền đánh giá)', async () => {
    const { product, order } = await setupOwnOrder();
    const otherUser = await createCustomer();
    const res = await request(app)
      .post('/api/feedbacks')
      .set(authHeader(otherUser))
      .send({ order_id: order._id, product_id: product._id, rating: 4 });
    expect(res.status).toBe(404);
    expect(res.body.error_code).toBe('ORDER_NOT_FOUND');
  });

  it('tạo mới feedback hợp lệ (snake_case) -> 201 + map đủ field cho FE', async () => {
    const { user, product, order } = await setupOwnOrder();
    const res = await request(app)
      .post('/api/feedbacks')
      .set(authHeader(user))
      .send({ order_id: order._id, product_id: product._id, rating: 5, comment: 'Tốt' });
    expect(res.status).toBe(201);
    expect(res.body.code).toBe(0);
    expect(res.body.result.rating).toBe(5);
    expect(res.body.result.comment).toBe('Tốt');
    expect(res.body.result.feedbackId).toBeTruthy();
    expect(res.body.result.orderId).toBe(order._id.toString());
    expect(res.body.result.productId).toBe(product._id.toString());
    expect(res.body.result.imageUrls).toEqual([]);
  });

  it('tạo feedback bằng camelCase (orderId/productId) -> 201', async () => {
    const { user, product, order } = await setupOwnOrder();
    const res = await request(app)
      .post('/api/feedbacks')
      .set(authHeader(user))
      .send({ orderId: order._id, productId: product._id, rating: 3 });
    expect(res.status).toBe(201);
    // comment không gửi -> mặc định chuỗi rỗng
    expect(res.body.result.comment).toBe('');
  });

  it('gửi qua field feedback dạng JSON string (multipart) kèm ảnh -> 201 + lưu ảnh', async () => {
    const { user, product, order } = await setupOwnOrder();
    const res = await request(app)
      .post('/api/feedbacks')
      .set(authHeader(user))
      .field('feedback', JSON.stringify({
        orderId: order._id.toString(), productId: product._id.toString(), rating: 4, comment: 'Có ảnh'
      }))
      .attach('images', PNG, { filename: 'fb.png', contentType: 'image/png' });
    expect(res.status).toBe(201);
    expect(res.body.result.rating).toBe(4);
    expect(res.body.result.imageUrls).toHaveLength(1);
    expect(res.body.result.imageUrls[0]).toContain('/uploads/');
  });

  it('field feedback là JSON hỏng -> bỏ qua parse, dùng field thường (nhánh catch)', async () => {
    const { user, product, order } = await setupOwnOrder();
    const res = await request(app)
      .post('/api/feedbacks')
      .set(authHeader(user))
      .field('feedback', '{json hỏng')
      .field('order_id', order._id.toString())
      .field('product_id', product._id.toString())
      .field('rating', '5');
    expect(res.status).toBe(201);
  });

  it('đã có feedback trước đó -> tự chuyển sang cập nhật (200) + gộp thêm ảnh', async () => {
    const { user, product, order } = await setupOwnOrder();
    await Feedback.create({
      user_id: user._id, order_id: order._id, product_id: product._id,
      rating: 2, comment: 'Cũ', images: ['/uploads/old.png']
    });
    const res = await request(app)
      .post('/api/feedbacks')
      .set(authHeader(user))
      .field('order_id', order._id.toString())
      .field('product_id', product._id.toString())
      .field('rating', '5')
      .field('comment', 'Mới')
      .attach('images', PNG, { filename: 'new.png', contentType: 'image/png' });
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('Cập nhật');
    expect(res.body.result.rating).toBe(5);
    expect(res.body.result.comment).toBe('Mới');
    // Ảnh mới nối thêm vào ảnh cũ
    expect(res.body.result.imageUrls).toHaveLength(2);
    // Không tạo bản ghi thứ hai
    const count = await Feedback.countDocuments({ order_id: order._id, product_id: product._id });
    expect(count).toBe(1);
  });

  it('cập nhật qua nhánh existing nhưng không gửi comment -> giữ comment cũ', async () => {
    const { user, product, order } = await setupOwnOrder();
    await Feedback.create({
      user_id: user._id, order_id: order._id, product_id: product._id, rating: 2, comment: 'Giữ nguyên'
    });
    const res = await request(app)
      .post('/api/feedbacks')
      .set(authHeader(user))
      .send({ order_id: order._id, product_id: product._id, rating: 4 });
    expect(res.status).toBe(200);
    expect(res.body.result.comment).toBe('Giữ nguyên');
  });

  it('rating ngoài khoảng 1-5 -> lỗi validation của model (500 qua errorHandler)', async () => {
    const { user, product, order } = await setupOwnOrder();
    const res = await request(app)
      .post('/api/feedbacks')
      .set(authHeader(user))
      .send({ order_id: order._id, product_id: product._id, rating: 6 });
    expect(res.status).toBeGreaterThanOrEqual(400);
    const count = await Feedback.countDocuments({ order_id: order._id });
    expect(count).toBe(0);
  });

  it('rating biên: 1 và 5 đều hợp lệ', async () => {
    const a = await setupOwnOrder();
    const res1 = await request(app)
      .post('/api/feedbacks')
      .set(authHeader(a.user))
      .send({ order_id: a.order._id, product_id: a.product._id, rating: 1 });
    expect(res1.status).toBe(201);

    const b = await setupOwnOrder();
    const res5 = await request(app)
      .post('/api/feedbacks')
      .set(authHeader(b.user))
      .send({ order_id: b.order._id, product_id: b.product._id, rating: 5 });
    expect(res5.status).toBe(201);
  });
});

describe('GET /api/feedbacks/me', () => {
  it('không đăng nhập -> 401', async () => {
    const res = await request(app).get('/api/feedbacks/me');
    expect(res.status).toBe(401);
  });

  it('trả về danh sách feedback của riêng tôi, map đủ field', async () => {
    const { user, product, order } = await setupOwnOrder();
    await Feedback.create({
      user_id: user._id, order_id: order._id, product_id: product._id,
      rating: 5, comment: 'Của tôi', images: ['/uploads/a.png']
    });
    // Feedback của người khác không được trả về
    const other = await setupOwnOrder();
    await Feedback.create({
      user_id: other.user._id, order_id: other.order._id, product_id: other.product._id, rating: 1
    });

    const res = await request(app).get('/api/feedbacks/me').set(authHeader(user));
    expect(res.status).toBe(200);
    expect(res.body.result).toHaveLength(1);
    expect(res.body.result[0].comment).toBe('Của tôi');
    expect(res.body.result[0].feedbackId).toBeTruthy();
    expect(res.body.result[0].imageUrls).toEqual(['/uploads/a.png']);
    // populate product -> orderId map từ ObjectId, productId map từ object đã populate
    expect(res.body.result[0].orderId).toBe(order._id.toString());
    expect(res.body.result[0].productId).toBe(product._id.toString());
  });

  it('chưa có feedback nào -> mảng rỗng', async () => {
    const user = await createCustomer();
    const res = await request(app).get('/api/feedbacks/me').set(authHeader(user));
    expect(res.status).toBe(200);
    expect(res.body.result).toEqual([]);
  });
});

describe('GET /api/feedbacks/product/:productId (public)', () => {
  it('trả về feedback của sản phẩm, không cần đăng nhập', async () => {
    const { user, product, order } = await setupOwnOrder();
    await Feedback.create({
      user_id: user._id, order_id: order._id, product_id: product._id, rating: 4, comment: 'Public'
    });
    const res = await request(app).get(`/api/feedbacks/product/${product._id}`);
    expect(res.status).toBe(200);
    expect(res.body.result).toHaveLength(1);
    // populate thông tin user hiển thị công khai
    expect(res.body.result[0].user_id).toHaveProperty('first_name');
  });

  it('sản phẩm chưa có đánh giá -> mảng rỗng', async () => {
    const product = await createProduct();
    const res = await request(app).get(`/api/feedbacks/product/${product._id}`);
    expect(res.status).toBe(200);
    expect(res.body.result).toEqual([]);
  });
});

describe('GET /api/feedbacks/order/:orderId', () => {
  it('trả về feedback theo đơn hàng của tôi', async () => {
    const { user, product, order } = await setupOwnOrder();
    await Feedback.create({
      user_id: user._id, order_id: order._id, product_id: product._id, rating: 3
    });
    const res = await request(app)
      .get(`/api/feedbacks/order/${order._id}`)
      .set(authHeader(user));
    expect(res.status).toBe(200);
    expect(res.body.result).toHaveLength(1);
  });

  it('đơn của người khác -> mảng rỗng (filter theo user_id)', async () => {
    const { user, product, order } = await setupOwnOrder();
    await Feedback.create({
      user_id: user._id, order_id: order._id, product_id: product._id, rating: 3
    });
    const stranger = await createCustomer();
    const res = await request(app)
      .get(`/api/feedbacks/order/${order._id}`)
      .set(authHeader(stranger));
    expect(res.status).toBe(200);
    expect(res.body.result).toEqual([]);
  });
});

describe('GET /api/feedbacks/:feedbackId', () => {
  it('lấy chi tiết feedback -> 200', async () => {
    const { user, product, order } = await setupOwnOrder();
    const fb = await Feedback.create({
      user_id: user._id, order_id: order._id, product_id: product._id, rating: 5
    });
    const res = await request(app)
      .get(`/api/feedbacks/${fb._id}`)
      .set(authHeader(user));
    expect(res.status).toBe(200);
    expect(res.body.result._id).toBe(fb._id.toString());
  });

  it('feedback không tồn tại -> 404', async () => {
    const user = await createCustomer();
    const res = await request(app)
      .get('/api/feedbacks/64b7f0000000000000000000')
      .set(authHeader(user));
    expect(res.status).toBe(404);
    expect(res.body.error_code).toBe('NOT_FOUND');
  });
});

describe('PUT /api/feedbacks/:feedbackId', () => {
  it('cập nhật rating + comment -> 200', async () => {
    const { user, product, order } = await setupOwnOrder();
    const fb = await Feedback.create({
      user_id: user._id, order_id: order._id, product_id: product._id, rating: 2, comment: 'Cũ'
    });
    const res = await request(app)
      .put(`/api/feedbacks/${fb._id}`)
      .set(authHeader(user))
      .send({ rating: 4, comment: 'Đã sửa' });
    expect(res.status).toBe(200);
    expect(res.body.result.rating).toBe(4);
    expect(res.body.result.comment).toBe('Đã sửa');
  });

  it('cập nhật qua field feedback JSON string + thêm ảnh -> 200', async () => {
    const { user, product, order } = await setupOwnOrder();
    const fb = await Feedback.create({
      user_id: user._id, order_id: order._id, product_id: product._id,
      rating: 2, images: ['/uploads/old.png']
    });
    const res = await request(app)
      .put(`/api/feedbacks/${fb._id}`)
      .set(authHeader(user))
      .field('feedback', JSON.stringify({ rating: 5, comment: 'JSON update' }))
      .attach('images', PNG, { filename: 'more.png', contentType: 'image/png' });
    expect(res.status).toBe(200);
    expect(res.body.result.rating).toBe(5);
    expect(res.body.result.comment).toBe('JSON update');
    expect(res.body.result.images).toHaveLength(2);
  });

  it('field feedback JSON hỏng -> bỏ qua, vẫn cập nhật bằng field thường', async () => {
    const { user, product, order } = await setupOwnOrder();
    const fb = await Feedback.create({
      user_id: user._id, order_id: order._id, product_id: product._id, rating: 2
    });
    const res = await request(app)
      .put(`/api/feedbacks/${fb._id}`)
      .set(authHeader(user))
      .field('feedback', '{hỏng')
      .field('rating', '3');
    expect(res.status).toBe(200);
    expect(res.body.result.rating).toBe(3);
  });

  it('chỉ gửi comment (không rating) -> giữ rating cũ', async () => {
    const { user, product, order } = await setupOwnOrder();
    const fb = await Feedback.create({
      user_id: user._id, order_id: order._id, product_id: product._id, rating: 2
    });
    const res = await request(app)
      .put(`/api/feedbacks/${fb._id}`)
      .set(authHeader(user))
      .send({ comment: 'Chỉ sửa comment' });
    expect(res.status).toBe(200);
    expect(res.body.result.rating).toBe(2);
    expect(res.body.result.comment).toBe('Chỉ sửa comment');
  });

  it('sửa feedback của người khác -> 404', async () => {
    const { user, product, order } = await setupOwnOrder();
    const fb = await Feedback.create({
      user_id: user._id, order_id: order._id, product_id: product._id, rating: 2
    });
    const stranger = await createCustomer();
    const res = await request(app)
      .put(`/api/feedbacks/${fb._id}`)
      .set(authHeader(stranger))
      .send({ rating: 1 });
    expect(res.status).toBe(404);
  });

  it('feedback không tồn tại -> 404', async () => {
    const user = await createCustomer();
    const res = await request(app)
      .put('/api/feedbacks/64b7f0000000000000000000')
      .set(authHeader(user))
      .send({ rating: 1 });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/feedbacks/:feedbackId', () => {
  it('xóa feedback của mình -> 200 + xóa khỏi DB', async () => {
    const { user, product, order } = await setupOwnOrder();
    const fb = await Feedback.create({
      user_id: user._id, order_id: order._id, product_id: product._id, rating: 2
    });
    const res = await request(app)
      .delete(`/api/feedbacks/${fb._id}`)
      .set(authHeader(user));
    expect(res.status).toBe(200);
    expect(await Feedback.findById(fb._id)).toBeNull();
  });

  it('xóa feedback của người khác -> 404, không bị xóa', async () => {
    const { user, product, order } = await setupOwnOrder();
    const fb = await Feedback.create({
      user_id: user._id, order_id: order._id, product_id: product._id, rating: 2
    });
    const stranger = await createCustomer();
    const res = await request(app)
      .delete(`/api/feedbacks/${fb._id}`)
      .set(authHeader(stranger));
    expect(res.status).toBe(404);
    expect(await Feedback.findById(fb._id)).not.toBeNull();
  });

  it('feedback không tồn tại -> 404', async () => {
    const user = await createCustomer();
    const res = await request(app)
      .delete('/api/feedbacks/64b7f0000000000000000000')
      .set(authHeader(user));
    expect(res.status).toBe(404);
  });
});
