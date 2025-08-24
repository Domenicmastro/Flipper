import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { type Product } from "../../../types/Product";

//const PORT = 3000;
const API_URL = import.meta.env.VITE_API_URL;

export interface ProductBySellerState {
	items: Product[];
	status: "idle" | "loading" | "succeeded" | "failed";
	error: string | null;
}

const initialState: ProductBySellerState = {
	items: [],
	status: "idle",
	error: null,
};

export const fetchProductsBySeller = createAsyncThunk(
	"products/fetchBySeller",
	async (sellerId: string, { rejectWithValue }) => {
		try {
			const response = await fetch(`${API_URL}/api/products/by-seller-id/${sellerId}`);
			const products = await response.json();
			return products;
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Failed to fetch products";
			return rejectWithValue(message);
		}
	}
);

const productBySellerSlice = createSlice({
	name: "productsBySeller",
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(fetchProductsBySeller.pending, (state) => {
				state.status = "loading";
			})
			.addCase(fetchProductsBySeller.fulfilled, (state, action) => {
				state.status = "succeeded";
				state.items = action.payload;
			})
			.addCase(fetchProductsBySeller.rejected, (state, action) => {
				state.status = "failed";
				state.error = action.error.message || "Failed to fetch";
			});
	},
});

export default productBySellerSlice.reducer;
