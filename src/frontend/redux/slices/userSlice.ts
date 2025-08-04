import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { User, Product, Review } from '@/types';
import logo from "@/assets/logo.png";
import { auth } from "@/backend/firebase/firebase";
import { waitForAuthUser } from "@/utils/auth";
import type { RootState } from '../store';

const PORT = 3000;

export interface UserState {
  users: User[];
  currentUser: User | null;
  isAuthInitialized: boolean;
  wishlistProducts: Product[];
  loading: boolean;
  error: string | null;
  userNames: Record<string, string>;
}

const initialState: UserState = {
  users: [
    {
      id: "1",
      name: "Person One",
      email: "p_one@veryrealemail.com",
      image: logo,
      bio: "Welcome to my profile! I'm passionate about finding great deals and sharing recommendations.",
      location: {
        label: "6200 University Blvd, Vancouver, BC, V6T 1Z4",
        lat: 49.2606,
        lng: -123.246,
        postalCode: "V6T 1Z4",
        city: "Vancouver",
        province: "British Columbia",
        country: "Canada",
      },
      reviews: [],
      forSale: [],
      joinedAt: "2024-01-01T00:00:00Z",
    },
  ],
  currentUser: null,
  isAuthInitialized: false,
  wishlistProducts: [],
  loading: false,
  error: null,
  userNames: {},
};

export const fetchUserNameById = createAsyncThunk<
  { id: string; name: string },
  string,
  { rejectValue: string }
>("user/fetchUserNameById", async (userId, { rejectWithValue }) => {
  try {
    const currentUser = await waitForAuthUser();
    if (!currentUser) return rejectWithValue("User not logged in");

    const token = await currentUser.getIdToken();
    const res = await fetch(`http://localhost:${PORT}/api/users/by-id/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const data = await res.json();
      return rejectWithValue(data.error || "Failed to fetch user");
    }

    const user = await res.json();
    return { id: userId, name: user.name };
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Unknown error");
  }
});

export const fetchUserById = createAsyncThunk<User | null, string, { rejectValue: string }>(
  'user/fetchUserById',
  async (userId, { rejectWithValue }) => {
    try {
      const firebaseUser = auth.currentUser;
      const response = await fetch(`http://localhost:${PORT}/api/users/get-or-create/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: {
            id: firebaseUser?.uid ?? userId,
            name: firebaseUser?.displayName ?? "No Name",
            email: firebaseUser?.email ?? "",
            image: firebaseUser?.photoURL ?? logo,
            bio: "",
            location: {
              label: "Unknown",
              lat: 0,
              lng: 0,
              city: "",
              province: "",
              country: "",
              postalCode: "",
            },
            reviews: [],
            forSale: [],
            joinedAt: firebaseUser?.metadata?.creationTime ?? new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to fetch user');
      }

      const user = await response.json();
      return user;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch user');
    }
  }
);

export const fetchAllUsers = createAsyncThunk<User[], void, { rejectValue: string }>(
  'user/fetchAllUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`http://localhost:${PORT}/api/users/`);
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to fetch users');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch users');
    }
  }
);

export const createNewUser = createAsyncThunk<void, Omit<User, 'joinedAt'>, { rejectValue: string }>(
  'user/createNewUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await fetch(`http://localhost:${PORT}/api/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: userData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to create user');
      }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create user');
    }
  }
);

export const deleteCurrentUser = createAsyncThunk<void, void, { rejectValue: string }>(
  'user/deleteCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const currentUser = await waitForAuthUser();
      if (!currentUser) return rejectWithValue("User not logged in");

      const token = await currentUser.getIdToken();
      const response = await fetch(`http://localhost:${PORT}/api/users/`, { 
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to delete user');
      }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete user');
    }
  }
);

export const updateUserData = createAsyncThunk<
  { userId: string; updates: Partial<User> },
  { userId: string; updates: Partial<User> },
  { rejectValue: string }
>('user/updateUserData', async ({ userId, updates }, { rejectWithValue }) => {
  try {
    const currentUser = await waitForAuthUser();
    if (!currentUser) return rejectWithValue("User not logged in");

    const token = await currentUser.getIdToken();
    const response = await fetch(`http://localhost:${PORT}/api/users/by-id/${userId}`, {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ updates }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return rejectWithValue(errorData.error || 'Failed to update user');
    }

    return { userId, updates };
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to update user');
  }
});

export const addProductToWishlist = createAsyncThunk<
  string,
  { userId: string; productId: string },
  { rejectValue: string }
>('user/addProductToWishlist', async ({ userId, productId }, { rejectWithValue }) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`http://localhost:${PORT}/api/users/wishlist/by-user-and-product-id/${userId}/${productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const data = await res.json();
      return rejectWithValue(data.error || "Failed to add to wishlist");
    }

    return productId;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Unknown error");
  }
});

export const removeProductFromWishlist = createAsyncThunk<
  string,
  { userId: string; productId: string },
  { rejectValue: string }
>('user/removeProductFromWishlist', async ({ userId, productId }, { rejectWithValue }) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`http://localhost:${PORT}/api/users/wishlist/by-user-and-product-id/${userId}/${productId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const data = await res.json();
      return rejectWithValue(data.error || "Failed to remove from wishlist");
    }

    return productId;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Unknown error");
  }
});

export const fetchWishlistProducts = createAsyncThunk<Product[], string, { rejectValue: string }>(
  'user/fetchWishlistProducts',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await fetch(`http://localhost:${PORT}/api/users/wishlist/by-user-id/${userId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to fetch wishlist');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch wishlist');
    }
  }
);

export const addUserReview = createAsyncThunk<
  { userId: string; review: Review },
  { userId: string; review: Review },
  { rejectValue: string }
>('user/addUserReview', async ({ userId, review }, { rejectWithValue }) => {
  try {
    const currentUser = await waitForAuthUser();
    if (!currentUser) return rejectWithValue("User not logged in");

    const token = await currentUser.getIdToken();
    const res = await fetch(`http://localhost:${PORT}/api/users/reviews/${userId}`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ review }),
    });

    if (!res.ok) {
      const data = await res.json();
      return rejectWithValue(data.error || "Failed to add review");
    }

    return { userId, review };
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Unknown error");
  }
});

export const updateUserListsOnSale = createAsyncThunk<
  { sellerId: string; buyerId: string; productId: string },
  { sellerId: string; buyerId: string; productId: string },
  { rejectValue: string }
>('user/updateUserListsOnSale', async ({ sellerId, buyerId, productId }, { rejectWithValue }) => {
  try {
    const currentUser = await waitForAuthUser();
    if (!currentUser) return rejectWithValue("User not logged in");

    const token = await currentUser.getIdToken();
    const response = await fetch(`http://localhost:${PORT}/api/users/update-lists-on-sale`, {
      method: 'PATCH',
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ sellerId, buyerId, productId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return rejectWithValue(errorData.error || 'Failed to update user lists');
    }

    return { sellerId, buyerId, productId };
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to update user lists');
  }
});

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<User | null>) => {
      state.currentUser = action.payload;
    },
    setAuthInitialized: (state, action: PayloadAction<boolean>) => {
      state.isAuthInitialized = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentUser: (state) => {
      state.currentUser = null;
    },
    clearWishlistProducts: (state) => {
      state.wishlistProducts = [];
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserNameById.fulfilled, (state, action) => {
        state.userNames[action.payload.id] = action.payload.name;
      })
      .addCase(fetchUserById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.loading = false;
        const fetchedUser = action.payload;
        if (!fetchedUser) return;

        const index = state.users.findIndex((u) => u.id === fetchedUser.id);
        if (index !== -1) {
          state.users[index] = fetchedUser;
        } else {
          state.users.push(fetchedUser);
        }
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch user';
      })
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch users';
      })
      .addCase(createNewUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createNewUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createNewUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create user';
      })
      .addCase(deleteCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCurrentUser.fulfilled, (state) => {
        state.loading = false;
        state.currentUser = null;
        state.wishlistProducts = [];
      })
      .addCase(deleteCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete user';
      })
      .addCase(updateUserData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserData.fulfilled, (state, action) => {
        state.loading = false;
        const { userId, updates } = action.payload;
        
        // Update current user if it matches
        if (state.currentUser?.id === userId) {
          state.currentUser = { ...state.currentUser, ...updates };
        }
        
        // Update user in users array
        const index = state.users.findIndex((u) => u.id === userId);
        if (index !== -1) {
          state.users[index] = { ...state.users[index], ...updates };
        }
      })
      .addCase(updateUserData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update user';
      })
      .addCase(addProductToWishlist.fulfilled, (state, action) => {
        if (state.currentUser) {
          state.currentUser.wishlist = [...(state.currentUser.wishlist || []), action.payload];
        }
      })
      .addCase(removeProductFromWishlist.fulfilled, (state, action) => {
        const pid = action.payload;
        if (state.currentUser?.wishlist) {
          state.currentUser.wishlist = state.currentUser.wishlist.filter((id) => id !== pid);
        }
        state.wishlistProducts = state.wishlistProducts.filter((p) => p.id !== pid);
      })
      .addCase(fetchWishlistProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWishlistProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.wishlistProducts = action.payload;
      })
      .addCase(fetchWishlistProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch wishlist';
      })
      .addCase(addUserReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addUserReview.fulfilled, (state, action) => {
        state.loading = false;
        const { userId, review } = action.payload;
        
        // Update the user in the users array
        const userIndex = state.users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
          state.users[userIndex].reviews = [...(state.users[userIndex].reviews || []), review];
        }
        
        // If it's the current user, update their reviews too
        if (state.currentUser?.id === userId) {
          state.currentUser.reviews = [...(state.currentUser.reviews || []), review];
        }
      })
      .addCase(addUserReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to add review';
      })
      .addCase(updateUserListsOnSale.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserListsOnSale.fulfilled, (state, action) => {
        state.loading = false;
        const { sellerId, buyerId, productId } = action.payload;
        
        // Update seller's forSale list
        const sellerIndex = state.users.findIndex(u => u.id === sellerId);
        if (sellerIndex !== -1) {
          state.users[sellerIndex].forSale = state.users[sellerIndex].forSale?.filter(id => id !== productId) || [];
        }
        
        // Update buyer's purchased list
        const buyerIndex = state.users.findIndex(u => u.id === buyerId);
        if (buyerIndex !== -1) {
          state.users[buyerIndex].purchased = [...(state.users[buyerIndex].purchased || []), productId];
        }
        
        // Update current user if they are the seller or buyer
        if (state.currentUser?.id === sellerId) {
          state.currentUser.forSale = state.currentUser.forSale?.filter(id => id !== productId) || [];
        }
        if (state.currentUser?.id === buyerId) {
          state.currentUser.purchased = [...(state.currentUser.purchased || []), productId];
        }
      })
      .addCase(updateUserListsOnSale.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update user lists';
      });
  },
});

// Export actions and reducer
export const {
  setCurrentUser,
  setAuthInitialized,
  clearError,
  clearCurrentUser,
  clearWishlistProducts,
  setLoading,
  setError,
} = userSlice.actions;

export default userSlice.reducer;

// Selectors
export const selectCurrentUser = (state: RootState) => state.users.currentUser;
export const selectAllUsers = (state: RootState) => state.users.users;
export const selectIsAuthInitialized = (state: RootState) => state.users.isAuthInitialized;
export const selectWishlistProducts = (state: RootState) => state.users.wishlistProducts;
export const selectUserLoading = (state: RootState) => state.users.loading;
export const selectUserError = (state: RootState) => state.users.error;
export const selectUserNames = (state: RootState) => state.users.userNames;
export const selectUserById = (state: RootState, userId: string): User | undefined =>
  state.users.users.find((user) => user.id === userId);