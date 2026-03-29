import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";

import userReducer from "./features/userSlice";
import settingsReducer from "./features/settingsSlice";

const userPersistConfig = {
  key: "user",
  storage: AsyncStorage,
  whitelist: ["userDetails"],
};

const settingsPersistConfig = {
  key: "settings",
  storage: AsyncStorage,
  whitelist: ["theme"], 
};

const rootReducer = combineReducers({
  user: persistReducer(userPersistConfig, userReducer),
  settings: persistReducer(settingsPersistConfig, settingsReducer),
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);
