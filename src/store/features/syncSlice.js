import { createSlice } from "@reduxjs/toolkit";

const syncSlice = createSlice({
    name: "sync",
    initialState: {
        trigger: 0,
        manual: false,
        isSyncing: false,
        lastSyncedAt: null,
    },
    reducers: {
        triggerSync: (state) => {
            state.trigger += 1;
        },

        triggerManualSync: (state) => {
            state.trigger += 1;
            state.manual = true;
        },

        clearManualFlag: (state) => {
            state.manual = false;
        },

        // 🔥 NEW: lifecycle control
        syncStarted: (state) => {
            state.isSyncing = true;
        },

        syncFinished: (state) => {
            state.isSyncing = false;
            state.lastSyncedAt = Date.now(); 
        },
    },
});

export const {
    triggerSync,
    triggerManualSync,
    clearManualFlag,
    syncStarted,
    syncFinished,
} = syncSlice.actions;

export default syncSlice.reducer;