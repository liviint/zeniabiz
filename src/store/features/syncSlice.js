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

        syncStarted: (state) => {
            state.isSyncing = true;
            state.error = null;
        },

        syncFinished: (state) => {
            state.isSyncing = false;
            state.lastSyncedAt = Date.now();
            state.error = null;
            state.manual = false;
        },

        syncFailed: (state, action) => {
            state.isSyncing = false;
            state.error = action.payload || "Sync failed";
            state.manual = false;
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