import { z } from 'zod';
import * as ProductService from '../services/ProductService.js';

// Định nghĩa bộ quy tắc kiểm duyệt dữ liệu (Validation Schema) bằng Zod
const productValidationSchema = z.object({
  name: z.string().min(1, 'Tên sản phẩm không được để trống'),
  brand: z.string().min(1, 'Thương hiệu không được để trống'),
  price: z.number().min(0, 'Giá sản phẩm phải lớn hơn hoặc bằng 0'),
  image: z.string().optional(),
  stock_quantity: z.number().int().min(0, 'Số lượng tồn kho phải là số nguyên dương'),
  description: z.string().optional()
});

export const getAllProducts = async (req, res, next) => {
  try {
    const result = await ProductService.getProducts(req.query);
    // Trả về dữ liệu thành công theo đúng định dạng API
    res.status(200).json(result);
  } catch (error) {
    // Đẩy lỗi hệ thống xuống middleware xử lý lỗi tập trung
    next(error); 
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const product = await ProductService.getProductById(req.params.id);
    if (!product) {
      // Bắt buộc format lỗi { success, error_code, message }
      return res.status(404).json({
        success: false,
        error_code: 'PRODUCT_NOT_FOUND',
        message: 'Không tìm thấy sản phẩm'
      });
    }
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    // Xác thực dữ liệu đầu vào. Nếu sai, nó sẽ văng lỗi (throw error) xuống catch
    const validatedData = productValidationSchema.parse(req.body);
    const newProduct = await ProductService.createProduct(validatedData);
    
    res.status(201).json(newProduct);
  } catch (error) {
    // Bắt riêng lỗi của Zod để trả về 400 Bad Request cho Frontend biết họ gửi sai cái gì
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error_code: 'VALIDATION_ERROR',
        message: error.errors.map(e => e.message).join(', ')
      });
    }
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    // Dùng .partial() vì khi update, Frontend có thể chỉ gửi 1-2 trường (ví dụ chỉ update giá)
    const validatedData = productValidationSchema.partial().parse(req.body);
    const updatedProduct = await ProductService.updateProduct(req.params.id, validatedData);
    
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        error_code: 'PRODUCT_NOT_FOUND',
        message: 'Không tìm thấy sản phẩm hoặc sản phẩm đã bị xóa'
      });
    }
    res.status(200).json(updatedProduct);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error_code: 'VALIDATION_ERROR',
        message: error.errors.map(e => e.message).join(', ')
      });
    }
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const deletedProduct = await ProductService.softDeleteProduct(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        error_code: 'PRODUCT_NOT_FOUND',
        message: 'Không tìm thấy sản phẩm'
      });
    }
    res.status(200).json({ message: 'Đã xóa sản phẩm' });
  } catch (error) {
    next(error);
  }
};