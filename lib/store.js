import { create } from "zustand";

export const useStore = create((set) => ({
  // auth / tenant
  user: null,
  school: null,
  currentTerm: null,
  setSession: ({ user, school }) =>
    set((s) => ({ user: user ?? s.user, school: school ?? s.school })),
  setUser: (user) => set({ user }),
  setSchool: (school) => set({ school }),
  setCurrentTerm: (currentTerm) => set({ currentTerm }),
  clearSession: () => set({ user: null, school: null, currentTerm: null, currentChildId: null }),

  // parent
  currentChildId: null,
  setCurrentChild: (currentChildId) => set({ currentChildId }),

  // report card template
  defaultTemplateId: "classic",
  setDefaultTemplate: (defaultTemplateId) => set({ defaultTemplateId }),

  // school branding (white-labeling)
  brandColor: "#1B6B3A",
  setBrandColor: (brandColor) => set({ brandColor }),
  accentColor: "#E8A020",
  setAccentColor: (accentColor) => set({ accentColor }),
  logoUrl: null,
  setLogoUrl: (logoUrl) => set({ logoUrl }),
  stampUrl: null,
  setStampUrl: (stampUrl) => set({ stampUrl }),

  // ui
  sidebarOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
