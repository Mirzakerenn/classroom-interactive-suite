import type { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "./db.js";

type Identity =
  | { role: "teacher"; id: string }
  | { role: "student"; id: string; roomId: string };

const REACTION_TYPES = ["paham", "bingung", "terlalu_cepat"] as const;
type ReactionKind = (typeof REACTION_TYPES)[number];
const REACTION_COOLDOWN_MS = 2000;
const lastReactionAt = new Map<string, number>();

async function listOnline(roomId: string) {
  return prisma.participant.findMany({
    where: { roomId, isOnline: true },
    select: { id: true, displayName: true },
    orderBy: { joinedAt: "asc" },
  });
}

async function reactionSummary(roomId: string) {
  const latest = await prisma.reaction.findMany({
    where: { roomId, participant: { isOnline: true } },
    orderBy: { createdAt: "desc" },
    distinct: ["participantId"],
    select: { type: true },
  });
  const summary: Record<ReactionKind, number> = {
    paham: 0,
    bingung: 0,
    terlalu_cepat: 0,
  };
  for (const r of latest) summary[r.type] += 1;
  return summary;
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
            io.to(roomId).emit("reaction:update", await reactionSummary(roomId));
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
            ack?.({
              ok: true,
              participants: await listOnline(roomId),
              reactions: await reactionSummary(roomId),
            });
          }
        } catch (e) {
          console.error(e);
          ack?.({ ok: false, error: "Gagal bergabung ke room." });
        }
      }
    );

    socket.on(
      "reaction:send",
      async (payload: { type?: string }, ack?: (r: unknown) => void) => {
        try {
          if (identity.role !== "student" || !socket.data.roomId) {
            return ack?.({ ok: false, error: "Khusus siswa di dalam room." });
          }
          const type = payload?.type as ReactionKind;
          if (!REACTION_TYPES.includes(type)) {
            return ack?.({ ok: false, error: "Jenis reaksi tidak valid." });
          }

          const now = Date.now();
          const last = lastReactionAt.get(identity.id) ?? 0;
          if (now - last < REACTION_COOLDOWN_MS) {
            return ack?.({ ok: false, error: "Terlalu cepat, tunggu sebentar." });
          }
          lastReactionAt.set(identity.id, now);

          const roomId = identity.roomId;
          await prisma.reaction.create({
            data: { roomId, participantId: identity.id, type },
          });
          io.to(roomId).emit("reaction:update", await reactionSummary(roomId));
          ack?.({ ok: true });
        } catch (e) {
          console.error(e);
          ack?.({ ok: false, error: "Gagal mengirim reaksi." });
        }
      }
    );

    socket.on("disconnect", async () => {
      if (identity.role !== "student" || !socket.data.roomId) return;
      const roomId = socket.data.roomId as string;
      lastReactionAt.delete(identity.id);
      await prisma.participant
        .update({
          where: { id: identity.id },
          data: { isOnline: false, lastSeenAt: new Date() },
        })
        .catch(() => {});
      io.to(roomId).emit("room:participants", await listOnline(roomId));
      io.to(roomId).emit("reaction:update", await reactionSummary(roomId));
    });
  });
}