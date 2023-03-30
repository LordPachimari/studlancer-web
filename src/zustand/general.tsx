import { create } from "zustand";

export type ComponentName = "USERNAME" | "CHARACTER";
interface GeneralState {
  redirectUrl: string | undefined;
  setRedirectUrl: (url: string) => void;
}

export const GeneralStore = create<GeneralState>((set) => ({
  redirectUrl: undefined,
  setRedirectUrl: (url) => set({ redirectUrl: url }),
}));
