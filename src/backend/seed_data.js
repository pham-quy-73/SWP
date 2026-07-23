import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from './models/Product.js';
import ProductVariant from './models/ProductVariant.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Hàm chuyển đổi và làm sạch dữ liệu để khớp 100% với ProductSchema
const filterRawItemToSchema = (item) => {
  // Chuẩn hoá Category (Chỉ nhận FRAME hoặc SUNGLASSES — tròng kính là model
  // Lens riêng, seed bằng seed_lenses.js; category lạ fallback về FRAME)
  let category = 'FRAME';
  const rawCat = (item.category || '').toUpperCase();
  if (['FRAME', 'SUNGLASSES'].includes(rawCat)) {
    category = rawCat;
  }

  // Chuẩn hoá viền kính để khớp enum ['Full-Rim', 'Semi-Rimless', 'Rimless', 'Other']
  let frameType = 'Full-Rim';
  const rawType = (item.frameType || '').replace(/\s+/g, '-').trim(); // Đổi "Full Rim" thành "Full-Rim"
  if (['Full-Rim', 'Semi-Rimless', 'Rimless', 'Other'].includes(rawType)) {
    frameType = rawType;
  } else if (rawType === 'Half-Rim') {
    frameType = 'Semi-Rimless'; // Chuyển Half-Rim về Semi-Rimless
  } else if (rawType) {
    frameType = 'Other';
  }

  // Chuẩn hoá giới tính sang chữ Hoa và khớp enum
  let gender = 'UNISEX';
  const rawGender = (item.gender || '').toUpperCase();
  if (['MALE', 'FEMALE', 'UNISEX'].includes(rawGender)) {
    gender = rawGender;
  }

  return {
    name: item.name,
    brand: item.brand,
    price: item.minPrice || item.price || 0, // Dùng minPrice làm giá gốc
    discountPrice: (item.maxPrice > item.minPrice) ? item.minPrice : undefined, // Lấy giá ưu đãi nếu có chênh lệch
    imageUrl: (item.imageUrl || []).map(img => ({ imageUrl: img.imageUrl })), // Giữ cấu trúc imageUrl của ImageSchema
    description: `Kính thời trang thương hiệu ${item.brand} dòng ${item.name} chính hãng chất lượng cao. Sản xuất bằng chất liệu ${item.frameMaterial || 'cao cấp'}, dáng kính ${item.shape || 'thời thượng'}, thích hợp đeo hàng ngày.`,
    category,
    frameType,
    gender,
    shape: item.shape || '',
    frameMaterial: item.frameMaterial || '',
    hingeType: item.hingeType || 'Standard',
    nosePadType: item.nosePadType || 'Fixed',
    weightGram: item.weightGram || 0,
    status: item.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'
  };
};

const seedProducts = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/SWP';
    console.log(`Connecting to database to seed...`);
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected Successfully.');

    // Xoá dữ liệu cũ
    console.log('Clearing existing product variants...');
    await ProductVariant.deleteMany({});
    console.log('Existing product variants cleared.');

    console.log('Clearing existing products...');
    await Product.deleteMany({});
    console.log('Existing products cleared.');

    // Đọc danh sách 27 sản phẩm thô từ file JSON
    const jsonPath = path.join(__dirname, 'products_seed.json');
    console.log(`Reading raw products from ${jsonPath}...`);
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const rawProducts = JSON.parse(rawData);

    // Lọc và chuyển đổi dữ liệu
    console.log(`Filtering and mapping ${rawProducts.length} raw products to ProductSchema...`);
    const cleanedProducts = rawProducts.map(item => filterRawItemToSchema(item));

    // Lưu vào database
    console.log('Inserting filtered data to MongoDB...');
    const createdProducts = await Product.insertMany(cleanedProducts);
    console.log(`Imported ${createdProducts.length} items to database.`);

    // Tạo các biến thể tương ứng cho từng sản phẩm
    console.log('Generating product variants...');
    const variantsToCreate = [];

    for (const p of createdProducts) {
      const colors = ['Đen bóng', 'Đồi mồi', 'Trong suốt'];

      colors.forEach((color, index) => {
        // Tạo SKU: SKU-BRAND-NAME-COLOR (sau khi loại bỏ kí tự đặc biệt)
        const brandSlug = p.brand.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const nameSlug = p.name.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const colorSlug = index === 0 ? 'BLK' : index === 1 ? 'TOR' : 'CLR';
        const sku = `SKU-${brandSlug}-${nameSlug}-${colorSlug}`;

        // Lấy hình ảnh từ sản phẩm (nếu có) gán vào biến thể
        const variantImages = p.imageUrl && p.imageUrl.length > 0
          ? p.imageUrl.map(img => ({ imageUrl: img.imageUrl }))
          : [];

        variantsToCreate.push({
          productId: p._id,
          sku,
          colorName: color,
          frameFinish: color === 'Đen bóng' ? 'Glossy' : 'Matte',
          lensWidthMm: 52,
          bridgeWidthMm: 18,
          templeLengthMm: 140,
          sizeLabel: 'Standard',
          price: p.price,
          discountPrice: p.discountPrice,
          quantity: 20, // Tồn kho mặc định để có sẵn hàng bán
          status: 'ACTIVE',
          orderItemType: 'IN_STOCK',
          imageUrl: variantImages
        });
      });
    }

    console.log(`Inserting ${variantsToCreate.length} variants to MongoDB...`);
    const createdVariants = await ProductVariant.insertMany(variantsToCreate);
    console.log('Seeding completed successfully!');
    
    console.log(`Imported ${createdProducts.length} products and ${createdVariants.length} variants:`);
    createdProducts.forEach((p, idx) => {
      const pVariants = createdVariants.filter(v => v.productId.toString() === p._id.toString());
      console.log(` ${idx + 1}. [${p.category}] ${p.brand} - ${p.name} (Variants: ${pVariants.map(v => v.colorName).join(', ')})`);
    });

    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error(`Error during seeding: ${error.message}`);
    process.exit(1);
  }
};

seedProducts();
