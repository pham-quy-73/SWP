# Feature: Giỏ hàng (Cart) — SPECIFICATION

**Status:** Approved (đồng bộ với code thực tế)
**Author:** AI Agent | **Tech Lead Approval:** —
**Date:** 2026-07-12
**Risk Level:** Low (client-only state, không đụng server, không nhạy cảm PCI/DSS)
**Related Specs:** `feature-checkout`, `feature-products`, `feature-auth`
**Cấu trúc:** Tuân theo `docs/spec.md` — 8 thành phần cốt lõi + EARS Notation.

> **Ghi chú phiên bản:** Spec này được viết lại từ code hiện có để phản ánh đúng
> hành vi thực tế. Các điểm khác biệt so với bản trước được đánh dấu **[REALITY]**.

---

## 1. Context & Goal (Bối cảnh & Mục tiêu)

Giỏ hàng là bước đệm giữa Browse (xem sản phẩm) và Checkout (thanh toán) trong hệ thống Optics Management. Khách hàng tích lũy nhiều biến thể gọng kính (`ProductVariant`) đang muốn mua trước khi chuyển sang trang `/checkout`.

**Pain point:** Nếu lưu giỏ tạm lên MongoDB, backend phải xử lý merge cart guest ↔ cart user, gánh tải DB cho dữ liệu chỉ có giá trị tạm thời và không nhạy cảm. Giỏ hàng client-only loại bỏ toàn bộ chi phí đó.

**Mục tiêu:**
- Trải nghiệm thêm/xóa/sửa số lượng tức thì, không phụ thuộc mạng.
- Giữ nguyên giỏ hàng khi khách reload trang hoặc đóng trình duyệt.
- Không tạo tải cho MongoDB, không cần API `/cart` phía Backend (theo **ADR-006**).
- Đảm bảo khi khách chuyển sang cổng thanh toán / hoàn tất đặt đơn thì giỏ được làm trống để tránh đặt trùng.

---

## 2. Actors & Roles (Tác nhân & Vai trò)

| Actor | Vai trò | Phân quyền với Cart |
| :--- | :--- | :--- |
| **Khách vãng lai (Guest)** | Chưa đăng nhập | Thêm/xóa/sửa số lượng bình thường. Khi bấm "Tiến hành thanh toán" → điều hướng `/login` với `state.from = { pathname: '/checkout' }` (giữ nguyên giỏ). |
| **Khách hàng (CUSTOMER)** | Đã đăng nhập | Thêm/xóa/điều chỉnh giỏ hàng, đi thẳng đến `/checkout`. |
| **MANAGER / ADMIN** | Quản trị | KHÔNG có quyền đọc/ghi giỏ hàng của user khác (cart nằm trong `localStorage` của trình duyệt, không tồn tại server-side). |
| **Frontend Developer** | Team FE | Tiêu thụ store `useCartStore` (Zustand + persist), không phải xử lý sync server. |
| **Product Manager** | Team sản phẩm | Chỉ quan tâm event tracking (Add-to-cart → Checkout) — ngoài scope kỹ thuật. |

---

## 3. Functional Requirements (Yêu cầu chức năng — EARS)

> Nguồn hành vi: `src/frontend/src/feature/product/store/useCartStore.js`,
> `CartDrawer.jsx`, `CartItemRow.jsx`, `ProductForm.jsx`,
> `feature/checkout/hooks/useOrderSuccess.js`, `feature/checkout/store/useCheckoutFlow.js`,
> `components/layout/Header.jsx`.

### 3.1 Ubiquitous (Luôn luôn đúng)
- **U-1:** THE Cart store SHALL persist state vào `localStorage` dưới key `vision-cart-storage` (Zustand `persist`, mặc định lưu toàn bộ state gồm `items` và `isOpen`).
- **U-2:** THE hệ thống SHALL NOT expose bất kỳ HTTP endpoint nào dưới `/cart`; cart không bao giờ rời khỏi trình duyệt (không có route backend cho cart).

### 3.2 Event-driven (Kích hoạt bằng sự kiện)
- **E-1:** WHEN `addToCart(payload)` được gọi với `id` (auto-gen) CHƯA có trong store, THE store SHALL append item mới `{ ...payload, id }` và set `isOpen = true`.
- **E-2:** WHEN `addToCart(payload)` được gọi với item đã tồn tại (khớp unique key `${productId}-${lensId}-${JSON.stringify(prescription)}`), THE store SHALL cộng dồn `quantity` bằng `newItem.quantity` và set `isOpen = true`.
  - **[REALITY]** `ProductForm` luôn gửi `quantity: 1`, nên trong luồng hiện tại mỗi lần add trùng cộng thêm đúng 1.
- **E-3:** WHEN `updateQuantity(id, q)` được gọi, THE store SHALL set `quantity = Math.max(1, q)` cho đúng item đó (clamp sàn về 1).
- **E-4:** WHEN `removeFromCart(id)` được gọi, THE store SHALL filter bỏ đúng item đó; các item khác giữ nguyên; **không** đổi `isOpen`.
- **E-5:** WHEN `clearCart()` được gọi, THE store SHALL set `items = []` VÀ `isOpen = false`. **[REALITY]** `clearCart()` được gọi tại **hai** nơi:
  1. `useCheckoutFlow.submitOrder` — ngay trước khi `window.location.href` chuyển sang cổng VNPay hoặc mock (sau khi tạo đơn thành công).
  2. `useOrderSuccess` — trong `finally` sau khi load chi tiết đơn trên `/payment-success` (và cả nhánh `orderId === '#UNKNOWN'`). Gọi lặp là idempotent.
- **E-6:** WHEN user bấm "Mua sắm ngay" ở empty state của Drawer, THE Drawer SHALL `closeCart()` rồi `navigate('/products')`.
- **E-7:** WHEN user bấm "Tiến hành thanh toán" trong Drawer, THE Drawer SHALL `closeCart()`, sau đó điều hướng `/checkout` (nếu `user` truthy) hoặc `/login` với `state.from = { pathname: '/checkout' }` (nếu chưa đăng nhập).

### 3.3 State-driven (Khi ở trạng thái)
- **S-1:** WHILE `items.length === 0`, THE Cart Drawer footer (Thành tiền + nút "Tiến hành thanh toán") SHALL không render; body hiển thị empty state với nút "Mua sắm ngay".
- **S-2:** WHILE Cart Drawer đang mở (`isOpen === true`), THE `document.body.style.overflow` SHALL bằng `'hidden'`; khi đóng hoặc unmount, SHALL được reset về `''`.
- **S-3:** WHILE `items.length > 0`, THE Header cart badge SHALL hiển thị **tổng `quantity`** (`items.reduce((a, i) => a + i.quantity, 0)`), CÒN badge trong header của Drawer hiển thị **`items.length`** (số dòng). **[REALITY]** Hai chỗ đếm khác nhau — xem OQ-5.
- **S-4:** WHILE `variant.quantity <= 0`, THE nút "Thêm vào giỏ hàng" trong `ProductForm` SHALL ở trạng thái `disabled` và hiển thị "Sản phẩm tạm hết hàng".

### 3.4 Optional / Where (Tùy chọn)
- **O-1:** WHERE `localStorage` không khả dụng (private mode, quota exceeded), THE Zustand `persist` SHALL fallback in-memory — cart vẫn hoạt động trong phiên.

### 3.5 Unwanted (Lỗi / Edge Case)
- **N-1:** WHERE variant hết hàng (`selectedVariant.quantity <= 0`) tại thời điểm Add-to-Cart, THE `ProductForm.handleAddToCart` SHALL chặn (`isOutOfStock`) và hiển thị toast lỗi thay vì gọi `addToCart`. **[REALITY]** Kiểm tra tồn kho nằm ở `ProductForm`, KHÔNG ở store — store không biết gì về tồn kho.
- **N-2:** THE store SHALL NOT lưu JWT token hay PII ngoài các trường product-facing hiện có.
- **N-3:** THE store SHALL NOT expose function cho MANAGER/ADMIN đọc cart của user khác.

---

## 4. Non-functional Requirements (Yêu cầu phi chức năng)

### 4.1 Performance
- Thao tác store (add/remove/update) `< 5 ms` trên thiết bị tầm trung (thao tác mảng thuần).
- `getCartTotal()` chạy O(n) `reduce` trên `items` — chấp nhận vì `n` thực tế nhỏ.
- Persist ghi `localStorage` mỗi lần state thay đổi (synchronous).
- Cart Drawer mở/đóng animation `0.35s` (framer-motion tween, `ease: 'easeInOut'`).

### 4.2 Security
- Không lưu token JWT hay mật khẩu vào cart store.
- Server luôn re-validate giá và tồn kho trong `OrderController.createOrder`; các trường `price`, `lensPrice` ở client chỉ để hiển thị (**LESSON-002**).
- XSS: `item.name`, `item.image`, `item.lensName` render qua React nên tự escape; không dùng `dangerouslySetInnerHTML`.
- `localStorage` same-origin isolation là đủ cho rủi ro của dữ liệu này (không nhạy cảm).

### 4.3 Scalability
- Không tác động backend → tuyến tính theo số user client; không có bottleneck server.

### 4.4 Availability
- Cart hoạt động 100% offline (add/remove/view không cần mạng).
- Availability của Cart = availability của trình duyệt user, không gắn với SLA server.

### 4.5 Accessibility & UX
- Cart Drawer có nút đóng (icon `X`) và overlay bấm-ngoài-để-đóng (`onClick={closeCart}`).
- Nút giảm số lượng `disabled` khi `quantity <= 1`.
- **[Gap]** Badge số lượng chưa có `aria-label`; đề xuất bổ sung.

---

## 5. Data Model (Mô hình dữ liệu)

**Không có thay đổi schema DB.**
- Collection `carts` (`src/backend/models/Cart.js`) TỒN TẠI nhưng KHÔNG được import/sử dụng ở bất kỳ đâu trong backend (không route, không controller). Giữ lại chỉ để tương thích lịch sử (ADR-006). Không migrate, không seed, không index.
- Không thêm collection mới; không thay đổi `Product`, `ProductVariant`, `Order`, `OrderItem`.

### 5.1 Client-only state — Zustand Store `useCartStore`
Path: `src/frontend/src/feature/product/store/useCartStore.js` · Persist key: `vision-cart-storage`

```ts
// [REALITY] Prescription trong CartItem là dạng LỒNG (nested), không phải phẳng.
// Dạng phẳng (odSphere, osSphere, ...) chỉ được map ở useCheckoutFlow khi tạo đơn.
type Prescription = {
  od?: { sphere?: string|number; cylinder?: string|number; axis?: string|number; add?: string|number; pd?: string|number };
  os?: { sphere?: string|number; cylinder?: string|number; axis?: string|number; add?: string|number; pd?: string|number };
  imageUrl?: string;   // ảnh đơn kính (có thể là data: URL)
  notes?: string;
} | null;

type CartItem = {
  id: string;              // Auto-gen: `${productId}-${lensId}-${JSON.stringify(prescription)}`
  productId: string;       // Product._id (gọng)
  variantId: string;       // ProductVariant._id (dùng khi tạo đơn)
  name: string;            // `${product.name} - ${variant.colorName}`
  price: number;           // Giá gọng (hiển thị; SERVER là source of truth khi tạo đơn)
  image: string;           // URL ảnh biến thể/sản phẩm (đã chuẩn hóa qua getDisplayImageUrl)
  quantity: number;        // >= 1 (ProductForm luôn khởi tạo = 1)
  orderType: 'buy-now' | 'pre-order';  // ProductForm hiện luôn set 'buy-now'
  lensId: string | null;
  lensName: string | null;
  lensPrice: number;       // Chỉ dùng hiển thị (mặc định 0 nếu không kèm tròng)
  prescription: Prescription;  // ProductForm hiện luôn gửi null
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;

  addToCart: (newItem: Omit<CartItem, 'id'>) => void; // gen id, cộng dồn nếu trùng, set isOpen=true
  removeFromCart: (id: string) => void;               // filter; KHÔNG đổi isOpen
  updateQuantity: (id: string, quantity: number) => void; // Math.max(1, quantity)
  clearCart: () => void;                              // items=[] và isOpen=false
  getCartTotal: () => number;                         // sum((price + lensPrice) * quantity), fallback 0

  openCart: () => void;   // isOpen = true
  closeCart: () => void;  // isOpen = false
};
```

### 5.2 Contract với Checkout API (Backend)
Khi tạo đơn, `useCheckoutFlow.submitOrder` đọc `useCartStore().items` rồi build `orderInfo.items[]`. **[REALITY]** Mỗi item gửi lên gồm cả `lensId` và `prescription` đã map sang dạng phẳng:
```json
{
  "items": [
    {
      "productVariantId": "<variantId | productId>",
      "quantity": 2,
      "lensId": "<lensId | null>",
      "prescription": {
        "odSphere": 0, "odCylinder": 0, "odAxis": 0, "odAdd": 0, "odPd": 0,
        "osSphere": 0, "osCylinder": 0, "osAxis": 0, "osAdd": 0, "osPd": 0,
        "note": ""
      }
    }
  ]
}
```
- `productVariantId` fallback về `item.productId` nếu thiếu `variantId`.
- `prescription` = `null` nếu item không có `prescription`.
- Gửi kèm `multipart/form-data`: `orderInfo` (JSON) + `prescriptionImage` (blob nếu có `data:image/`, ngược lại chuỗi rỗng).

Gọi (qua `paymentApi`):
- `paymentApi.createOrder(formData, paymentMethod)` — tạo đơn thực tế.
- `paymentApi.mockCheckout(orderId, 'SUCCESS'|'FAILURE')` hoặc `paymentApi.checkoutVnpay(orderId)` — lấy `redirectUrl` rồi `clearCart()` trước khi redirect.

Xem `docs/API_Document.md` (§ Checkout / Orders).

---

## 6. Error Handling (Xử lý lỗi)

| Mã | Tình huống | Xử lý | UI feedback |
| :--- | :--- | :--- | :--- |
| **CART-E01** | Add-to-cart khi chưa có biến thể (`!selectedVariant`) | Chặn ở `ProductForm.handleAddToCart` | Toast: "Vui lòng chọn phiên bản gọng kính!" |
| **CART-E02** | Biến thể hết hàng (`isOutOfStock`) | Chặn add + nút `disabled` | Toast: "Rất tiếc, phiên bản bạn chọn đã hết hàng!" |
| **CART-E03** | Guest bấm "Tiến hành thanh toán" | Redirect `/login` với `state.from = { pathname: '/checkout' }` | Không toast; điều hướng silent |
| **CART-E04** | `localStorage` đầy / disable | Zustand `persist` fallback in-memory; state vẫn chạy trong phiên | Không UI |
| **CART-E05** | JSON corrupt trong `localStorage` | `persist` rehydrate lỗi → fallback initial `items: []` | Cart trống, không crash |
| **CART-E06** | Server báo `OUT_OF_STOCK` / `VARIANT_NOT_FOUND` khi tạo đơn | Ngoài scope Cart; `useCheckoutFlow` catch và toast "Đặt hàng thất bại" | Toast phía checkout |
| **CART-E07** | `getCartTotal()`/`CartItemRow` gặp item thiếu `price`/`lensPrice` | Fallback `0` (`item.price || 0`, `item.lensPrice || 0`) | Tổng nhỏ hơn thực; không crash |

Không có HTTP status code trong bản thân feature Cart vì không có server call ở tầng store.

### 6.1 Edge Cases & Corner Cases
- **EC-1:** Thêm sản phẩm A, admin xóa biến thể A ở backend → khi checkout, `createOrder` trả `VARIANT_NOT_FOUND`. Cart không tự đồng bộ; `feature-checkout` xử lý.
- **EC-2:** Thêm nhiều biến thể của cùng Product (khác `lensId`/`prescription`) → là các dòng riêng.
- **EC-3:** Giá đổi giữa lúc add và checkout → UI hiển thị giá cũ, server tính giá mới (source of truth).
- **EC-4:** 2 tab dùng chung `localStorage`; sau reload state đồng bộ.
- **EC-5:** User đăng xuất → Cart KHÔNG bị xóa (thuộc trình duyệt). Guest kế tiếp trên cùng máy thấy cart cũ. Rủi ro thấp, chấp nhận.
- **EC-6:** **[REALITY]** Unique key = `${productId}-${lensId}-${JSON.stringify(prescription)}`, KHÔNG gồm `variantId`. Hai variants của cùng product, cùng `lensId`, cùng `prescription` (đều `null`) sẽ va cùng một dòng và cộng dồn `quantity` — dù `variantId` khác nhau. **Xem OQ-2.**
- **EC-7:** `clearCart` gọi nhiều lần (checkout redirect + `/payment-success`, hoặc React StrictMode dev) → idempotent.
- **EC-8:** `localStorage` bị clear thủ công → Zustand khôi phục initial `items: []`, không crash.
- **EC-9:** **[REALITY]** `CartItemRow` có `hasPrescription = false` hard-code → toàn bộ khối UI hiển thị chi tiết đơn kính (bảng OD/OS, ảnh, ghi chú) hiện là dead code, không bao giờ render dù item có `prescription`. Xem OQ-6.

---

## 7. Acceptance Criteria (Tiêu chí nghiệm thu — Given/When/Then)

- **AC-1 (Thêm mới):** *Given* giỏ chưa có item khớp key, *When* `addToCart` được gọi, *Then* `items.length` tăng 1 và `isOpen = true`.
- **AC-2 (Cộng dồn):** *Given* giỏ đã có item khớp unique key, *When* `addToCart` cùng key, *Then* `items.length` không đổi và `quantity += newItem.quantity`, `isOpen = true`.
- **AC-3 (Clamp số lượng):** *Given* một item trong giỏ, *When* `updateQuantity(id, 0)` (hoặc số âm), *Then* `quantity = 1`.
- **AC-4 (Xóa item):** *Given* giỏ có nhiều item, *When* `removeFromCart(id)`, *Then* đúng item đó bị xóa, các item còn lại giữ nguyên, `isOpen` không đổi.
- **AC-5 (Persist reload):** *Given* giỏ có item, *When* reload trang / mở lại tab, *Then* `items` (và `isOpen`) giữ nguyên từ `localStorage`.
- **AC-6 (Guest checkout):** *Given* `user` falsy, *When* bấm "Tiến hành thanh toán", *Then* `closeCart()` + `navigate('/login', { state: { from: { pathname: '/checkout' } } })`, giỏ còn nguyên.
- **AC-7 (Clear khi vào cổng TT):** *Given* order tạo thành công, *When* nhận `redirectUrl`/`paymentUrl`, *Then* `clearCart()` được gọi trước khi `window.location.href` chuyển trang.
- **AC-8 (Clear trên payment-success):** *Given* vào `/payment-success`, *When* `useOrderSuccess` chạy xong `finally` (hoặc `orderId === '#UNKNOWN'`), *Then* `clearCart()` + `resetCheckout()` được gọi → `items = []`, `isOpen = false`.
- **AC-9 (Chặn giỏ trống):** *Given* `items.length === 0`, *When* mở Cart Drawer, *Then* footer + nút "Tiến hành thanh toán" không render, hiện empty state.
- **AC-10 (Chặn hết hàng):** *Given* variant `quantity <= 0`, *When* xem `ProductForm`, *Then* nút add `disabled` + label "Sản phẩm tạm hết hàng"; nếu vẫn gọi `handleAddToCart`, store không đổi và toast lỗi hiển thị.
- **AC-11 (Tổng tiền):** *Given* items có `lensPrice > 0`, *When* `getCartTotal()`, *Then* kết quả = `sum((price + lensPrice) * quantity)`.
- **AC-12 (Khóa scroll):** *Given* Drawer mở, *Then* `document.body.style.overflow === 'hidden'`; đóng/unmount → `''`.
- **AC-13 (Badge):** *Given* giỏ có items, *Then* Header badge = tổng `quantity`, badge trong Drawer = `items.length`.

### 7.1 Testing Requirements
- **Unit (store):** add mới / add trùng (cộng dồn) / clamp `updateQuantity` / remove / `clearCart` (reset cả `isOpen`) / `getCartTotal` (gồm lensPrice + fallback 0) / persist rehydrate.
- **Component:** `CartDrawer` empty vs có item; điều hướng checkout theo `user`; body overflow khi mở/đóng; `CartItemRow` nút −/+ và `disabled` khi `quantity <= 1`.
- **Integration:** `ProductForm` add → badge Header tăng; add khi hết hàng (nút disabled) → store không đổi; `useCheckoutFlow` → `clearCart` trước redirect; `/payment-success` → cart clear.
- **E2E:** Guest add → reload → checkout → login → về `/checkout` giỏ nguyên. Login → add 2 sp → chỉnh số lượng → tạo đơn → cổng TT → payment success → giỏ trống.
- **Manual QA:** private/incognito mode; iOS Safari (persist + swipe drawer).

---

## 8. Out of Scope (Phạm vi ngoài)

> **Quan trọng:** Các mục dưới đây hệ thống **KHÔNG** thực hiện ở giai đoạn này.

- **KHÔNG** đồng bộ giỏ giữa nhiều thiết bị (mỗi trình duyệt/máy có state riêng).
- **KHÔNG** tạo bất kỳ HTTP API `/cart` hay dùng collection `carts` server-side nào cho giỏ hàng.
- **KHÔNG** lưu lịch sử giỏ hàng đã xóa.
- **KHÔNG** cho phép chia sẻ giỏ hàng qua link.
- **KHÔNG** merge cart guest ↔ cart user khi đăng nhập.
- **KHÔNG** chặn cứng `quantity ≤ variant.quantity` tại tầng store (chỉ server re-validate) — xem OQ-3.
- **KHÔNG** áp TTL tự xóa giỏ (xem OQ-4).
- **KHÔNG** cho nhập/hiển thị `prescription` từ `ProductForm` (hiện luôn `null`) và không render UI đơn kính trong `CartItemRow` (`hasPrescription = false`) — xem OQ-6.
- Tracking event phễu (`cart_add`, `cart_remove`, `cart_checkout_click`) là **khuyến nghị**, không bắt buộc.

---

## Phụ lục — Dependencies & Open Questions

### A. Dependencies & Integration Points
**Internal:**
- `feature-products`: `ProductForm.jsx` gọi `addToCart`, đọc `variant.quantity`, fetch variants (`/api/products/:id/variants`) và lenses (`/api/products?category=LENS`).
- `feature-checkout`: `useCheckoutFlow.js` đọc `items`, map `orderInfo`, gọi `clearCart` trước redirect; `useOrderSuccess.js` gọi `clearCart` + `resetCheckout`.
- `feature-auth`: `AuthContext` (`user`) quyết định redirect `/login` vs `/checkout` trong `CartDrawer`.
- `components/layout/Header.jsx`: `openCart`, hiển thị badge tổng `quantity`.
- `App.jsx`: mount `<CartDrawer />`.

**Libraries:** `zustand` + `zustand/middleware` (persist), `framer-motion` (`motion`, `AnimatePresence`), `sonner` (toast), `react-router-dom` (`useNavigate`), `lucide-react` (icons), `axios`.
**Browser API:** `localStorage`, `document.body.style`, `window.location.href`.

### B. Rollout
Không feature flag, không DB migration. Nếu tương lai đổi shape `CartItem`, Zustand `persist` cần **`version` bump + `migrate`** để tránh crash rehydrate. Rollback = revert PR client-side.

### C. Open Questions
- **OQ-1:** Có cần đồng bộ giỏ lên server khi login (multi-device)? — Owner: Product — Due: 2026-08-01. Trade-off: phá vỡ ADR-006.
- **OQ-2:** Unique key thiếu `variantId` → 2 variants cùng product (cùng lens/prescription) va cùng dòng. Đề xuất `${variantId}-${lensId}-${JSON.stringify(prescription)}`. — Owner: FE Lead — Due: 2026-07-25.
- **OQ-3:** Có nên chặn cứng `quantity ≤ variant.quantity` tại tầng store/CartItemRow? — Owner: FE Lead — Due: 2026-07-25.
- **OQ-4:** Có cần TTL tự xóa giỏ sau N ngày để tránh giá cũ? — Owner: Product — Due: 2026-08-15.
- **OQ-5:** Header badge (tổng `quantity`) và Drawer badge (`items.length`) đếm khác nhau — có chủ đích hay cần đồng nhất? — Owner: FE Lead — Due: 2026-07-25.
- **OQ-6:** `ProductForm` gửi `prescription: null` và `CartItemRow` hard-code `hasPrescription = false` → luồng đơn kính chưa hoạt động ở giỏ hàng. Kích hoạt hay gỡ dead code? — Owner: FE Lead — Due: 2026-07-25.
</content>
</invoke>
