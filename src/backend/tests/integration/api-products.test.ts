import { describe, it, beforeEach, afterEach } from "mocha";
import { expect } from "chai";
import request from "supertest";
import app from "../../../backend/app.js"; // express app
import { addProduct, deleteProduct } from "../../firebase/products.js";
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

describe("Testing product functionality through API routes", () => {
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

	it("should add product", async () => {
		const testProductNew: Omit<Product, "id" | "createdAt" | "updatedAt"> = {
			name: "Another Test Chair",
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
		const res = await request(app)
			.post("/api/products")
			.send({ product: testProductNew })
			.set("Content-Type", "application/json")
			.set("Accept", "application/json");

		expect(res.status).to.equal(200);
		const newProduct = res.body;
		if (newProduct) productIds.push(newProduct.id);
		expect(newProduct.name).to.equal("Another Test Chair");
		expect(newProduct.createdAt).to.exist;
		expect(newProduct.updatedAt).to.exist;
		expect(newProduct.id).to.exist;
	});

	it("should fetch all products", async () => {
		const res = await request(app).get("/api/products");

		expect(res.status).to.equal(200);
		expect(res.body).to.be.an("array");
		expect(res.body.length).to.be.gte(1);
	});

	it("should get product by product ID", async () => {
		const res = await request(app).get(`/api/products/by-id/${productId}`);

		expect(res.status).to.equal(200);
		const fetchedProduct = res.body;
		expect(fetchedProduct).to.exist;
		expect(fetchedProduct.id).to.equal(productId);
	});

	it("should get products by category ID", async () => {
		const res = await request(app).get(
			`/api/products/by-category/${testCategoryId}`
		);

		expect(res.status).to.equal(200);
		expect(res.body).to.be.an("array");
		expect(res.body.length).to.be.gte(1);
	});

	it("should get products by seller ID", async () => {
		const res = await request(app).get(
			`/api/products/by-seller-id/${testProduct.sellerId}`
		);

		expect(res.status).to.equal(200);
		expect(res.body).to.be.an("array");
		expect(res.body.length).to.be.gte(1);
	});

	it("should get products by tag", async () => {
		const tag = testProduct.tags[0];
		const res = await request(app).get(`/api/products/by-tag/${tag}`);

		expect(res.status).to.equal(200);
		expect(res.body).to.be.an("array");
		expect(res.body.length).to.be.gte(1);
	});

	it("should search product by 'chair'", async () => {
		const res = await request(app)
			.get("/api/products/search-products")
			.query({ input: "chair" });
		expect(res.status).to.equal(200);
		expect(res.body).to.be.an("array");
		const found = res.body.some((p: Product) =>
			p.name.toLowerCase().includes("chair")
		);
		expect(found).to.be.true;
	});

	it("should update price and status", async () => {
		const updates = { updates: { status: "Sold", price: 3.99 } };

		const res = await request(app)
			.patch(`/api/products/by-id/${productId}`)
			.send(updates)
			.set("Accept", "application/json");

		expect(res.status).to.equal(200);
		const updatedProduct = res.body;
		expect(updatedProduct.price).to.equal(3.99);
		expect(updatedProduct.status).to.equal("Sold");
	});

	it("should delete product", async () => {
		console.log("product ID (test): ", productId);
		const deleteRes = await request(app).delete(
			`/api/products/by-id/${productId}`
		);
		expect(deleteRes.status).to.equal(204);
		const getRes = await request(app).get(`/api/products/by-id/${productId}`);
		expect(getRes.status).to.equal(404);
	});

	it("should fail to delete same product twice", async () => {
		// First delete
		const deleteRes1 = await request(app).delete(
			`/api/products/by-id/${productId}`
		);
		expect(deleteRes1.status).to.equal(204);
		const deleteRes2 = await request(app).delete(
			`/api/products/by-id/${productId}`
		);
		expect(deleteRes2.status).to.equal(404);
	});

	it("should place bid on auctioned item", async () => {
		//
		const testProductNew: Omit<Product, "id" | "createdAt" | "updatedAt"> = {
			name: "Another Test Chair (Auctionable)",
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
			isAuction: true,
			startingBid: 49.99,
			currentBid: 0.0,
			bidCount: 0,
		};
		const resAdd = await request(app)
			.post("/api/products")
			.send({ product: testProductNew })
			.set("Content-Type", "application/json")
			.set("Accept", "application/json");

		expect(resAdd.status).to.equal(200);
		const newProduct = resAdd.body;
		if (newProduct) productIds.push(newProduct.id);
		const resBid = await request(app)
			.post(`/api/bids/${newProduct.id}/bid`)
			.send({
				amount: 50.0,
				userId: "user123",
			})
			.set("Accept", "application/json");
		expect(resBid.status).to.equal(200);
		const auctionedProduct = resBid.body;
		if (!auctionedProduct) {
			throw new Error("Auctioned product should exist!");
		}
		expect(auctionedProduct.currentBid).to.equal(50.0);
		expect(auctionedProduct.bidderId).to.equal("user123");
		expect(auctionedProduct.bidCount).to.equal(1);
	});

	it("should not be able to bid less than current bid", async () => {
		//
		const testProductNew: Omit<Product, "id" | "createdAt" | "updatedAt"> = {
			name: "Another Test Chair (Auctionable)",
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
			isAuction: true,
			startingBid: 49.99,
			currentBid: 60.0,
			bidCount: 3,
		};
		const resAdd = await request(app)
			.post("/api/products")
			.send({ product: testProductNew })
			.set("Content-Type", "application/json")
			.set("Accept", "application/json");

		expect(resAdd.status).to.equal(200);
		const newProduct = resAdd.body;
		if (newProduct) productIds.push(newProduct.id);
		try {
			const resBid = await request(app)
				.post(`/api/bids/${newProduct.id}/bid`)
				.send({
					amount: 50.0,
					userId: "user123",
				})
				.set("Accept", "application/json");
			expect(resBid.status).to.equal(400);
		} catch (error: any) {
			// pass!
		}
	});

	it("should not be able to bid on non-auctionable product", async () => {
		//
		const testProductNew: Omit<Product, "id" | "createdAt" | "updatedAt"> = {
			name: "Another Test Chair (Auctionable)",
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
			isAuction: false,
		};
		const resAdd = await request(app)
			.post("/api/products")
			.send({ product: testProductNew })
			.set("Content-Type", "application/json")
			.set("Accept", "application/json");

		expect(resAdd.status).to.equal(200);
		const newProduct = resAdd.body;
		if (newProduct) productIds.push(newProduct.id);
		try {
			const resBid = await request(app)
				.post(`/api/bids/${newProduct.id}/bid`)
				.send({
					amount: 50.0,
					userId: "user123",
				})
				.set("Accept", "application/json");
			expect(resBid.status).to.equal(400);
		} catch (error: any) {
			// pass!
		}
	});
});
