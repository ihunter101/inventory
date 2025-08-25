import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface InitialStateType {
    isSideBarCollapsed: boolean;
    isDarkMode: boolean;
}

// Here we give our state an initial value. At app-load, the sidebar is expanded (false = not collapsed) and the theme is light (false = not dark).
const initialState: InitialStateType = {
    isSideBarCollapsed: false,
    isDarkMode: false,
};

export const globalSlice = createSlice ({
    name: "global",
    initialState, 
    reducers: {
        setIsSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
            state.isSideBarCollapsed = action.payload
        },
        setIsDarkMode: (state, action: PayloadAction<boolean>) => {
            state.isDarkMode = action.payload
        },
    }

});

export const { setIsSidebarCollapsed, setIsDarkMode } = globalSlice.actions

export default globalSlice.reducer