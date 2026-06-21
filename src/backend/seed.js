import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Product from './models/Product.js';

dotenv.config();

const sampleProducts = [
  {
    name: 'Gọng Kính Ray-Ban RB3025 Aviator - Vàng Bóng',
    brand: 'Ray-Ban',
    price: 2500000,
    stock_quantity: 15,
    description: 'Gọng kính Aviator cổ điển huyền thoại, khung kim loại mạ vàng bóng, tròng chống UV400.',
    image_url: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&q=80',
    image_public_id: 'seed/product_01'
  },
  {
    name: 'Gọng Kính Oakley Holbrook - Đen Mờ',
    brand: 'Oakley',
    price: 3200000,
    stock_quantity: 8,
    description: 'Gọng nhựa O-Matter siêu nhẹ, thiết kế thể thao năng động, kháng va đập cao.',
    image_url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80',
    image_public_id: 'seed/product_02'
  },
  {
    name: 'Gọng Kính Gucci GG0396S - Đồi Mồi',
    brand: 'Gucci',
    price: 8900000,
    stock_quantity: 5,
    description: 'Gọng acetate cao cấp họa tiết đồi mồi, logo GG đặc trưng, thời trang sang trọng.',
    image_url: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&q=80',
    image_public_id: 'seed/product_03'
  },
  {
    name: 'Gọng Kính Tom Ford FT0237 - Hồng Vàng',
    brand: 'Tom Ford',
    price: 7500000,
    stock_quantity: 6,
    description: 'Gọng oversized nữ tính, màu hồng vàng sang trọng, kèm bao da chính hãng.',
    image_url: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=800&q=80',
    image_public_id: 'seed/product_04'
  },
  {
    name: 'Gọng Kính Prada PR 01OS - Đen Bóng',
    brand: 'Prada',
    price: 6800000,
    stock_quantity: 10,
    description: 'Gọng hình vuông cổ điển, chất liệu acetate Mazzucchelli Italia cao cấp.',
    image_url: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=800&q=80',
    image_public_id: 'seed/product_05'
  },
  {
    name: 'Gọng Kính Persol PO3007V - Nâu Đồi Mồi',
    brand: 'Persol',
    price: 4500000,
    stock_quantity: 12,
    description: 'Gọng kim loại ý thủ công, bản lề Meflecto độc quyền linh hoạt, phong cách Ý.',
    image_url: 'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=800&q=80',
    image_public_id: 'seed/product_06'
  },
  {
    name: 'Gọng Kính Warby Parker Durand - Xanh Lam',
    brand: 'Warby Parker',
    price: 1800000,
    stock_quantity: 20,
    description: 'Gọng nhựa tái chế thân thiện môi trường, thiết kế tối giản hiện đại.',
    image_url: 'https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=800&q=80',
    image_public_id: 'seed/product_07'
  },
  {
    name: 'Gọng Kính Maui Jim Peahi - Bạc Gương',
    brand: 'Maui Jim',
    price: 5200000,
    stock_quantity: 7,
    description: 'Gọng titanium siêu nhẹ, tròng PolarizedPlus2® chống chói cực mạnh cho thể thao ngoài trời.',
    image_url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80',
    image_public_id: 'seed/product_08'
  },
  {
    name: 'Gọng Kính Garrett Leight Wilson M - Trong Suốt',
    brand: 'Garrett Leight',
    price: 4200000,
    stock_quantity: 0,
    description: 'Gọng acetate trong suốt phong cách California, thiết kế unisex tối giản.',
    image_url: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80',
    image_public_id: 'seed/product_09'
  },
  {
    name: 'Gọng Kính Oliver Peoples OV5183 - Đen Vàng',
    brand: 'Oliver Peoples',
    price: 6100000,
    stock_quantity: 4,
    description: 'Gọng vintage biểu tượng từ LA, khung acetate Ý phối kim loại mạ vàng tinh tế.',
    image_url: 'https://images.unsplash.com/photo-1555085932-5be1d504fd24?w=800&q=80',
    image_public_id: 'seed/product_10'
  }
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/SWP');
    console.log('✅ Kết nối MongoDB thành công');

    const existing = await Product.countDocuments({ deleted_at: null });
    if (existing > 0) {
      console.log(`⚠️  Đã có ${existing} sản phẩm trong DB. Seed thêm vào...`);
    }

    const result = await Product.insertMany(sampleProducts);
    console.log(`✅ Đã thêm ${result.length} sản phẩm mẫu vào DB:`);
    result.forEach((p, i) => console.log(`   ${i + 1}. ${p.name} (${p.brand}) — ${p.stock_quantity === 0 ? '❌ Hết hàng' : `✅ ${p.stock_quantity} cái`}`));
  } catch (err) {
    console.error('❌ Lỗi seed:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối MongoDB');
  }
};

seed();
