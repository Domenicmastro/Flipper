import {
	collection,
	addDoc,
	doc,
	deleteDoc,
	updateDoc,
	serverTimestamp,
	getDoc,
	getDocs,
	query,
	where,
	Timestamp,
} from "firebase/firestore";
import { db } from "./firebase.js";
import { type Product } from "../../types/Product";

export const PRODUCT_COLLECTION_NAME = "products_v2";

export const addProduct = async (
	product: Omit<Product, "id" | "createdAt" | "updatedAt">
): Promise<Product> => {
	const docRef = await addDoc(collection(db, PRODUCT_COLLECTION_NAME), {
		...product,
		categories: product.categories,
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp(),
	});

	const snapshot = await getDoc(docRef);
	const data = snapshot.data();

	if (!data) throw new Error("Failed to retrieve added product");

	return {
		id: docRef.id,
		name: data.name,
		description: data.description,
		images: data.images,
		condition: data.condition,
		price: data.price,
		sellerId: data.sellerId,
		location: data.location,
		priceComparisons: data.priceComparisons ?? [],
		categories: data.categories,
		tags: data.tags ?? [],
		status: data.status,
		attributes: data.attributes ?? [],
		embedding: data.embedding, // ⬅️ return it here too
		createdAt: data.createdAt?.toDate() ?? null,
		updatedAt: data.updatedAt?.toDate() ?? null,
		isAuction: data.isAuction ?? false,
		startingBid: data.startingBid,
		currentBid: data.currentBid,
		bidCount: data.bidCount,
		auctionEndsAt:
			data.auctionEndsAt instanceof Timestamp
				? data.auctionEndsAt
				: data.auctionEndsAt
					? Timestamp.fromDate(new Date(data.auctionEndsAt))
					: undefined,
		bidderId: data.bidderId ?? null,
	};
};

export const deleteProduct = async (productId: string) => {
	await deleteDoc(doc(db, PRODUCT_COLLECTION_NAME, productId));
};

export const updateProduct = async (
	productId: string,
	updates: Partial<Omit<Product, "id" | "createdAt" | "sellerId">>
): Promise<Product> => {
	const productRef = doc(db, PRODUCT_COLLECTION_NAME, productId);
	const snapshot = await getDoc(productRef);
	if (!snapshot.exists()) throw new Error("Product not found");

	await updateDoc(productRef, {
		...updates,
		updatedAt: serverTimestamp(),
	});

	const updatedSnapshot = await getDoc(productRef);
	const data = updatedSnapshot.data();
	if (!data) throw new Error("Product data missing after update");

	return {
		id: productId,
		name: data.name,
		description: data.description,
		images: data.images,
		embedding: data.embedding,
		condition: data.condition,
		price: data.price,
		priceComparisons: data.priceComparisons ?? [],
		sellerId: data.sellerId,
		location: data.location,
		categories: data.categories,
		tags: data.tags ?? [],
		status: data.status,
		attributes: data.attributes ?? [],
		createdAt: data.createdAt?.toDate() ?? null,
		updatedAt: data.updatedAt?.toDate() ?? null,
		isAuction: data.isAuction ?? false,
		startingBid: data.startingBid,
		currentBid: data.currentBid,
		bidCount: data.bidCount,
		auctionEndsAt:
			data.auctionEndsAt instanceof Timestamp
				? data.auctionEndsAt
				: data.auctionEndsAt
					? Timestamp.fromDate(new Date(data.auctionEndsAt))
					: undefined,
		bidderId: data.bidderId ?? null,
	};
};

export const getAllProducts = async (): Promise<Product[]> => {
	const snapshot = await getDocs(collection(db, PRODUCT_COLLECTION_NAME));

	return snapshot.docs.map((doc) => {
		const data = doc.data();
		return {
			id: doc.id,
			name: data.name,
			description: data.description,
			images: data.images,
			embedding: data.embedding,
			condition: data.condition,
			price: data.price,
			priceComparisons: data.priceComparisons ?? [],
			sellerId: data.sellerId,
			location: data.location,
			categories: data.categories,
			tags: data.tags ?? [],
			status: data.status,
			attributes: data.attributes ?? [],
			createdAt: data.createdAt?.toDate() ?? null,
			updatedAt: data.updatedAt?.toDate() ?? null,
			isAuction: data.isAuction ?? false,
			startingBid: data.startingBid,
			currentBid: data.currentBid,
			bidCount: data.bidCount,
			auctionEndsAt:
				data.auctionEndsAt instanceof Timestamp
					? data.auctionEndsAt
					: data.auctionEndsAt
						? Timestamp.fromDate(new Date(data.auctionEndsAt))
						: undefined,
			bidderId: data.bidderId ?? null,
		};
	});
};

export const getProductById = async (productId: string): Promise<Product> => {
	const snapshot = await getDoc(doc(db, PRODUCT_COLLECTION_NAME, productId));
	if (!snapshot.exists()) throw new Error("Product not found");

	const data = snapshot.data();

	return {
		id: snapshot.id,
		name: data.name,
		description: data.description,
		images: data.images,
		embedding: data.embedding,
		condition: data.condition,
		price: data.price,
		priceComparisons: data.priceComparisons ?? [],
		sellerId: data.sellerId,
		location: data.location,
		categories: data.categories,
		tags: data.tags ?? [],
		status: data.status,
		attributes: data.attributes ?? [],
		createdAt: data.createdAt?.toDate() ?? null,
		updatedAt: data.updatedAt?.toDate() ?? null,
		isAuction: data.isAuction ?? false,
		startingBid: data.startingBid,
		currentBid: data.currentBid,
		bidCount: data.bidCount,
		auctionEndsAt:
			data.auctionEndsAt instanceof Timestamp
				? data.auctionEndsAt
				: data.auctionEndsAt
					? Timestamp.fromDate(new Date(data.auctionEndsAt))
					: undefined,
		bidderId: data.bidderId ?? null,
	};
};

export const getProductsInCategory = async (
	categoryId: string
): Promise<Product[]> => {
	const q = query(
		collection(db, PRODUCT_COLLECTION_NAME),
		where("categories", "array-contains", categoryId)
	);

	const snapshot = await getDocs(q);

	return snapshot.docs.map((doc) => {
		const data = doc.data();
		return {
			id: doc.id,
			name: data.name,
			description: data.description,
			images: data.images,
			embedding: data.embedding,
			condition: data.condition,
			price: data.price,
			priceComparisons: data.priceComparisons ?? [],
			sellerId: data.sellerId,
			location: data.location,
			categories: data.categories,
			tags: data.tags ?? [],
			status: data.status,
			attributes: data.attributes ?? [],
			createdAt: data.createdAt?.toDate() ?? null,
			updatedAt: data.updatedAt?.toDate() ?? null,
			isAuction: data.isAuction ?? false,
			startingBid: data.startingBid,
			currentBid: data.currentBid,
			bidCount: data.bidCount,
			auctionEndsAt:
				data.auctionEndsAt instanceof Timestamp
					? data.auctionEndsAt
					: data.auctionEndsAt
						? Timestamp.fromDate(new Date(data.auctionEndsAt))
						: undefined,
			bidderId: data.bidderId ?? null,
		};
	});
};

export const getProductsByTag = async (tag: string): Promise<Product[]> => {
	const q = query(
		collection(db, PRODUCT_COLLECTION_NAME),
		where("tags", "array-contains", tag)
	);

	const snapshot = await getDocs(q);

	return snapshot.docs.map((doc) => {
		const data = doc.data();
		return {
			id: doc.id,
			name: data.name,
			description: data.description,
			images: data.images,
			embedding: data.embedding,
			condition: data.condition,
			price: data.price,
			priceComparisons: data.priceComparisons ?? [],
			sellerId: data.sellerId,
			location: data.location,
			categories: data.categories,
			tags: data.tags ?? [],
			status: data.status,
			attributes: data.attributes ?? [],
			isAuction: data.isAuction ?? false,
			startingBid: data.startingBid,
			currentBid: data.currentBid,
			bidCount: data.bidCount,
			auctionEndsAt:
				data.auctionEndsAt instanceof Timestamp
					? data.auctionEndsAt
					: data.auctionEndsAt
						? Timestamp.fromDate(new Date(data.auctionEndsAt))
						: undefined,
			bidderId: data.bidderId ?? null,
			createdAt: data.createdAt?.toDate() ?? null,
			updatedAt: data.updatedAt?.toDate() ?? null,
		};
	});
};

export const getProductsBySellerId = async (
	sellerId?: string
): Promise<Product[]> => {
	const effectiveSellerId = sellerId?.trim() || "1";

	const q = query(
		collection(db, PRODUCT_COLLECTION_NAME),
		where("sellerId", "==", effectiveSellerId)
	);

	const snapshot = await getDocs(q);

	return snapshot.docs.map((doc) => {
		const data = doc.data();
		return {
			id: doc.id,
			name: data.name,
			description: data.description,
			images: data.images,
			embedding: data.embedding,
			condition: data.condition,
			price: data.price,
			priceComparisons: data.priceComparisons ?? [],
			sellerId: data.sellerId,
			location: data.location,
			categories: data.categories,
			tags: data.tags ?? [],
			status: data.status,
			attributes: data.attributes ?? [],
			isAuction: data.isAuction ?? false,
			startingBid: data.startingBid,
			currentBid: data.currentBid,
			bidCount: data.bidCount,
			auctionEndsAt:
				data.auctionEndsAt instanceof Timestamp
					? data.auctionEndsAt
					: data.auctionEndsAt
						? Timestamp.fromDate(new Date(data.auctionEndsAt))
						: undefined,
			bidderId: data.bidderId ?? null,
			createdAt: data.createdAt?.toDate() ?? null,
			updatedAt: data.updatedAt?.toDate() ?? null,
		};
	});
};

export const searchProducts = async (
	searchTerm: string
): Promise<Product[]> => {
	const term = searchTerm.toLowerCase();

	const snapshot = await getDocs(collection(db, PRODUCT_COLLECTION_NAME));

	return snapshot.docs
		.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
				name: data.name,
				description: data.description,
				images: data.images,
				embedding: data.embedding,
				condition: data.condition,
				price: data.price,
				priceComparisons: data.priceComparisons ?? [],
				sellerId: data.sellerId,
				location: data.location,
				categories: data.categories,
				tags: data.tags ?? [],
				status: data.status,
				attributes: data.attributes ?? [],
				createdAt: data.createdAt?.toDate() ?? null,
				updatedAt: data.updatedAt?.toDate() ?? null,
				isAuction: data.isAuction ?? false,
				startingBid: data.startingBid,
				currentBid: data.currentBid,
				bidCount: data.bidCount,
				auctionEndsAt:
					data.auctionEndsAt instanceof Timestamp
						? data.auctionEndsAt
						: data.auctionEndsAt
							? Timestamp.fromDate(new Date(data.auctionEndsAt))
							: undefined,
				bidderId: data.bidderId ?? null,
			};
		})
		.filter((product) => {
			const inName = product.name.toLowerCase().includes(term);
			const inDesc = product.description?.toLowerCase().includes(term);
			const inTags = product.tags?.some((tag: string) =>
				tag.toLowerCase().includes(term)
			);
			return inName || inDesc || inTags;
		});
};
