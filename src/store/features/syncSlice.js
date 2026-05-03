import { createSlice } from "@reduxjs/toolkit";

const syncSlice = createSlice({
    name: "sync",
    initialState: {
        trigger: 0,      
        manual: false,  
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
    },
    });

    export const {
        triggerSync,
        triggerManualSync,
        clearManualFlag,
    } = syncSlice.actions;

export default syncSlice.reducer;