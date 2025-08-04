import {
	collection,
	doc,
	getDoc,
	getDocs,
	query,
	where,
} from "firebase/firestore";
import { db } from "../firebase/firebase.ts";
import { type Product, StatusLevel } from "../../types/Product.ts"

const CATEGORY_OVERLAP_WEIGHT = 3
const TAG_OVERLAP_WEIGHT = 2
const ATTRIBUTE_OVERLAP_WEIGHT = 1

// Compute similarity score between two products
function getSimilarityScore(productA: Product, productB: Product): number {
	let score = 0;

	// Category overlap
	const categoriesA = productA.categories ?? [];
	const categoriesB = productB.categories ?? [];
	const categoryOverlap = categoriesA.filter((cat) =>
		categoriesB.includes(cat)
	).length;
	score += categoryOverlap * CATEGORY_OVERLAP_WEIGHT;

	// Tag overlap
	const tagsA = productA.tags ?? [];
	const tagsB = productB.tags ?? [];
	const tagOverlap = tagsA.filter((tag) => tagsB.includes(tag)).length;
	score += tagOverlap * TAG_OVERLAP_WEIGHT;

	// Attribute overlap
	const attributeOverlap = productA.attributes.filter((a) =>
		productB.attributes.includes(a)
	).length;
	score += attributeOverlap * ATTRIBUTE_OVERLAP_WEIGHT;

	return score;
}

// Main recommendation function
export async function getRecommendedProducts(
	userId: string,
	maxResults = 100
): Promise<Product[]> {
	try {
		console.log("Getting recommendations for userId:", userId);

		// Get the user document to access the wishlist array
		const userDoc = await getDoc(doc(db, "users_v2", userId));
		if (!userDoc.exists()) {
			console.log("User document not found");
			return [];
		}

		const userData = userDoc.data();

		// Get wishlist product IDs from the user document
		const wishlistProductIds: string[] = userData.wishlist || [];

		if (wishlistProductIds.length === 0) {
			console.log("No items in wishlist");
			return [];
		}

		// Fetch full product data for each wishlisted item
		const wishlistProducts: Product[] = [];
		for (const productId of wishlistProductIds) {
			const productDoc = await getDoc(doc(db, "products_v2", productId));
			if (productDoc.exists()) {
				wishlistProducts.push(productDoc.data() as Product);
			}
		}

		if (wishlistProducts.length === 0) return [];

		// Get all products first (optional debug)
		const allProductsSnapshot = await getDocs(collection(db, "products_v2"));
		console.log("Total products in database:", allProductsSnapshot.size);

		// Get all available (not sold) products
		const availableProductsQuery = query(
			collection(db, "products_v2"),
			where("status", "!=", StatusLevel.sold)
		);
		const availableProductsSnapshot = await getDocs(availableProductsQuery);

		const allProducts = availableProductsSnapshot.docs
			.map((doc) => doc.data() as Product)
			.filter((p) =>
				!wishlistProductIds.includes(p.id) && // not already wishlisted
				p.sellerId !== userId // not sold by the current user
			);

		// Score each remaining product based on similarity to wishlist items
		const scored = allProducts.map((product) => {
			let totalScore = 0;
			for (const wishProduct of wishlistProducts) {
				totalScore += getSimilarityScore(wishProduct, product);
			}
			return { product, score: totalScore };
		});

		// Sort by score descending
		scored.sort((a, b) => b.score - a.score);

		console.log("Top 5 recommendations scores:", scored.slice(0, 5).map(s => s.score));

		// Return top N products
		return scored.slice(0, maxResults).map((entry) => entry.product);
	} catch (error) {
		console.error("Error getting recommendations:", error);
		throw error;
	}
}