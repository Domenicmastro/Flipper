/// <reference path="../../types/express.d.ts" />
import express from "express";
import { verifyAuth } from "../middleware/verifyAuth.ts";
import {
	getUserById,
	getAllUsers,
	createUser,
	deleteUser,
	updateUser,
	addToWishlist,
	removeFromWishlist,
	getWishlistProducts,
} from "../firebase/users.ts";
import type { Request, Response } from "express";
import type { User, Review } from "../../types";

const router = express.Router();

router.put("/get-or-create/:userId", async (req: Request, res: Response) => {
	try {
		const userId = req.params.userId;
		const fullUser = await getUserById(userId, undefined);
		res.status(200).json(fullUser);
	} catch (error) {
		res.status(500).send({ error: "Error getting user: " + error });
	}
});

router.get("/", async (_req: Request, res: Response) => {
	try {
		const users = await getAllUsers();
		res.status(200).json(users);
	} catch (error) {
		res.status(500).send({ error: "Error getting users: " + error });
	}
});

router.post("/", verifyAuth, async (req: Request, res: Response) => {
	try {
		const user = req.body.user as Omit<User, "joinedAt">;

		if (req.user?.uid !== user.id) {
			res
				.status(403)
				.json({ error: "Forbidden: Cannot create user for another ID" });
		}

		const result = await createUser(user);
		res.status(200).json(result);
	} catch (error) {
		res.status(500).send({ error: "Error creating user: " + error });
	}
});

router.delete("/", verifyAuth, async (req: Request, res: Response) => {
	try {
		console.log("Deleting user:", req.user?.uid);
		await deleteUser(req.user!.uid);
		res.status(200).send();
	} catch (error) {
		res.status(500).send({ error: "Error deleting user: " + error });
	}
});

router.patch(
	"/by-id/:userId",
	verifyAuth,
	async (req: Request, res: Response) => {
		try {
			const userId = req.params.userId;
			if (req.user?.uid !== userId) {
				res
					.status(403)
					.json({ error: "Forbidden: Cannot update another user" });
			}

			const updates = req.body.updates as Partial<User>;
			await updateUser(userId, updates);
			res.status(200).send();
		} catch (error) {
			res.status(500).send({ error: "Error updating user: " + error });
		}
	}
);

router.post("/reviews/:userId", verifyAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const review = req.body.review as Review;

    const user = await getUserById(userId);
    const newReviews = [...(user.reviews || []), review];
    await updateUser(userId, { reviews: newReviews });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error adding review: " + error });
  }
});

// New route to update user lists when a sale occurs
router.patch("/update-lists-on-sale", verifyAuth, async (req: Request, res: Response) => {
	try {
		const { sellerId, buyerId, productId } = req.body;

		if (!sellerId || !buyerId || !productId) {
			res.status(400).json({ 
				error: "Missing required fields: sellerId, buyerId, or productId" 
			});
		}

		console.log("Updating user lists on sale:", { sellerId, buyerId, productId });

		// Get both users
		const [seller, buyer] = await Promise.all([
			getUserById(sellerId),
			getUserById(buyerId)
		]);

		if (!seller || !buyer) {
			res.status(404).json({ error: "Seller or buyer not found" });
		}

		// Remove from seller's forSale list
		const sellerForSale = (seller.forSale || []).filter(id => id !== productId);
		await updateUser(sellerId, { forSale: sellerForSale });

		// Update buyer's purchased items list
		const buyerPurchasedItems = [...(buyer.purchased || []), productId];
		await updateUser(buyerId, { purchased: buyerPurchasedItems });

		// Remove from buyer's wishlist if it exists
		const buyerWishlist = (buyer.wishlist || []).filter(id => id !== productId);
		await updateUser(buyerId, { wishlist: buyerWishlist });

		console.log("Successfully updated user lists on sale");
		res.status(200).json({ success: true });
	} catch (error) {
		console.error("Error updating user lists on sale:", error);
		res.status(500).json({ 
			error: "Error updating user lists on sale: " + error 
		});
	}
});

router.get("/by-id/:userId", verifyAuth, async (req: Request, res: Response) => {
	try {
		const userId = req.params.userId;
		console.log("🔍 Received request for userId:", userId);

		const user = await getUserById(userId, undefined);
		console.log("📦 Retrieved user data:", user);

		if (!user) {
			console.warn("⚠️ User not found for ID:", userId);
			res.status(404).json({ error: "User not found" });
			return;
		}

		res.status(200).json(user);
	} catch (error) {
		console.error("🔥 Error in GET /by-id/:userId:", error);
		res.status(500).json({
			error: "Error getting user: " + (error instanceof Error ? error.message : String(error))
		});
	}
});


router.put(
	"/wishlist/by-user-and-product-id/:userId/:productId",
	verifyAuth,
	async (req: Request, res: Response) => {
		try {
			const { userId, productId } = req.params;

			if (req.user?.uid !== userId) {
				res
					.status(403)
					.json({ error: "Forbidden: Cannot modify another user's wishlist" });
			}

			await addToWishlist(userId, productId);
			res.status(200).send();
		} catch (error) {
			res.status(500).send({ error: "Error adding to wishlist: " + error });
		}
	}
);

router.delete(
	"/wishlist/by-user-and-product-id/:userId/:productId",
	verifyAuth,
	async (req: Request, res: Response) => {
		try {
			const { userId, productId } = req.params;

			if (req.user?.uid !== userId) {
				res
					.status(403)
					.json({ error: "Forbidden: Cannot modify another user's wishlist" });
			}

			await removeFromWishlist(userId, productId);
			res.status(200).send();
		} catch (error) {
			res.status(500).send({ error: "Error removing from wishlist: " + error });
		}
	}
);

router.get(
	"/wishlist/by-user-id/:userId",
	async (req: Request, res: Response) => {
		try {
			const userId = req.params.userId;
			const wishlist = await getWishlistProducts(userId);
			res.status(200).json(wishlist);
		} catch (error) {
			res.status(500).send({ error: "Error getting wishlist: " + error });
		}
	}
);


export default router;