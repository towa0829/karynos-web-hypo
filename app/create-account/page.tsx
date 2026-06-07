"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDreamer } from "@/lib/api";

export default function CreateAccountPage() {
  const router = useRouter();
  const [nameFamily, setNameFamily] = useState("");
  const [nameGiven, setNameGiven] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nameFamily.trim() || !nameGiven.trim()) {
      setError("名前を入力してください");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await createDreamer(nameFamily.trim(), nameGiven.trim());
      localStorage.setItem("dreamer_id", res.dreamer_id);
      router.push("/questions");
    } catch (err) {
      setError("エラーが発生しました。もう一度お試しください。");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">
          Karynos
        </h1>
        <p className="text-gray-500 text-center mb-8 text-sm">
          あなたにぴったりの職業を見つけよう
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              姓
            </label>
            <input
              type="text"
              value={nameFamily}
              onChange={(e) => setNameFamily(e.target.value)}
              placeholder="山田"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              名
            </label>
            <input
              type="text"
              value={nameGiven}
              onChange={(e) => setNameGiven(e.target.value)}
              placeholder="太郎"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white font-semibold py-3 rounded-xl transition-colors mt-2"
          >
            {loading ? "登録中..." : "診断をはじめる"}
          </button>
        </form>
      </div>
    </div>
  );
}
