"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Session = {
  token: string;
  participant: { id: string; displayName: string };
  room: { id: string; title: string; code: string };
};

export default function RoomPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("student");
    if (!raw) {
      router.replace("/");
      return;
    }
    setSession(JSON.parse(raw));
  }, [router]);

  if (!session) return null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 p-4">
      <h1 className="text-xl font-semibold">{session.room.title}</h1>
      <p className="text-sm text-gray-500">
        Masuk sebagai {session.participant.displayName}
      </p>
    </main>
  );
}