import { type Product } from "@/types/Product.ts";
import {
	getAllProducts,
	addProduct,
	deleteProduct,
	updateProduct,
	getProductById,
	getProductsInCategory,
	getProductsByTag,
	getProductsBySellerId,
	searchProducts,
} from "../firebase/products.ts";
import type { Request, Response } from "express";
import express from "express";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../firebase/firebase.ts";
import { cosineSimilarity } from "../utils/cosineSimilarity.ts";
import { averageEmbeddings } from "../utils/getImageEmbedding.ts";

const router = express.Router();

router.get("/", async (_req: Request, res: Response) => {
	try {
		const products = await getAllProducts();
		res.status(200).json(products);
	} catch (error) {
		res
			.status(500)
			.send({ error: "An error occurred while getting products: " + error });
	}
});

router.post("/", async (req: Request, res: Response) => {
	try {
		const product = req.body.product as Omit<
			Product,
			"id" | "createdAt" | "updatedAt"
		>;

		// --- EMBEDDING GENERATION ---
		if (product.images && product.images.length) {
			const embeddings: number[][] = [];

			for (const imageUrl of product.images) {
				let embedding;
				const fetchRes = await fetch(
					"http://localhost:3000/api/image/embedding",
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ imageUrl }),
					}
				);
				if (!fetchRes.ok) {
					console.error(`Embedding fetch failed for ${imageUrl}`);
					embedding = null;
				} else {
					embedding = await fetchRes.json();
				}
				if (embedding) embeddings.push(embedding.embedding);
			}
			console.log(embeddings);
			if (embeddings.length) {
				const averagedEmbedding = averageEmbeddings(embeddings);
				console.log("ave: ", averagedEmbedding);
				(product as any).embedding = averagedEmbedding;
			}
		}
		console.log("ADDING PRODUCT: ", product);
		const result = await addProduct(product);
		res.status(200).json(result);
	} catch (error) {
		console.error("Product creation failed:", error);
		res
			.status(500)
			.send({ error: "An error occurred while adding new product: " + error });
	}
});

router.post("/image", async (req, res) => {
	console.log("products image ");
	const { embedding } = req.body;

	if (!embedding || !Array.isArray(embedding)) {
		res.status(400).json({ error: "Missing or invalid embedding" });
	}

	try {
		const productsSnapshot = await getDocs(collection(db, "products_v2"));
		const matches: { product: any; similarity: number }[] = [];

		productsSnapshot.forEach((doc) => {
			const product = doc.data();
			if (product.embedding && Array.isArray(product.embedding)) {
				const sim = cosineSimilarity(embedding, product.embedding);
				console.log("product: ", product.name);
				console.log("similarity: ", sim);
				matches.push({ product: { id: doc.id, ...product }, similarity: sim });
			}
		});

		const SIMILARITY_THRESHOLD = 0.65;
		const filteredResults = matches
			.filter((m) => m.similarity >= SIMILARITY_THRESHOLD)
			.sort((a, b) => b.similarity - a.similarity);

		if (filteredResults.length === 0) {
			res.status(404).json({ error: "No similar products found" });
		}

		res.status(200).json({ results: filteredResults });
	} catch (error) {
		console.error("Image search failed:", error);
		res.status(500).json({ error: "Failed to search by image" });
	}
});

router.delete("/by-id/:productId", async (req: Request, res: Response) => {
	const productId = req.params.productId;
	try {
		await getProductById(productId);
		console.log("Deleting Product:", productId);
		try {
			await deleteProduct(productId);
			res.status(204).send();
		} catch (err: any) {
			res.status(500).send({
				error: "An error occurred while deleting a product: " + err,
			});
		}
	} catch (error: any) {
		res.status(404).send({ error: "Product with that ID does not exist" });
	}
});

router.patch("/by-id/:productId", async (req: Request, res: Response) => {
	try {
		const productId = req.params.productId;
		const productUpdates = req.body.updates as Partial<
			Omit<Product, "id" | "createdAt" | "updatedAt">
		>;
		await getProductById(productId);
		console.log("Updating Product:", productId);
		const updated = await updateProduct(productId, productUpdates);
		res.status(200).json(updated);
	} catch (error: any) {
		if (error.message.includes("Product not found")) {
			res.status(404).send({ error: "Product with that ID does not exist" });
		} else {
			res.status(500).send({
				error: "An error occurred while updating a product: " + error,
			});
		}
	}
});

// New route to mark product as sold
router.patch(
	"/mark-as-sold/:productId",
	async (req: Request, res: Response) => {
		try {
			const productId = req.params.productId;
			const { buyerId } = req.body;

			if (!buyerId) {
				res.status(400).json({ error: "Buyer ID is required" });
			}

			await getProductById(productId);
			console.log("Marking Product as Sold:", productId, "Buyer:", buyerId);

			const productUpdates = {
				status: "Sold",
			};

			const updated = await updateProduct(productId, productUpdates);
			res.status(200).json(updated);
		} catch (error: any) {
			if (error.message?.includes("Product not found")) {
				res.status(404).json({ error: "Product with that ID does not exist" });
			}
			res.status(500).json({
				error: "An error occurred while marking product as sold: " + error,
			});
		}
	}
);

router.get("/by-id/:productId", async (req: Request, res: Response) => {
	try {
		const productId = req.params.productId;
		console.log("Getting Product:", productId);
		const product = await getProductById(productId);
		res.status(200).json(product);
	} catch (error) {
		res
			.status(404)
			.send({ error: "An error occurred while retrieving product: " + error });
	}
});

router.get("/by-category/:categoryId", async (req: Request, res: Response) => {
	try {
		const categoryId = req.params.categoryId;
		console.log("Getting Products in Category:", categoryId);
		const products = await getProductsInCategory(categoryId);
		res.status(200).json(products);
	} catch (error) {
		res.status(500).send({
			error:
				"An error occurred while retrieving products by category: " + error,
		});
	}
});

router.get("/by-tag/:tag", async (req: Request, res: Response) => {
	try {
		const tag = req.params.tag;
		console.log("Getting Products by Tag:", tag);
		const products = await getProductsByTag(tag);
		res.status(200).json(products);
	} catch (error) {
		res.status(500).send({
			error: "An error occurred while retrieving products by tag: " + error,
		});
	}
});

router.get("/by-seller-id/:sellerId", async (req: Request, res: Response) => {
	try {
		const sellerId = req.params.sellerId;
		console.log("Getting Products by Seller Id:", sellerId);
		const products = await getProductsBySellerId(sellerId);
		res.status(200).json(products);
	} catch (error) {
		res.status(500).send({
			error:
				"An error occurred while retrieving products by seller Id: " + error,
		});
	}
});

router.get("/search-products", async (req: Request, res: Response) => {
	try {
		const searchTerm = req.query.input as string;
		console.log("Getting Products matching search term", searchTerm);
		const products = await searchProducts(searchTerm);
		if (!products || products.length === 0) {
			res.status(404).send({ message: "No Products found" });
		}
		res.status(200).json(products);
	} catch (error) {
		res
			.status(500)
			.send({ error: "An error occurred while searching products: " + error });
	}
});

export default router;
