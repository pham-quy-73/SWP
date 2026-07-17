# --- Stage 1: Build React Application ---
FROM node:20-alpine AS builder

# Thiết lập thư mục làm việc
WORKDIR /app

# Sao chép package.json và package-lock.json
COPY package*.json ./

# Cài đặt dependencies (bao gồm cả devDependencies phục vụ khâu build)
RUN npm install

# Sao chép toàn bộ mã nguồn frontend
COPY . .

# Khai báo và sử dụng biến môi trường lúc build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build ứng dụng sang sản phẩm tĩnh (folder /dist)
RUN npm run build

# --- Stage 2: Serve tĩnh bằng Nginx ---
FROM nginx:alpine

# Sao chép file cấu hình Nginx phục vụ SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Sao chép bản build tĩnh từ Stage 1 sang thư mục root của Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Mở cổng 80 để phục vụ yêu cầu HTTP
EXPOSE 80

# Chạy Nginx ở foreground
CMD ["nginx", "-g", "daemon off;"]
