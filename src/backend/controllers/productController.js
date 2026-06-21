import crypto from 'crypto';
import mongoose from 'mongoose';
import productService from '../services/productService.js';
import { createProductSchema, updateProductSchema } from '../validators/productValidator.js';

const makeError = (res, status, error_code, message) => {
  return res.status(status).json({
    success: false,
    error_code,
    message,
    request_id: crypto.randomUUID()
  });
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const getProducts = async (req, res) => {
  try {
    const { page, limit, search, minPrice, maxPrice } = req.query;
    const result = await productService.getAllProducts({ page, limit, search, minPrice, maxPrice });
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return makeError(res, 500, 'SERVER_ERROR', 'Lỗi khi lấy danh sách sản phẩm');
  }
};

export const getProductById = async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return makeError(res, 400, 'INVALID_ID', 'ID sản phẩm không hợp lệ');
  }
  try {
    const product = await productService.getProductById(id);
    if (!product) return makeError(res, 404, 'NOT_FOUND', 'Sản phẩm không tồn tại hoặc đã bị xóa');
    return res.status(200).json({ success: true, data: product });
  } catch (err) {
    return makeError(res, 500, 'SERVER_ERROR', 'Lỗi khi lấy thông tin sản phẩm');
  }
};

export const createProduct = async (req, res) => {
  const { error, value } = createProductSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return makeError(res, 400, 'VALIDATION_ERROR', error.details.map((d) => d.message).join('; '));
  }
  if (!req.file) {
    return makeError(res, 400, 'VALIDATION_ERROR', 'Ảnh sản phẩm là bắt buộc');
  }
  try {
    const product = await productService.createProduct(value, req.file.buffer);
    return res.status(201).json({ success: true, data: product });
  } catch (err) {
    return makeError(res, 500, 'SERVER_ERROR', 'Lỗi khi tạo sản phẩm');
  }
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return makeError(res, 400, 'INVALID_ID', 'ID sản phẩm không hợp lệ');
  }
  const { error, value } = updateProductSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return makeError(res, 400, 'VALIDATION_ERROR', error.details.map((d) => d.message).join('; '));
  }
  try {
    const fileBuffer = req.file ? req.file.buffer : null;
    const product = await productService.updateProduct(id, value, fileBuffer);
    if (!product) return makeError(res, 404, 'NOT_FOUND', 'Sản phẩm không tồn tại hoặc đã bị xóa');
    return res.status(200).json({ success: true, data: product });
  } catch (err) {
    return makeError(res, 500, 'SERVER_ERROR', 'Lỗi khi cập nhật sản phẩm');
  }
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return makeError(res, 400, 'INVALID_ID', 'ID sản phẩm không hợp lệ');
  }
  try {
    const product = await productService.softDeleteProduct(id);
    if (!product) return makeError(res, 404, 'NOT_FOUND', 'Sản phẩm không tồn tại hoặc đã bị xóa');
    return res.status(200).json({ success: true, message: 'Xóa sản phẩm thành công' });
  } catch (err) {
    return makeError(res, 500, 'SERVER_ERROR', 'Lỗi khi xóa sản phẩm');
  }
};
