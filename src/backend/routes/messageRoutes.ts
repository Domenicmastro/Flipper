import {
    getMessages,
    getOrCreateConversation,
    getUserConversations,
    sendMessage,
} from "../firebase/messages.ts";
import type {Request, Response} from "express";
import express from 'express';

const router = express.Router();

router.put("/conversation/get-or-create/", async (req: Request, res: Response) => {
    try {
        const userId1 = req.body.userId1 as string;
        const userId2 = req.body.userId2 as string;
        const productId = req.body.productId as string | undefined; // optional

        const conversation = await getOrCreateConversation(userId1, userId2, productId);
        res.json(conversation);
    } catch (error) {
        res.status(500).send({error: "An error occurred while getting a conversation: " + error});
    }
});

router.get("/:conversationId", async (req: Request, res: Response) => {
    try {
        const conversationId = req.params.conversationId;
        const messages = await getMessages(conversationId); // ✅ now correct
        res.json(messages);
    } catch (error) {
        res.status(500).send({ error: "Failed to fetch messages: " + error });
    }
});
router.get("/conversation/by-user-id/:userId", async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;
        const conversations = await getUserConversations(userId);
        res.json(conversations);
    } catch (error) {
        res.status(500).send({error: "An error occurred while getting user conversations: " + error});
    }
});

router.post("/", async (req: Request, res: Response) => {
    try {
        const senderId = req.body.senderId as string;
        const conversationId = req.body.conversationId as string;
        const messageBody = req.body.text as string
        await sendMessage(conversationId, senderId, messageBody);
        res.status(200).send();
    } catch (error) {
        res.status(500).send({error: "An error occurred while getting user messages: " + error});
    }
});

export default router;