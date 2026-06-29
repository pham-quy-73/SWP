import Product from '../models/Product.js';

class ProductController {

  async getProducts(req, res, next) {
    try {
      const {
        page = 1, limit = 10, search, category, brand, gender, shape,
        frameMaterial, frameType, minPrice, maxPrice, status,
        isManager // Thêm cờ này để phân biệt Admin gọi hay Khách hàng gọi
      } = req.query;

      const query = {};

      // 1. Lọc theo trạng thái
      if (status === 'ALL') {
        // Quản lý xem tất cả
      } else if (status) {
        query.status = status;
      } else {
        query.status = 'ACTIVE'; // Khách hàng mặc định chỉ thấy hàng ACTIVE
      }

      // 2. LOGIC QUAN TRỌNG: ẨN TRÒNG KÍNH (LENS) KHỎI DANH MỤC CHUNG
      if (category) {
        query.category = category; // Nếu chỉ đích danh lấy category nào thì lấy category đó (VD: popup chọn tròng sẽ gọi API với category=LENS)
      } else {
        // Nếu không truyền category (Trang chủ gọi): 
        // - Quản lý (Manager) thì thấy tất cả.
        // - Khách hàng (Customer) thì ẨN 'LENS' đi.
        if (!isManager || isManager === 'false') {
          query.category = { $ne: 'LENS' };
        }
      }

      // 3. Các bộ lọc khác giữ nguyên
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { brand: { $regex: search, $options: 'i' } }
        ];
      }
      if (brand) query.brand = { $regex: brand, $options: 'i' };
      if (gender) query.gender = gender.toUpperCase();
      if (shape) query.shape = { $regex: shape, $options: 'i' };
      if (frameMaterial) query.frameMaterial = { $regex: frameMaterial, $options: 'i' };
      if (frameType) query.frameType = frameType;

      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
      }

      const skip = (Number(page) - 1) * Number(limit);
      const totalElements = await Product.countDocuments(query);
      const totalPages = Math.ceil(totalElements / Number(limit));

      const items = await Product.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 });

      res.status(200).json({
        code: 0,
        result: { items, page: Number(page) - 1, size: items.length, totalElements, totalPages }
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductById(req, res, next) {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
      res.status(200).json(product);
    } catch (error) {
      next(error);
    }
  }

  async createProduct(req, res, next) {
    try {
      let productData = req.body;
      if (req.body.product && typeof req.body.product === 'string') {
        productData = JSON.parse(req.body.product);
      }

      if (!productData.name || !productData.brand || productData.price === undefined) {
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc: Name, Brand hoặc Price!' });
      }

      if (productData.imageUrl && Array.isArray(productData.imageUrl)) {
        productData.imageUrl = productData.imageUrl.map(img => (typeof img === 'string' ? { imageUrl: img } : img));
      } else {
        productData.imageUrl = [];
      }

      if (req.files && req.files.length > 0) {
        const imageUrls = req.files.map(file => ({
          imageUrl: `/${(file.path || file.filename).replace(/\\/g, '/')}`
        }));
        productData.imageUrl = [...productData.imageUrl, ...imageUrls];
      } else if (productData.imageUrl.length === 0) {
        productData.imageUrl = [{ imageUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=800' }];
      }

      if (productData.price !== undefined) productData.price = Number(productData.price);
      if (productData.discountPrice !== undefined) productData.discountPrice = Number(productData.discountPrice);
      if (productData.weightGram !== undefined) productData.weightGram = Number(productData.weightGram);

      // Nâng cấp: Đã gỡ bỏ logic liên quan đến stock_quantity tại đây

      const product = new Product(productData);
      await product.save();

      res.status(201).json({ code: 0, result: product });
    } catch (error) {
      console.error("Lỗi tại createProduct:", error);
      res.status(500).json({ message: 'Lỗi server khi tạo sản phẩm', details: error.message });
    }
  }

  async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      let updateData = req.body;

      if (req.body.product && typeof req.body.product === 'string') {
        updateData = JSON.parse(req.body.product);
      }

      if (updateData.imageUrl && Array.isArray(updateData.imageUrl)) {
        updateData.imageUrl = updateData.imageUrl.map(img => (typeof img === 'string' ? { imageUrl: img } : img));
      } else {
        updateData.imageUrl = [];
      }

      if (req.files && req.files.length > 0) {
        const newImageUrls = req.files.map(file => ({
          imageUrl: `/${(file.path || file.filename).replace(/\\/g, '/')}`
        }));
        updateData.imageUrl = [...updateData.imageUrl, ...newImageUrls];
      }

      if (updateData.price !== undefined) updateData.price = Number(updateData.price);
      if (updateData.discountPrice !== undefined) updateData.discountPrice = Number(updateData.discountPrice);
      if (updateData.weightGram !== undefined) updateData.weightGram = Number(updateData.weightGram);

      // Nâng cấp: Đã gỡ bỏ logic liên quan đến stock_quantity tại đây

      const product = await Product.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
      if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

      res.status(200).json({ code: 0, result: product });
    } catch (error) {
      console.error("Lỗi tại updateProduct:", error);
      res.status(500).json({ message: 'Lỗi server khi cập nhật sản phẩm', details: error.message });
    }
  }

  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      const product = await Product.findByIdAndDelete(id);
      if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
      res.status(200).json({ code: 0, message: 'Xóa sản phẩm thành công' });
    } catch (error) {
      next(error);
    }
  }
}

export default new ProductController();