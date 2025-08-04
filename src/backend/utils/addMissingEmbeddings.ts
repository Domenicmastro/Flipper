import fetch from "node-fetch";
import dotenv from "dotenv";
import type { Product } from "@/types";
dotenv.config({ path: "../.env" });

const BACKEND_API = "http://localhost:3000";
const EMBEDDING_ENDPOINT = `${BACKEND_API}/api/image/embedding`;
const GET_PRODUCTS_ENDPOINT = `${BACKEND_API}/api/products`;
const PATCH_PRODUCT_ENDPOINT = `${BACKEND_API}/api/products/by-id`;

async function getAllProducts() {
	const res = await fetch(GET_PRODUCTS_ENDPOINT);
	if (!res.ok) throw new Error("Failed to fetch products");
	return await res.json();
}

async function getImageEmbedding(imageUrl: string): Promise<number[] | null> {
	console.log("Embedding for:", imageUrl);
	const res = await fetch(EMBEDDING_ENDPOINT, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ imageUrl }),
	});
	if (!res.ok) {
		console.error(`Embedding failed for ${imageUrl}`);
		return null;
	}
	const data = (await res.json()) as any;
	return data.embedding || null;
}

function averageEmbeddings(embeddings: number[][]): number[] {
	const length = embeddings[0].length;
	const avg = Array(length).fill(0);
	for (const emb of embeddings) {
		for (let i = 0; i < length; i++) {
			avg[i] += emb[i];
		}
	}
	return avg.map((sum) => sum / embeddings.length);
}

async function updateProductEmbedding(productId: string, embedding: number[]) {
	const res = await fetch(`${PATCH_PRODUCT_ENDPOINT}/${productId}`, {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ updates: { embedding } }),
	});

	if (!res.ok) {
		const errorText = await res.text();
		console.error(`Failed to update product ${productId}:`, errorText);
	} else {
		console.log(`✅ Updated product ${productId} with embedding.`);
	}
}

async function main() {
	console.log("Fetching products...");
	const products = (await getAllProducts()) as Product[];

	const productsMissingEmbedding = products.filter(
		(p: any) => !Array.isArray(p.embedding)
	);

	console.log(
		`Found ${productsMissingEmbedding.length} product(s) without embeddings.`
	);

	for (const product of productsMissingEmbedding) {
		if (!Array.isArray(product.images) || product.images.length === 0) {
			console.warn(`⚠️ Product ${product.id} missing images, skipping.`);
			continue;
		}

		console.log(`Generating embeddings for product ${product.id}...`);
		const validEmbeddings: number[][] = [];

		for (const img of product.images) {
			const embedding = await getImageEmbedding(img);
			if (embedding) validEmbeddings.push(embedding);
			else console.warn(`  ⚠️ Failed to get embedding for image: ${img}`);
		}

		if (validEmbeddings.length === 0) {
			console.warn(`❌ No valid embeddings for product ${product.id}`);
			continue;
		}

		const averagedEmbedding = averageEmbeddings(validEmbeddings);
		await updateProductEmbedding(product.id, averagedEmbedding);
	}
}

main().catch((err) => {
	console.error("Script failed:", err);
	process.exit(1);
});
