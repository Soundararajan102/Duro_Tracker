import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { PrinterDevice } from "../types/printer";

type PrinterState = {
  preferredPrinter: PrinterDevice | null;
  setPreferredPrinter: (printer: PrinterDevice) => void;
  clearPreferredPrinter: () => void;
};

export const usePrinterStore = create<PrinterState>()(
  persist(
    (set) => ({
      preferredPrinter: null,
      setPreferredPrinter: (preferredPrinter) => set({ preferredPrinter }),
      clearPreferredPrinter: () => set({ preferredPrinter: null }),
    }),
    {
      name: "duro_tracker_printer_storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ preferredPrinter: state.preferredPrinter }),
      migrate: (persistedState) => {
        const state = (persistedState ?? {}) as Partial<Pick<PrinterState, "preferredPrinter">>;
        return { preferredPrinter: state.preferredPrinter ?? null };
      },
    },
  ),
);
