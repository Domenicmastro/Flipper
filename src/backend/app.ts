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

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // allow cookies, authorization headers
}));

app.use(express.json());

app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/image", imageRoutes);
console.log("bidRoutes is:", typeof bidRoutes);
app.use("/api/bids", bidRoutes);

const PORT = parseInt(process.env.PORT || "8080", 10);
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});

export default app;
