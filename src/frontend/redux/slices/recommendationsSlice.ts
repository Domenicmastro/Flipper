import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import type { Product } from "../../../types";
import type { RootState } from '../store';
import { auth } from "@/backend/firebase/firebase";

const PORT = 3000;

export interface RecommendationsState {
  products: Product[];
  loading: boolean;
  error: string | null;
}

const initialState: RecommendationsState = {
  products: [],
  loading: false,
  error: null,
};

// Async thunk to fetch recommendations from backend API
export const fetchRecommendations = createAsyncThunk<
  Product[],
  string, // userId
  { rejectValue: string }
>(
  "recommendations/fetchRecommendations",
  async (userId, { rejectWithValue }) => {
    try {
      console.log("fetching recommendations in recommendations Slice for userId:", userId);
      
      const token = await auth.currentUser?.getIdToken();
      console.log("Token:", token)
      const response = await fetch(`http://localhost:${PORT}/api/recommendations/${userId}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });
      console.log("Response:", response)
      
      if (!response.ok) {
        console.log("Response not ok, trying to parse error");
        try {
          const errorData = await response.json();
          console.log("Error data:", errorData);
          return rejectWithValue(errorData.message || "Failed to fetch recommendations");
        } catch (parseError) {
          console.log("Failed to parse error response:", parseError);
          return rejectWithValue(`HTTP ${response.status}: ${response.statusText}`);
        }
      }
      
      
      // Try to parse as JSON
      let data: Product[];
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Failed to parse JSON:", jsonError);
        return rejectWithValue("Invalid JSON response from server");
      }
      
      return data;
      
    } catch (err) {
      console.error("Fetch error:", err);
      return rejectWithValue((err as Error).message);
    }
  }
);

// export const fetchRecommendations = createAsyncThunk<
//   Product[],
//   string, // userId
//   { rejectValue: string }
// >(
//   "recommendations/fetchRecommendations",
//   async (userId, { rejectWithValue }) => {
//     try {
//       console.log("fetching recommendations in recommendations Slice")
//       const token = await auth.currentUser?.getIdToken();
//       const response = await fetch(`/api/recommendations/${userId}`, {
//         headers: {
//           "Content-Type": "application/json",
//           "Authorization": `Bearer ${token}`
//         },
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         console.log("errorData")
//         return rejectWithValue(errorData.message || "Failed to fetch recommendations");
//       }

//       const data: Product[] = await response.json();
//       console.log("got data")
//       return data;
//     } catch (err) {
//       return rejectWithValue((err as Error).message);
//     }
//   }
// );

const recommendationsSlice = createSlice({
  name: "recommendations",
  initialState,
  reducers: {
    clearRecommendations(state) {
      state.products = [];
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecommendations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecommendations.fulfilled, (state, action: PayloadAction<Product[]>) => {
        console.log("Recommendations fetched:", action.payload);
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchRecommendations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load recommendations";
      });
  },
});

export const { clearRecommendations } = recommendationsSlice.actions;

export const selectRecommendations = (state: RootState) =>
  state.recommendations.products;

export const selectRecommendationsLoading = (state: RootState) =>
  state.recommendations.loading;

export const selectRecommendationsError = (state: RootState) =>
  state.recommendations.error;

export default recommendationsSlice.reducer;