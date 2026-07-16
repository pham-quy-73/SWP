# Sử dụng Node.js LTS làm base image
FROM node:20-alpine

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Sao chép package.json và package-lock.json
COPY package*.json ./

# Cài đặt các thư viện sản xuất để tối ưu trọng lượng
RUN npm install --production

# Sao chép toàn bộ mã nguồn backend
COPY . .

# Mở cổng chạy backend (Express mặc định trên cổng 3000)
EXPOSE 3000

# Khởi chạy ứng dụng
CMD ["npm", "start"]
