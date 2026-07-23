/**
 * CLIENT_URL có thể chứa NHIỀU origin phân tách bằng dấu phẩy — dùng cho cấu
 * hình CORS (chấp nhận nhiều domain: local + production). Nhưng khi build URL
 * redirect (VNPay callback, verify email...) ta chỉ được dùng MỘT origin, nếu
 * không sẽ tạo ra URL sai kiểu "http://a,https://b/checkout/success".
 *
 * Helper này trả về origin ĐẦU TIÊN đã trim để dùng làm base cho redirect.
 */
export function getClientBaseUrl() {
  const raw = process.env.CLIENT_URL;
  if (!raw) return 'http://localhost:5173';
  const first = raw.split(',')[0].trim();
  return first || 'http://localhost:5173';
}

/**
 * Danh sách origin cho CORS (mảng đã trim, bỏ phần tử rỗng).
 * Trả về origin mặc định nếu CLIENT_URL chưa cấu hình.
 */
export function getCorsOrigins() {
  const raw = process.env.CLIENT_URL;
  if (!raw) return ['http://localhost:5173'];
  const origins = raw.split(',').map(o => o.trim()).filter(Boolean);
  return origins.length ? origins : ['http://localhost:5173'];
}
