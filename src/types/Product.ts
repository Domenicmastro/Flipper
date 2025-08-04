import type { Timestamp } from "firebase/firestore";

export const Category = {
	Home: "Home & Garden",
	Electronics: "Electronics & Appliances",
	Furniture: "Furniture",
	Baby: "Baby & Kids",
	Women: "Women's Fashion",
	Men: "Men's Fashion",
	Accessories: "Accessories",
	Health: "Health & Beauty",
	Sports: "Sports & Outdoors",
	Games: "Games & Hobbies",
	Books: "Books & Music",
	Vehicles: "Vehicles",
	Rentals: "Property Rentals",
	Other: "Other",
} as const;

export const Attributes = {
	Color: [
		"Red",
		"Blue",
		"Green",
		"Black",
		"White",
		"Yellow",
		"Gray",
		"Orange",
		"Purple",
		"Brown",
	],
	Size: ["XS", "S", "M", "L", "XL", "XXL", "One Size", "Kids"],
	Gender: ["Men", "Women", "Unisex"],
} as const;

export const Condition = {
	New: "New",
	LikeNew: "Like New",
	Used: "Used",
	NotWorking: "Not Working",
} as const;

export const StatusLevel = {
	forSale: "For Sale",
	pendingSale: "Pending Sale",
	sold: "Sold",
};

export type Location = {
	label: string; // "Vancouver, BC, Canada" - human readable for UI
	lat: number; // 49.2827
	lng: number; // -123.1207
	placeId?: string; // optional Nominatim or Google place_id
	postalCode?: string; // "V6T 1Z4"
	city?: string; // "Vancouver"
	province?: string; // "British Columbia"
	country?: string; // "Canada"
};

export type PriceComparison = {
	url: string;
	price: `${number}.${number}${number}`;
};

export type Product = {
	id: string;
	name: string;
	description: string;
	images: string[]; // image -> images[]
	embedding?: number[]; // make optional b/c it's computed internally
	condition: Condition;
	price: number;
	sellerId: string;
	location: Location;
	priceComparisons: PriceComparison[];
	categories: Category[]; // store category IDs here, have separate collection for categories
	tags: string[];
	status: StatusLevel;
	attributes: Attribute[]; // for colours, sizes, etc
	createdAt?: Timestamp;
	updatedAt?: Timestamp;

	// Auction-related fields:
	isAuction?: boolean; // Flag to indicate if product is an auction item
	startingBid?: number; // Starting bid amount
	currentBid?: number; // Current highest bid
	bidCount?: number; // Number of bids placed
	auctionEndsAt?: Timestamp; // Auction end time
	bidderId?: string; // Current highest bidder's user ID
};

export type Category = (typeof Category)[keyof typeof Category];
export type Condition = (typeof Condition)[keyof typeof Condition];
export type StatusLevel = (typeof StatusLevel)[keyof typeof StatusLevel];

export type AttributeCategory = keyof typeof Attributes;
// "Color" | "Size" | "Gender"

export type AttributeValue = (typeof Attributes)[AttributeCategory][number];
// "Red" | "Blue" | "Green" | ... | "Unisex"

export type Attribute = {
	category: AttributeCategory;
	value: AttributeValue;
};
