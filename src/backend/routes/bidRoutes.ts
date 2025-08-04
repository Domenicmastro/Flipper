// routes/bid.ts
import express from "express";
import type { Request, Response } from "express";
import { getProductById, updateProduct } from "../firebase/products.ts";

const router = express.Router();

/**
 * POST /api/bids/:productId/bid
 */
router.post(
	"/:productId/bid",
	async (
		req: Request<
			{ productId: string },
			any,
			{ userId: string; amount: number }
		>,
		res: Response
	): Promise<void> => {
		try {
			const { productId } = req.params;
			const { userId, amount } = req.body;

			if (!userId || typeof userId !== "string") {
				res.status(400).json({ error: "Missing or invalid userId" });
				return;
			}

			const numericAmount = Number(amount);
			if (isNaN(numericAmount) || numericAmount <= 0) {
				res.status(400).json({ error: "Invalid bid amount" });
				return;
			}

			const product = await getProductById(productId);
			if (!product) {
				res.status(404).json({ error: "Product not found" });
				return;
			}

			if (!product.isAuction) {
				res.status(400).json({ error: "Product is not listed for auction" });
				return;
			}

			const currentBid = product.currentBid ?? product.startingBid ?? 0;
			if (numericAmount <= currentBid) {
				res.status(400).json({ error: "Bid must be higher than current bid" });
				return;
			}

			const updated = await updateProduct(productId, {
				currentBid: numericAmount,
				bidderId: userId,
				bidCount: (product.bidCount || 0) + 1,
			});

			res.status(200).json(updated);
		} catch (error) {
			console.error("Error placing bid:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}
);

export default router;
