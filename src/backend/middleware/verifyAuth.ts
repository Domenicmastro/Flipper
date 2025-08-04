import type { Request, Response, NextFunction } from "express";
import { adminAuth } from "../utils/admin.ts";

export const verifyAuth = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const authHeader = req.headers.authorization;

	if (!authHeader?.startsWith("Bearer ")) {
		res.status(401).json({ error: "Unauthorized: Missing token" });
		return;
	}

	const token = authHeader.split("Bearer ")[1];

	try {
		const decodedToken = await adminAuth.verifyIdToken(token);
		req.user = decodedToken;
		next();
	} catch (error) {
		res.status(401).json({ error: "Unauthorized: Invalid token" });
	}
};
