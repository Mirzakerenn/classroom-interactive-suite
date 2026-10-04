"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

type LoginResponse = {
  token: string;
  teacher: { id: string; name: string; email: string };
};

export default function TeacherLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        await api("/auth/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
        });
      }
      const data = await api<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("teacher", JSON.stringify(data));
      router.push("/pengajar/rooms");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  const input =
    "w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 dark:border-gray-600";

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-gray-300 p-6 dark:border-gray-700"
      >
        <h1 className="text-xl font-semibold">
          {mode === "login" ? "Masuk sebagai pengajar" : "Daftar pengajar"}
        </h1>

        {mode === "register" && (
          <div className="space-y-1">
            <label className="text-sm text-gray-500">Nama</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={input}
            />
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm text-gray-500">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            className={input}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-500">Kata sandi</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 8 karakter"
            className={input}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white disabled:opacity-50"
        >
          {loading ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar"}
        </button>

        {error && <p className="text-center text-sm text-red-500">{error}</p>}

        <p className="text-center text-sm text-gray-500">
          {mode === "login" ? "Belum punya akun? " : "Sudah punya akun? "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
            className="text-blue-500"
          >
            {mode === "login" ? "Daftar" : "Masuk"}
          </button>
        </p>

        <p className="border-t border-gray-300 pt-3 text-center text-sm text-gray-500 dark:border-gray-700">
          Siswa atau mahasiswa?{" "}
          <Link href="/" className="text-blue-500">
            Gabung dengan kode room
          </Link>
        </p>
      </form>
    </main>
  );
}