"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getRecommendation, sendGood, sendBad, Recommendation } from "@/lib/api";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

interface Card {
  rec: Recommendation;
}

export default function MatchPage() {
  const router = useRouter();
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const dreamerId = useRef<string | null>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-20, 20]);
  const likeOpacity = useTransform(x, [30, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, -30], [1, 0]);

  useEffect(() => {
    const id = localStorage.getItem("dreamer_id");
    if (!id) {
      router.push("/create-account");
      return;
    }
    dreamerId.current = id;
    fetchNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchNext() {
    const id = dreamerId.current;
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await getRecommendation(id);
      setCard({ rec: res.recommendation });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("404")) {
        setDone(true);
      } else {
        setError("読み込みに失敗しました");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSwipe(direction: "good" | "bad") {
    if (!card || swiping) return;
    setSwiping(true);
    const id = dreamerId.current!;
    const target = direction === "good" ? 300 : -300;

    await animate(x, target, { duration: 0.35 });

    try {
      if (direction === "good") {
        await sendGood(id, card.rec.history_id);
      } else {
        await sendBad(id, card.rec.history_id);
      }
    } catch {
      // ignore feedback errors
    }

    x.set(0);
    setCard(null);
    setSwiping(false);
    fetchNext();
  }

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x > 80) {
      handleSwipe("good");
    } else if (info.offset.x < -80) {
      handleSwipe("bad");
    } else {
      animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 gap-6 p-8">
        <div className="text-5xl">🎉</div>
        <h2 className="text-xl font-bold text-gray-800">診断完了！</h2>
        <p className="text-gray-500 text-sm text-center">
          すべての職業を確認しました。<br />もう一度やり直す場合は下のボタンから。
        </p>
        <button
          onClick={() => router.push("/create-account")}
          className="bg-indigo-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-600 transition-colors"
        >
          最初からやり直す
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="px-4 pt-6 pb-2 text-center">
        <h1 className="text-lg font-bold text-gray-800">マッチング</h1>
        <p className="text-xs text-gray-400 mt-1">右スワイプ: いいね ／ 左スワイプ: パス</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-4">
        {loading || !card ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-gray-400 text-sm">
              {loading ? "読み込み中..." : error || ""}
            </div>
          </div>
        ) : (
          <div className="relative w-full max-w-sm" style={{ height: 520 }}>
            {/* LIKE / NOPE labels */}
            <motion.div
              className="absolute top-8 right-6 z-10 border-4 border-green-400 text-green-400 text-2xl font-black px-4 py-1 rounded-lg rotate-[-15deg]"
              style={{ opacity: likeOpacity }}
            >
              LIKE
            </motion.div>
            <motion.div
              className="absolute top-8 left-6 z-10 border-4 border-red-400 text-red-400 text-2xl font-black px-4 py-1 rounded-lg rotate-[15deg]"
              style={{ opacity: nopeOpacity }}
            >
              NOPE
            </motion.div>

            {/* Card */}
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={handleDragEnd}
              style={{ x, rotate }}
              className="absolute inset-0 bg-white rounded-3xl shadow-xl overflow-hidden cursor-grab active:cursor-grabbing"
            >
              {/* Image area */}
              <div className="h-56 bg-gradient-to-br from-indigo-200 to-purple-200 flex items-center justify-center">
                {card.rec.imgs && card.rec.imgs.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={card.rec.imgs[0]}
                    alt={card.rec.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-6xl">💼</span>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-xl font-bold text-gray-800">{card.rec.name}</h2>
                  <span className="bg-indigo-100 text-indigo-600 text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ml-2">
                    適合度 {card.rec.similarity_score}%
                  </span>
                </div>

                <div className="flex gap-4 text-sm text-gray-500 mb-3">
                  <span>💰 平均年収 {card.rec.salary}万円</span>
                  <span>🎂 平均年齢 {card.rec.age}歳</span>
                </div>

                <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">
                  {card.rec.description}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Buttons */}
      {!loading && card && (
        <div className="pb-8 flex justify-center gap-8">
          <button
            onClick={() => handleSwipe("bad")}
            disabled={swiping}
            className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center text-2xl hover:scale-110 transition-transform disabled:opacity-50"
          >
            ✕
          </button>
          <button
            onClick={() => handleSwipe("good")}
            disabled={swiping}
            className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center text-2xl hover:scale-110 transition-transform disabled:opacity-50"
          >
            ♥
          </button>
        </div>
      )}
    </div>
  );
}
