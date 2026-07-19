import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Môi trường Node cho backend Express/Mongoose.
    environment: 'node',
    globals: true,
    // Thiết lập biến môi trường + kết nối mongodb-memory-server trước toàn bộ test.
    setupFiles: ['./tests/setup.js'],
    // DB in-memory dùng chung một instance; chạy tuần tự để tránh các test
    // ghi/đọc lẫn dữ liệu của nhau trên cùng một database.
    fileParallelism: false,
    hookTimeout: 120000, // tải binary MongoDB lần đầu có thể lâu
    testTimeout: 30000,
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'text-summary', 'html', 'json-summary', 'json'],
      include: [
        'controllers/**/*.js',
        'services/**/*.js',
        'middlewares/**/*.js',
        'models/**/*.js',
        'routes/**/*.js',
        'jobs/**/*.js',
        'app.js'
      ],
      // Loại trừ code khởi động server, seed và cấu hình kết nối DB thật.
      exclude: [
        'server.js',
        'config/db.js',
        'seed_data.js',
        'seed_users.js',
        'tests/**',
        'node_modules/**'
      ],
      thresholds: {
        lines: 90,
        branches: 85,
        functions: 90,
        statements: 90
      }
    }
  }
});
