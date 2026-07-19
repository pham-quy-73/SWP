import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Giỏ không được đụng tới quá 30 ngày sẽ tự làm trống khi khôi phục,
// tránh khách quay lại thấy giá hiển thị đã quá cũ (server vẫn là source of truth về giá).
const CART_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// Key phân biệt dòng giỏ: có variantId để 2 màu/size của cùng product là 2 dòng riêng.
// Item cũ (trước v1) không có variantId sẽ rơi về 'default'.
const buildItemId = (item) =>
  `${item.productId}-${item.variantId || 'default'}-${item.lensId}-${JSON.stringify(item.prescription)}`;

export const useCartStore = create()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      updatedAt: null,

      addToCart: (newItem) =>
        set((state) => {
          const uniqueId = buildItemId(newItem);

          const existingItem = state.items.find((item) => item.id === uniqueId);

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === uniqueId
                  ? { ...item, quantity: item.quantity + newItem.quantity }
                  : item
              ),
              isOpen: true,
              updatedAt: Date.now(),
            };
          }

          return {
            items: [...state.items, { ...newItem, id: uniqueId }],
            isOpen: true,
            updatedAt: Date.now(),
          };
        }),

      clearCart: () => set({ items: [], isOpen: false, updatedAt: Date.now() }),

      removeFromCart: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
          updatedAt: Date.now(),
        })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
          ),
          updatedAt: Date.now(),
        })),

      // NÂNG CẤP: Đã cộng gộp Tiền Gọng (price) + Tiền Tròng (lensPrice)
      getCartTotal: () => {
        return get().items.reduce((total, item) => {
          const basePrice = item.price || 0;
          const lensPrice = item.lensPrice || 0;
          return total + ((basePrice + lensPrice) * item.quantity);
        }, 0);
      },

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: 'vision-cart-storage',
      version: 1,
      // v0 → v1: format id đổi (thêm variantId) — tính lại id từ dữ liệu item,
      // KHÔNG xóa giỏ đang có của khách.
      migrate: (persisted) => {
        const hasUpdatedAt = persisted && 'updatedAt' in persisted && persisted.updatedAt;
        return {
          ...persisted,
          updatedAt: hasUpdatedAt ? persisted.updatedAt : Date.now() - CART_TTL_MS - 1000,
          items: hasUpdatedAt
            ? (persisted?.items || []).map((item) => ({
                ...item,
                id: buildItemId(item),
              }))
            : [],
        };
      },
      onRehydrateStorage: () => (state) => {
        if (
          state?.updatedAt &&
          Date.now() - state.updatedAt > CART_TTL_MS &&
          state.items?.length
        ) {
          useCartStore.setState({ items: [], updatedAt: Date.now() });
        }
      },
    }
  )
);
