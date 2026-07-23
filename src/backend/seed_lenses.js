import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Lens from './models/Lens.js';

dotenv.config();

const sampleLenses = [
  {
    name: "Tròng kính chống ánh sáng xanh",
    material: "Nhựa CR-39",
    price: 300000,
    description: "Giảm ánh sáng xanh từ màn hình, bảo vệ mắt khi dùng máy tính."
  },
  {
    name: "Tròng kính chống tia UV",
    material: "Polycarbonate",
    price: 350000,
    description: "Ngăn chặn tia UV, phù hợp sử dụng ngoài trời."
  },
  {
    name: "Tròng kính đổi màu",
    material: "Trivex",
    price: 800000,
    description: "Tự động đổi màu khi ra nắng, tiện lợi khi di chuyển."
  },
  {
    name: "Tròng kính chống trầy xước",
    material: "Nhựa cao cấp",
    price: 250000,
    description: "Bề mặt chống trầy, tăng độ bền khi sử dụng."
  },
  {
    name: "Tròng kính siêu mỏng 1.56",
    material: "Nhựa 1.56",
    price: 400000,
    description: "Mỏng nhẹ, phù hợp người có độ cận trung bình."
  },
  {
    name: "Tròng kính siêu mỏng 1.61",
    material: "Nhựa 1.61",
    price: 600000,
    description: "Mỏng hơn, giảm độ dày cho kính cận cao."
  },
  {
    name: "Tròng kính siêu mỏng 1.67",
    material: "Nhựa 1.67",
    price: 900000,
    description: "Rất mỏng, dành cho độ cận cao."
  },
  {
    name: "Tròng kính siêu mỏng 1.74",
    material: "Nhựa 1.74",
    price: 1200000,
    description: "Mỏng nhất hiện nay, thẩm mỹ cao."
  },
  {
    name: "Tròng kính chống chói",
    material: "Polycarbonate",
    price: 450000,
    description: "Giảm chói khi lái xe ban đêm."
  },
  {
    name: "Tròng kính phân cực",
    material: "Polycarbonate",
    price: 700000,
    description: "Giảm phản xạ ánh sáng, nhìn rõ hơn khi đi biển hoặc lái xe."
  },
  {
    name: "Tròng kính đa tròng",
    material: "Nhựa cao cấp",
    price: 1500000,
    description: "Nhìn rõ ở nhiều khoảng cách, phù hợp người lớn tuổi."
  },
  {
    name: "Tròng kính đọc sách",
    material: "CR-39",
    price: 200000,
    description: "Hỗ trợ nhìn gần, giảm mỏi mắt khi đọc."
  },
  {
    name: "Tròng kính chống ánh sáng xanh (Polycarbonate)",
    material: "Polycarbonate",
    price: 500000,
    description: "Chống ánh sáng xanh hiệu suất cao với chất liệu Polycarbonate siêu bền."
  }
];

const seedLenses = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/SWP';
    console.log(`Connecting to database to seed lenses...`);
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected Successfully.');

    console.log('Clearing existing lenses collection...');
    await Lens.deleteMany({});
    console.log('Cleared existing lenses.');

    console.log(`Inserting ${sampleLenses.length} sample lenses to MongoDB...`);
    const createdLenses = await Lens.insertMany(sampleLenses);

    console.log('Lens seeding completed successfully!');
    console.log(`Imported ${createdLenses.length} lenses:`);
    createdLenses.forEach((lens, index) => {
      console.log(` ${index + 1}. ${lens.name} (${lens.material}) - ${lens.price.toLocaleString('vi-VN')} VND`);
    });

    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error(`Error during lens seeding: ${error.message}`);
    process.exit(1);
  }
};

seedLenses();
