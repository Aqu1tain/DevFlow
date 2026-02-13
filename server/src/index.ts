import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";
import snippetRoutes from "./routes/snippets";
import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import executionRoutes from "./routes/execution";
import aiRoutes from "./routes/ai";
import billingRoutes from "./routes/billing";
import { handleWebhook, validateStripeEnv } from "./controllers/billingController";
import profileRoutes from "./routes/profile";
import { socketAuth } from "./socket/auth";
import { registerLiveSession } from "./socket/liveSession";
import { connectRedis } from "./lib/redis";

dotenv.config();

if (process.env.NODE_ENV === "production") validateStripeEnv();

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/devflow";
const PORT = process.env.PORT || 3001;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: CLIENT_URL, methods: ["GET", "POST"] },
});

app.use(cors({ origin: CLIENT_URL }));
app.post("/api/billing/webhook", express.raw({ type: "application/json" }), handleWebhook);
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/snippets", snippetRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/execute", executionRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/profile", profileRoutes);
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

connectRedis()
  .then(() => console.log("Connected to Redis"))
  .catch((err) => console.error("Redis connection error:", err));

io.use(socketAuth);

registerLiveSession(io);

httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export { app, io };
