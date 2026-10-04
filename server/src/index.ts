import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { prisma } from "./db.js";
import { authRouter } from "./auth.js";

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/db-check", async (_req, res) => {
  try {
    const teachers = await prisma.teacher.count();
    res.json({ teachers });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({
      code: e.code,
      message: String(e.message).slice(-400),
    });
  }
});

app.use("/auth", authRouter);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "http://localhost:3000" },
});

io.on("connection", (socket) => {
  console.log("client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("client disconnected:", socket.id);
  });
});

const PORT = 4000;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});