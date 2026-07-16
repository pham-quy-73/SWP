import Product from '../models/Product.js';
import ProductVariant from '../models/ProductVariant.js';

/**
 * Lỗi định giá (giống OrderValidationError): mang theo status + body để controller
 * trả đúng mã HTTP thay vì để errorHandler nuốt.
 */
export class PricingError extends Error {
  constructor(status, body) {
    super(body.message);
    this.status = status;
    this.body = body;
  }
}

// Ưu tiên discountPrice > 0, ngược lại dùng price gốc.
const pickPrice = (price, discountPrice) =>
  (discountPrice != null && discountPrice > 0) ? discountPrice : price;

/**
 * [NGUỒN GIÁ DUY NHẤT] Tính giá một item theo giá DB, tuyệt đối không tin giá client.
 * Dùng chung cho cả getPaymentRequirement (báo giá lúc checkout) và createOrder
 * (tính tiền thật) để hai luồng không lệch nhau.
 *
 * @param {Object} item  - { variantId | productVariantId | productId, lensId?, quantity }
 * @param {Object|null} session - Mongoose session (khi gọi trong transaction của createOrder)
 * @returns {{ variant, basePrice, lensPrice, finalUnitPrice }}
 */
export async function priceOrderItem(item, session = null) {
  // Chấp nhận mọi tên trường ID biến thể mà Frontend có thể gửi.
  const targetVariantId = item.variantId || item.productVariantId || item.productId;

  let variantQuery = ProductVariant.findById(targetVariantId).populate('productId');
  if (session) variantQuery = variantQuery.session(session);
  let variant = await variantQuery;

  if (!variant) {
    // Fallback: Tìm biến thể hoạt động đầu tiên của sản phẩm này (nếu targetVariantId thực chất là Product ID)
    let fallbackQuery = ProductVariant.findOne({ productId: targetVariantId, status: 'ACTIVE' }).populate('productId');
    if (session) fallbackQuery = fallbackQuery.session(session);
    variant = await fallbackQuery;
  }

  if (!variant) {
    throw new PricingError(400, {
      error_code: 'VARIANT_NOT_FOUND',
      message: `Không tìm thấy biến thể với ID: ${targetVariantId}`
    });
  }

  // Giá gọng lấy từ variant DB.
  const basePrice = pickPrice(variant.price, variant.discountPrice);

  // Giá tròng: chỉ tính khi có lensId, tra Product (category='LENS', đang bán).
  let lensPrice = 0;
  if (item.lensId) {
    let lensQuery = Product.findById(item.lensId);
    if (session) lensQuery = lensQuery.session(session);
    const lens = await lensQuery;
    if (!lens || lens.category !== 'LENS' || lens.status !== 'ACTIVE') {
      throw new PricingError(400, {
        error_code: 'INVALID_LENS',
        message: `Tròng kính không hợp lệ hoặc đã ngưng bán (ID: ${item.lensId}).`
      });
    }
    lensPrice = pickPrice(lens.price, lens.discountPrice);
  }

  const finalUnitPrice = basePrice + lensPrice;
  return { variant, basePrice, lensPrice, finalUnitPrice };
}
