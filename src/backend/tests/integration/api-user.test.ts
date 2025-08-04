import { describe, it, before, after } from "mocha";
import { expect } from "chai";
import request from "supertest";
import app from "../../../backend/app.ts";
import admin from "firebase-admin";
import type { User } from "../../../types/User";
import type { Location } from "../../../types/Product";
import { firebaseConfig } from "../../firebase/firebase.ts";
import {
	initializeApp as initAdminApp,
	getApps as getAdminApps,
	cert,
} from "firebase-admin/app";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let createdUserId: string;
let testUserId = "";
let idToken = "";

const testLocation: Location = {
	label: "Vancouver, BC, Canada",
	lat: 49.2827,
	lng: -123.1207,
};

const testUser: Omit<User, "joinedAt"> = {
	id: "", // will be set to testUserId before test
	name: "Test User",
	email: "testuser@example.com",
	location: testLocation,
	reviews: [],
	forSale: [],
	image: "",
	bio: "Test bio",
	lastOnline: new Date().toISOString(),
	conversationIds: [],
	blockedUserIds: [],
	wishlist: [],
};

describe("User Routes (with auth)", () => {
	before(async function () {
		this.timeout(10000);

		if (!getAdminApps().length) {
			// Only initialize if not initialized yet, with projectId here if you want
			initAdminApp({
				credential: cert(
					path.join(__dirname, "../config/firebase-service-account.json")
				),
				projectId: "flipper-ae6d1",
			});
		}

		const adminAuth = admin.auth();

		const userRecord = await adminAuth.createUser({
			email: testUser.email,
			password: "testpassword",
			displayName: testUser.name,
		});

		testUserId = userRecord.uid;
		testUser.id = testUserId;

		const customToken = await adminAuth.createCustomToken(testUserId);

		const fetch = (await import("node-fetch")).default;
		const apiKey = firebaseConfig.apiKey;

		const response = await fetch(
			`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token: customToken, returnSecureToken: true }),
			}
		);

		const data = (await response.json()) as any;
		idToken = data.idToken;
	});

	after(async () => {
		if (createdUserId)
			await admin.auth().deleteUser(createdUserId).catch(console.error);
		if (testUserId)
			await admin.auth().deleteUser(testUserId).catch(console.error);
	});

	it("should create a user (POST /users) with auth", async () => {
		const res = await request(app)
			.post("/api/users")
			.set("Authorization", `Bearer ${idToken}`)
			.send({ user: testUser });

		expect(res.status).to.equal(200);
		expect(res.body).to.have.property("id", testUserId);
		createdUserId = res.body.id;
	});

	it("should get user by id (PUT /users/get-or-create/:userId) without auth", async () => {
		const res = await request(app).put(
			`/api/users/get-or-create/${testUserId}`
		);

		expect(res.status).to.equal(200);
		expect(res.body).to.have.property("id", testUserId);
	});

	it("should update user info (PATCH /users/by-id/:userId) with auth", async () => {
		const updates = { bio: "Updated bio" };

		const res = await request(app)
			.patch(`/api/users/by-id/${testUserId}`)
			.set("Authorization", `Bearer ${idToken}`)
			.send({ updates });

		expect(res.status).to.equal(200);
	});

	it("should NOT update user info with invalid auth", async () => {
		const updates = { bio: "Fail update" };

		const res = await request(app)
			.patch(`/api/users/by-id/${testUserId}`)
			.set("Authorization", `Bearer invalidtoken`)
			.send({ updates });

		expect(res.status).to.equal(401);
	});

	it("should add product to wishlist (PUT /users/wishlist/by-user-and-product-id/:userId/:productId)", async () => {
		const dummyProductId = "dummy-product-id";

		const res = await request(app)
			.put(
				`/api/users/wishlist/by-user-and-product-id/${testUserId}/${dummyProductId}`
			)
			.set("Authorization", `Bearer ${idToken}`);

		expect(res.status).to.equal(200);
	});

	it("should get wishlist (GET /users/wishlist/by-user-id/:userId) without auth", async () => {
		const res = await request(app).get(
			`/api/users/wishlist/by-user-id/${testUserId}`
		);

		expect(res.status).to.equal(200);
		expect(res.body).to.be.an("array");
	});

	it("should delete user (DELETE /users) with auth", async () => {
		const res = await request(app)
			.delete("/api/users")
			.set("Authorization", `Bearer ${idToken}`);

		expect(res.status).to.equal(200);
	});

	it("should not delete user (DELETE /users) without auth", async () => {
		try {
			const res = await request(app).delete("/api/users");
			expect(res.status).to.equal(403);
		} catch (error: any) {
			// pass
		}
	});

	it("should get recommendations for user", async () => {
		const thisTestUserId = "user_001";

		const adminAuth = admin.auth();
		const customToken = await adminAuth.createCustomToken(thisTestUserId);

		const fetch = (await import("node-fetch")).default;
		const apiKey = firebaseConfig.apiKey;

		const response = await fetch(
			`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					token: customToken,
					returnSecureToken: true,
				}),
			}
		);

		const data = (await response.json()) as any;
		const thisCustomToken = data.idToken;

		// const thisCustomToken =
		// 	"eyJhbGciOiJSUzI1NiIsImtpZCI6ImE4ZGY2MmQzYTBhNDRlM2RmY2RjYWZjNmRhMTM4Mzc3NDU5ZjliMDEiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiQWxpY2UgSm9obnNvbiIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9mbGlwcGVyLWFlNmQxIiwiYXVkIjoiZmxpcHBlci1hZTZkMSIsImF1dGhfdGltZSI6MTc1Mjg3NjgyNywidXNlcl9pZCI6InVzZXJfMDAxIiwic3ViIjoidXNlcl8wMDEiLCJpYXQiOjE3NTI4NzY4MjcsImV4cCI6MTc1Mjg4MDQyNywiZW1haWwiOiJhbGljZS5qb2huc29uQGV4YW1wbGUuY29tIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7ImVtYWlsIjpbImFsaWNlLmpvaG5zb25AZXhhbXBsZS5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwYXNzd29yZCJ9fQ.xpOIqJEsowtlGaT3A1eFAADMsVrphiySw1lUocmOSd_a2EGBNaUBG0Mc1qDbWFBeJU_0LlvSg0U37c8Gg_DA9j8IRSfS62IDFoAtqQuS5zzAC1Z6sBIqxDQKF71xK-mYlLnzcom8S1rY_mX5JWC0wEkIEcpulw3X2WQzXS2tGiJZnEDeYUxtxRQgIth1SukJssd1vqmjttdsZrCf_h_lTpha5BTPVBHmiJNSPUZYm_2Fnq3iMD_YUr4c8Bx4xuHTJT88DjnjyK3du2B2mnx0QRjn8YMVcNBAGhWoAyKrt46TBd7WNFDOdOyldir4NfhrMLLD7WB8ZmUW83NLytwqvw";
		try {
			const res = await request(app)
				.get(`/api/recommendations/${thisTestUserId}`)
				.set("Authorization", `Bearer ${thisCustomToken}`);
			expect(res.status).to.equal(200);
		} catch (_err) {
			throw new Error("this shouldn't happen :(");
		}
	});
});
