# 📱 Responsive Mobile — Phase 2 Log

> Ngày thực hiện: 2026-07-29 · Branch: `quypd`
> Phạm vi: **Nội dung bên trong các trang** (tables, forms, modals, cards, grid) — tiếp nối Phase 1 (Header drawer, Bottom nav, Sidebar off-canvas, ProfileSidebar).
> Breakpoint chuẩn: mobile `<640px (sm)` / tablet `<768px (md)` / desktop `≥1024px (lg)`.

---

## ✅ Kết quả build

```
vite build → ✓ built in 7.38s (2374 modules, không lỗi)
```

---

## 1. Storefront (khách hàng)

### `src/pages/ProductsPage.jsx`
| Thay đổi | Chi tiết |
|---|---|
| 🆕 **Mobile Filter Drawer** | Nút lọc mobile (`showMobileFilters`) trước đây **không có panel** — đã thêm drawer trượt từ phải (overlay + panel `w-[85%] max-w-[340px]`, animate bằng framer-motion, khóa `lg:hidden`) gồm đủ: tìm kiếm, giới tính, khoảng giá, nút Áp dụng / Xóa tất cả cố định đáy. |
| Tiêu đề | `text-4xl` → `text-3xl sm:text-4xl` |

### `src/pages/HomePage.jsx`
| Thay đổi | Chi tiết |
|---|---|
| Hero heading | `text-6xl` → `text-4xl sm:text-6xl lg:text-8xl` (đã chỉnh trước đó + xác nhận) |
| Hero container | `py-12 sm:py-24`, `gap-10 sm:gap-16` |
| Section heading | `text-4xl` → `text-3xl sm:text-4xl` |
| 🆕 **Category card overlay** | Overlay + tên danh mục trước đây chỉ hiện khi **hover** → mobile không có hover nên không thấy gì. Đã cho hiện mặc định trên mobile (`opacity-100 md:opacity-0 md:group-hover:opacity-100`), desktop giữ nguyên hiệu ứng hover. Vị trí content `bottom-6 left-6` mobile / `bottom-8 left-8` desktop. |

### `src/pages/ProductDetailPage.jsx`, `CheckoutPage.jsx`, checkout components
- Đã kiểm tra: grid `lg:grid-cols-12`, form checkout, OrderSummary đều đã responsive sẵn → **không cần sửa**.

---

## 2. Manager

### `feature/manager/page/products/ProductManagePage.jsx`
| Thay đổi | Chi tiết |
|---|---|
| **Table min-width** | `<table>` chỉ có `w-full` → bị nén cột trên mobile dù wrapper có `overflow-x-auto`. Thêm `min-w-[720px]` → cuộn ngang hoạt động đúng. |
| Padding trang | `p-6 md:p-10` → `p-4 md:p-10` |
| Tiêu đề | `text-4xl` → `text-2xl sm:text-3xl md:text-4xl` |
| Tabs | `gap-6 px-8` → `gap-4 md:gap-6 px-4 md:px-8` |
| Toolbar | `px-8 py-6` → `px-4 py-4 md:px-8 md:py-6`, `items-center` → `items-stretch lg:items-center` |

### `feature/manager/page/products/ProductVariantManagePage.jsx`
| Thay đổi | Chi tiết |
|---|---|
| **Table min-width** | Bảng 8 cột — thêm `min-w-[1000px]` (nghiêm trọng nhất, trước đây vỡ hoàn toàn trên mobile). |
| Padding trang | `p-6 md:p-10` → `p-4 md:p-10` |
| Tiêu đề + badge ID | `text-4xl` → `text-2xl sm:text-3xl md:text-4xl`, thêm `flex-wrap` chống tràn badge |
| Toolbar | `px-8 py-6` → `px-4 py-4 md:px-8 md:py-6` + `items-stretch sm:items-center` |

### `feature/manager/page/orders/ManagerOrderPage.jsx`
| Thay đổi | Chi tiết |
|---|---|
| **Table min-width** | Bảng 5 cột — thêm `min-w-[640px]`. |
| Modal chi tiết đơn | Content `p-8` → `p-4 md:p-8`, `space-y-8` → `space-y-6 md:space-y-8`, grid `gap-8` → `gap-6 md:gap-8` |
| Thông số kính thuốc OD/OS | `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` (text mono dài dễ tràn) |

### `feature/manager/page/products/ProductModal.jsx`
| Thay đổi | Chi tiết |
|---|---|
| **Form grid** | `grid-cols-2` cố định → `grid-cols-1 sm:grid-cols-2` (input không còn bị ép 2 cột chật trên mobile). |
| Body padding | `px-8 py-8` → `px-5 py-6 md:px-8 md:py-8` |

### `feature/manager/page/products/VariantModal.jsx`
| Thay đổi | Chi tiết |
|---|---|
| **Form grid** | `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` (các `col-span-2 sm:col-span-1` sẵn có vẫn hoạt động đúng). |
| Sub-grid thông số kỹ thuật | `grid-cols-3` → `grid-cols-1 sm:grid-cols-3` (label dài: "Cầu mắt (mm)"…) |
| Body padding | `px-8 py-8` → `px-5 py-6 md:px-8 md:py-8` |

### `feature/manager/page/products/ImportVariantModal.jsx`
| Thay đổi | Chi tiết |
|---|---|
| Modal padding | `p-8` → `p-5 md:p-8` |
| Banner "Tải file mẫu" | `flex items-center justify-between` → `flex-col sm:flex-row` (không còn ép text + nút chung 1 hàng chật). |

### `feature/manager/page/dashboard/ManagerDashboardPage.jsx`
| Thay đổi | Chi tiết |
|---|---|
| Tiêu đề | `text-4xl sm:text-5xl` → `text-3xl sm:text-4xl md:text-5xl` |
| KPI cards | `gap-8` → `gap-5 md:gap-8`; 3 card `p-8` → `p-6 md:p-8` |
| Heading Top 5 | thêm `flex-col sm:flex-row gap-1` chống 2 nhãn đè nhau |
| Quick actions | 2 card `p-10` → `p-6 md:p-10` |

---

## 3. Admin + Profile

### `feature/admin/page/UserManagePage.jsx`
| Thay đổi | Chi tiết |
|---|---|
| **Table min-width** | Bảng 5 cột — thêm `min-w-[860px]` để cuộn ngang thay vì nén. |
| Padding trang | `p-6 md:p-10` → `p-4 md:p-10` |
| Tiêu đề | `text-4xl` → `text-2xl sm:text-3xl md:text-4xl` |
| Tabs / Toolbar / Pagination | `px-8` → `px-4 md:px-8`, `py-6` → `py-4 md:py-6` |
| Modal tạo tài khoản & reset password | Đã có sẵn `max-h-[90vh] overflow-y-auto` + form Họ/Tên `flex-col sm:flex-row` → giữ nguyên. |

### `feature/profile/page/MyOrder.jsx`
| Thay đổi | Chi tiết |
|---|---|
| **Pagination số trang** | Dãy số trang render tất cả trang không cuộn → tràn ngang khi nhiều trang. Bọc `overflow-x-auto max-w-[55vw] sm:max-w-none` + nút `shrink-0`. |
| Grid Số lượng/Đơn giá/Thành tiền | `gap-2` → `gap-1.5 sm:gap-2` |

### `feature/profile/page/MyAddresses.jsx`
| Thay đổi | Chi tiết |
|---|---|
| Modal thêm/sửa địa chỉ | thêm `max-h-[90vh] overflow-y-auto` (chống tràn màn thấp/xoay ngang). |
| Padding + header | Đã responsive từ trước (`p-4 sm:p-8`, header `flex-col sm:flex-row`) → giữ nguyên. |

### `feature/profile/page/ProfilePage.jsx`
| Thay đổi | Chi tiết |
|---|---|
| Avatar | `h-24 w-24` → `h-20 w-20 sm:h-24 sm:w-24`, `gap-6` → `gap-4 sm:gap-6` |
| Tên người dùng | `text-2xl` → `text-xl sm:text-2xl` |
| Grid thông tin | Đã đúng chuẩn `grid-cols-1 md:grid-cols-2` → giữ nguyên. |

### `feature/profile/components/feedback/FeedbackModal.jsx`
| Thay đổi | Chi tiết |
|---|---|
| Grid preview ảnh | `grid-cols-3` → `grid-cols-2 sm:grid-cols-3` (ảnh không còn quá nhỏ trên mobile). |
| Cấu trúc modal | Đã chuẩn (`max-h-[90vh] overflow-y-auto`) → giữ nguyên, dùng làm pattern mẫu. |

---

## 🔑 Pattern chung đã áp dụng

1. **Table trong wrapper `overflow-x-auto` bắt buộc phải có `min-w-[...]`** — nếu không, table tự co theo `w-full` và cuộn ngang vô hiệu. Đã áp dụng: 720px (6 cột) / 860px (5 cột rộng) / 640px (5 cột) / 1000px (8 cột).
2. **Form grid trong modal**: luôn `grid-cols-1 sm:grid-cols-N`, không dùng `grid-cols-N` cứng.
3. **Modal**: overlay `p-4` + panel `w-full max-w-* max-h-[90vh] overflow-y-auto`.
4. **Padding scale**: base mobile nhỏ (`p-4`/`px-4 py-4`) → desktop giữ nguyên qua `md:`.
5. **Heading scale**: `text-2xl sm:text-3xl md:text-4xl` thay vì cỡ cố định.
6. **Hover-only content** (HomePage category): phải hiện mặc định trên mobile vì không có hover.

---

# 📱 Phase 3 — Dropdown clip fix + Code-split

> Ngày thực hiện: 2026-08-02 · Tiếp nối Phase 2.

## ✅ Kết quả build Phase 3

```
vite build → ✓ built in 4.56s, KHÔNG còn cảnh báo chunk > 500 kB
Bundle chính: 854 kB → 271 kB (index) — giảm ~68%
```

| Chunk | Kích thước | Ghi chú |
|---|---|---|
| `index` (storefront) | 271.86 kB (gzip 67.9) | khách hàng chỉ tải phần này |
| `react-vendor` | 164.68 kB (gzip 53.8) | react + react-dom + router, cache lâu dài |
| `motion` | 129.58 kB (gzip 42.8) | framer-motion |
| `form` | 89.06 kB (gzip 26.7) | react-hook-form + zod |
| `query` | 46.24 kB (gzip 18.0) | axios + zustand |
| Manager/Admin pages | 5–49 kB mỗi trang | **lazy-load** — chỉ tải khi vào `/manager`, `/admin` |

## 1. Fix dropdown action menu bị clip trong table

**Vấn đề:** menu thao tác (⋯) dùng `position: absolute` bên trong container `overflow-x-auto` → bị cắt (clip) theo cả 2 trục khi bảng cuộn ngang trên mobile, đặc biệt khi bảng ít dòng.

**Giải pháp:** chuyển menu sang `position: fixed`, tọa độ tính từ `getBoundingClientRect()` của nút bấm (không cần portal):
- Tự động lật lên trên (`bottom`) khi gần đáy viewport.
- `right` kẹp tối thiểu 8px để không tràn mép phải màn hình.
- Đóng menu khi **cuộn** (window + capture cả cuộn ngang của bảng) để menu fixed không bị "trôi" sai vị trí.

Áp dụng cho 3 file:
- `feature/admin/page/UserManagePage.jsx`
- `feature/manager/page/products/ProductManagePage.jsx`
- `feature/manager/page/products/ProductVariantManagePage.jsx`

## 2. Code-split

### `src/App.jsx`
- 7 component Manager/Admin (`ManagerLayout`, `ManagerDashboardPage`, `ProductManagePage`, `ProductVariantManagePage`, `ManagerOrderPage`, `AdminLayout`, `UserManagePage`) chuyển sang `React.lazy()` + `<Suspense fallback={<PageLoader />}>`.
- Khách hàng (đa số người dùng, chủ yếu mobile) không còn phải tải ~150 kB code quản trị.
- Bỏ import `AnimatePresence` không dùng.

### `vite.config.js`
- Thêm `build.rollupOptions.output.manualChunks` tách vendor: `react-vendor`, `motion`, `form`, `query`.
- ✅ `@tanstack/react-query` có trong `package.json` nhưng không được cài & không được dùng ở bất kỳ file nào → **đã gỡ khỏi `package.json` + cập nhật lockfile** (2026-08-02), build xác nhận pass.

## 📌 Còn lại / đề xuất tiếp theo (chưa làm)

- **Card-view thay table trên mobile** cho Manager/Admin (hiện dùng cuộn ngang với `min-w` — dùng được nhưng UX card sẽ tốt hơn).
