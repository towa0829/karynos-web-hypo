"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getResult, JobSummary, ResultResponse } from "@/lib/api";

function JobCard({ job, rank }: { job: JobSummary; rank?: number }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex">
      <div className="relative w-28 h-28 flex-shrink-0 bg-gradient-to-br from-indigo-200 to-purple-200 flex items-center justify-center">
        {job.imgs && job.imgs.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={job.imgs[0]}
            alt={job.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <span className="text-3xl">💼</span>
        )}
        {rank !== undefined && (
          <span className="absolute top-1 left-1 bg-indigo-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
            {rank}
          </span>
        )}
      </div>
      <div className="flex-1 p-3 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-gray-800 truncate">{job.name}</h3>
          <span className="bg-indigo-100 text-indigo-600 text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
            {job.similarity_score}%
          </span>
        </div>
        <div className="flex gap-3 text-xs text-gray-500 mt-1">
          <span>💰 {job.salary}万円</span>
          <span>🎂 {job.age}歳</span>
        </div>
        <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
          {job.description}
        </p>
      </div>
    </div>
  );
}

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<ResultResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("dreamer_id");
    if (!id) {
      router.push("/create-account");
      return;
    }
    getResult(id)
      .then(setResult)
      .catch((err) => {
        console.error(err);
        setError("診断結果の取得に失敗しました");
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <p className="text-gray-500 text-sm">読み込み中...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-indigo-50 to-purple-50 p-8">
        <p className="text-red-500 text-sm">{error || "結果がありません"}</p>
        <button
          onClick={() => router.push("/create-account")}
          className="bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-600 transition-colors"
        >
          最初からやり直す
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Header */}
        <div className="text-center">
          <div className="text-4xl mb-2">🎉</div>
          <h1 className="text-2xl font-bold text-gray-800">あなたの診断結果</h1>
        </div>

        {/* 性格・適性 */}
        {result.personality_text && (
          <section className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span>🧭</span> あなたの性格・適性
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {result.personality_text}
            </p>
          </section>
        )}

        {/* いいねした職業 */}
        <section>
          <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2 px-1">
            <span>❤️</span> いいねした職業
            <span className="text-xs text-gray-400 font-normal">
              （{result.liked_jobs.length}件）
            </span>
          </h2>
          {result.liked_jobs.length > 0 ? (
            <div className="flex flex-col gap-3">
              {result.liked_jobs.map((job) => (
                <JobCard key={job.job_id} job={job} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 px-1">
              いいねした職業はありませんでした。
            </p>
          )}
        </section>

        {/* 適合度トップ5 */}
        <section>
          <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2 px-1">
            <span>🏆</span> あなたへのおすすめ TOP5
          </h2>
          <div className="flex flex-col gap-3">
            {result.top_matches.map((job, i) => (
              <JobCard key={job.job_id} job={job} rank={i + 1} />
            ))}
          </div>
        </section>

        {/* やり直す */}
        <button
          onClick={() => router.push("/create-account")}
          className="bg-indigo-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-600 transition-colors mt-2"
        >
          最初からやり直す
        </button>
      </div>
    </div>
  );
}
