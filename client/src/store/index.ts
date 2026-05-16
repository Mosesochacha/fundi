import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistReducer, persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import { apiSlice } from "./apiSlice";
import authReducer from "./authSlice";
import feedReducer from "./feedSlice";
import searchReducer from "./searchSlice";

export function makeStore() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const storage = require("redux-persist/lib/storage").default;

  const rootReducer = combineReducers({
    auth:   persistReducer({ key: "auth", storage, whitelist: ["user", "profile", "isLoggedIn"] }, authReducer),
    feed:   feedReducer,
    search: searchReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  });

  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: { ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER] },
      }).concat(apiSlice.middleware),
    devTools: process.env.NODE_ENV !== "production",
  });

  return { store, persistor: persistStore(store) };
}

export type AppStore = ReturnType<typeof makeStore>["store"];
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
