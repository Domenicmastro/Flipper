import { FieldValue } from "firebase/firestore";

export type Message = {
  id: string;
  senderId: string;
  conversationId: string;
  text: string;
  timestamp: FieldValue | { seconds: number; nanoseconds: number };
}

export type MessageMap = {
  [conversationId: string]: Message[];
};

export type Conversation = {
  id: string;
  lastUpdated: { seconds: number; nanoseconds: number };
  productId?: string;
  lastMessage: string;
  participants: string[];
};