import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Expense } from "./api"; // adjust path to your types if needed

export interface GlobalState {
  isSideBarCollapsed: boolean;
  // isDarkMode is removed since you're using Tailwind toggle + localStorage or HTML class directly
}

const globalInitialState: GlobalState = {
  isSideBarCollapsed: false,
};

export const globalSlice = createSlice({
  name: "global",
  initialState: globalInitialState,
  reducers: {
    setIsSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isSideBarCollapsed = action.payload;
    },
  },
});

export const { setIsSidebarCollapsed } = globalSlice.actions;

export const globalReducer = globalSlice.reducer;

// src/state/expenseSlice.ts

interface ExpenseState {
  expenses: Expense[];
}

const expensesInitialState: ExpenseState = {
  expenses: [],
};

const expenseSlice = createSlice({
  name: "expenses",
  initialState: expensesInitialState,
  reducers: {
    setExpenses: (state, action: PayloadAction<Expense[]>) => {
      state.expenses = action.payload;
    },
    addExpense: (state, action: PayloadAction<Expense>) => {
      state.expenses.unshift(action.payload); // newest on top
    },
    removeExpense: (state, action: PayloadAction<string>) => {
      state.expenses = state.expenses.filter((e) => e.expenseId !== action.payload);
    },
    clearExpenses: (state) => {
      state.expenses = [];
    },
  },
});

export const {
  setExpenses,
  addExpense,
  removeExpense,
  clearExpenses,
} = expenseSlice.actions;

export  const expensesReducer = expenseSlice.reducer;
