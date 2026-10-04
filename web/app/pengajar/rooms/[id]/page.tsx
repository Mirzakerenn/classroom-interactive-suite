"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { connectSocket } from "@/lib/socket";

type TeacherSession = {
  token: string;
  teacher: { id: string; name: string; email: string };
};

type Room = { id: string; title: string; code: string };
type Participant = { id: string; displayName: string };
type Summary = { paham: number; bingung: number; terlalu_cepat: number };

const EMPTY: Summary = { paham: 0, bingung: 0, terlalu_cepat: 0 };

const BARS = [
  { key: "paham", label: "Paham", color: "bg-green-500" },
  { key: "bingung", label: "Bingung", color: "bg-yellow-500" },
  { key: "terlalu_cepat", label: "Terlalu cepat", color: "bg-red-500" },
] as const;

export default function DashboardPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<TeacherSession | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [connected, setConnected] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [reactions, setReactions] = useState<Summary>(EMPTY);
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("teacher");
    if (!raw) {
      router.replace("/pengajar");
      return;
    }
    setSession(JSON.parse(raw));
  }, [router]);

  useEffect(() => {
    if (!session) return;
    api<Room[]>("/rooms", { token: session.token })
      .then((list) => setRoom(list.find((r) => r.id === id) ?? null))
      .catch(() => router.replace("/pengajar"));
  }, [session, id, router]);

  useEffect(() => {
    if (!session) return;
    const socket = connectSocket(session.token);

    socket.on("connect", () => {
      setConnected(true);
      socket.emit(
        "room:join",
        { roomId: id },
        (res: {
          ok: boolean;
          error?: string;
          participants?: Participant[];
          reactions?: Summary;
        }) => {
          if (!res.ok) {
            setError(res.error ?? "Gagal membuka room.");
            return;
          }
          setError("");
          setParticipants(res.participants ?? []);
          setReactions(res.reactions ?? EMPTY);
        }
      );
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => {
      setConnected(false);
      setError("Gagal terhubung ke server.");
    });
    socket.on("room:participants", (list: Participant[]) =>
      setParticipants(list)
    );
    socket.on("reaction:update", (s: Summary) => setReactions(s));

    return () => {
      socket.disconnect();
    };
  }, [session, id]);

  const total = reactions.paham + reactions.bingung + reactions.terlalu_cepat;

  if (!session) return null;

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4">
      <Link href="/pengajar/rooms" className="text-sm text-gray-500">
        ← Semua room
      </Link>

      <header className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">{room?.title ?? "Memuat..."}</h1>
          <p className="text-sm text-gray-500">
            Kode room: <span className="font-mono font-medium">{room?.code}</span>{" "}
            · {participants.length} online
          </p>
        </div>
        <span
          className={`text-xs ${connected ? "text-green-500" : "text-red-500"}`}
        >
          {connected ? "● Terhubung" : "● Terputus"}
        </span>
      </header>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <section className="space-y-3 rounded-xl border border-gray-300 p-4 dark:border-gray-700">
        <h2 className="text-sm font-medium">Reaksi kelas</h2>
        {BARS.map((b) => {
          const count = reactions[b.key];
          const pct = total ? (count / total) * 100 : 0;
          return (
            <div key={b.key} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{b.label}</span>
                <span className="font-medium">{count}</span>
              </div>
              <div className="h-2 rounded bg-gray-500/20">
                <div
                  className={`h-2 rounded transition-all ${b.color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </section>

      <section className="space-y-2 rounded-xl border border-gray-300 p-4 dark:border-gray-700">
        <h2 className="text-sm font-medium">Peserta online</h2>
        {participants.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada peserta.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {participants.map((p) => (
              <li
                key={p.id}
                className="rounded-full bg-gray-500/15 px-3 py-1 text-sm"
              >
                {p.displayName}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}