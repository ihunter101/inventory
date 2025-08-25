import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";


export interface Product {
    productId: string;
    name: string;
    price: number;
    rating?: number;
    stockQuantity: number;
}

export interface NewProduct {
    name: string;
    price: number;
    rating?: number;
    stockQuantity: number; 
}

export interface SalesSummary {
    salesSummaryId: string;
    totalValue: number;
    changePercentage?: number;
    date: string;
}

export interface PurchaseSummary {
    purchaseSummaryId: string; 
    totalPurchased: number;
    changePercentage?: number;
    date: string;

}


export interface ExpenseSummary {
    expenseSummaryId: string;
    totalExpenses: number;
    date: string;
}

export interface ExpenseByCategorySummary {
    expenseByCategorySummaryId: string;
    category: string;
    amount: string;
    date: string;
}

export interface DashboardMetrics {
    popularProducts: Product[];
    salesSummary: SalesSummary[];
    purchaseSummary: PurchaseSummary[];
    expenseSummary: ExpenseSummary[];
    expenseByCategorySummary: ExpenseByCategorySummary[];
}


export const api = createApi({
    reducerPath: "api",
    baseQuery: fetchBaseQuery({
        baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    }),
    tagTypes: ["DashboardMetrics", "Products"], //this is the data in our overall app that we want to track 
    endpoints: (build) => ({
        getDashboardMetrics: build.query<DashboardMetrics, void>({
            query: () => "/dashboard",
            providesTags: ["DashboardMetrics"] // this is the data listed from tagtypes but related to a specific endpoint that we would like to track 
        }),
        getProducts: build.query<Product[], string | void>({
            // our product query has a posible parameter called searc define in the productController
            query: (search)=> ({
                url: "/products",
                params: search ? { search }: {}
            }),
            providesTags: ["Products"]
        }),
        createProduct: build.mutation<Product,NewProduct>({
             query: (newProduct)=> ({
                url: "/products",
                method: "POST",
                body: newProduct
        }),
        invalidatesTags: ["Products"]
        })
    }),
});

export const {
    useGetDashboardMetricsQuery,
    useGetProductsQuery,
    useCreateProductMutation
} = api;


// the CreateApi function has four properties 
// the reducer path which is where all the information about stored data and states related to your app is 
// the baseQuery prop which contains a functions called baseQuery set the baseURL for getting to your inital webpage and from there more urls paths can be added
// tagTypes help assign tags to a some kind of object (data) and tracks it so if something changes redux toolkit reflects those new changes
// endpoints are the last file paths in a URL. Here DashboardMetrics is the name we give to this endpoint. build.query tells it that its a get request (were fetching data) 
// ... cont and DashbaordMetrics is they type of data we expect back. which is popular products, sales summary, purchases summary, expense summary and expense by category from the interface DashboardMetrics
// and void means this query takes no inputs nor does it have any parameters 
// query: () => "/dashboard", this arrow function tells redux wen someone calls getDashBoardMetrics, render the /dashboard enpoint


// redux toolkit automatically create react hooks for every endpoint that we define. since we created an getDashmetrics, redux creates an hook get useGetDasboardMetrics that we can use in our components (for tat enpoint) for fetching data
    // const { data, error, isLoading } = useGetDashboardMetricsQuery(); for example this snippet of code handles all this information for us

