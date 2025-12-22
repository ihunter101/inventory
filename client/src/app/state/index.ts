
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Expense } from "./api";

export interface GlobalState {
  // Remove: isSideBarCollapsed: boolean;
  // The shadcn sidebar manages its own state
}

const globalInitialState: GlobalState = {};

export const globalSlice = createSlice({
  name: "global",
  initialState: globalInitialState,
  reducers: {
    // Remove: setIsSidebarCollapsed
  },
});

export const {} = globalSlice.actions;
export const globalReducer = globalSlice.reducer;

// Keep your expense slice as is
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
      state.expenses.unshift(action.payload);
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

export const expensesReducer = expenseSlice.reducer;