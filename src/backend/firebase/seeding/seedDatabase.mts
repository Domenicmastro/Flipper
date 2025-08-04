// import { addProduct } from "../products";
// import { createUser } from "../users"
import { products } from "./exampleProducts.js";
import { users } from "./exampleUsers.js";
import admin from "firebase-admin";
import type { ServiceAccount } from "firebase-admin";

// Replace this with your actual service account file
import serviceAccount from "../../config/firebase-service-account.json" assert { type: "json" };

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount as ServiceAccount),
});

const db = admin.firestore();

async function seedProducts() {
	const batch = db.batch();
	const collectionRef = db.collection("products_v2");

	products.forEach((product) => {
		const docRef = collectionRef.doc(product.id); // use .doc() with specific ID
		batch.set(docRef, product);
	});

	try {
		await batch.commit();
		console.log("Products successfully seeded to 'products_v2'");
	} catch (err) {
		console.error("Error seeding products:", err);
	}
}

async function seedUsers() {
	const batch = db.batch();
	const collectionRef = db.collection("users_v2");

	users.forEach((user) => {
		const docRef = collectionRef.doc(user.id); // use .doc() with specific ID
		batch.set(docRef, user);
	});

	try {
		await batch.commit();
		console.log("Users successfully seeded to 'users_v2'");
	} catch (err) {
		console.error("Error seeding products:", err);
	}
}

async function seedUserAuth() {
	try {
		const userRecord = await admin.auth().createUser({
			uid: "user_001",
			email: "alice.johnson@example.com",
			password: "12341234",
			displayName: "Alice Johnson",
		});

		console.log("Successfully created user:", userRecord.uid);
		process.exit(0);
	} catch (error) {
		console.error("Error creating user:", error);
		process.exit(1);
	}
}

try {
	seedUsers();
	seedProducts();
	seedUserAuth();
} catch (err) {
	console.error("❌ Unhandled error:", err);
}

// async function addAllProducts() {
// 	for (const product of products) {
// 		try {
// 			const addedProduct = await addProduct(product);
// 			console.log(
// 				`Added product: ${addedProduct.name} (ID: ${addedProduct.id})`
// 			);
// 		} catch (error) {
// 			console.error(`Failed to add product ${product.name}:`, error);
// 		}
// 	}
// }

// addAllProducts()
// 	.then(() => {
// 		console.log("All products processed.");
// 		process.exit(0);
// 	})
// 	.catch((err) => {
// 		console.error("Error in adding products:", err);
// 		process.exit(1);
// 	});

// async function addAllUsers() {
// 	for (const user of users) {
// 		try {
// 			const addedUser = await createUser(user);
// 			console.log(
// 				`Added user: ${addedUser.id} )`
// 			);
// 		} catch (error) {
// 			console.error(`Failed to add user ${user.id}:`, error);
// 		}
// 	}
// }

// addAllUsers()
// 	.then(() => {
// 		console.log("All users processed.");
// 		process.exit(0);
// 	})
// 	.catch((err) => {
// 		console.error("Error in adding users:", err);
// 		process.exit(1);
// 	});
