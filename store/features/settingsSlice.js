import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  theme: null, // 'light' | 'dark' | later: 'system'
};

const settingsSlice = createSlice({
    name: "settings",
    initialState,
    reducers: {
        setTheme: (state, action) => {
          state.theme = action.payload;
        },
        toggleTheme: (state) => {
          state.theme = state.theme === "light" ? "dark" : "light";
        },
    },
});

export const { setTheme, toggleTheme } = settingsSlice.actions;
export default settingsSlice.reducer;
