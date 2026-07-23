# Graph Report - optic  (2026-07-23)

## Corpus Check
- 206 files · ~831,261 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1131 nodes · 1628 edges · 102 communities (81 shown, 21 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5a94b24b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.jsx
- ProductVariant.js
- dependencies
- MyOrder.jsx
- index.js
- useRefunds.js
- dependencies
- useCartStore
- User
- devDependencies
- Product.js
- Feature: Giỏ hàng (Cart) — SPECIFICATION
- What You Must Do When Invoked
- ProductManagePage.jsx
- AddressController
- UserManagePage.jsx
- Feature: Checkout & Thanh toán VNPay — FULL SPECIFICATION
- PrescriptionModal.jsx
- Cart.js
- Verification.js
- Architecture Decisions (ADR)
- 2026-07-12
- PLAN.md — Implementation Plan: Bảng phân tích doanh số (Dashboard Analytics)
- PLAN.md — Implementation Plan: Quản lý Hoàn tiền (Refunds Management)
- Feature: Quản lý Hoàn tiền (Refunds Management) — FULL SPECIFICATION
- PLAN.md — Implementation Plan: Quản lý thành viên (User Management)
- Version: 1.0.0 | Status: APPROVED | Risk: Cao | Level: Formal
- server.js
- RefundController.js
- AGENTS.md — Hướng dẫn Coding Agent cho Optics Management Project
- Feature: Quản lý thành viên (User Management) — STANDARD SPECIFICATION
- Feature: Trang sản phẩm (Store & Products) — STANDARD SPECIFICATION
- graphify reference: extra exports and benchmark
- 2. Người dùng (User API) — Base: `/api/users`
- 6. Đơn hàng (Orders API) — Base: `/orders` (hoặc `/api/orders`, `/api/management/orders`)
- 📌 Tổng quan dự án: Optics Management
- Người viết: @antigravity | Ngày: 2026-06-23
- Người viết: @antigravity | Ngày: 2026-06-23
- Người viết: @antigravity | Ngày: 2026-06-23
- Người lập: @Doan-Bao-Long | Ngày: 2026-06-13
- Khung kiến trúc: Node.js + Express + Mongoose + React (Tailwind CSS)
- Người viết: @antigravity | Ngày: 2026-06-23
- Người viết: @antigravity | Ngày: 2026-06-23
- Người viết: @antigravity | Ngày: 2026-06-23
- Người viết: @antigravity | Ngày: 2026-06-23
- Người viết: @antigravity | Ngày: 2026-06-23
- Người viết: @antigravity | Ngày: 2026-06-23
- CONSTITUTION.md — Project Law
- OrderController
- Architecture Decisions (ADR)
- 4. Sản phẩm & Biến thể (Products API) — Base: `/api/products`
- PLAN.md
- TASK.md — Checkout & Thanh toán (Checkout Feature Task List)
- graphify reference: query, path, explain
- 📄 Tài liệu API – Optics Management
- 1. Xác thực (Auth API) — Base: `/api/auth`
- 5. Sổ địa chỉ (Address API) — Base: `/api/addresses`
- 8. Hoàn tiền (Refund API) — Base: `/api/refund`
- Feature: Bảng phân tích doanh số (Dashboard Analytics) — LIGHT SPECIFICATION
- ProductVariantController
- 7. Thanh toán VNPay (Payment API) — Base: `/payment` (hoặc `/api/payment`)
- Hướng Dẫn Viết Spec Chuẩn & Chuyên Nghiệp
- README.md
- TASK.md — Giỏ hàng (Cart Feature Task List)
- TASK.md — Trang sản phẩm & Biến thể (Store & Products Task List)
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- 📌 Quy tắc & Định dạng chung
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- TASKS.md — Danh sách task: Dashboard Analytics
- TASKS.md — Danh sách task: Refunds Management (Manager/Admin)
- TASKS.md — Danh sách task: User Management (Admin)
- TASKS.md
- graphify
- extraction-spec.md
- TASK.md
- Người viết: @antigravity | Ngày: 2026-06-23
- CONSTITUTION.md — Project Law
- Architecture Decisions (ADR)
- BÁO CÁO AUDIT RESPONSIVE MOBILE — PHASE 3 & STOREFRONT (Full Suite)
- TASK.md — Checkout & Thanh toán (Checkout Feature Task List)
- PrescriptionOrderView.tsx
- ProductVariantManagePage.jsx
- useLoginForm.js
- RegisterForm.jsx
- ManagerDashboardPage.jsx
- ProfileLayout.jsx
- setup.js
- PrescriptionOrderView.jsx
- lucide-react
- react
- react-dom
- react-helmet-async
- @react-oauth/google
- @tanstack/react-query
- zustand

## God Nodes (most connected - your core abstractions)
1. `User` - 30 edges
2. `useCartStore` - 21 edges
3. `createApp()` - 18 edges
4. `createCustomer()` - 14 edges
5. `useCheckoutStore` - 14 edges
6. `createProduct()` - 13 edges
7. `authHeader()` - 12 edges
8. `createVariant()` - 12 edges
9. `What You Must Do When Invoked` - 12 edges
10. `Feature: Checkout & Thanh toán VNPay — FULL SPECIFICATION` - 12 edges

## Surprising Connections (you probably didn't know these)
- `createApp()` --indirect_call--> `errorHandler()`  [INFERRED]
  src/backend/app.js → src/backend/middlewares/errorMiddleware.js
- `createApp()` --indirect_call--> `notFound()`  [INFERRED]
  src/backend/app.js → src/backend/middlewares/errorMiddleware.js
- `authenticate()` --references--> `User`  [EXTRACTED]
  src/backend/middlewares/authMiddleware.js → src/backend/models/User.js
- `optionalAuthenticate()` --references--> `User`  [EXTRACTED]
  src/backend/middlewares/authMiddleware.js → src/backend/models/User.js
- `createUser()` --references--> `User`  [EXTRACTED]
  src/backend/tests/helpers/factories.js → src/backend/models/User.js

## Import Cycles
- None detected.

## Communities (102 total, 21 thin omitted)

### Community 0 - "App.jsx"
Cohesion: 0.16
Nodes (12): App(), PrivateRoute(), AuthContext, AuthProvider(), AdminLayout(), ManagerLayout(), CartDrawer(), CartItemRow() (+4 more)

### Community 1 - "ProductVariant.js"
Cohesion: 0.07
Nodes (15): AuthController, googleLoginSchema, loginSchema, registerSchema, resendEmailSchema, OrderController, orderHasPrescription(), PaymentController (+7 more)

### Community 2 - "dependencies"
Cohesion: 0.04
Nodes (46): bcryptjs, cors, dotenv, express, google-auth-library, joi, jsonwebtoken, mongodb-memory-server (+38 more)

### Community 3 - "MyOrder.jsx"
Cohesion: 0.25
Nodes (6): profileApi, FeedbackModal(), useProfileQuery(), emptyForm, MyAddresses(), ProfilePage()

### Community 4 - "index.js"
Cohesion: 0.09
Nodes (26): ADR-0003, createLens(), deleteLens(), getLensById(), getLenses(), updateLens(), validateLensPayload(), RefundController (+18 more)

### Community 5 - "useRefunds.js"
Cohesion: 0.13
Nodes (24): refundApi, CreateBatchModal(), fmt(), getDisplayImageUrl(), CustomerCancelModal(), fmt(), getProductName(), fmt() (+16 more)

### Community 6 - "dependencies"
Cohesion: 0.13
Nodes (15): axios, dependencies, axios, framer-motion, @hookform/resolvers, react-hook-form, react-router-dom, sonner (+7 more)

### Community 7 - "useCartStore"
Cohesion: 0.11
Nodes (23): AuthLayout(), Footer(), Header(), MainLayout(), MobileBottomNav(), paymentApi, CheckoutStepper(), OrderSummary() (+15 more)

### Community 8 - "User"
Cohesion: 0.09
Nodes (11): UserController, User, userSchema, cleanUser(), __dirname, __filename, seedUsers(), AuthService (+3 more)

### Community 9 - "devDependencies"
Cohesion: 0.13
Nodes (15): autoprefixer, devDependencies, autoprefixer, postcss, tailwindcss, @types/react, @types/react-dom, vite (+7 more)

### Community 10 - "Product.js"
Cohesion: 0.07
Nodes (26): 1. Context & Goal (Bối cảnh & Mục tiêu), 2. Actors & Roles (Tác nhân & Vai trò), 3.1 Ubiquitous (Luôn luôn đúng), 3.2 Event-driven (Kích hoạt bằng sự kiện), 3.3 State-driven (Khi ở trạng thái), 3.4 Optional / Where (Tùy chọn), 3.5 Unwanted (Lỗi / Edge Case), 3. Functional Requirements (Yêu cầu chức năng — EARS) (+18 more)

### Community 11 - "Feature: Giỏ hàng (Cart) — SPECIFICATION"
Cohesion: 0.12
Nodes (13): escapeRegex(), isStaff(), ProductController, removeLocalImages(), SORT_OPTIONS, ProductVariantController, httpError(), ImageSchema (+5 more)

### Community 12 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 13 - "ProductManagePage.jsx"
Cohesion: 0.30
Nodes (11): useCreateManagerLens(), useDeleteManagerLens(), useManagerLenses(), useUpdateManagerLens(), useCreateManagerProduct(), useDeleteManagerProduct(), useManagerProducts(), useUpdateManagerProduct() (+3 more)

### Community 15 - "UserManagePage.jsx"
Cohesion: 0.50
Nodes (6): useAdminUsers(), useCreateUser(), useDeleteUser(), useResetUserPassword(), useUpdateUserStatus(), UserManagePage()

### Community 16 - "Feature: Checkout & Thanh toán VNPay — FULL SPECIFICATION"
Cohesion: 0.09
Nodes (22): 10. Dependencies & Integration Points, 11. Testing Requirements, 1.1 Chính sách thanh toán (nguyên tắc) **[SYNC]**, 1. Business Context & Goals, 2. Stakeholders & User Personas, 3. User Stories (all paths), 4. Acceptance Criteria (EARS), 5.1 Báo giá trước checkout **[SYNC]** (+14 more)

### Community 17 - "PrescriptionModal.jsx"
Cohesion: 0.09
Nodes (21): 1. Ngôn ngữ thiết kế, 2.1 Trung tính (nền, chữ, viền), 2.2 Màu thương hiệu — Emerald (điểm nhấn / CTA), 2.3 Màu ngữ nghĩa (semantic / status), 2. Bảng màu (Color Palette), 3. Typography, 4.1 Border radius, 4.2 Shadow (từ mềm → nổi) (+13 more)

### Community 23 - "Architecture Decisions (ADR)"
Cohesion: 0.13
Nodes (14): ADR-001: Chọn JWT + Google OAuth2 thay vì Session, ADR-002: Chọn Mongoose ODM thay vì MongoDB Native Driver, ADR-003: Nhúng dữ liệu Payment vào Order thay vì tách collection riêng, ADR-004: Loại bỏ hoàn toàn COD, chấp nhận duy nhất cổng VNPay Sandbox, ADR-005: Cho phép quản lý đơn hàng đặt trước (Pre-order) và Hủy đơn PENDING ở Client, ADR-006: Giỏ hàng client-only hoàn toàn (Zustand + LocalStorage), Architecture Decisions (ADR), AUTO MEMORY (+6 more)

### Community 24 - "2026-07-12"
Cohesion: 0.14
Nodes (13): 2026-06-15, 2026-07-08, 2026-07-12, FEATURE-001: Server-side price validation trong OrderController.createOrder, FEATURE-002: Address Book (Sổ địa chỉ persistent cho Customer), FEATURE-003: Lens Builder — Persist đơn kính (prescription) theo từng OrderItem, FIX-001: Sửa 3 chỗ `stock_quantity` → `quantity` (đúng model `ProductVariant`), MEMORY_LOG.md — Auto-generated Memory Log (+5 more)

### Community 25 - "PLAN.md — Implementation Plan: Bảng phân tích doanh số (Dashboard Analytics)"
Cohesion: 0.14
Nodes (13): 1. ARCHITECTURAL APPROACH, 2. COMPONENTS, 3. DATA FLOW, 4. DEPENDENCIES, 5. RISKS & MITIGATIONS, 6. QUESTIONS FOR HUMAN, Backend (đã có — cần hiệu chỉnh), Cách tiếp cận tổng thể (+5 more)

### Community 26 - "PLAN.md — Implementation Plan: Quản lý Hoàn tiền (Refunds Management)"
Cohesion: 0.14
Nodes (13): 1. ARCHITECTURAL APPROACH, 2. COMPONENTS, 3. DATA FLOW, 4. DEPENDENCIES, 5. RISKS & MITIGATIONS, 6. QUESTIONS FOR HUMAN, Backend (đã có — cần khớp tên route với spec), Cách tiếp cận tổng thể (+5 more)

### Community 27 - "Feature: Quản lý Hoàn tiền (Refunds Management) — FULL SPECIFICATION"
Cohesion: 0.14
Nodes (13): 1. Business Context & Goals, 2. Stakeholders & User Personas, 3. User Stories (all paths), 4. Acceptance Criteria (EARS), 5.1 Lấy danh sách đơn hàng đã hủy cần hoàn trả tiền, 5.2 Lấy danh sách các đơn hàng bị ảnh hưởng khi dừng bán biến thể, 5.3 Tạo yêu cầu hoàn tiền hàng loạt (Batch), 5.4 Phê duyệt hoàn tiền thành công (+5 more)

### Community 28 - "PLAN.md — Implementation Plan: Quản lý thành viên (User Management)"
Cohesion: 0.21
Nodes (12): VnpayCheckoutButton(), useCheckoutVnpay(), useMyOrders(), ALL_STATUSES, fmt(), getDisplayImageUrl(), ITEM_STATUS, MyOrders() (+4 more)

### Community 29 - "Version: 1.0.0 | Status: APPROVED | Risk: Cao | Level: Formal"
Cohesion: 0.14
Nodes (13): 1. Context & Goal, 2. Actors & Roles, 3.1 Ubiquitous (Luôn luôn đúng), 3.2 Event-driven (Phản ứng với sự kiện), 3.3 State-driven (Hành vi liên tục trong trạng thái), 3. Functional Requirements (EARS Notation), 4. Non-functional Requirements, 5. Data Model (MongoDB Schema) (+5 more)

### Community 30 - "server.js"
Cohesion: 0.07
Nodes (47): createApp(), __dirname, __filename, connectDB(), DashboardController, cleanupExpiredOrders(), startOrderStatusCleanupJob(), errorHandler() (+39 more)

### Community 31 - "RefundController.js"
Cohesion: 0.14
Nodes (13): 1. ARCHITECTURAL APPROACH, 2. COMPONENTS, 3. DATA FLOW, 4. DEPENDENCIES, 5. RISKS & MITIGATIONS, 6. QUESTIONS FOR HUMAN, Backend (đã có), Cách tiếp cận tổng thể (+5 more)

### Community 32 - "AGENTS.md — Hướng dẫn Coding Agent cho Optics Management Project"
Cohesion: 0.21
Nodes (3): policyApi, orderApi, httpClient

### Community 33 - "Feature: Quản lý thành viên (User Management) — STANDARD SPECIFICATION"
Cohesion: 0.18
Nodes (10): 1. Business Context, 2. User Stories, 3. Acceptance Criteria (EARS), 4.1 Liệt kê người dùng, 4.2 Cập nhật quyền (Role), 4.3 Khóa/Mở khóa tài khoản (Status), 4. API Contract, 5. Technical Constraints (+2 more)

### Community 34 - "Feature: Trang sản phẩm (Store & Products) — STANDARD SPECIFICATION"
Cohesion: 0.07
Nodes (27): 1. Context & Goal (Bối cảnh & Mục tiêu), 2. Actors & Roles (Tác nhân & Vai trò), 3.1 Ubiquitous (Luôn luôn đúng), 3.2 Event-driven (Kích hoạt bằng sự kiện), 3.3 State-driven (Khi ở trạng thái), 3.4 Optional / Where (Tùy chọn), 3.5 Unwanted (Lỗi / Edge Case), 3. Functional Requirements (Yêu cầu chức năng — EARS) (+19 more)

### Community 35 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 36 - "2. Người dùng (User API) — Base: `/api/users`"
Cohesion: 0.22
Nodes (9): 2.1 Xem thông tin tài khoản hiện tại, 2.2 Tạo tài khoản mới (ADMIN), 2.3 Danh sách người dùng, 2.4 Chi tiết người dùng, 2.5 Đổi vai trò người dùng, 2.6 Khóa / Mở khóa tài khoản, 2.7 Đặt lại mật khẩu, 2.8 Xóa tài khoản vĩnh viễn (+1 more)

### Community 37 - "6. Đơn hàng (Orders API) — Base: `/orders` (hoặc `/api/orders`, `/api/management/orders`)"
Cohesion: 0.22
Nodes (9): 6.1 Tạo đơn hàng từ giỏ (CUSTOMER), 6.2 Lịch sử đơn hàng của tôi, 6.3 Khách hàng tự hủy đơn, 6.4 Chi tiết đơn hàng, 6.5 Toàn bộ đơn hàng trong hệ thống, 6.6 Danh sách đơn CANCELLED đã thanh toán (chờ hoàn tiền), 6.7 Cập nhật trạng thái đơn (MANAGER/ADMIN), 6.8 Xóa đơn khỏi CSDL (+1 more)

### Community 38 - "📌 Tổng quan dự án: Optics Management"
Cohesion: 0.23
Nodes (8): Breadcrumb(), ProductFeedback(), getDisplayImageUrl(), ProductGallery(), ProductInfo(), ProductDetailPage(), getDisplayImageUrl(), ProductsPage()

### Community 39 - "Người viết: @antigravity | Ngày: 2026-06-23"
Cohesion: 0.22
Nodes (8): 1. PROBLEM STATEMENT, 2. DOMAIN KNOWLEDGE, 3. STAKEHOLDERS, 4. CONSTRAINTS (ràng buộc không thể thay đổi), 5. ASSUMPTIONS (giả định — cần confirm), 6. OPEN QUESTIONS (câu hỏi chưa có câu trả lời), CONTEXT.md — Bảng phân tích doanh số (Dashboard Analytics Feature), Người viết: @antigravity | Ngày: 2026-06-23

### Community 40 - "Người viết: @antigravity | Ngày: 2026-06-23"
Cohesion: 0.22
Nodes (8): 1. PROBLEM STATEMENT, 2. DOMAIN KNOWLEDGE, 3. STAKEHOLDERS, 4. CONSTRAINTS (ràng buộc không thể thay đổi), 5. ASSUMPTIONS (giả định — cần confirm), 6. OPEN QUESTIONS (câu hỏi chưa có câu trả lời), CONTEXT.md — Quản lý Hoàn tiền (Refunds Management Feature), Người viết: @antigravity | Ngày: 2026-06-23

### Community 41 - "Người viết: @antigravity | Ngày: 2026-06-23"
Cohesion: 0.22
Nodes (8): 1. PROBLEM STATEMENT, 2. DOMAIN KNOWLEDGE, 3. STAKEHOLDERS, 4. CONSTRAINTS (ràng buộc không thể thay đổi), 5. ASSUMPTIONS (giả định — cần confirm), 6. OPEN QUESTIONS (câu hỏi chưa có câu trả lời), CONTEXT.md — Quản lý thành viên (User Management Feature), Người viết: @antigravity | Ngày: 2026-06-23

### Community 42 - "Người lập: @Doan-Bao-Long | Ngày: 2026-06-13"
Cohesion: 0.22
Nodes (8): 1. PROBLEM STATEMENT, 2. DOMAIN KNOWLEDGE & CONSTRAINTS, 3. STAKEHOLDERS, 4. ASSUMPTIONS (Giả định), 5. OPEN QUESTIONS, CONTEXT.md - Module Xác Thực & Định Danh (Authentication), Người lập: @Doan-Bao-Long | Ngày: 2026-06-13, Tech Stack: Node.js + Express + MongoDB (Mongoose) + React (Vite)

### Community 43 - "Khung kiến trúc: Node.js + Express + Mongoose + React (Tailwind CSS)"
Cohesion: 0.22
Nodes (8): 1. ARCHITECTURAL APPROACH, 2. COMPONENTS, 3. DATA FLOW, 4. DEPENDENCIES, 5. RISKS & MITIGATIONS, 6. QUESTIONS FOR HUMAN, Khung kiến trúc: Node.js + Express + Mongoose + React (Tailwind CSS), KẾ HOẠCH TRIỂN KHAI KỸ THUẬT (PLAN.md)

### Community 44 - "Người viết: @antigravity | Ngày: 2026-06-23"
Cohesion: 0.22
Nodes (8): 1. PROBLEM STATEMENT, 2. DOMAIN KNOWLEDGE, 3. STAKEHOLDERS, 4. CONSTRAINTS (ràng buộc không thể thay đổi), 5. ASSUMPTIONS (giả định — cần confirm), 6. OPEN QUESTIONS (câu hỏi chưa có câu trả lời), CONTEXT.md — Giỏ hàng (Cart Feature), Người viết: @antigravity | Ngày: 2026-06-23

### Community 45 - "Người viết: @antigravity | Ngày: 2026-06-23"
Cohesion: 0.22
Nodes (8): 1. ARCHITECTURAL APPROACH, 2. COMPONENTS, 3. DATA FLOW, 4. DEPENDENCIES, 5. RISKS & MITIGATIONS, 6. QUESTIONS FOR HUMAN, Người viết: @antigravity | Ngày: 2026-06-23, PLAN.md — Giỏ hàng (Cart Feature Implementation Plan)

### Community 46 - "Người viết: @antigravity | Ngày: 2026-06-23"
Cohesion: 0.29
Nodes (3): FeedbackController, Feedback, feedbackSchema

### Community 47 - "Người viết: @antigravity | Ngày: 2026-06-23"
Cohesion: 0.18
Nodes (10): 1. TECH STACK THỰC TẾ, 2. CẤU TRÚC THƯ MỤC THỰC TẾ, 3. API ENDPOINTS THỰC TẾ (đã triển khai), 4. DATABASE COLLECTIONS THỰC TẾ, 5. CÁC GAP ĐÃ ĐƯỢC GIẢI QUYẾT & BẢN ĐĂNG KÝ, 6. QUY TẮC AGENT, AGENTS.md — Hướng dẫn Coding Agent cho Optics Management Project, Auth & Users (+2 more)

### Community 48 - "Người viết: @antigravity | Ngày: 2026-06-23"
Cohesion: 0.22
Nodes (8): 1. PROBLEM STATEMENT, 2. DOMAIN KNOWLEDGE, 3. STAKEHOLDERS, 4. CONSTRAINTS (ràng buộc không thể thay đổi), 5. ASSUMPTIONS (giả định — cần confirm), 6. OPEN QUESTIONS (câu hỏi chưa có câu trả lời), CONTEXT.md — Trang sản phẩm & Biến thể (Store & Products Feature), Người viết: @antigravity | Ngày: 2026-06-23

### Community 49 - "Người viết: @antigravity | Ngày: 2026-06-23"
Cohesion: 0.22
Nodes (8): 1. ARCHITECTURAL APPROACH, 2. COMPONENTS, 3. DATA FLOW, 4. DEPENDENCIES, 5. RISKS & MITIGATIONS, 6. QUESTIONS FOR HUMAN, Người viết: @antigravity | Ngày: 2026-06-23, PLAN.md — Trang sản phẩm & Biến thể (Store & Products Implementation Plan)

### Community 50 - "CONSTITUTION.md — Project Law"
Cohesion: 0.20
Nodes (9): Defensive Code Review & Production Readiness Workflow, Production Audit Checklist, Step 1: Authentication & Authorization Review, Step 2: Input Validation & Controller Safety, Step 3: Transaction & Inventory Resiliency, Step 4: File Upload & Media Handling, Step 5: Error Handling & Logging, Step 6: Frontend State & Component Performance (+1 more)

### Community 51 - "OrderController"
Cohesion: 0.20
Nodes (9): Báo cáo kiểm thử Backend, Cách chạy, Ghi chú, System test (End-to-End), Thống kê theo file, Thống kê theo loại test, Tổng quan, Độ phủ mã nguồn (+1 more)

### Community 52 - "Architecture Decisions (ADR)"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, preview, type, version

### Community 53 - "4. Sản phẩm & Biến thể (Products API) — Base: `/api/products`"
Cohesion: 0.29
Nodes (7): 4.1 Danh sách sản phẩm (có lọc & phân trang), 4.2 Chi tiết sản phẩm, 4.3 Thêm sản phẩm mới, 4.4 Cập nhật sản phẩm, 4.5 Xóa sản phẩm, 4.6 Biến thể sản phẩm (Product Variants), 4. Sản phẩm & Biến thể (Products API) — Base: `/api/products`

### Community 54 - "PLAN.md"
Cohesion: 0.29
Nodes (6): 1. ARCHITECTURAL APPROACH, 2. COMPONENTS, 3. DATA FLOW, 4. DEPENDENCIES, 5. RISKS & MITIGATIONS, 6. QUESTIONS FOR HUMAN

### Community 55 - "TASK.md — Checkout & Thanh toán (Checkout Feature Task List)"
Cohesion: 0.22
Nodes (8): 1. Giới thiệu, 2. Mục tiêu, 3. Phạm vi (Scope), 4. Các actor chính & Chức năng, 5. Luồng nghiệp vụ chính, 6. Công nghệ triển khai thực tế, 7. Rủi ro và Giải pháp đồng bộ, 📌 Tổng quan dự án: Optics Management

### Community 56 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 57 - "📄 Tài liệu API – Optics Management"
Cohesion: 0.33
Nodes (5): 3. Giỏ hàng (Cart), 9.1 Thống kê doanh thu, 9. Dashboard (Dashboard API) — Base: `/api/dashboard`, 📄 Tài liệu API – Optics Management, 📌 Vòng đời trạng thái đơn hàng (Order Status Lifecycle)

### Community 58 - "1. Xác thực (Auth API) — Base: `/api/auth`"
Cohesion: 0.33
Nodes (6): 1.1 Đăng ký tài khoản, 1.2 Đăng nhập, 1.3 Đăng nhập bằng Google OAuth2, 1.4 Xác minh email qua token, 1.5 Gửi lại email xác minh, 1. Xác thực (Auth API) — Base: `/api/auth`

### Community 59 - "5. Sổ địa chỉ (Address API) — Base: `/api/addresses`"
Cohesion: 0.33
Nodes (6): 5.1 Danh sách địa chỉ của tôi, 5.2 Thêm địa chỉ, 5.3 Cập nhật địa chỉ, 5.4 Đặt địa chỉ mặc định, 5.5 Xóa địa chỉ, 5. Sổ địa chỉ (Address API) — Base: `/api/addresses`

### Community 60 - "8. Hoàn tiền (Refund API) — Base: `/api/refund`"
Cohesion: 0.33
Nodes (6): 8.1 Vô hiệu hóa biến thể (bước 1), 8.2 Danh sách đơn bị ảnh hưởng (bước 2), 8.3 Tạo lô hoàn tiền (bước 3), 8.4 Danh sách yêu cầu hoàn tiền sẵn sàng (bước 4), 8.5 Xác nhận hoàn tiền (bước 5), 8. Hoàn tiền (Refund API) — Base: `/api/refund`

### Community 61 - "Feature: Bảng phân tích doanh số (Dashboard Analytics) — LIGHT SPECIFICATION"
Cohesion: 0.33
Nodes (5): 1. Business Context, 2. User Stories, 3. Technical Implementation, 4. Acceptance Criteria, Feature: Bảng phân tích doanh số (Dashboard Analytics) — LIGHT SPECIFICATION

### Community 62 - "ProductVariantController"
Cohesion: 0.40
Nodes (5): 7.1 Tính yêu cầu thanh toán trước khi tạo đơn, 7.2 Sinh liên kết thanh toán VNPay, 7.3 Callback VNPay (IPN), 7.4 Mock thanh toán (chỉ dùng local/test), 7. Thanh toán VNPay (Payment API) — Base: `/payment` (hoặc `/api/payment`)

### Community 63 - "7. Thanh toán VNPay (Payment API) — Base: `/payment` (hoặc `/api/payment`)"
Cohesion: 0.40
Nodes (4): 1. Cấu Trúc 8 Thành Phần Cốt Lõi, 2. Ngôn Ngữ EARS Notation (Cách Viết Chống Mơ Hồ), 5 Mẫu Câu Chuẩn EARS, Hướng Dẫn Viết Spec Chuẩn & Chuyên Nghiệp

### Community 64 - "Hướng Dẫn Viết Spec Chuẩn & Chuyên Nghiệp"
Cohesion: 0.40
Nodes (4): 1. Link tạo App Password để cấu hình gửi Email, 2. Cấu hình gửi Email kích hoạt (Nodemailer), 3. Tải các thư viện sau khi chạy code, Mật khẩu ứng dụng (App Password) - KHÔNG PHẢI mật khẩu đăng nhập Gmail

### Community 65 - "README.md"
Cohesion: 0.40
Nodes (4): A. THIẾT LẬP CLIENT STATE (ZUSTAND), B. XÂY DỰNG GIAO DIỆN (UI COMPONENTS), C. KẾT NỐI & TÍCH HỢP HỆ THỐNG, TASK.md — Giỏ hàng (Cart Feature Task List)

### Community 66 - "TASK.md — Giỏ hàng (Cart Feature Task List)"
Cohesion: 0.40
Nodes (4): A. THIẾT KẾ CƠ SỞ DỮ LIỆU & API CORE, B. XÂY DỰNG GIAO DIỆN HIỂN THỊ CỬA HÀNG (FE), C. XÂY DỰNG BỘ CÔNG CỤ QUẢN TRỊ (ADMIN CRUD), TASK.md — Trang sản phẩm & Biến thể (Store & Products Task List)

### Community 67 - "TASK.md — Trang sản phẩm & Biến thể (Store & Products Task List)"
Cohesion: 0.22
Nodes (8): 1. PROBLEM STATEMENT, 2. DOMAIN KNOWLEDGE, 3. STAKEHOLDERS, 4. CONSTRAINTS (ràng buộc không thể thay đổi), 5. ASSUMPTIONS (giả định — cần confirm), 6. OPEN QUESTIONS (câu hỏi chưa có câu trả lời), CONTEXT.md — Checkout & Thanh toán VNPay (Checkout & Payment Feature), Người viết: @antigravity | Ngày: 2026-06-23

### Community 68 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 69 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 70 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 71 - "📌 Quy tắc & Định dạng chung"
Cohesion: 0.50
Nodes (4): Các vai trò người dùng (Roles):, Mã trạng thái HTTP:, 📌 Quy tắc & Định dạng chung, Định dạng response chuẩn:

### Community 81 - "Người viết: @antigravity | Ngày: 2026-06-23"
Cohesion: 0.22
Nodes (8): 1. ARCHITECTURAL APPROACH, 2. COMPONENTS, 3. DATA FLOW, 4. DEPENDENCIES, 5. RISKS & MITIGATIONS, 6. QUESTIONS FOR HUMAN, Người viết: @antigravity | Ngày: 2026-06-23, PLAN.md — Checkout & Thanh toán (Checkout Feature Implementation Plan)

### Community 82 - "CONSTITUTION.md — Project Law"
Cohesion: 0.25
Nodes (7): ARTICLE 1 — TECH STACK (immutable), ARTICLE 2 — CODING STANDARDS, ARTICLE 3 — SECURITY POLICIES (non-negotiable), ARTICLE 4 — DATABASE SCHEMA (MongoDB), ARTICLE 5 — API CONVENTIONS, ARTICLE 6 — OUT-OF-SCOPE (explicitly excluded), CONSTITUTION.md — Project Law

### Community 83 - "Architecture Decisions (ADR)"
Cohesion: 0.29
Nodes (5): ADR-001: Chọn JWT + Google OAuth2 thay vì Session, ADR-002: Chọn Mongoose ODM thay vì MongoDB Native Driver, ADR-003: Nhúng dữ liệu Payment vào Order thay vì tách collection riêng, Architecture Decisions (ADR), graphify

### Community 84 - "BÁO CÁO AUDIT RESPONSIVE MOBILE — PHASE 3 & STOREFRONT (Full Suite)"
Cohesion: 0.29
Nodes (6): 1. `HomePage.jsx`, 2. `CheckoutPage.jsx`, BÁO CÁO AUDIT RESPONSIVE MOBILE — PHASE 3 & STOREFRONT (Full Suite), 📑 BẢNG TỔNG HỢP DANH SÁCH FILE ĐÃ AUDIT, 🔍 CHI TIẾT KẾT QUẢ AUDIT STOREFRONT & CHECKOUT (PHASE 3), 🚀 TỔNG HỢP CÁC ACTION FIX UY TIÊN HÀNG ĐẦU (MUST-FIX FIRST)

### Community 85 - "TASK.md — Checkout & Thanh toán (Checkout Feature Task List)"
Cohesion: 0.29
Nodes (6): A. THIẾT KẾ DATA SCHEMAS & LOGIC TÍNH LƯỢNG, B. ĐẶT ĐƠN HÀNG & PHẢN HỒI KHO HÀNG (ATOMIC UPDATES), C. TÍCH HỢP CỔNG VNPAYmerchant, D. TỰ ĐỘNG DỌN DẸP KHO TREO (WORKER), E. XÂY DỰNG FRONTEND FLOW, TASK.md — Checkout & Thanh toán (Checkout Feature Task List)

### Community 86 - "PrescriptionOrderView.tsx"
Cohesion: 0.33
Nodes (5): OrderItemPrescription, PrescriptionData, PrescriptionOrderProps, formatCurrency(), PrescriptionOrderView()

### Community 87 - "ProductVariantManagePage.jsx"
Cohesion: 0.38
Nodes (4): ImportVariantModal(), ProductVariantManagePage(), EMPTY_FORM, VariantModal()

### Community 88 - "useLoginForm.js"
Cohesion: 0.60
Nodes (3): LoginForm(), loginSchema, useLoginForm()

### Community 89 - "RegisterForm.jsx"
Cohesion: 0.60
Nodes (3): RegisterForm(), registerSchema, useRegisterForm()

### Community 90 - "ManagerDashboardPage.jsx"
Cohesion: 0.70
Nodes (3): useDashboardRevenue(), getDashboardImageUrl(), ManagerDashboardPage()

### Community 91 - "ProfileLayout.jsx"
Cohesion: 0.50
Nodes (3): ProfileSidebar(), sidebarItems, ProfileLayout()

## Knowledge Gaps
- **514 isolated node(s):** `__filename`, `__dirname`, `registerSchema`, `loginSchema`, `googleLoginSchema` (+509 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `xlsx` connect `dependencies` to `Feature: Giỏ hàng (Cart) — SPECIFICATION`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `httpError()` connect `Feature: Giỏ hàng (Cart) — SPECIFICATION` to `server.js`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `createApp()` (e.g. with `errorHandler()` and `notFound()`) actually correct?**
  _`createApp()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `__filename`, `__dirname`, `registerSchema` to the rest of the system?**
  _514 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ProductVariant.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07051282051282051 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._
- **Should `index.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08585858585858586 - nodes in this community are weakly interconnected._