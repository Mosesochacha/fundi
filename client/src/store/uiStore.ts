import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  mobileDrawerOpen: boolean;
  activeModal: string | null;
  toggleSidebar: () => void;
  toggleDrawer: () => void;
  openModal: (name: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  mobileDrawerOpen: false,
  activeModal: null,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleDrawer: () => set((s) => ({ mobileDrawerOpen: !s.mobileDrawerOpen })),
  openModal: (name) => set({ activeModal: name }),
  closeModal: () => set({ activeModal: null }),
}));
