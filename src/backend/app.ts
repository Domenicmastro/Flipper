import cors from "cors";
import express from "express";
import productRoutes from "./routes/productRoutes.ts";
import userRoutes from "./routes/userRoutes.ts";
import recommendationRoutes from "./routes/recommendationRoutes.ts";
import messageRoutes from "./routes/messageRoutes.ts";
import imageRoutes from "./routes/imageRoutes.ts";
import bidRoutes from "./routes/bidRoutes.ts";
import dotenv from "dotenv";
dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:5173", // Vite dev
  "http://localhost:3000", // Next.js dev
  "https://flipper.domenicosoftware.com"
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // if you ever need cookies/auth headers
  })
);

app.use(express.json());

app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/image", imageRoutes);
console.log("bidRoutes is:", typeof bidRoutes);
app.use("/api/bids", bidRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log(`Backend running at http://localhost:${PORT}`);
});

export default app;
