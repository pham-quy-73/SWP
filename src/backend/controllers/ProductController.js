import Product from '../models/Product.js';

/**
 * Controller xử lý các nghiệp vụ liên quan đến Sản phẩm
 */
class ProductController {
  /**
   * Lấy danh sách sản phẩm có bộ lọc (Filter), tìm kiếm (Search) và phân trang (Pagination)
   * dựa trực tiếp trên các trường của ProductSchema.
   */
  async getProducts(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        category,
        brand,
        gender,
        shape,
        frameMaterial,
        frameType,
        minPrice,
        maxPrice,
        status = 'ACTIVE'
      } = req.query;

      // Xây dựng đối tượng truy vấn (query filter)
      const query = {};

      // Chỉ hiển thị sản phẩm theo status
      if (status) {
        query.status = status;
      }

      // Tìm kiếm theo tên sản phẩm hoặc thương hiệu (Không phân biệt hoa thường)
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { brand: { $regex: search, $options: 'i' } }
        ];
      }

      // Lọc chính xác theo Category (enum: FRAME, SUNGLASSES, ACCESSORIES)
      if (category) {
        query.category = category;
      }

      // Lọc theo Brand
      if (brand) {
        query.brand = { $regex: brand, $options: 'i' };
      }

      // Lọc theo giới tính (enum: MALE, FEMALE, UNISEX)
      if (gender) {
        query.gender = gender.toUpperCase();
      }

      // Lọc theo kiểu dáng mắt kính (Ví dụ: Round, Square, Cat-Eye)
      if (shape) {
        query.shape = { $regex: shape, $options: 'i' };
      }

      // Lọc theo chất liệu gọng kính
      if (frameMaterial) {
        query.frameMaterial = { $regex: frameMaterial, $options: 'i' };
      }

      // Lọc theo viền kính (enum: Full-Rim, Semi-Rimless, Rimless, Other)
      if (frameType) {
        query.frameType = frameType;
      }

      // Lọc theo khoảng giá (price hoặc discountPrice nếu có)
      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
      }

      // Thực thi phân trang
      const skip = (Number(page) - 1) * Number(limit);
      const totalElements = await Product.countDocuments(query);
      const totalPages = Math.ceil(totalElements / Number(limit));

      const items = await Product.find(query)
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }); // Mới nhất lên đầu

      res.status(200).json({
        code: 0,
        result: {
          items,
          page: Number(page) - 1,
          size: items.length,
          totalElements,
          totalPages
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy chi tiết một sản phẩm theo ID
   */
  async getProductById(req, res, next) {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
      }
      res.status(200).json(product);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Tạo mới một sản phẩm (dành cho quản lý)
   */
  async createProduct(req, res, next) {
    try {
      let productData = req.body;
      if (req.body.product && typeof req.body.product === 'string') {
        productData = JSON.parse(req.body.product);
      }

      // Xử lý files ảnh nếu có upload
      if (req.files && req.files.length > 0) {
        const imageUrls = req.files.map(file => ({
          imageUrl: `/${file.path || file.filename}`
        }));
        productData.imageUrl = imageUrls;
      } else if (!productData.imageUrl || (Array.isArray(productData.imageUrl) && productData.imageUrl.length === 0)) {
        // Fallback ảnh mặc định
        productData.imageUrl = [{ imageUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=800' }];
      }

      // Ép kiểu
      if (productData.weightGram) productData.weightGram = Number(productData.weightGram);
      if (productData.price) productData.price = Number(productData.price);
      if (productData.discountPrice) productData.discountPrice = Number(productData.discountPrice);
      if (productData.stock_quantity) productData.stock_quantity = Number(productData.stock_quantity);

      const product = new Product(productData);
      await product.save();

      res.status(201).json({
        code: 0,
        result: product
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cập nhật thông tin sản phẩm (dành cho quản lý)
   */
  async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      let updateData = req.body;

      if (req.body.product && typeof req.body.product === 'string') {
        updateData = JSON.parse(req.body.product);
      }

      if (req.files && req.files.length > 0) {
        const imageUrls = req.files.map(file => ({
          imageUrl: `/${file.path || file.filename}`
        }));
        updateData.imageUrl = imageUrls;
      }

      // Ép kiểu
      if (updateData.weightGram !== undefined) updateData.weightGram = Number(updateData.weightGram);
      if (updateData.price !== undefined) updateData.price = Number(updateData.price);
      if (updateData.discountPrice !== undefined) updateData.discountPrice = Number(updateData.discountPrice);
      if (updateData.stock_quantity !== undefined) updateData.stock_quantity = Number(updateData.stock_quantity);

      const product = await Product.findByIdAndUpdate(id, updateData, { new: true });
      if (!product) {
        return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
      }

      res.status(200).json({
        code: 0,
        result: product
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Xóa sản phẩm (dành cho quản lý)
   */
  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      const product = await Product.findByIdAndDelete(id);
      if (!product) {
        return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
      }
      res.status(200).json({
        code: 0,
        message: 'Xóa sản phẩm thành công'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ProductController();
