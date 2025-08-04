import { type Location } from "./Product"

export type ReviewScore = 1 | 2 | 3 | 4 | 5;

export type Review = {
	id: string; // Firestore doc ID (optional if embedded, required if in separate collection)
	reviewerId: string; // UID of the user who wrote the review
	reviewerName?: string; // Optional redundancy for display
	reviewerImage?: string; // Optional for quick access in UI
	score: ReviewScore; // 1–5 star rating
	comment: string;
	role: "buyer" | "seller"; // Whether reviewer was a buyer or seller
	timestamp: string; // ISO string or Firestore Timestamp
};

export type User = {
	id: string; // Firestore doc ID / Firebase Auth UID
	name: string;
	email: string;
	location: Location;
	reviews: Review[];
	forSale: string[]; // string of product IDs
	image: string;
	joinedAt: string; // ISO or Firestore Timestamp
	bio?: string;
	lastOnline?: string; // For chat presence
	conversationIds?: string[];
	blockedUserIds?: string[];
	wishlist?: string[]; // List of product IDs (Firestore doc.id)
	purchased?: string[]; // string of product IDs
};