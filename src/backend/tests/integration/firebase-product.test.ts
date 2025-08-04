import { describe, it, beforeEach, afterEach } from "mocha";
import { expect } from "chai";
import {
	addProduct,
	getAllProducts,
	getProductById,
	getProductsInCategory,
	deleteProduct,
	updateProduct,
	searchProducts,
} from "../../firebase/products.js";
import {
	type Product,
	type Location,
	Category,
	type Attribute,
} from "../../../types/Product.ts";
const testCategoryId = Category.Accessories;
const testLocation: Location = {
	label: "Vancouver, BC, Canada",
	lat: 49.2827,
	lng: -123.1207,
};
const testAttribute: Attribute = {
	category: "Color",
	value: "Blue",
};
const testProduct: Omit<Product, "id" | "createdAt" | "updatedAt"> = {
	name: "Test Chair",
	description: "A comfy test chair",
	price: 49.99,
	sellerId: "user123",
	status: "For Sale",
	tags: ["test", "chair"],
	categories: [Category.Accessories],
	images: [""],
	embedding: [],
	condition: "New",
	location: testLocation,
	attributes: [testAttribute],
	priceComparisons: [],
};

describe("Testing product functionality through firebase directly", () => {
	const productIds: string[] = [];
	let product: Product;
	let productId: string;

	beforeEach(async () => {
		product = await addProduct(testProduct);
		productId = product.id;
		productIds.push(productId);
	});

	afterEach(async () => {
		await Promise.all(productIds.map((id) => deleteProduct(id)));
		productIds.length = 0; // clear the array
	});

	it("should add a product", async () => {
		try {
			expect(productId).to.exist;
		} catch (err: any) {
			throw new Error(`Error adding product: ${err.message}`);
		}
	});

	it("should fetch product by ID", async () => {
		try {
			let fetchedProduct = await getProductById(productId);
			expect(fetchedProduct).to.exist;
			expect(fetchedProduct.name).to.equal(testProduct.name);
		} catch (err: any) {
			throw new Error(`Error fetching by ID: ${err.message}`);
		}
	});

	it("should fetch all products", async () => {
		try {
			const product2 = await addProduct(testProduct);
			const productId2 = product2.id;
			productIds.push(productId2);
			const products = await getAllProducts();
			expect(products).to.be.an("array");
			expect(products.length).to.be.gte(2);
		} catch (err: any) {
			throw new Error(`Error fetching all products: ${err.message}`);
		}
	});

	it("should search products with 'chair'", async () => {
		try {
			const results = await searchProducts("chair");
			expect(results).to.be.an("array");
			expect(results.some((p) => p.name.toLowerCase().includes("chair"))).to.be
				.true;
		} catch (err: any) {
			throw new Error(`Error searching products: ${err.message}`);
		}
	});

	it(`should get products in category '${testCategoryId}'`, async () => {
		try {
			const products = await getProductsInCategory(testCategoryId);
			expect(products).to.be.an("array");
			expect(products.some((p) => p.categories.includes(testCategoryId))).to.be
				.true;
		} catch (err: any) {
			throw new Error(`Error fetching products in category: ${err.message}`);
		}
	});

	it("should update product price", async () => {
		try {
			await updateProduct(productId, { price: 59.99 });
			const updatedProduct = await getProductById(productId);
			expect(updatedProduct.price).to.equal(59.99);
		} catch (err: any) {
			throw new Error(`Error updating price: ${err.message}`);
		}
	});

	it("should update product status", async () => {
		try {
			await updateProduct(productId, { status: "Sold" });
			const updatedProduct = await getProductById(productId);
			expect(updatedProduct.status).to.equal("Sold");
		} catch (err: any) {
			throw new Error(`Error updating status: ${err.message}`);
		}
	});

	it("should delete product", async () => {
		expect(productId).to.exist;

		await deleteProduct(productId);

		try {
			await getProductById(productId);
			throw new Error("Product still exists after deletion");
		} catch (err: any) {
			expect(err.message).to.include("Product not found");
		}
	});

	it("should fail to delete the same product again", async () => {
		try {
			await deleteProduct(productId);
			throw new Error("Expected deleteProduct to throw, but it succeeded");
		} catch (error) {
			expect(error).to.exist;
		}
	});
});
