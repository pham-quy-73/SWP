import mongoose from 'mongoose';
import productService from '../services/productService.js';
import { httpError } from '../middlewares/errorMiddleware.js';
import { createProductSchema, updateProductSchema, listQuerySchema } from '../validators/productValidator.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Chỉ SALE/ADMIN được xem stock_quantity thực tế.
// TODO: TẠM TẮT PHÂN QUYỀN XEM TỒN KHO ĐỂ TEST — nhớ mở lại dòng gốc trước khi commit/deploy
const isPrivilegedViewer = (_user) => true;
// const isPrivilegedViewer = (user) => Boolean(user) && ['SALE', 'ADMIN'].includes(user.role);

// Chuẩn hóa product trả ra theo quyền xem:
// - SALE/ADMIN: giữ stock_quantity thực + thêm cờ in_stock.
// - CUSTOMER/ẩn danh: ẩn stock_quantity, chỉ trả cờ in_stock cho UI còn/hết hàng.
const presentProduct = (doc, privileged) => {
  const obj = doc?.toObject ? doc.toObject() : { ...doc };
  const in_stock = (obj.stock_quantity ?? 0) > 0;
  if (!privileged) delete obj.stock_quantity;
  return { ...obj, in_stock };
};

export const getProducts = async (req, res, next) => {
  const { error, value } = listQuerySchema.validate(req.query, { abortEarly: false, convert: true });
  if (error) {
    return next(httpError(400, 'VALIDATION_ERROR', error.details.map((d) => d.message).join('; ')));
  }
  try {
    const privileged = isPrivilegedViewer(req.user);
    const result = await productService.getAllProducts(value);
    return res.status(200).json({
      success: true,
      products: result.products.map((p) => presentProduct(p, privileged)),
      pagination: result.pagination
    });
  } catch (err) {
    return next(httpError(500, 'SERVER_ERROR', 'Lỗi khi lấy danh sách sản phẩm'));
  }
};

export const getProductById = async (req, res, next) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return next(httpError(400, 'INVALID_ID', 'ID sản phẩm không hợp lệ'));
  }
  try {
    const product = await productService.getProductById(id);
    if (!product) return next(httpError(404, 'NOT_FOUND', 'Sản phẩm không tồn tại hoặc đã bị xóa'));
    return res.status(200).json({ success: true, data: presentProduct(product, isPrivilegedViewer(req.user)) });
  } catch (err) {
    return next(httpError(500, 'SERVER_ERROR', 'Lỗi khi lấy thông tin sản phẩm'));
  }
};

export const createProduct = async (req, res, next) => {
  const { error, value } = createProductSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return next(httpError(400, 'VALIDATION_ERROR', error.details.map((d) => d.message).join('; ')));
  }
  if (!req.file) {
    return next(httpError(400, 'VALIDATION_ERROR', 'Ảnh sản phẩm là bắt buộc'));
  }
  try {
    const product = await productService.createProduct(value, req.file.buffer);
    return res.status(201).json({ success: true, data: product });
  } catch (err) {
    return next(httpError(500, 'SERVER_ERROR', 'Lỗi khi tạo sản phẩm'));
  }
};

export const updateProduct = async (req, res, next) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return next(httpError(400, 'INVALID_ID', 'ID sản phẩm không hợp lệ'));
  }
  const { error, value } = updateProductSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return next(httpError(400, 'VALIDATION_ERROR', error.details.map((d) => d.message).join('; ')));
  }
  // PUT hợp lệ phải có ít nhất 1 trường text hoặc 1 ảnh mới
  if (Object.keys(value).length === 0 && !req.file) {
    return next(httpError(400, 'VALIDATION_ERROR', 'Cần ít nhất một trường hoặc ảnh mới để cập nhật'));
  }
  try {
    const fileBuffer = req.file ? req.file.buffer : null;
    const product = await productService.updateProduct(id, value, fileBuffer);
    if (!product) return next(httpError(404, 'NOT_FOUND', 'Sản phẩm không tồn tại hoặc đã bị xóa'));
    return res.status(200).json({ success: true, data: product });
  } catch (err) {
    return next(httpError(500, 'SERVER_ERROR', 'Lỗi khi cập nhật sản phẩm'));
  }
};

export const deleteProduct = async (req, res, next) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return next(httpError(400, 'INVALID_ID', 'ID sản phẩm không hợp lệ'));
  }
  try {
    const product = await productService.softDeleteProduct(id);
    if (!product) return next(httpError(404, 'NOT_FOUND', 'Sản phẩm không tồn tại hoặc đã bị xóa'));
    return res.status(200).json({ success: true, message: 'Xóa sản phẩm thành công' });
  } catch (err) {
    return next(httpError(500, 'SERVER_ERROR', 'Lỗi khi xóa sản phẩm'));
  }
};
