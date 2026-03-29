import { createSlice } from '@reduxjs/toolkit';
import { safeLocalStorage } from '@/utils/storage';

const initialState = {
  userDetails: null, 
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserDetails: (state, action) => {
      state.userDetails = action.payload;
      safeLocalStorage.setItem('userDetails', action.payload);
    },
    clearUserDetails: (state) => {
      state.userDetails = null;
      safeLocalStorage.clear();
    },
  },
});

export const { setUserDetails, clearUserDetails } = userSlice.actions;
export default userSlice.reducer;
