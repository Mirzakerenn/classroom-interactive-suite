"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Socket } from "socket.io-client";
import { connectSocket } from "@/lib/socket";

type Session = {
  token: string;
  participant: { id: string; displayName: string };
  room: { id: string; title: string; code: string };
};

type ReactionType = "paham" | "bingung" | "terlalu_cepat";

const REACTIONS: { type: ReactionType; label: string; emoji: string }[] = [
  { type: "paham", label: "Paham", emoji: "😊" },
  { type: "bingung", label: "Bingung", emoji: "🤔" },
  { type: "terlalu_cepat", label: "Terlalu cepat", emoji: "⏩" },
];

export default function RoomPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [connected, setConnected] = useState(false);
  const [selected, setSelected] = useState<ReactionType | null>(null);
  const [message, setMessage] = useState("");
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("student");
    if (!raw) {
      router.replace("/");
      return;
    }
    setSession(JSON.parse(raw));
  }, [router]);

  useEffect(() => {
    if (!session) return;
    const socket = connectSocket(session.token);
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setMessage("");
      socket.emit("room:join", {});
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => {
      setConnected(false);
      setMessage("Gagal terhubung ke server.");
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [session]);

  function sendReaction(type: ReactionType) {
    setMessage("");
    socketRef.current?.emit(
      "reaction:send",
      { type },
      (res: { ok: boolean; error?: string }) => {
        if (res.ok) setSelected(type);
        else setMessage(res.error ?? "Gagal mengirim reaksi.");
      }
    );
  }

  if (!session) return null;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col gap-6 p-4">
      <header className="flex items-start justify-between gap-2">
        <div>
          <h1 className="font-semibold">{session.room.title}</h1>
          <p className="text-sm text-gray-500">
            Masuk sebagai {session.participant.displayName}
          </p>
        </div>
        <span
          className={`text-xs ${connected ? "text-green-500" : "text-red-500"}`}
        >
          {connected ? "● Terhubung" : "● Terputus"}
        </span>
      </header>

      <section className="space-y-2">
        <p className="text-sm text-gray-500">Bagaimana pemahamanmu sekarang?</p>
        <div className="grid grid-cols-3 gap-2">
          {REACTIONS.map((r) => (
            <button
              key={r.type}
              onClick={() => sendReaction(r.type)}
              disabled={!connected}
              className={`flex h-20 flex-col items-center justify-center gap-1 rounded-xl border text-sm disabled:opacity-50 ${
                selected === r.type
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-gray-300 dark:border-gray-700"
              }`}
            >
              <span className="text-2xl">{r.emoji}</span>
              <span>{r.label}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400">Bisa diganti kapan saja.</p>
        {message && <p className="text-sm text-red-500">{message}</p>}
      </section>
    </main>
  );
}