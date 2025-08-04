import {
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	setDoc,
	updateDoc,
	serverTimestamp,
	Timestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase.ts";
import type { User, Product } from "@/types";
import { deleteUser as deleteAuthUser } from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";
import { PRODUCT_COLLECTION_NAME } from "./products.ts";

const USER_COLLECTION_NAME = "users_v2";

// Get one user by ID
export const getUserById = async (
	userId: string,
	authUser?: FirebaseUser
): Promise<User> => {
	const ref = doc(db, USER_COLLECTION_NAME, userId);
	const snap = await getDoc(ref);

	if (!snap.exists()) {
		const defaultUser: Omit<User, "joinedAt" | "location" | "reviews" | "forSale"> = {
			id: userId,
			name: authUser?.displayName || "New User",
			email: authUser?.email || "",
			image: authUser?.photoURL || "",
			bio: "",
			lastOnline: "",
			conversationIds: [],
			blockedUserIds: [],
			wishlist: [],
		};

		await setDoc(ref, {
			...defaultUser,
			location: {
				label: "",
				lat: 0,
				lng: 0,
			},
			reviews: [],
			forSale: [],
			joinedAt: serverTimestamp(),
		});

		return {
			...defaultUser,
			location: {
				label: "",
				lat: 0,
				lng: 0,
			},
			reviews: [],
			forSale: [],
			joinedAt: new Date().toISOString(),
		};
	}

	const data = snap.data();
	return {
		id: snap.id,
		...(data as Omit<User, "id" | "joinedAt">),
		joinedAt:
			data.joinedAt instanceof Timestamp
				? data.joinedAt.toDate().toISOString()
				: data.joinedAt ?? new Date().toISOString(),
	};
};

// Get all users
export const getAllUsers = async (): Promise<User[]> => {
	const snap = await getDocs(collection(db, USER_COLLECTION_NAME));
	return snap.docs.map((doc) => {
		const data = doc.data();
		return {
			id: doc.id,
			...(data as Omit<User, "id" | "joinedAt">),
			joinedAt:
				data.joinedAt instanceof Timestamp
					? data.joinedAt.toDate().toISOString()
					: data.joinedAt ?? new Date().toISOString(),
		};
	});
};

// Create or overwrite a user
export const createUser = async (user: Omit<User, "joinedAt">) => {
	const ref = doc(db, USER_COLLECTION_NAME, user.id);
	await setDoc(ref, {
		...user,
		joinedAt: serverTimestamp(),
	});
	return { id: user.id };
};

// Delete a user (must be authed)
export const deleteUser = async (userId?: string) => {
	const uid = userId || auth.currentUser?.uid;
	if (!uid) throw new Error("No authenticated user");
	await deleteDoc(doc(db, USER_COLLECTION_NAME, uid));
	if (!userId && auth.currentUser) {
		await deleteAuthUser(auth.currentUser);
	}
};

// Update user fields
export const updateUser = async (userId: string, updates: Partial<User>) => {
	const ref = doc(db, USER_COLLECTION_NAME, userId);
	await updateDoc(ref, updates);
};

// Add a product to the user's wishlist
export const addToWishlist = async (userId: string, productId: string) => {
	const userRef = doc(db, USER_COLLECTION_NAME, userId);
	const userSnap = await getDoc(userRef);
	if (!userSnap.exists()) throw new Error("User not found");

	const current = userSnap.data().wishlist || [];
	if (!current.includes(productId)) {
		await updateDoc(userRef, {
			wishlist: [...current, productId],
		});
	}
};

// Remove a product from wishlist
export const removeFromWishlist = async (userId: string, productId: string) => {
	const userRef = doc(db, USER_COLLECTION_NAME, userId);
	const userSnap = await getDoc(userRef);
	if (!userSnap.exists()) throw new Error("User not found");

	const current = userSnap.data().wishlist || [];
	await updateDoc(userRef, {
		wishlist: current.filter((id: string) => id !== productId),
	});
};

// Get full product objects from wishlist
export const getWishlistProducts = async (
	userId: string
): Promise<Product[]> => {
	const products: Product[] = [];
	const userRef = doc(db, USER_COLLECTION_NAME, userId);
	const userSnap = await getDoc(userRef);
	if (!userSnap.exists()) throw new Error("User not found");

	const wishlist = userSnap.data().wishlist || [];

	for (const id of wishlist) {
		const ref = doc(db, PRODUCT_COLLECTION_NAME, id);
		const snap = await getDoc(ref);
		if (snap.exists()) {
			const data = snap.data();
			products.push({
				id: snap.id,
				name: data.name,
				description: data.description,
				images: data.images,
				condition: data.condition,
				price: data.price,
				priceComparisons: data.priceComparisons ?? [],
				sellerId: data.sellerId,
				location: data.location,
				categories: data.categories,
				tags: data.tags ?? [],
				status: data.status,
				attributes: data.attributes ?? [],
				createdAt:
					data.createdAt instanceof Timestamp
						? data.createdAt.toDate()
						: data.createdAt ?? null,
				updatedAt:
					data.updatedAt instanceof Timestamp
						? data.updatedAt.toDate()
						: data.updatedAt ?? null,
			});
		}
	}
	return products;
};
