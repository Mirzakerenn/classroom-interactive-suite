"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

type TeacherSession = {
  token: string;
  teacher: { id: string; name: string; email: string };
};

type Room = {
  id: string;
  title: string;
  code: string;
  status: "active" | "closed";
  _count: { participants: number };
};

export default function RoomsPage() {
  const router = useRouter();
  const [session, setSession] = useState<TeacherSession | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  const logout = useCallback(() => {
    localStorage.removeItem("teacher");
    router.replace("/pengajar");
  }, [router]);

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
      .then(setRooms)
      .catch(() => logout());
  }, [session, logout]);

  async function createRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !title.trim()) return;
    setError("");
    try {
      const room = await api<Omit<Room, "_count">>("/rooms", {
        method: "POST",
        token: session.token,
        body: JSON.stringify({ title }),
      });
      setRooms([{ ...room, _count: { participants: 0 } }, ...rooms]);
      setTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    }
  }

  if (!session) return null;

  return (
    <main className="mx-auto max-w-xl space-y-6 p-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Room saya</h1>
          <p className="text-sm text-gray-500">{session.teacher.name}</p>
        </div>
        <button onClick={logout} className="text-sm text-gray-500">
          Keluar
        </button>
      </header>

      <form onSubmit={createRoom} className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Judul room baru"
          className="flex-1 rounded-lg border border-gray-300 bg-transparent px-3 py-2 dark:border-gray-600"
        />
        <button
          type="submit"
          disabled={!title.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          Buat room
        </button>
      </form>
      {error && <p className="text-sm text-red-500">{error}</p>}

      <ul className="space-y-2">
        {rooms.map((room) => (
          <li key={room.id}>
            <Link
              href={`/pengajar/rooms/${room.id}`}
              className="flex items-center justify-between rounded-xl border border-gray-300 p-3 dark:border-gray-700"
            >
              <div>
                <p className="font-medium">{room.title}</p>
                <p className="text-sm text-gray-500">
                  Kode: <span className="font-mono">{room.code}</span> ·{" "}
                  {room._count.participants} peserta
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs ${
                  room.status === "active"
                    ? "bg-green-500/15 text-green-500"
                    : "bg-gray-500/15 text-gray-500"
                }`}
              >
                {room.status === "active" ? "Aktif" : "Selesai"}
              </span>
            </Link>
          </li>
        ))}
        {rooms.length === 0 && (
          <p className="text-sm text-gray-500">Belum ada room.</p>
        )}
      </ul>
    </main>
  );
}