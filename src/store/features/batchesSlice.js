import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  processing: false,
  lastProcessedAt: null,
  error: null,

  // optional: track pending triggers (debugging / UI insight)
  pending: false,
  pendingCount: 0
};

const batchesSlice = createSlice({
  name: "batches",
  initialState,
  reducers: {
    // 🔔 trigger processing
    triggerBatchProcessing: (state) => {
        state.pendingCount += 1;
    },

    // 🚀 start processing
    processingStarted: (state) => {
      state.processing = true;
      state.error = null;
    },

    // ✅ success
    processingSuccess: (state) => {
      state.processing = false;
      state.pending = false;
      state.lastProcessedAt = new Date().toISOString();
      state.pendingCount = 0;
    },

    // ❌ failure
    processingFailed: (state, action) => {
      state.processing = false;
      state.error = action.payload;
    },
  },
});

export const {
  triggerBatchProcessing,
  processingStarted,
  processingSuccess,
  processingFailed,
} = batchesSlice.actions;

export default batchesSlice.reducer;