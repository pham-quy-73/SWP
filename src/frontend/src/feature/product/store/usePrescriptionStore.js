import { create } from 'zustand';

const initialPrescription = {
  od: { sphere: '', cylinder: '', axis: '', add: '', pd: '' },
  os: { sphere: '', cylinder: '', axis: '', add: '', pd: '' },
  imageUrl: null,
  notes: '',
};

export const usePrescriptionStore = create((set) => ({
  orderType: 'buy-now',
  selectedLensId: 'standard',
  prescription: initialPrescription,

  setOrderType: (type) => set({ orderType: type }),
  setLensId: (id) => set({ selectedLensId: id }),

  updatePrescription: (data) =>
    set((state) => ({
      prescription: { ...state.prescription, ...data },
    })),

  resetPrescription: () =>
    set({
      prescription: initialPrescription,
      selectedLensId: null,
      orderType: 'buy-now',
    }),
}));
