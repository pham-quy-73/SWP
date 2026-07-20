# UI Design — Optic (Cửa hàng kính mắt online)

Tài liệu **thiết kế giao diện** (visual/UI design system) cho frontend Optic.
Tất cả token dưới đây trích trực tiếp từ class Tailwind đang dùng trong `src/frontend/src`.

> Tailwind chạy **theme mặc định** (`tailwind.config.js` không extend). Không có biến CSS tùy chỉnh — design system nằm ở quy ước sử dụng class utility. Font mặc định là system font stack (`-apple-system, Segoe UI, Roboto…`) khai báo ở `index.css`.

---

## 1. Ngôn ngữ thiết kế

Phong cách **tối giản, hiện đại, cao cấp** (minimal / editorial):

- Nền trung tính (trắng + xám `zinc`/`gray`), điểm nhấn **xanh ngọc `emerald`**.
- Chữ đậm, chữ hoa, giãn chữ rộng (`uppercase tracking-widest`) cho nhãn & nút → cảm giác thời trang.
- Bo góc lớn (`rounded-xl`/`2xl`/`full`), shadow mềm, hiệu ứng chuyển động mượt.
- Nhiều khoảng trắng, container tối đa `max-w-7xl`.

---

## 2. Bảng màu (Color Palette)

### 2.1 Trung tính (nền, chữ, viền)
Dùng song song 2 thang xám của Tailwind: **`zinc`** (chủ đạo cho trang khách) và **`gray`** (chủ đạo cho manager/admin).

| Vai trò | Class | Ghi chú |
|---|---|---|
| Chữ chính | `text-zinc-900` / `text-gray-900` | Tiêu đề, nội dung đậm |
| Chữ phụ | `text-zinc-600` / `text-gray-500` / `text-zinc-500` | Mô tả, caption |
| Chữ mờ / placeholder | `text-zinc-400` / `text-gray-400` | Icon phụ, gợi ý |
| Nền trang | `bg-zinc-50` / `bg-gray-50` | Nền tổng thể |
| Nền khối | `bg-white`, `bg-zinc-100` / `bg-gray-100` | Card, ô nhập |
| Viền | `border-zinc-200` / `border-gray-200`, `border-zinc-100` | Đường phân cách |
| Nền tối (nút/logo) | `bg-zinc-900` | Nút chính, logo |

### 2.2 Màu thương hiệu — Emerald (điểm nhấn / CTA)
| Sắc độ | Class | Dùng cho |
|---|---|---|
| Nhạt | `bg-emerald-50`, `bg-emerald-100` | Nền badge, hover nhẹ, trạng thái tích cực |
| Vừa | `bg-emerald-500`, `bg-emerald-600` | Nút CTA, badge giỏ hàng, icon active |
| Đậm | `bg-emerald-700`, `text-emerald-700` | Hover đậm, chữ nhấn |
| Focus ring | `focus:ring-emerald-500`, `focus:ring-emerald-100` | Viền focus ô nhập |

### 2.3 Màu ngữ nghĩa (semantic / status)
| Ý nghĩa | Màu | Ví dụ class |
|---|---|---|
| Thành công / tích cực | Emerald | `bg-emerald-50 text-emerald-700` |
| Lỗi / hủy | Rose / Red | `text-rose-600`, `bg-rose-50`, `text-red-500` |
| Cảnh báo / chờ | Amber | `bg-amber-50` |
| Thông tin / vai trò Manager | Indigo | `bg-indigo-50`, `text-indigo-600` |
| Vai trò Admin | Red | `text-red-650 hover:text-red-800` |

---

## 3. Typography

Thang chữ Tailwind mặc định. Tần suất dùng thực tế:

| Cấp | Class | Dùng cho |
|---|---|---|
| Body chính | `text-sm` (nhiều nhất) | Nội dung, form, bảng |
| Nhãn nhỏ / caption | `text-xs` | Badge, nhãn nút, meta |
| Nhấn / phụ đề | `text-base`, `text-lg` | Giá, tiêu đề phụ |
| Tiêu đề | `text-xl` → `text-3xl` | Heading trang, section |
| Hero | `text-4xl` → `text-7xl` | Banner trang chủ |

**Font-weight:** `font-bold` (mặc định cho nhãn/nút), `font-semibold`, `font-medium`, và `font-black` cho logo/hero.

**Letter-spacing (đặc trưng thương hiệu):**
- `tracking-widest` + `uppercase` → nhãn nút, menu, badge.
- `tracking-tight` / `tracking-tighter` → tiêu đề lớn, logo.

Ví dụ nhãn chuẩn: `text-xs font-bold uppercase tracking-wider`.

---

## 4. Bo góc, đổ bóng, khoảng cách

### 4.1 Border radius
| Class | Dùng cho |
|---|---|
| `rounded-xl` (phổ biến nhất) | Card, ô nhập, khối nội dung |
| `rounded-2xl` | Card lớn, modal, panel |
| `rounded-full` | Nút pill, avatar, badge, ô tìm kiếm |
| `rounded-lg` | Nút nhỏ, logo, tag |
| `rounded-3xl` | Khối hero / card nổi bật |

### 4.2 Shadow (từ mềm → nổi)
`shadow-sm` (mặc định card) → `shadow-md` → `shadow-lg` (hover/nút) → `shadow-xl` → `shadow-2xl` (modal, drawer, hero).
Shadow màu thương hiệu: `hover:shadow-emerald-500/20`.

### 4.3 Layout & spacing
- Container: `max-w-7xl mx-auto px-6`.
- Modal/form hẹp: `max-w-sm` / `max-w-md` / `max-w-lg`.
- Khoảng cách phổ biến: `gap-2/4/5/8`, `py-4/6`, `p-2`.

---

## 5. Component chuẩn

### 5.1 Nút (Button)

**Primary (tối, CTA chính)** — dùng ở Header "Đăng ký":
```jsx
className="bg-zinc-900 text-white px-5 py-2 rounded-full text-xs font-bold
           uppercase tracking-wider hover:bg-emerald-600 transition-all
           shadow-lg hover:shadow-emerald-500/20 active:scale-95"
```

**Primary (emerald)** — hành động xác nhận:
```jsx
className="bg-emerald-600 text-white ... rounded-full hover:bg-emerald-700
           active:scale-95 transition-all"
```

**Text/Link** — điều hướng phụ:
```jsx
className="text-xs font-bold uppercase tracking-wider text-zinc-900
           hover:text-emerald-600 transition-colors"
```

**Nút hủy / nguy hiểm:** `text-rose-600 hover:text-rose-800`.

Quy ước tương tác: `active:scale-95` khi bấm, `transition-all`/`transition-colors` cho mọi hover.

### 5.2 Ô nhập (Input) — ví dụ ô tìm kiếm Header
```jsx
className="h-11 pl-12 pr-5 rounded-full border border-zinc-200 bg-white text-sm
           text-zinc-700 placeholder:text-zinc-400 shadow-sm outline-none
           transition-all duration-300
           focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 focus:shadow-lg"
```
Mẫu focus dùng lại: `focus:ring-2`/`ring-4` + `focus:ring-emerald-500`/`ring-emerald-100`.

### 5.3 Badge / Chip
- Đếm giỏ hàng: hình tròn `bg-emerald-600 text-white text-[9px] rounded-full border border-white shadow-sm`.
- Trạng thái: nền nhạt + chữ đậm cùng tông, ví dụ `bg-emerald-50 text-emerald-700 rounded-full px-… text-xs font-bold`.

### 5.4 Card
`bg-white rounded-xl/2xl border border-zinc-100 shadow-sm` (thêm `hover:shadow-lg` khi tương tác).

### 5.5 Header / Navbar
`fixed top-0 w-full z-50`, chuyển trạng thái theo scroll:
- Đầu trang: `bg-transparent py-6`.
- Đã cuộn: `bg-white/80 backdrop-blur-md py-4 shadow-sm` (hiệu ứng kính mờ).
- `transition-all duration-500`.

---

## 6. Chuyển động (Motion)

- **Thư viện:** `framer-motion` (drawer giỏ hàng, chuyển cảnh, `AnimatePresence`).
- **Thời lượng transition CSS:** chủ yếu `duration-300`, cảnh lớn `duration-500`/`700`, micro-interaction `duration-200`.
- **Micro-interaction:** `active:scale-95` (bấm nút), `group-hover:` đổi màu logo/icon, `hover:` đổi màu + shadow.
- **Toast:** `sonner` cho thông báo.

---

## 7. Icon

- **Bộ icon:** `lucide-react`.
- Kích thước quen dùng: `size={18}` / `20`.
- Màu icon theo ngữ cảnh: `text-zinc-400` (phụ), `text-zinc-700` (thường), `text-emerald-600` (active/hover).

---

## 8. Màu theo vai trò người dùng (Role accent)

Header đổi màu link điều hướng theo `user.role`:

| Vai trò | Màu nhấn |
|---|---|
| Customer | Emerald (mặc định) |
| Manager | Indigo — `text-indigo-600 hover:text-indigo-850` |
| Admin | Red — `text-red-650 hover:text-red-800` |

Khu vực Manager/Admin nghiêng về thang **`gray`** + accent **indigo/blue** (`bg-gradient-to-r from-blue-600 to-indigo-600`), trong khi trang khách nghiêng về **`zinc` + emerald**.

---

## 9. Nguyên tắc & gợi ý nhất quán

- **Thống nhất thang xám:** hiện dùng lẫn `zinc` (khách) và `gray` (quản lý). Nên giữ ranh giới này có chủ đích, hoặc gom về một thang để đồng nhất.
- **Đưa token vào `tailwind.config`:** khai báo `theme.extend.colors.brand` (emerald), radius, shadow mặc định → tránh lặp chuỗi class dài và dễ đổi đồng loạt.
- **Chuẩn hóa nút/input thành component dùng chung** (`Button`, `Input`, `Badge`) thay vì lặp class inline nhiều nơi.
- **Accessibility:** giữ `aria-label` cho nút icon (đã có ở badge giỏ hàng), đảm bảo tương phản chữ trên nền màu đạt WCAG AA.
