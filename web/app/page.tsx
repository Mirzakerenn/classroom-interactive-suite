"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

type JoinResponse = {
  token: string;
  participant: { id: string; displayName: string };
  room: { id: string; title: string; code: string };
};

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api<JoinResponse>("/join", {
        method: "POST",
        body: JSON.stringify({ code, displayName }),
      });
      sessionStorage.setItem("student", JSON.stringify(data));
      router.push("/room");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-gray-300 p-6 dark:border-gray-700"
      >
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold">Gabung ke kelas</h1>
          <p className="text-sm text-gray-500">
            Masukkan kode dari pengajarmu.
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-500">Kode room</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={8}
            placeholder="K7F3QA"
            className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-center font-mono text-lg tracking-widest dark:border-gray-600"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-500">Nama tampilan</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={30}
            placeholder="Contoh: Rina"
            className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 dark:border-gray-600"
          />
          <p className="text-xs text-gray-400">Nama ini terlihat oleh pengajar.</p>
        </div>

        <button
          type="submit"
          disabled={loading || !code || !displayName}
          className="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white disabled:opacity-50"
        >
          {loading ? "Menghubungkan..." : "Gabung"}
        </button>

        {error && <p className="text-center text-sm text-red-500">{error}</p>}
      </form>
    </main>
  );
}