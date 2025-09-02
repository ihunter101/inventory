import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface InitialStateType {
  isSideBarCollapsed: boolean;
  // isDarkMode is removed since you're using Tailwind toggle + localStorage or HTML class directly
}

const initialState: InitialStateType = {
  isSideBarCollapsed: false,
};

export const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    setIsSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isSideBarCollapsed = action.payload;
    },
  },
});

export const { setIsSidebarCollapsed } = globalSlice.actions;

export default globalSlice.reducer;
