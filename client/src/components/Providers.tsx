"use client";

import { useRef } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { makeStore, type AppStore } from "@/store";
import type { Persistor } from "redux-persist";

export default function Providers({ children }: { children: React.ReactNode }) {
  const ref = useRef<{ store: AppStore; persistor: Persistor } | null>(null);
  if (!ref.current) {
    ref.current = makeStore();
  }
  const { store, persistor } = ref.current;

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
