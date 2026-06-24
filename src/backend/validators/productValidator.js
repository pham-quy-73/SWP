import Joi from 'joi';

export const createProductSchema = Joi.object({
  name: Joi.string().trim().min(1).required().messages({
    'string.empty': 'Tên sản phẩm không được để trống',
    'any.required': 'Tên sản phẩm là bắt buộc'
  }),
  brand: Joi.string().trim().min(1).required().messages({
    'string.empty': 'Thương hiệu không được để trống',
    'any.required': 'Thương hiệu là bắt buộc'
  }),
  price: Joi.number().min(0).required().messages({
    'number.base': 'Giá phải là số',
    'number.min': 'Giá không được nhỏ hơn 0',
    'any.required': 'Giá là bắt buộc'
  }),
  stock_quantity: Joi.number().integer().min(0).required().messages({
    'number.base': 'Số lượng tồn kho phải là số',
    'number.integer': 'Số lượng tồn kho phải là số nguyên',
    'number.min': 'Số lượng tồn kho không được nhỏ hơn 0',
    'any.required': 'Số lượng tồn kho là bắt buộc'
  }),
  description: Joi.string().allow('', null).optional()
});

export const updateProductSchema = Joi.object({
  name: Joi.string().trim().min(1).optional().messages({
    'string.empty': 'Tên sản phẩm không được để trống'
  }),
  brand: Joi.string().trim().min(1).optional().messages({
    'string.empty': 'Thương hiệu không được để trống'
  }),
  price: Joi.number().min(0).optional().messages({
    'number.base': 'Giá phải là số',
    'number.min': 'Giá không được nhỏ hơn 0'
  }),
  stock_quantity: Joi.number().integer().min(0).optional().messages({
    'number.base': 'Số lượng tồn kho phải là số',
    'number.integer': 'Số lượng tồn kho phải là số nguyên',
    'number.min': 'Số lượng tồn kho không được nhỏ hơn 0'
  }),
  description: Joi.string().allow('', null).optional()
});
// Không dùng `.min(1)`: PUT có thể chỉ kèm ảnh mới (không sửa field text nào) nên body rỗng vẫn
// hợp lệ. Trường hợp rỗng hoàn toàn (không field lẫn ảnh) được kiểm ở controller vì Joi không
// thấy được req.file.

// Validate query của GET /api/products: page/limit là số nguyên dương, minPrice/maxPrice là số ≥ 0,
// và minPrice ≤ maxPrice. Joi tự ép chuỗi query sang số (convert: true).
export const listQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  search: Joi.string().trim().allow('').optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional()
})
  .custom((value, helpers) => {
    if (value.minPrice !== undefined && value.maxPrice !== undefined && value.minPrice > value.maxPrice) {
      return helpers.error('any.invalid');
    }
    return value;
  })
  .messages({
    'any.invalid': 'minPrice không được lớn hơn maxPrice',
    'number.base': 'Tham số lọc phải là số',
    'number.min': 'Tham số lọc không hợp lệ (phải ≥ 0)',
    'number.integer': 'page/limit phải là số nguyên',
    'number.max': 'limit tối đa là 100'
  });
