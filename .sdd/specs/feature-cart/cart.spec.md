# Feature: Giỏ hàng (Cart) — SPECIFICATION

**Status:** Approved
**Author:** AI Agent | **Tech Lead Approval:** —
**Date:** 2026-07-21 (rà lại từ bản 2026-07-19)
**Risk Level:** Low (client-only state, không đụng server, không nhạy cảm PCI/DSS)
**Related Specs:** `feature-checkout`, `feature-products` (bản 2026-07-19), `feature-auth`
**Cấu trúc:** Tuân theo `docs/spec.md` — 8 thành phần cốt lõi + EARS Notation.

> **Ghi chú phiên bản:** . Thay đổi lớn nhất ở bản
> 2026-07-19: bổ sung luồng **Quick-Add từ trang danh sách** và sửa trích dẫn
> LESSON-002 → cơ chế đúng là `PricingService` server-side; đã triển khai fix
> OQ-2, 4, 5, 6, 7 và đóng OQ-1, 3 (xem Phụ lục C) — hành vi **sau** fix đánh
> dấu **[ĐÃ VÁ]**.
> **Cập nhật 2026-07-21:** đối chiếu lại phát hiện **[REALITY-2026-07-21]**
> form NHẬP đơn kính ĐÃ TỒN TẠI phía trang chi tiết (`PrescriptionModal.jsx`
>
> - `usePrescriptionStore.js`), hiện qua khi khách chọn tròng — đóng OQ-6
>   (khối hiển thị nay có dữ liệu thật để render). Đường **quick-add vẫn gửi
>   `prescription: null`**. Các mục mô tả sai "chưa có form nhập" đã được sửa.

---

## 1. Context & Goal (Bối cảnh & Mục tiêu)

Giỏ hàng là bước đệm giữa Browse (xem sản phẩm) và Checkout (thanh toán) trong hệ thống Optics Management. Khách hàng tích lũy các biến thể gọng kính (`ProductVariant`) — kèm hoặc không kèm tròng (model `Lens` riêng, API `/api/lenses`) — trước khi chuyển sang `/checkout`.

**Pain point:** Nếu lưu giỏ tạm lên MongoDB, backend phải xử lý merge cart guest ↔ cart user, gánh tải DB cho dữ liệu chỉ có giá trị tạm thời và không nhạy cảm. Giỏ hàng client-only loại bỏ toàn bộ chi phí đó (**ADR-006**, `docs/architecture.md`).

**Mục tiêu:**

- Thao tác thêm/xóa/sửa số lượng tức thì, không phụ thuộc mạng.
- Giữ nguyên giỏ khi reload trang hoặc đóng trình duyệt (persist `localStorage`).
- Không tạo tải cho MongoDB, không cần API `/cart` phía Backend.
- Khi khách chuyển sang cổng thanh toán / hoàn tất đặt đơn, giỏ được làm trống để tránh đặt trùng.

---

## 2. Actors & Roles (Tác nhân & Vai trò)

| Actor                      | Vai trò        | Phân quyền với Cart                                                                                                                                |
| :------------------------- | :------------- | :------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Khách vãng lai (Guest)** | Chưa đăng nhập | Thêm/xóa/sửa số lượng bình thường. Bấm "Tiến hành thanh toán" → điều hướng `/login` với `state.from = { pathname: '/checkout' }` (giữ nguyên giỏ). |
| **Khách hàng (CUSTOMER)**  | Đã đăng nhập   | Thêm/xóa/điều chỉnh giỏ, đi thẳng `/checkout`.                                                                                                     |
| **MANAGER / ADMIN**        | Quản trị       | KHÔNG có quyền đọc/ghi giỏ của user khác (cart nằm trong `localStorage` trình duyệt, không tồn tại server-side).                                   |
| **Frontend Developer**     | Team FE        | Tiêu thụ store `useCartStore` (Zustand + persist), không xử lý sync server.                                                                        |
| **Hệ thống Checkout**      | Internal       | Đọc `items` để build `orderInfo`; server (`PricingService`) là source-of-truth về giá/tồn kho — cart chỉ hiển thị.                                 |

---

## 3. Functional Requirements (Yêu cầu chức năng — EARS)

> Nguồn hành vi: `src/frontend/src/feature/product/store/useCartStore.js`,
> `CartDrawer.jsx`, `CartItemRow.jsx`, `ProductForm.jsx`,
> `feature/product/components/PrescriptionModal.jsx`, `feature/product/store/usePrescriptionStore.js`,
> **`pages/ProductsPage.jsx`** (quick-add),
> `feature/checkout/store/useCheckoutFlow.js`, `feature/checkout/hooks/useOrderSuccess.js`,
> `components/layout/Header.jsx`.

### 3.1 Ubiquitous (Luôn luôn đúng)

- **U-1:** THE Cart store SHALL persist state vào `localStorage` dưới key `vision-cart-storage` với `version: 1` (Zustand `persist`, lưu `items`, `isOpen`, `updatedAt`).
- **U-2:** THE hệ thống SHALL NOT expose bất kỳ HTTP endpoint nào dưới `/cart`; cart không bao giờ rời khỏi trình duyệt (đã xác minh: `models/Cart.js` không được import ở bất kỳ route/controller nào).
- **U-3:** **[ĐÃ VÁ — OQ-2]** THE unique key của một dòng giỏ SHALL là `${productId}-${variantId || 'default'}-${lensId}-${JSON.stringify(prescription)}` (hàm `buildItemId`) — 2 variants của cùng product là 2 dòng riêng. Giỏ cũ (v0) được `migrate` tính lại id từ dữ liệu item, KHÔNG bị xóa.
- **U-4:** THE mọi mutation (`addToCart`/`removeFromCart`/`updateQuantity`/`clearCart`) SHALL cập nhật `updatedAt = Date.now()` để phục vụ TTL (O-2).

### 3.2 Event-driven (Kích hoạt bằng sự kiện)

**Hai đường vào giỏ:** **[REALITY-NEW]** Ngoài `ProductForm` (trang chi tiết), còn có `ProductsPage.handleQuickAddToCart` (nút giỏ hàng trên card danh sách) — bản spec trước bỏ sót đường này.

- **E-1:** WHEN `addToCart(payload)` được gọi với key CHƯA có trong store, THE store SHALL append item mới `{ ...payload, id }` và set `isOpen = true`.
- **E-2:** WHEN `addToCart(payload)` được gọi với key ĐÃ tồn tại, THE store SHALL cộng dồn `quantity += newItem.quantity`, **giữ nguyên mọi thuộc tính còn lại của item cũ** (item vào trước "thắng" về `variantId`/`name`/`price`), và set `isOpen = true`.
  - **[REALITY]** Cả hai đường add đều gửi `quantity: 1`, nên mỗi lần add trùng cộng đúng 1.
- **E-3:** WHEN khách bấm add từ **trang chi tiết** (`ProductForm.handleAddToCart`), THE payload SHALL gồm `productId`, `variantId`, `name = "${product.name} - ${variant.colorName}"`, `price` (giá variant), `lensId`/`lensName`/`lensPrice` (nếu chọn tròng), `orderType: 'buy-now'`, và `prescription` (xem E-10); và SHALL bị chặn khi chưa chọn variant hoặc variant hết hàng (N-1).
- **E-10:** **[REALITY-2026-07-21]** WHEN khách chọn một tròng (`selectedLensId !== 'none'`) ở trang chi tiết, THE `ProductForm` SHALL render `PrescriptionWidget` (`PrescriptionModal.jsx`) để khách nhập đơn kính qua **ảnh** (upload → base64 `data:` URL vào `prescription.imageUrl`) hoặc **thủ công** (OD/OS: `sphere`/`cylinder`/`axis`/`add`/`pd`) + `notes`, lưu vào `usePrescriptionStore`. WHEN `handleAddToCart`, THE payload `prescription` SHALL = `{ ...prescription }` NẾU có tròng VÀ có ít nhất một trong (`imageUrl`, `od.sphere`, `od.cylinder`, `os.sphere`, `os.cylinder`, `notes`) — gọi là `hasPrescriptionData`; NGƯỢC LẠI `prescription = null`. Sau khi add, `resetPrescription()` chạy và `selectedLensId` về `'none'`.
- **E-4:** **[ĐÃ VÁ — OQ-7]** WHEN khách bấm quick-add từ **trang danh sách** (`ProductsPage.handleQuickAddToCart`), THE FE SHALL fetch `GET /api/products/:id/variants`, chọn **variant đầu tiên có `quantity > 0` và `status ACTIVE`**, rồi add payload đầy đủ: `productId`, `variantId`, `name = "${product.name} - ${colorName}"`, `price` (giá variant), `lensId: null`, `lensName: null`, `lensPrice: 0`, `prescription: null`. WHERE không có variant nào còn hàng, SHALL toast lỗi "đã tạm hết hàng" và KHÔNG add; WHERE request variants lỗi, SHALL toast lỗi chung và KHÔNG add.
- **E-5:** WHEN `updateQuantity(id, q)` được gọi, THE store SHALL set `quantity = Math.max(1, q)` cho đúng item đó (clamp sàn 1).
- **E-6:** WHEN `removeFromCart(id)` được gọi, THE store SHALL filter bỏ đúng item đó; item khác giữ nguyên; **không** đổi `isOpen`.
- **E-7:** WHEN `clearCart()` được gọi, THE store SHALL set `items = []` VÀ `isOpen = false`. **[REALITY]** `clearCart()` được gọi tại **hai** nơi:
  1. `useCheckoutFlow.submitOrder` — sau khi tạo đơn + lấy được `redirectUrl`/`paymentUrl`, gọi `clearCart()` rồi `setTimeout(() => window.location.href = ..., 1000)`.
  2. `useOrderSuccess` — trong `finally` sau khi load chi tiết đơn trên `/payment-success` (và cả nhánh `orderId === '#UNKNOWN'`), kèm `resetCheckout()`. Gọi lặp là idempotent.
- **E-8:** WHEN user bấm "Mua sắm ngay" ở empty state của Drawer, THE Drawer SHALL `closeCart()` rồi `navigate('/products')`.
- **E-9:** WHEN user bấm "Tiến hành thanh toán", THE Drawer SHALL `closeCart()`, sau đó điều hướng `/checkout` (nếu `user` truthy) hoặc `/login` với `state.from = { pathname: '/checkout' }`.

### 3.3 State-driven (Khi ở trạng thái)

- **S-1:** WHILE `items.length === 0`, THE Drawer footer (Thành tiền + nút thanh toán) SHALL không render; body hiển thị empty state với nút "Mua sắm ngay".
- **S-2:** WHILE Drawer mở (`isOpen === true`), THE `document.body.style.overflow` SHALL là `'hidden'`; đóng hoặc unmount → reset `''`.
- **S-3:** **[ĐÃ VÁ — OQ-5]** WHILE `items.length > 0`, THE cả Header badge LẪN Drawer badge SHALL hiển thị **tổng `quantity`** (`reduce`) — đã đồng nhất; cả hai đều có `aria-label="<n> sản phẩm trong giỏ hàng"`.
- **S-4:** WHILE variant đang chọn có `quantity <= 0` (trang chi tiết), THE nút "Thêm vào giỏ hàng" SHALL `disabled` + label "Sản phẩm tạm hết hàng". Product không có variant nào → `ProductForm` dựng variant mặc định `quantity: 0` → cũng bị chặn (xem spec products S-3).
- **S-5:** WHILE item có `lensId`, THE `CartItemRow` SHALL hiển thị badge "Kèm Tròng" + `lensName` + `lensPrice`; tổng dòng = `(price + lensPrice) * quantity`.

### 3.4 Optional / Where (Tùy chọn)

- **O-1:** WHERE `localStorage` không khả dụng (private mode, quota exceeded), THE Zustand `persist` SHALL fallback in-memory — cart vẫn hoạt động trong phiên.
- **O-2:** **[ĐÃ VÁ — OQ-4]** WHERE giỏ không được đụng tới quá **30 ngày** (`updatedAt` cũ hơn `CART_TTL_MS`), THE store SHALL làm trống `items` ngay khi rehydrate (`onRehydrateStorage`) — tránh khách quay lại thấy giá hiển thị quá cũ.

### 3.5 Unwanted (Lỗi / Edge Case)

- **N-1:** WHERE variant hết hàng tại thời điểm add, THE cả hai đường add SHALL chặn và toast lỗi: trang chi tiết chặn qua `isOutOfStock` (`ProductForm`), trang danh sách chặn qua fetch variants lúc bấm (E-4). **[REALITY]** Kiểm tra tồn kho vẫn nằm ở tầng component, KHÔNG ở store (by design — OQ-3 đã đóng).
- **N-2:** THE store SHALL NOT lưu JWT token hay PII ngoài các trường product-facing hiện có.
- **N-3:** THE store SHALL NOT expose function cho MANAGER/ADMIN đọc cart của user khác.

---

## 4. Non-functional Requirements (Yêu cầu phi chức năng)

### 4.1 Performance

- Thao tác store (add/remove/update) `< 5 ms` trên thiết bị tầm trung (thao tác mảng thuần).
- `getCartTotal()` O(n) `reduce` — chấp nhận vì `n` thực tế nhỏ.
- Persist ghi `localStorage` synchronous mỗi lần state đổi.
- Drawer animation `0.35s` (framer-motion tween, `ease: 'easeInOut'`).

### 4.2 Security

- Không lưu token JWT hay mật khẩu vào cart store.
- **[SỬA TRÍCH DẪN]** Server luôn re-validate giá và tồn kho khi tạo đơn: `PricingService.priceOrderItem` đọc giá từ DB theo variant (bản trước dẫn LESSON-002 là nhầm — LESSON-002 trong `docs/architecture.md` nói về checksum VNPay). `price`/`lensPrice` phía client **chỉ để hiển thị**.
- XSS: `item.name`, `item.image`, `item.lensName` render qua React (tự escape); không dùng `dangerouslySetInnerHTML`.
- `localStorage` same-origin isolation đủ cho mức rủi ro của dữ liệu này.

### 4.3 Scalability & Availability

- Không tác động backend → không có bottleneck server.
- Cart hoạt động 100% offline (add/remove/view); availability = availability trình duyệt.

### 4.4 Accessibility & UX

- Drawer có nút đóng (`X`) và overlay bấm-ngoài-để-đóng.
- Nút giảm số lượng `disabled` khi `quantity <= 1`.
- **[ĐÃ VÁ]** Badge số lượng (Header + Drawer) đã có `aria-label` mô tả số sản phẩm.

---

## 5. Data Model (Mô hình dữ liệu)

**Không có thay đổi schema DB.**

- Collection `carts` (`src/backend/models/Cart.js`: `user_id`, `product_id`, `variant_id`, `lens_id`, `quantity`) TỒN TẠI nhưng **không được import/sử dụng** ở bất kỳ route/controller nào (đã re-verify 2026-07-19). Giữ lại chỉ vì lịch sử (ADR-006). Không migrate, không seed, không index.
- Không thêm collection mới; không đổi `Product`, `ProductVariant`, `Order`, `OrderItem`.

### 5.1 Client-only state — Zustand Store `useCartStore`

Path: `src/frontend/src/feature/product/store/useCartStore.js` · Persist key: `vision-cart-storage`

```ts
// [REALITY] Prescription trong CartItem là dạng LỒNG (nested), không phải phẳng.
// Dạng phẳng (odSphere, ...) chỉ được map ở useCheckoutFlow khi tạo đơn.
// [REALITY-2026-07-21] Nguồn nhập là PrescriptionWidget (trang chi tiết, khi có tròng):
// od/os { sphere, cylinder, axis, add, pd }, imageUrl (data: base64), notes.
type Prescription = {
  od?: {
    sphere?: string | number;
    cylinder?: string | number;
    axis?: string | number;
    add?: string | number;
    pd?: string | number;
  };
  os?: {
    sphere?: string | number;
    cylinder?: string | number;
    axis?: string | number;
    add?: string | number;
    pd?: string | number;
  };
  imageUrl?: string; // ảnh đơn kính (có thể là data: URL)
  notes?: string;
} | null;

type CartItem = {
  id: string; // buildItemId: `${productId}-${variantId || 'default'}-${lensId}-${JSON.stringify(prescription)}`
  productId: string; // Product._id (gọng)
  variantId?: string; // ProductVariant._id — cả 2 đường add đều gửi; chỉ thiếu ở item cũ migrate từ v0
  name: string; // `${product.name} - ${variant.colorName}` (cả 2 đường)
  price: number; // Giá variant (chỉ hiển thị; server là source of truth khi tạo đơn)
  image: string; // URL đã chuẩn hóa qua getDisplayImageUrl
  quantity: number; // >= 1 (cả hai đường add đều khởi tạo 1)
  orderType: "buy-now" | "pre-order"; // hiện cả hai đường luôn set 'buy-now'
  lensId: string | null;
  lensName: string | null; // quick-add luôn null (không chọn tròng từ danh sách)
  lensPrice: number; // quick-add luôn 0
  prescription: Prescription; // [REALITY-2026-07-21] detail-add: object khi có tròng + nhập đơn kính, ngược lại null; quick-add luôn null
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  updatedAt: number | null; // Date.now() của mutation gần nhất — phục vụ TTL 30 ngày
  addToCart: (newItem: Omit<CartItem, "id">) => void; // gen id, cộng dồn nếu trùng, isOpen=true
  removeFromCart: (id: string) => void; // filter; KHÔNG đổi isOpen
  updateQuantity: (id: string, quantity: number) => void; // Math.max(1, quantity)
  clearCart: () => void; // items=[] và isOpen=false
  getCartTotal: () => number; // sum((price||0 + lensPrice||0) * quantity)
  openCart: () => void;
  closeCart: () => void;
};
```

### 5.2 Contract với Checkout API (Backend)

Khi tạo đơn, `useCheckoutFlow.submitOrder` đọc `items` rồi build `orderInfo`. **[REALITY]** Shape đầy đủ (bản trước thiếu `comboId`, `bankInfo`, thông tin người nhận):

```json
{
  "deliveryAddress": "<shippingData.address>",
  "recipientName": "<shippingData.name>",
  "phoneNumber": "<shippingData.phone>",
  "comboId": null,
  "bankInfo": {
    "bankName": "...",
    "bankAccountNumber": "...",
    "accountHolderName": "..."
  },
  "items": [
    {
      "productVariantId": "<variantId || productId>",
      "quantity": 2,
      "lensId": "<lensId | null>",
      "prescription": { "odSphere": 0, "...": 0, "note": "" }
    }
  ]
}
```

- `productVariantId` fallback về `item.productId` khi thiếu `variantId` — sau fix OQ-7 chỉ còn xảy ra với **item cũ migrate từ giỏ v0** (quick-add trước 2026-07-19); backend `PricingService` fallback `findOne({ productId, status: 'ACTIVE' })` vẫn đỡ được các item này (xem spec products §5.3).
- `bankInfo` = `null` nếu không điền đủ 3 trường; điền một phần → chặn validate ở FE (bước 2).
- `prescription` = `null` nếu item không có; validate SĐT `^[0-9+]{9,15}$` trước khi submit.
- **[REALITY-NEW]** Ảnh đơn kính: chỉ lấy từ **item ĐẦU TIÊN** có `prescription.imageUrl` dạng `data:image/` (`items.find`), append 1 file `prescriptionImage` duy nhất cho **cả đơn** — nhiều item có ảnh khác nhau thì các ảnh sau bị bỏ.
- **[REALITY-NEW]** `paymentMethod` gửi lên server: `MOCK_SUCCESS`/`MOCK_FAILURE` được map thành `'VNPAY'` để khớp CSDL.

Gọi qua `paymentApi` (`feature/checkout/api/checkout-api.js`): `createOrder(formData, paymentMethod)` → `mockCheckout(orderId, 'SUCCESS'|'FAILURE')` hoặc `checkoutVnpay(orderId)` → nhận `redirectUrl`/`paymentUrl` → `clearCart()` → redirect sau 1s. Xem `docs/API_Document.md` (§ Checkout / Orders).

---

## 6. Error Handling (Xử lý lỗi)

| Mã           | Tình huống                                                     | Xử lý                                                                                   | UI feedback                                                        |
| :----------- | :------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------- |
| **CART-E01** | Add ở trang chi tiết khi chưa có biến thể (`!selectedVariant`) | Chặn ở `ProductForm.handleAddToCart`                                                    | Toast: "Vui lòng chọn phiên bản gọng kính!"                        |
| **CART-E02** | Biến thể hết hàng (`isOutOfStock`) ở trang chi tiết            | Chặn add + nút `disabled`                                                               | Toast: "Rất tiếc, phiên bản bạn chọn đã hết hàng!"                 |
| **CART-E03** | Quick-add sản phẩm hết hàng / lỗi fetch variants               | **[ĐÃ VÁ — OQ-7]** Fetch variants lúc bấm; không còn variant ACTIVE còn hàng → chặn add | Toast: "Rất tiếc, ... đã tạm hết hàng!" / "Không thể thêm vào giỏ" |
| **CART-E04** | Guest bấm "Tiến hành thanh toán"                               | Redirect `/login` với `state.from = { pathname: '/checkout' }`                          | Điều hướng silent                                                  |
| **CART-E05** | `localStorage` đầy / disable                                   | Zustand `persist` fallback in-memory                                                    | Không UI                                                           |
| **CART-E06** | JSON corrupt trong `localStorage`                              | `persist` rehydrate lỗi → fallback `items: []`                                          | Cart trống, không crash                                            |
| **CART-E07** | Server báo `OUT_OF_STOCK` / `VARIANT_NOT_FOUND` khi tạo đơn    | Ngoài scope Cart; `useCheckoutFlow` catch, đọc `error.response.data.message`            | Toast "Đặt hàng thất bại" phía checkout                            |
| **CART-E08** | Item thiếu `price`/`lensPrice` (vd item cũ migrate từ giỏ v0)  | Fallback `0` trong `getCartTotal`/`CartItemRow`                                         | Không crash                                                        |

Không có HTTP status code trong bản thân feature Cart vì store không gọi server.

### 6.1 Edge Cases & Corner Cases

- **EC-1:** Item đã vào giỏ, admin xóa variant (hoặc xóa product → **cascade xóa variants**, hành vi mới của feature-products 2026-07-19) → khi checkout, server trả `VARIANT_NOT_FOUND`. Cart không tự đồng bộ; `feature-checkout` xử lý toast.
- **EC-2:** Thêm nhiều biến thể cùng Product nhưng khác `lensId`/`prescription` → là các dòng riêng (key khác nhau).
- **EC-3:** Giá đổi giữa lúc add và checkout → UI hiển thị giá cũ, server tính giá mới (source of truth).
- **EC-4:** 2 tab cùng `localStorage`; sau reload state đồng bộ.
- **EC-5:** Đăng xuất → Cart KHÔNG bị xóa (thuộc trình duyệt). Guest kế tiếp trên cùng máy thấy cart cũ. Rủi ro thấp, chấp nhận.
- **EC-6:** **[ĐÃ VÁ — OQ-2]** Key đã chứa `variantId` → 2 variants cùng product là 2 dòng riêng. Giỏ cũ trong `localStorage` được migrate v0→v1 (tính lại id), không mất dữ liệu.
- **EC-7:** `clearCart` gọi nhiều lần (redirect + `/payment-success`, React StrictMode dev) → idempotent.
- **EC-8:** `localStorage` bị clear thủ công → khôi phục initial `items: []`, không crash.
- **EC-9:** **[ĐÃ VÁ — OQ-6, cập nhật 2026-07-21]** `hasPrescription` trong `CartItemRow` tính từ dữ liệu (`hasImage || hasManualInput`). Nay khối chi tiết đơn kính **thực sự render** vì detail-add đã có thể gửi `prescription` object (E-10) khi khách chọn tròng và nhập ảnh/độ. Đường quick-add vẫn gửi `null` nên item quick-add không hiện khối này.
- **EC-10:** **[ĐÃ VÁ — OQ-7]** Quick-add fetch variants lúc bấm → hết hàng bị chặn tại chỗ với toast lỗi, không còn vào giỏ rồi mới fail ở checkout.
- **EC-11:** **[ĐÃ VÁ — OQ-2 + OQ-7]** Quick-add giờ có `variantId` thật và key có `variantId` → không còn va chạm nuốt lựa chọn variant; add cùng variant từ 2 nơi thì cộng dồn đúng dòng.
- **EC-12:** **[REALITY-NEW]** Sản phẩm chuyển `INACTIVE` sau khi đã vào giỏ: trang chi tiết trả 404 với khách (hành vi mới feature-products), nhưng item trong giỏ vẫn đặt đơn được vì `PricingService` tra theo **variant**, không kiểm tra `Product.status`. Ghi nhận, thuộc scope checkout.

---

## 7. Acceptance Criteria (Tiêu chí nghiệm thu — Given/When/Then)

- **AC-1 (Thêm mới):** _Given_ giỏ chưa có item khớp key, _When_ `addToCart`, _Then_ `items.length` +1 và `isOpen = true`.
- **AC-2 (Cộng dồn):** _Given_ giỏ có item khớp key, _When_ `addToCart` cùng key, _Then_ `items.length` không đổi, `quantity += newItem.quantity`, thuộc tính khác giữ theo item cũ, `isOpen = true`.
- **AC-3 (Clamp số lượng):** _When_ `updateQuantity(id, 0)` (hoặc âm), _Then_ `quantity = 1`.
- **AC-4 (Xóa item):** _When_ `removeFromCart(id)`, _Then_ đúng item đó bị xóa, item khác giữ nguyên, `isOpen` không đổi.
- **AC-5 (Persist reload):** _Given_ giỏ có item, _When_ reload / mở lại tab, _Then_ `items` (và `isOpen`) khôi phục từ `localStorage`.
- **AC-6 (Guest checkout):** _Given_ `user` falsy, _When_ bấm thanh toán, _Then_ `closeCart()` + `navigate('/login', { state: { from: { pathname: '/checkout' } } })`, giỏ còn nguyên.
- **AC-7 (Clear khi vào cổng TT):** _Given_ order tạo thành công, _When_ nhận `redirectUrl`/`paymentUrl`, _Then_ `clearCart()` chạy trước `window.location.href` (redirect delay 1s).
- **AC-8 (Clear trên payment-success):** _When_ `useOrderSuccess` chạy xong `finally` (hoặc `orderId === '#UNKNOWN'`), _Then_ `clearCart()` + `resetCheckout()` → `items = []`, `isOpen = false`.
- **AC-9 (Chặn giỏ trống):** _Given_ `items.length === 0`, _Then_ footer + nút thanh toán không render, hiện empty state.
- **AC-10 (Chặn hết hàng — trang chi tiết):** _Given_ variant `quantity <= 0`, _Then_ nút add `disabled` + "Sản phẩm tạm hết hàng"; gọi tay `handleAddToCart` → store không đổi + toast lỗi.
- **AC-11 (Tổng tiền):** _Given_ items có `lensPrice > 0` lẫn item cũ (migrate v0) thiếu `lensPrice`, _When_ `getCartTotal()`, _Then_ kết quả = `sum((price||0 + lensPrice||0) * quantity)`, không NaN.
- **AC-12 (Khóa scroll):** _Given_ Drawer mở, _Then_ `document.body.style.overflow === 'hidden'`; đóng/unmount → `''`.
- **AC-13 (Badge):** _Given_ giỏ có items, _Then_ Header badge VÀ Drawer badge đều = tổng `quantity`, kèm `aria-label`.
- **AC-14 (Quick-add):** _Given_ product X có variant còn hàng, _When_ bấm nút giỏ trên card ở `/products`, _Then_ item mới có `variantId`, `name = "X - <colorName>"`, `price` = giá variant, toast success, Drawer mở; _Given_ mọi variant hết hàng, _Then_ toast "đã tạm hết hàng" và giỏ KHÔNG đổi.
- **AC-15 (Tách dòng theo variant):** _Given_ đã add variant A của product X, _When_ add variant B của X (cùng không tròng), _Then_ giỏ có **2 dòng riêng**; add lại đúng variant A (từ bất kỳ đường nào) → cộng dồn dòng A.
- **AC-16 (Migrate v0→v1):** _Given_ `localStorage` chứa giỏ format cũ (id không có variantId), _When_ app khởi động, _Then_ items giữ nguyên, mỗi item được gán id mới theo `buildItemId`, không crash, không mất giỏ.
- **AC-17 (TTL):** _Given_ `updatedAt` cũ hơn 30 ngày và giỏ có item, _When_ app khởi động (rehydrate), _Then_ `items = []`; `updatedAt` mới hơn 30 ngày → giỏ giữ nguyên.
- **AC-18 (Nhập đơn kính — detail-add):** **[REALITY-2026-07-21]** _Given_ trang chi tiết đã chọn tròng và nhập ảnh/độ trong `PrescriptionWidget`, _When_ `handleAddToCart`, _Then_ item có `prescription` object (ảnh `data:` hoặc od/os/notes), `CartItemRow` hiển thị khối chi tiết đơn kính; _Given_ chọn tròng nhưng bỏ trống mọi trường, _Then_ `prescription = null`. Sau add, `usePrescriptionStore` được reset và `selectedLensId` về `'none'`.

### 7.1 Testing Requirements

- **Unit (store):** add mới / add trùng (cộng dồn) / tách dòng theo `variantId` / clamp / remove / clearCart (reset cả `isOpen`) / getCartTotal (lensPrice + fallback 0) / `migrate` v0→v1 / TTL rehydrate (quá hạn vs còn hạn).
- **Component:** `CartDrawer` empty vs có item; badge = tổng quantity + `aria-label`; điều hướng theo `user`; body overflow; `CartItemRow` nút −/+ (`disabled` khi `quantity <= 1`), hiển thị "Kèm Tròng", khối prescription render khi có dữ liệu; **`PrescriptionWidget`: chuyển tab ảnh/thủ công, upload ảnh → base64, nhập OD/OS + notes cập nhật `usePrescriptionStore`.**
- **Integration:** `ProductForm` add → Header badge tăng; add hết hàng → store không đổi; **quick-add fetch variants → item có `variantId`, hết hàng bị chặn với toast**; `useCheckoutFlow` → `clearCart` trước redirect; `/payment-success` → giỏ trống.
- **E2E:** Guest add → reload → thanh toán → login → về `/checkout` giỏ nguyên. Login → add 2 SP (1 quick-add + 1 detail-add kèm tròng) → chỉnh số lượng → tạo đơn → cổng TT → payment-success → giỏ trống.
- **Manual QA:** private/incognito; iOS Safari (persist + swipe drawer).

---

## 8. Out of Scope (Phạm vi ngoài)

> **Quan trọng:** Các mục dưới đây hệ thống **KHÔNG** thực hiện ở giai đoạn này.

- **KHÔNG** đồng bộ giỏ giữa nhiều thiết bị (mỗi trình duyệt có state riêng).
- **KHÔNG** tạo HTTP API `/cart` hay dùng collection `carts` server-side.
- **KHÔNG** lưu lịch sử giỏ đã xóa; **KHÔNG** chia sẻ giỏ qua link.
- **KHÔNG** merge cart guest ↔ cart user khi đăng nhập.
- **KHÔNG** chặn cứng `quantity ≤ variant.quantity` tại tầng store (server re-validate; quyết định đóng OQ-3 — store không có dữ liệu tồn kho, chặn realtime đòi hỏi gọi API mỗi lần bấm "+").
- **[CẬP NHẬT 2026-07-21]** Form NHẬP `prescription` **đã có** ở trang chi tiết (`PrescriptionWidget`, hiện khi chọn tròng) — không còn ngoài scope. Đường **quick-add** vẫn KHÔNG nhập đơn kính (gửi `null`); muốn kèm đơn kính thì vào trang chi tiết.
- **KHÔNG** cho khách chọn màu/size ngay trên card quick-add — hệ thống tự lấy variant ACTIVE còn hàng đầu tiên; muốn chọn cụ thể thì vào trang chi tiết.
- **KHÔNG** áp dụng logic giảm giá riêng cho cart (không làm tính năng khuyến mãi — theo quyết định 2026-07-19 ở feature-products; `price` quick-add dùng `discountPrice||price` chỉ là hiển thị dữ liệu tồn dư).
- Tracking event phễu (`cart_add`, `cart_remove`, `cart_checkout_click`) là **khuyến nghị**, không bắt buộc.

---

## Phụ lục — Dependencies & Open Questions

### A. Dependencies & Integration Points

**Internal:**

- `feature-products`: `ProductForm.jsx` (add có variant + tròng, đọc `variant.quantity`, fetch `/api/products/:id/variants` và **`/api/lenses`** — [CẬP NHẬT 2026-07-22] tròng tách model `Lens` riêng, không còn `?category=LENS`); **`ProductsPage.jsx`** (quick-add không variant). Lưu ý thay đổi 2026-07-19 phía products: xóa product cascade xóa variants (ảnh hưởng EC-1), khách bị chặn xem chi tiết `INACTIVE` (EC-12).
- `feature-checkout`: `useCheckoutFlow.js` build `orderInfo` (map prescription phẳng, bankInfo, mock→VNPAY), `clearCart` trước redirect; `useOrderSuccess.js` `clearCart` + `resetCheckout`; backend `PricingService` fallback variant khi `productVariantId` là productId.
- `feature-auth`: `AuthContext.user` quyết định `/checkout` vs `/login` trong `CartDrawer`.
- `components/layout/Header.jsx`: `openCart` + badge tổng `quantity`.
- `App.jsx`: mount `<CartDrawer />`.

**Libraries:** `zustand` (+`persist`), `framer-motion`, `sonner`, `react-router-dom`, `lucide-react`, `axios`.
**Browser API:** `localStorage`, `document.body.style`, `window.location.href`, `fetch` (blob ảnh prescription).

### B. Rollout

Không feature flag, không DB migration. **Đã áp dụng** `persist` `version: 1` + `migrate` (2026-07-19) khi đổi format key — giỏ cũ của khách được tính lại id, không mất. Lần đổi shape tiếp theo: bump `version: 2` và viết `migrate` tương ứng. Rollback = revert PR client-side (lưu ý: rollback về v0 sẽ làm giỏ đã migrate lên v1 bị Zustand bỏ qua vì version cao hơn — chấp nhận được với dữ liệu giỏ).

### C. Open Questions — trạng thái 2026-07-19

Tất cả OQ đã xử lý hoặc đóng; giữ số thứ tự làm changelog.

- ✖️ **OQ-1 [ĐÃ ĐÓNG]:** Không đồng bộ giỏ lên server — giữ client-only theo ADR-006. Dữ liệu giỏ giá trị thấp, server đã re-validate giá/tồn kho; chi phí merge multi-device không đáng. Mở lại chỉ khi có số liệu khách đổi thiết bị giữa phễu mua.
- ✅ **OQ-2 [ĐÃ XỬ LÝ]:** Key mới `buildItemId` có `variantId || 'default'`; `persist` `version: 1` + `migrate` tính lại id cho giỏ cũ (`useCartStore.js`).
- ✖️ **OQ-3 [ĐÃ ĐÓNG]:** Không chặn cứng `quantity ≤ variant.quantity` ở store — store không có dữ liệu tồn kho, server là chốt chặn cuối (`OUT_OF_STOCK`). Cải thiện message lỗi checkout thuộc scope `feature-checkout`.
- ✅ **OQ-4 [ĐÃ XỬ LÝ]:** TTL 30 ngày qua `updatedAt` + `onRehydrateStorage` — giỏ quá hạn tự làm trống khi khôi phục.
- ✅ **OQ-5 [ĐÃ XỬ LÝ]:** Drawer badge đổi sang tổng `quantity` (đồng nhất với Header); cả hai badge có `aria-label`.
- ✅ **OQ-6 [ĐÃ ĐÓNG — 2026-07-21]:** `hasPrescription = hasImage || hasManualInput` (`CartItemRow.jsx`) hiển thị; và **form NHẬP đơn kính đã có** — `PrescriptionWidget` (`PrescriptionModal.jsx`) + `usePrescriptionStore.js`, hiện ở trang chi tiết khi chọn tròng (E-10). Detail-add nay gửi `prescription` object thật → khối hiển thị render. Mapping phẳng ở `useCheckoutFlow` (`odSphere`... + `prescriptionImage`) hoạt động end-to-end. Quick-add vẫn `null` (by design).
- ✅ **OQ-7 [ĐÃ XỬ LÝ — phương án (b)]:** `handleQuickAddToCart` fetch `GET /:id/variants`, chọn variant ACTIVE còn hàng đầu tiên, add kèm `variantId` + giá variant; hết hàng/lỗi → toast, không add (`ProductsPage.jsx`).
