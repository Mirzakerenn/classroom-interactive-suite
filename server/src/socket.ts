import type { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "./db.js";

type Identity =
  | { role: "teacher"; id: string }
  | { role: "student"; id: string; roomId: string };

async function listOnline(roomId: string) {
  return prisma.participant.findMany({
    where: { roomId, isOnline: true },
    select: { id: true, displayName: true },
    orderBy: { joinedAt: "asc" },
  });
}

export function setupSocket(io: Server) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Belum login."));

    try {
      const p = jwt.verify(token, process.env.JWT_SECRET!) as {
        sub: string;
        room?: string;
        role?: string;
      };
      socket.data.identity =
        p.role === "student"
          ? { role: "student", id: p.sub, roomId: p.room! }
          : { role: "teacher", id: p.sub };
      next();
    } catch {
      next(new Error("Token tidak valid."));
    }
  });

  io.on("connection", (socket) => {
    const identity = socket.data.identity as Identity;

    socket.on(
      "room:join",
      async (payload: { roomId?: string }, ack?: (r: unknown) => void) => {
        try {
          if (identity.role === "student") {
            const roomId = identity.roomId;
            socket.join(roomId);
            socket.data.roomId = roomId;
            await prisma.participant.update({
              where: { id: identity.id },
              data: { isOnline: true, lastSeenAt: new Date() },
            });
            io.to(roomId).emit("room:participants", await listOnline(roomId));
            ack?.({ ok: true });
          } else {
            const roomId = String(payload?.roomId ?? "");
            const room = await prisma.room.findFirst({
              where: { id: roomId, teacherId: identity.id },
            });
            if (!room) {
              return ack?.({ ok: false, error: "Room tidak ditemukan." });
            }
            socket.join(roomId);
            socket.data.roomId = roomId;
            ack?.({ ok: true, participants: await listOnline(roomId) });
          }
        } catch (e) {
          console.error(e);
          ack?.({ ok: false, error: "Gagal bergabung ke room." });
        }
      }
    );

    socket.on("disconnect", async () => {
      if (identity.role !== "student" || !socket.data.roomId) return;
      const roomId = socket.data.roomId as string;
      await prisma.participant
        .update({
          where: { id: identity.id },
          data: { isOnline: false, lastSeenAt: new Date() },
        })
        .catch(() => {});
      io.to(roomId).emit("room:participants", await listOnline(roomId));
    });
  });
}