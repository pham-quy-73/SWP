# Sử dụng Node.js LTS làm base image
FROM node:20-alpine

# Cài đặt dumb-init bảo vệ signal handling (PID 1)
RUN apk add --no-cache dumb-init

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Thiết lập môi trường NODE_ENV sang production
ENV NODE_ENV=production
ENV PORT=3000

# Sao chép package.json và package-lock.json
COPY package*.json ./

# Cài đặt dependencies sạch từ lockfile, loại bỏ dev_dependencies
RUN npm ci --omit=dev

# Sao chép toàn bộ mã nguồn backend dưới danh nghĩa user node
COPY --chown=node:node . .

# Chuyển quyền chạy container sang user node (không phải root)
USER node

# Expose port
EXPOSE 3000

# Dùng ENTRYPOINT dumb-init để xử lý chính xác tín hiệu hệ thống
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Khởi chạy ứng dụng
CMD ["node", "server.js"]

