import {
  collection,
  doc,
  addDoc,
  getDocs,
//  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase.ts";

export interface Message {
  id?: string;
  senderId: string;
  text: string;
  timestamp: Timestamp;
  read: boolean;
}

export interface Conversation {
  id?: string;
  participants: string[]; // [user1, user2]
  lastMessage: string;
  lastUpdated: Timestamp;
  productId?: string; // optional
}

// Ensure a conversation document exists or create it
export const getOrCreateConversation = async (
    userId1: string,
    userId2: string,
    productId?: string
): Promise<string> => {
  const convRef = collection(db, "conversations");

  let q;

  if (productId) {
    q = query(
        convRef,
        where("participants", "in", [
          [userId1, userId2],
          [userId2, userId1],
        ]),
        where("productId", "==", productId)
    );
  } else {
    // If no productId is provided, we only filter by participants
    q = query(
        convRef,
        where("participants", "in", [
          [userId1, userId2],
          [userId2, userId1],
        ])
    );
  }
  const snap = await getDocs(q);

  if (!snap.empty) {
    return snap.docs[0].id;
  }

  const newConv = await addDoc(convRef, {
    participants: [userId1, userId2],
    lastMessage: "",
    lastUpdated: serverTimestamp(),
    productId: productId ?? null,
  });

  return newConv.id;
};

// Send message
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  text: string
) => {
  const message: Omit<Message, "id"> = {
    senderId,
    text,
    timestamp: serverTimestamp() as Timestamp,
    read: false,
  };

  const msgRef = collection(db, "messages", conversationId, "messages");
  await addDoc(msgRef, message);

  const convRef = doc(db, "conversations", conversationId);
  await setDoc(
    convRef,
    {
      lastMessage: text,
      lastUpdated: serverTimestamp(),
    },
    { merge: true }
  );
};

// Get all conversations for a user
export const getUserConversations = async (userId: string) => {
  const convRef = collection(db, "conversations");

  const q = query(convRef, where("participants", "array-contains", userId));
  const snap = await getDocs(q);

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Conversation),
  }));
};

// Get messages for a conversation
export const getMessages = async (conversationId: string) => {
  const msgRef = collection(db, "messages", conversationId, "messages");

  const q = query(msgRef, orderBy("timestamp", "asc"));
  const snap = await getDocs(q);

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Message),
  }));
};
