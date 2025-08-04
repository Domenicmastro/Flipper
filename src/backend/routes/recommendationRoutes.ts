import express, { type Request, type Response } from "express";
import { getRecommendedProducts } from "../services/recommendationService.ts";
import { verifyAuth } from "../middleware/verifyAuth.js";

const router = express.Router();

router.get("/:userId", verifyAuth, async (req: Request, res: Response): Promise<void> => {
  
  const user = req.user as { uid: string };
  const authUserId = user.uid;
  const targetUserId = req.params.userId;
  console.log("Fetch for recs received")



  if (authUserId !== targetUserId) {
    res.status(403).json({ message: "Forbidden: user mismatch" });
    return; 
  }

  try {
    console.log("Auth check passed, calling getRecommendedProducts");
    const recommendations = await getRecommendedProducts(targetUserId);

    console.log(recommendations)
    
    res.setHeader('Content-Type', 'application/json');
    res.json(recommendations);

    
  } catch (error) {
    console.error("Error in route:", error);
    console.error("Error type:", typeof error);
    console.error("Error message:", (error as Error).message);
    console.error("Error stack:", (error as Error).stack);
    
    res.status(500).json({ message: "Error generating recommendations" });
  }
  
});

export default router;