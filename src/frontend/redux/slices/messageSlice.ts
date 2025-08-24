import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type {RootState} from "@/frontend/redux/store";

//const PORT = 3000;
const API_URL = import.meta.env.VITE_API_URL;

export interface Conversation {
    id: string;
    lastUpdated: { seconds: number; nanoseconds: number };
    productId?: string;
    lastMessage: string;
    participants: string[];
}

export interface Message {
    id: string;
    senderId: string;
    text: string;
    timestamp: { seconds: number; nanoseconds: number };
    read: boolean;
}

export interface MessagesState {
    conversations: Conversation[];
    messages: {
        [conversationId: string]: Message[];
    };
}

const initialState: MessagesState = {
    conversations: [],
    messages: {}
};


export const fetchConversations = createAsyncThunk(
    'messages/fetchConversations',
    async (userId: string, { rejectWithValue }) => {
        try {
            const res = await fetch(`${API_URL}/api/messages/conversation/by-user-id/${userId}`);
            if (!res.ok) throw new Error('Failed to fetch conversations');
            return await res.json();
        } catch (err: unknown) {
            return rejectWithValue(err instanceof Error ? err.message : String(err));
        }
    }
);

export const fetchMessages = createAsyncThunk(
    'messages/fetchMessages',
    async (conversationId: string, { rejectWithValue }) => {
        try {
            const res = await fetch(`${API_URL}/api/messages/${conversationId}`);
            if (!res.ok) throw new Error('Failed to fetch messages');
            const messages = await res.json(); // Message[]
            return { conversationId, messages };
        } catch (err: unknown) {
            return rejectWithValue(err instanceof Error ? err.message : String(err));
        }
    }
);

export const sendMessage = createAsyncThunk(
    'messages/sendMessage',
    async (
        {
            senderId,
            conversationId,
            text,
        }: { senderId: string; conversationId: string; text: string },
        { rejectWithValue }
    ) => {
        try {
            const res = await fetch(`${API_URL}/api/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    senderId,
                    conversationId,
                    text,
                }),
            });

            if (!res.ok) throw new Error('Failed to send message');
            return { senderId, conversationId, text };
        } catch (err: unknown) {
            return rejectWithValue(err instanceof Error ? err.message : String(err));
        }
    }
);

const messageSlice = createSlice({
    name: "messages",
    initialState,
    reducers: {
        setConversations: (state, action: PayloadAction<Conversation[]>) => {
            state.conversations = action.payload;
        },
        setMessages: (
            state,
            action: PayloadAction<{ conversationId: string; messages: Message[] }>
        ) => {
            const { conversationId, messages } = action.payload;
            state.messages[conversationId] = messages;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchMessages.fulfilled, (state, action) => {
            const { conversationId, messages } = action.payload as { conversationId: string; messages: Message[] };
            state.messages[conversationId] = messages;
        })
        .addCase(sendMessage.fulfilled, (state, action) => {
            const { conversationId, senderId, text } = action.payload;
            const newMessage: Message = {
                id: crypto.randomUUID(), // 프론트에서 임시 id 생성
                senderId,
                text,
                timestamp: {
                    seconds: Math.floor(Date.now() / 1000),
                    nanoseconds: 0,
                },
                read: false,
            };
            if (!state.messages[conversationId]) {
                state.messages[conversationId] = [];
            }
            state.messages[conversationId].push(newMessage);
        });
    },
});

export const { setConversations, setMessages } = messageSlice.actions;
export const selectMessageMap = (state: RootState) => state.messages.messages;
export default messageSlice.reducer;