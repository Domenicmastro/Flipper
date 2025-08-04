import { configureStore } from "@reduxjs/toolkit";
import productReducer from "./slices/productSlice";
import userReducer from "./slices/userSlice";
import recommendationsReducer from "./slices/recommendationsSlice"
import productsySellerReducer from "./slices/productBySellerSlice";
import messagesReducer from "./slices/messageSlice";

export const store = configureStore({
	reducer: {
		products: productReducer,
		users: userReducer,
		recommendations: recommendationsReducer,
		productsBySeller: productsySellerReducer,
		messages: messagesReducer,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: ["persist/PERSIST"],
			},
		}),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
