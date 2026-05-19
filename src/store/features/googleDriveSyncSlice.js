import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isGoogleConnected: false,
  syncRequested: false,
  syncInProgress: false,
  lastSyncTime: null,
  lastSyncStatus: null, // success | failed | null
};

const googleDriveSyncSlice = createSlice({
  name: "googleDriveSync",

  initialState,

  reducers: {
    // User connected/disconnected Google
    setGoogleConnected: (state, action) => {
      state.isGoogleConnected = action.payload;
    },

    // Trigger provider sync effect
    requestSync: (state) => {
      state.syncRequested = true;
    },

    // Clear sync request after handled
    clearSyncRequest: (state) => {
      state.syncRequested = false;
    },

    // Sync started
    setSyncInProgress: (state, action) => {
      state.syncInProgress = action.payload;
    },

    // Sync success
    setSyncSuccess: (state, action) => {
      state.lastSyncStatus = "success";
      state.lastSyncTime = action.payload;
      state.syncInProgress = false;
      state.syncRequested = false;
    },

    // Sync failed
    setSyncFailed: (state) => {
      state.lastSyncStatus = "failed";
      state.syncInProgress = false;
      state.syncRequested = false;
    },

    // Full reset
    resetGoogleDriveSyncState: () => initialState,
  },
});

export const {
  setGoogleConnected,
  requestSync,
  clearSyncRequest,
  setSyncInProgress,
  setSyncSuccess,
  setSyncFailed,
  resetGoogleDriveSyncState,
} = googleDriveSyncSlice.actions;

export default googleDriveSyncSlice.reducer;