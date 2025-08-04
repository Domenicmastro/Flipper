import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import FormData from "form-data";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const PRODUCT_IMAGE_DIR = path.resolve(__dirname, "../../../public");
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;
const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET;

async function uploadToCloudinary(filePath: string): Promise<string> {
	const formData = new FormData();
	formData.append("file", fs.createReadStream(filePath));
	formData.append("upload_preset", UPLOAD_PRESET!);
	formData.append("folder", "uploads");

	const res = await fetch(CLOUDINARY_UPLOAD_URL, {
		method: "POST",
		body: formData as any,
	} as any);

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Upload failed: ${err}`);
	}

	const data = (await res.json()) as any;
	return data.secure_url;
}

async function updateProductImageUrls() {
	const res = await fetch("http://localhost:3000/api/products");
	const products = (await res.json()) as any;

	for (const product of products) {
		const productId = product.id;
		const localPaths: string[] = product.images ?? [];

		const uploadedUrls = [];

		for (const relPath of localPaths) {
			const fullPath = path.join(PRODUCT_IMAGE_DIR, relPath);
			if (!fs.existsSync(fullPath)) {
				console.warn(`Skipping missing file: ${fullPath}`);
				continue;
			}

			const url = await uploadToCloudinary(fullPath);
			console.log(`Uploaded ${relPath} -> ${url}`);
			uploadedUrls.push(url);
		}

		if (uploadedUrls.length) {
			await fetch(`http://localhost:3000/api/products/by-id/${productId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ updates: { images: uploadedUrls } }),
			});
			console.log(`✔ Updated product ${productId}`);
		}
	}
}

updateProductImageUrls().catch(console.error);
