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
}).min(1).messages({
  'object.min': 'Cần ít nhất một trường để cập nhật'
});
