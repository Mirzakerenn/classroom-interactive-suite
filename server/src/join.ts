import { Router } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "./db.js";

export const joinRouter = Router();

joinRouter.post("/", async (req, res) => {
  const code = String(req.body?.code ?? "").trim().toUpperCase();
  const displayName = String(req.body?.displayName ?? "").trim();

  if (!code || !displayName) {
    return res
      .status(400)
      .json({ error: "Kode room dan nama tampilan wajib diisi." });
  }
  if (displayName.length > 30) {
    return res
      .status(400)
      .json({ error: "Nama tampilan maksimal 30 karakter." });
  }

  const room = await prisma.room.findUnique({ where: { code } });
  if (!room || room.status !== "active") {
    return res
      .status(404)
      .json({ error: "Kode room tidak ditemukan atau room sudah ditutup." });
  }

  const participant = await prisma.participant.create({
    data: { roomId: room.id, displayName },
  });

  const token = jwt.sign(
    { sub: participant.id, room: room.id, role: "student" },
    process.env.JWT_SECRET!,
    { expiresIn: "12h" }
  );

  res.status(201).json({
    token,
    participant: { id: participant.id, displayName: participant.displayName },
    room: { id: room.id, title: room.title, code: room.code },
  });
});