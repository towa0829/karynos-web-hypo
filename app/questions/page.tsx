"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getQuestions, analyzeAnswers, Question, QuestionOption } from "@/lib/api";
import { AnimatePresence, motion } from "framer-motion";

interface Answer {
  question_id: string;
  option_id: string;
}

export default function QuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getQuestions()
      .then((res) => setQuestions(res.questions))
      .catch(() => setError("質問の取得に失敗しました"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = questions[current];
    if (q) setSelected(answers[q.question_id] ?? null);
  }, [current, questions, answers]);

  const goNext = useCallback(() => {
    const q = questions[current];
    if (!selected) return;
    setAnswers((prev) => ({ ...prev, [q.question_id]: selected }));
    if (current < questions.length - 1) {
      setDirection(1);
      setCurrent((c) => c + 1);
    }
  }, [current, questions, selected]);

  const goPrev = useCallback(() => {
    if (current > 0) {
      setDirection(-1);
      setCurrent((c) => c - 1);
    }
  }, [current]);

  async function handleSubmit() {
    const q = questions[current];
    if (!selected) return;
    const allAnswers = { ...answers, [q.question_id]: selected };
    const dreamerId = localStorage.getItem("dreamer_id");
    if (!dreamerId) {
      router.push("/create-account");
      return;
    }
    const answerList: Answer[] = questions.map((q) => ({
      question_id: q.question_id,
      option_id: allAnswers[q.question_id] ?? "",
    })).filter((a) => a.option_id);

    setSubmitting(true);
    try {
      await analyzeAnswers(dreamerId, answerList);
      router.push("/match");
    } catch (err) {
      setError("送信に失敗しました。もう一度お試しください。");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const q = questions[current];
  const isLast = current === questions.length - 1;
  const progress = ((current + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>{current + 1} / {questions.length}</span>
          <span>{q?.category?.split(":")[0] ?? ""}</span>
        </div>
        <div className="w-full h-1.5 bg-gray-200 rounded-full">
          <div
            className="h-full bg-indigo-400 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={q?.question_id}
            initial={{ x: direction * 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -direction * 60, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-lg"
          >
            <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
              <p className="text-base font-semibold text-gray-800 leading-relaxed">
                {q?.question_text}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {q?.options.map((opt: QuestionOption) => (
                <button
                  key={opt.option_id}
                  onClick={() => setSelected(opt.option_id)}
                  className={`w-full text-left px-5 py-4 rounded-xl text-sm font-medium border transition-all ${
                    selected === opt.option_id
                      ? "bg-indigo-500 text-white border-indigo-500 shadow-md"
                      : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300"
                  }`}
                >
                  {opt.option_text}
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="px-4 pb-8 flex gap-3 max-w-lg mx-auto w-full">
        <button
          onClick={goPrev}
          disabled={current === 0}
          className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 font-medium text-sm disabled:opacity-30 hover:bg-gray-50 transition-colors"
        >
          ← 前の質問
        </button>
        {isLast ? (
          <button
            onClick={handleSubmit}
            disabled={!selected || submitting}
            className="flex-2 flex-grow-[2] py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white font-semibold text-sm transition-colors"
          >
            {submitting ? "分析中..." : "診断結果を見る →"}
          </button>
        ) : (
          <button
            onClick={goNext}
            disabled={!selected}
            className="flex-2 flex-grow-[2] py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white font-semibold text-sm transition-colors"
          >
            次の質問 →
          </button>
        )}
      </div>

      {error && (
        <p className="text-center text-red-500 text-sm pb-4">{error}</p>
      )}
    </div>
  );
}
