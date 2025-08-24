import {
	createSlice,
	createAsyncThunk,
	createSelector,
	type PayloadAction,
} from "@reduxjs/toolkit";
import { type Product, Category } from "@/types";
import type { RootState } from "../store";
import { getProductById } from "@/backend/firebase/products";

export const isCategory = (value: string): value is Category => {
	return Object.values(Category).includes(value as Category);
};

// const PORT = 3000;
const API_URL = import.meta.env.VITE_API_URL;

export interface ProductsState {
	products: Product[];
	loading: boolean;
	error: string | null;
	selectedProduct: Product | null;
	filters: {
		searchQuery: string;
		location: string;
		category: string[]; // value from Category type
		condition: string[]; // value from Condition type
		minPrice: number;
		maxPrice: number;
	};
	lastUpdated: number | null;
	lastModified: number | null; // Only for CUD operations, not reads
}

const initialState: ProductsState = {
	products: [],
	loading: false,
	error: null,
	selectedProduct: null,
	filters: {
		searchQuery: "",
		location: "",
		category: [],
		condition: [],
		minPrice: 0,
		maxPrice: Infinity,
	},
	lastUpdated: null,
	lastModified: null,
};

export interface ProductPayload
	extends Omit<Product, "id" | "createdAt" | "sellerId" | "auctionEndsAt"> {
	auctionEndsAt?: string; // Send as ISO string
}

// Fetch all products
export const fetchProducts = createAsyncThunk(
	"products/fetchProducts",
	async (_, { rejectWithValue }) => {
		try {
			const response = await fetch(`${API_URL}/api/products/`);
			const products = await response.json();
			return products;
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Failed to fetch products";
			return rejectWithValue(message);
		}
	}
);

// Fetch single product
export const fetchProduct = createAsyncThunk<
	Product,
	string,
	{ rejectValue: string }
>("products/fetchProduct", async (productId: string, { rejectWithValue }) => {
	try {
		const response = await fetch(
			`${API_URL}/api/products/by-id/${productId}`
		);
		const product = await response.json();
		return product;
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Failed to fetch product";
		return rejectWithValue(message);
	}
});

// Add product
export const addProductThunk = createAsyncThunk(
	"products/addProduct",
	async (product: ProductPayload, { rejectWithValue }) => {
		try {
			const response = await fetch(`${API_URL}/api/products/`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ product }),
			});

			if (!response.ok) {
				throw new Error(`Server responded with status ${response.status}`);
			}

			const data = await response.json();
			return data;
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Failed to add product";
			return rejectWithValue(message);
		}
	}
);

// Update product
export const updateProductThunk = createAsyncThunk(
	"products/updateProduct",
	async (
		{
			productId,
			updates,
		}: {
			productId: string;
			updates: Partial<Omit<Product, "id" | "createdAt" | "sellerId">>;
		},
		{ rejectWithValue }
	) => {
		try {
			const response = await fetch(
				`${API_URL}/api/products/by-id/${productId}`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ updates }),
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			// Return the updated product from the server response
			const updatedProduct = await response.json();
			return updatedProduct;
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Failed to update product";
			return rejectWithValue(message);
		}
	}
);

// Delete product
export const deleteProductThunk = createAsyncThunk(
	"products/deleteProduct",
	async (productId: string, { rejectWithValue }) => {
		try {
			await fetch(`${API_URL}/api/products/by-id/${productId}`, {
				method: "DELETE",
			});
			return productId;
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Failed to delete product";
			return rejectWithValue(message);
		}
	}
);

// Mark product as sold
export const markProductAsSoldThunk = createAsyncThunk(
	"products/markAsSold",
	async (
		{ productId, buyerId }: { productId: string; buyerId: string },
		{ rejectWithValue }
	) => {
		try {
			const response = await fetch(
				`${API_URL}/api/products/mark-as-sold/${productId}`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ buyerId }),
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();
			return { productId, buyerId, updatedProduct: result };
		} catch (error: unknown) {
			const message =
				error instanceof Error
					? error.message
					: "Failed to mark product as sold";
			return rejectWithValue(message);
		}
	}
);

export const placeBidThunk = createAsyncThunk(
	"products/placeBid",
	async (
		{
			productId,
			userId,
			bidAmount,
		}: { productId: string; userId: string; bidAmount: number },
		{ rejectWithValue }
	) => {
		try {
			const response = await fetch(
				`${API_URL}/api/products/place-bid/${productId}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ userId, bidAmount }),
				}
			);

			if (!response.ok) {
				throw new Error(`Server responded with status ${response.status}`);
			}

			const updatedProduct = await response.json();
			return updatedProduct;
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Failed to place bid";
			return rejectWithValue(message);
		}
	}
);

export const fetchProductByIdThunk = createAsyncThunk(
	"products/fetchById",
	async (productId: string) => {
		const product = await getProductById(productId); // your Firebase fetch
		return product;
	}
);

const productsSlice = createSlice({
	name: "products",
	initialState,
	reducers: {
		setSelectedProduct: (state, action: PayloadAction<Product | null>) => {
			state.selectedProduct = action.payload;
		},
		setSearchQuery: (state, action: PayloadAction<string>) => {
			state.filters.searchQuery = action.payload;
		},
		setLocation: (state, action: PayloadAction<string>) => {
			state.filters.location = action.payload;
		},
		setCategory: (state, action: PayloadAction<string[]>) => {
			state.filters.category = action.payload;
		},
		setCondition: (state, action: PayloadAction<string[]>) => {
			state.filters.condition = action.payload;
		},

		setPriceRange: (
			state,
			action: PayloadAction<{ min: number; max: number }>
		) => {
			state.filters.minPrice = action.payload.min;
			state.filters.maxPrice = action.payload.max;
		},
		clearFilters: (state) => {
			state.filters = { ...initialState.filters };
		},
		clearError: (state) => {
			state.error = null;
		},
		updateProductInList: (state, action: PayloadAction<Product>) => {
			const index = state.products.findIndex((p) => p.id === action.payload.id);
			if (index !== -1) {
				state.products[index] = action.payload;
			}
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchProducts.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchProducts.fulfilled, (state, action) => {
				state.loading = false;
				state.products = action.payload;
				state.error = null;
				state.lastUpdated = Date.now();
				// Don't update lastModified for fetch operations
			})
			.addCase(fetchProducts.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
			})
			.addCase(fetchProduct.fulfilled, (state, action) => {
				state.selectedProduct = action.payload;
			})
			.addCase(fetchProduct.rejected, (state, action) => {
				state.error = action.payload as string;
			})
			.addCase(addProductThunk.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(addProductThunk.fulfilled, (state, action) => {
				state.loading = false;
				state.error = null;
				state.products.push(action.payload);
				state.lastUpdated = Date.now();
				state.lastModified = Date.now();
			})
			.addCase(addProductThunk.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
			})
			.addCase(updateProductThunk.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateProductThunk.fulfilled, (state, action) => {
				state.loading = false;
				state.error = null;
				// Update the product in the products array
				const index = state.products.findIndex(
					(p) => p.id === action.payload.id
				);
				if (index !== -1) {
					state.products[index] = action.payload;
				}
				// Update selected product if it's the same one
				if (state.selectedProduct?.id === action.payload.id) {
					state.selectedProduct = action.payload;
				}
				state.lastUpdated = Date.now();
				state.lastModified = Date.now();
			})
			.addCase(updateProductThunk.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
			})
			.addCase(deleteProductThunk.fulfilled, (state, action) => {
				state.products = state.products.filter(
					(product) => product.id !== action.payload
				);
				if (state.selectedProduct?.id === action.payload) {
					state.selectedProduct = null;
				}
				state.lastUpdated = Date.now();
				state.lastModified = Date.now();
			})
			.addCase(deleteProductThunk.rejected, (state, action) => {
				state.error = action.payload as string;
			})
			.addCase(markProductAsSoldThunk.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(markProductAsSoldThunk.fulfilled, (state, action) => {
				state.loading = false;
				state.error = null;
				const { productId, updatedProduct } = action.payload;

				// Update the product in the products array
				const index = state.products.findIndex((p) => p.id === productId);
				if (index !== -1) {
					state.products[index] = updatedProduct;
				}

				// Update selected product if it's the same one
				if (state.selectedProduct?.id === productId) {
					state.selectedProduct = updatedProduct;
				}

				state.lastUpdated = Date.now();
				state.lastModified = Date.now();
			})
			.addCase(markProductAsSoldThunk.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
			})
			.addCase(placeBidThunk.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(placeBidThunk.fulfilled, (state, action) => {
				state.loading = false;
				state.error = null;

				const updated = action.payload;
				// Replace product in list
				const index = state.products.findIndex((p) => p.id === updated.id);
				if (index !== -1) {
					state.products[index] = updated;
				}
				// Update selectedProduct if it's open
				if (state.selectedProduct?.id === updated.id) {
					state.selectedProduct = updated;
				}
			})
			.addCase(placeBidThunk.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
			})
			.addCase(fetchProductByIdThunk.fulfilled, (state, action) => {
				state.selectedProduct = action.payload;
			});
	},
});

export const {
	setSelectedProduct,
	setSearchQuery,
	setLocation,
	setCategory,
	setCondition,
	setPriceRange,
	clearFilters,
	clearError,
	updateProductInList,
} = productsSlice.actions;

export default productsSlice.reducer;

// Selectors
export const selectProducts = (state: RootState) => state.products.products;
export const selectLoading = (state: RootState) => state.products.loading;
export const selectError = (state: RootState) => state.products.error;
export const selectSelectedProduct = (state: RootState) =>
	state.products.selectedProduct;
export const selectFilters = (state: RootState) => state.products.filters;

// Memoized filtered products
export const selectFilteredProducts = createSelector(
	[
		(state: RootState) => state.products.products,
		(state: RootState) => state.products.filters,
	],
	(products, filters) => {
		return products.filter((product) => {
			const matchesSearch =
				!filters.searchQuery ||
				product.name
					.toLowerCase()
					.includes(filters.searchQuery.toLowerCase()) ||
				product.description
					?.toLowerCase()
					.includes(filters.searchQuery.toLowerCase()) ||
				product.tags?.some((tag) =>
					tag.toLowerCase().includes(filters.searchQuery.toLowerCase())
				);

			const matchesLocation =
				!filters.location ||
				product.location.label
					.toLowerCase()
					.includes(filters.location.toLowerCase());

			const matchesCategory =
				!filters.category.length ||
				filters.category.some((cat) =>
					product.categories.includes(cat as Category)
				);

			const matchesCondition =
				!filters.condition.length ||
				filters.condition.includes(product.condition);

			const matchesPrice =
				product.price >= filters.minPrice &&
				(filters.maxPrice === Infinity || product.price <= filters.maxPrice);

			return (
				matchesSearch &&
				matchesLocation &&
				matchesCategory &&
				matchesCondition &&
				matchesPrice
			);
		});
	}
);
