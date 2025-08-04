import { type Review, type User } from "@/types"
import { locations } from "./exampleProducts"
import { USER_IDS, PRODUCT_IDS, CONV_IDS } from "./exampleConstants"

const reviews: Review[] = [
  {
    "id": "review_001",
    "reviewerId": USER_IDS.USER_001,
    "reviewerName": "Alice Johnson",
    "reviewerImage": "/images/Alice Johnson.png",
    "score": 5,
    "comment": "Great seller! Very responsive and the item was just as described.",
    "role": "buyer",
    "timestamp": "2025-07-01T14:23:00.000Z"
  },
  {
    "id": "review_002",
    "reviewerId": USER_IDS.USER_002,
    "reviewerName": "Daniel Lee",
    "reviewerImage": "/images/Daniel Lee.png",
    "score": 4,
    "comment": "Smooth transaction, would happily buy again.",
    "role": "buyer",
    "timestamp": "2025-06-28T09:45:00.000Z"
  },
  {
    "id": "review_003",
    "reviewerId": USER_IDS.USER_003,
    "reviewerName": "Sofia Martinez",
    "reviewerImage": "/images/Sofia Martinez.png",
    "score": 3,
    "comment": "Item was fine, but the communication could have been better.",
    "role": "buyer",
    "timestamp": "2025-06-25T17:10:00.000Z"
  },
  {
    "id": "review_004",
    "reviewerId": USER_IDS.USER_001,
    "reviewerName": "Alice Johnson",
    "reviewerImage": "/images/Alice Johnson.png",
    "score": 5,
    "comment": "Excellent buyer! Quick payment and friendly communication.",
    "role": "seller",
    "timestamp": "2025-07-03T11:05:00.000Z"
  },
  {
    "id": "review_005",
    "reviewerId": USER_IDS.USER_002,
    "reviewerName": "Daniel Lee",
    "reviewerImage": "/images/Daniel Lee.png",
    "score": 2,
    "comment": "Unfortunately, the item was not as described and the seller didn’t respond.",
    "role": "buyer",
    "timestamp": "2025-06-20T08:15:00.000Z"
  }
]

// add correct product IDs to forSale corresponding to exampleProducts
export const users: User[] = [
  {
    "id": "user_001",
    "name": "Alice Johnson",
    "email": "alice.johnson@example.com",
    "location": locations[0],
    "forSale" : [PRODUCT_IDS.PRODUCT_001, PRODUCT_IDS.PRODUCT_004, PRODUCT_IDS.PRODUCT_005, PRODUCT_IDS.PRODUCT_007, PRODUCT_IDS.PRODUCT_008, PRODUCT_IDS.PRODUCT_012, PRODUCT_IDS.PRODUCT_013, PRODUCT_IDS.PRODUCT_014, PRODUCT_IDS.PRODUCT_015, PRODUCT_IDS.PRODUCT_020],
    "reviews": [reviews[1], reviews[2], reviews[4]],
    "image": "/images/Alice Johnson.png",
    "joinedAt": "2024-12-01T10:30:00.000Z",
    "bio": "Outdoor enthusiast and part-time vintage reseller.",
    "lastOnline": "2025-07-04T18:00:00.000Z",
    "conversationIds": [CONV_IDS.CONV_001, CONV_IDS.CONV_002],
    "blockedUserIds": [],
    "wishlist": [PRODUCT_IDS.PRODUCT_003, PRODUCT_IDS.PRODUCT_011],
    "purchased": [PRODUCT_IDS.PRODUCT_017]
  },
  {
    "id": "user_002",
    "name": "Daniel Lee",
    "email": "daniel.lee@example.com",
    "location": locations[1],
    "forSale" : [PRODUCT_IDS.PRODUCT_002, PRODUCT_IDS.PRODUCT_009, PRODUCT_IDS.PRODUCT_016, PRODUCT_IDS.PRODUCT_018],
    "reviews": [reviews[0], reviews[3]],
    "image": "/images/Daniel Lee.png",
    "joinedAt": "2023-11-15T08:45:00.000Z",
    "bio": "Gadget lover. Selling old tech to make room for new.",
    "lastOnline": "2025-07-04T17:20:00.000Z",
    "conversationIds": [CONV_IDS.CONV_001, CONV_IDS.CONV_003],
    "blockedUserIds": [],
    "wishlist": [PRODUCT_IDS.PRODUCT_010, PRODUCT_IDS.PRODUCT_007],
    "purchased": [PRODUCT_IDS.PRODUCT_006]
  },
  {
    "id": "user_003",
    "name": "Sofia Martinez",
    "email": "sofia.martinez@example.com",
    "location": locations[2],
    "forSale" : [PRODUCT_IDS.PRODUCT_003, PRODUCT_IDS.PRODUCT_010, PRODUCT_IDS.PRODUCT_011, PRODUCT_IDS.PRODUCT_019],
    "reviews": [],
    "image": "/images/Sofia Martinez.png",
    "joinedAt": "2025-02-20T12:00:00.000Z",
    "bio": "Interior design student selling home decor pieces.",
    "lastOnline": "2025-07-04T13:10:00.000Z",
    "conversationIds": [CONV_IDS.CONV_002, CONV_IDS.CONV_003],
    "blockedUserIds": [],
    "wishlist": [],
    "purchased": []

  }
]