import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";
import snippetRoutes from "./routes/snippets";
import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import { socketAuth } from "./socket/auth";
import { registerLiveSession } from "./socket/liveSession";

dotenv.config();

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/devflow";
const PORT = process.env.PORT || 3001;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: CLIENT_URL, methods: ["GET", "POST"] },
});

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/snippets", snippetRoutes);
app.use("/api/admin", adminRoutes);
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

io.use(socketAuth);

registerLiveSession(io);

httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export { app, io };
