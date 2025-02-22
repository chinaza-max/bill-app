// store/slice.js
import { createSlice } from "@reduxjs/toolkit";

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  accessToken: null,
  isPasscodeEntered: false,
  lastVisitedPath: "/",
};

// Create the slice
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.accessToken = action.payload.accessToken;
    },
    setPasscodeStatus: (state, action) => {
      state.isPasscodeEntered = action.payload.isPasscodeEntered;
    },
    setUserEmail: (state, action) => {
      state.email = action.payload.email;
    },
    clearSensitiveData: (state, action) => {
      state.accessToken = null;
      state.isPasscodeEntered = false;
      state.user = null;
      // Keep authentication state if specified
      if (!action.payload?.keepAuthenticated) {
        state.isAuthenticated = false;
      }
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.accessToken = null;
      state.isPasscodeEntered = false;
    },
  },
});

export const {
  setUser,
  logout,
  setPasscodeStatus,
  clearSensitiveData,
  setUserEmail,
} = userSlice.actions;

// Export the reducer to be used in the store
export default userSlice.reducer;
