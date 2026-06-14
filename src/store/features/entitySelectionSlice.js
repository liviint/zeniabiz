import { createSlice } from "@reduxjs/toolkit";
const initialState = {
    recentlyCreatedCustomerId: null,
    recentlyCreatedCategoryId: null,
};

const entitySelectionSlice = createSlice({
    name: "entitySelection",
    initialState,
    reducers: {
        setRecentlyCreatedCustomerId: (state,action) => {
            state.recentlyCreatedCustomerId = action.payload;
        },

        clearRecentlyCreatedCustomerId: (state) => {
            state.recentlyCreatedCustomerId = null;
        },

        setRecentlyCreatedCategoryId: ( state, action ) => {
            state.recentlyCreatedCategoryId = action.payload;
        },

        clearRecentlyCreatedCategoryId: (state) => {
            state.recentlyCreatedCategoryId =  null;
        },
    },
});

export const {
    setRecentlyCreatedCustomerId,
    clearRecentlyCreatedCustomerId,
    setRecentlyCreatedCategoryId,
    clearRecentlyCreatedCategoryId,
} = entitySelectionSlice.actions;

export default entitySelectionSlice.reducer;