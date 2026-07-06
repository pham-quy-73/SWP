import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addToCart: (newItem) =>
        set((state) => {
          const uniqueId = `${newItem.productId}-${newItem.lensId}-${JSON.stringify(newItem.prescription)}`;

          const existingItem = state.items.find((item) => item.id === uniqueId);

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === uniqueId
                  ? { ...item, quantity: item.quantity + newItem.quantity }
                  : item
              ),
              isOpen: true,
            };
          }

          return {
            items: [...state.items, { ...newItem, id: uniqueId }],
            isOpen: true,
          };
        }),

      clearCart: () => set({ items: [], isOpen: false }),

      removeFromCart: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
          ),
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
    { name: 'vision-cart-storage' }
  )
);