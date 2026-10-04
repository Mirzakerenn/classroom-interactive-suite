import { Router } from "express";
import { randomInt } from "crypto";
import { prisma } from "./db.js";
import { requireAuth, type AuthedRequest } from "./middleware.js";

export const roomsRouter = Router();
roomsRouter.use(requireAuth);

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeCode(length = 6) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}

roomsRouter.post("/", async (req: AuthedRequest, res) => {
  const title = String(req.body?.title ?? "").trim();
  if (!title) {
    return res.status(400).json({ error: "Judul room wajib diisi." });
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const room = await prisma.room.create({
        data: { teacherId: req.teacherId!, title, code: makeCode() },
      });
      return res.status(201).json(room);
    } catch (e: any) {
      if (e.code !== "P2002") throw e;
    }
  }
  res.status(500).json({ error: "Gagal membuat kode room, coba lagi." });
});

roomsRouter.get("/", async (req: AuthedRequest, res) => {
  const rooms = await prisma.room.findMany({
    where: { teacherId: req.teacherId! },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { participants: true } } },
  });
  res.json(rooms);
});