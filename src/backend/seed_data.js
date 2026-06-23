import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from './models/Product.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Hàm chuyển đổi và làm sạch dữ liệu để khớp 100% với ProductSchema
const filterRawItemToSchema = (item) => {
  // Chuẩn hoá Category (Chỉ nhận FRAME, SUNGLASSES hoặc ACCESSORIES)
  let category = 'FRAME';
  const rawCat = (item.category || '').toUpperCase();
  if (['FRAME', 'SUNGLASSES', 'ACCESSORIES'].includes(rawCat)) {
    category = rawCat;
  } else if (rawCat === 'LENS') {
    category = 'FRAME'; // Gộp các mẫu LENS từ JSON thô thành FRAME
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
    stock_quantity: 20, // Số tồn kho mặc định
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
    console.log('Seeding completed successfully!');
    console.log(`Imported ${createdProducts.length} items to database:`);
    createdProducts.forEach((p, idx) => {
      console.log(` ${idx + 1}. [${p.category}] ${p.brand} - ${p.name} (${p.frameType}, ${p.gender}, Giá: ${p.price.toLocaleString()} VND)`);
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
