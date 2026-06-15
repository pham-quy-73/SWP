import Product from '../models/Product.js'

export const getProducts = async (filters) => {
  // Nhận các tham số tìm kiếm theo đúng API document
  const { page = 1, limit = 10, search, brand, minPrice, maxPrice } = filters
  
  // LUẬT DATA-01: Luôn luôn chỉ lấy các sản phẩm chưa bị xóa mềm
  const query = { deleted_at: null } 

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } }
    ]
  }
  
  if (brand) {
    query.brand = brand
  }
  
  if (minPrice || maxPrice) {
    query.price = {}
    if (minPrice) query.price.$gte = Number(minPrice)
    if (maxPrice) query.price.$lte = Number(maxPrice)
  }

  const skip = (page - 1) * limit
  
  // Thực thi truy vấn song song để lấy dữ liệu và tổng số đếm (tối ưu tốc độ)
  const [items, total] = await Promise.all([
    Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Product.countDocuments(query)
  ])

  return { 
    items, 
    total, 
    page: Number(page), 
    limit: Number(limit) 
  }
}

export const getProductById = async (id) => {
  // Chỉ lấy chi tiết sản phẩm nếu nó chưa bị xóa mềm
  return await Product.findOne({ _id: id, deleted_at: null })
}

export const createProduct = async (data) => {
  return await Product.create(data)
}

export const updateProduct = async (id, data) => {
  return await Product.findOneAndUpdate({ _id: id, deleted_at: null }, data, { new: true })
}

export const softDeleteProduct = async (id) => {
  // LUẬT DATA-01: Đánh dấu thời gian xóa thay vì xóa vĩnh viễn
  return await Product.findOneAndUpdate({ _id: id }, { deleted_at: new Date() }, { new: true })
}