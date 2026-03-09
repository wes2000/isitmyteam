"use client";

interface TeamGapScoreProps {
  score: number;
  matchesAnalyzed: number;
}

export default function TeamGapScore({ score, matchesAnalyzed }: TeamGapScoreProps) {
  const verdict =
    score > 30 ? "Your team is carrying!" :
    score > 10 ? "Your team is doing fine" :
    score > -10 ? "It's about even" :
    score > -30 ? "Your team is struggling" :
    "It might be your team...";

  const verdictColor =
    score > 30 ? "text-green-400" :
    score > 10 ? "text-green-300" :
    score > -10 ? "text-gray-400" :
    score > -30 ? "text-red-300" :
    "text-red-400";

  const scoreColor =
    score > 15 ? "text-green-400" :
    score < -15 ? "text-red-400" :
    "text-gray-300";

  return (
    <div className="text-center bg-[#1a1f35] rounded-2xl p-8 border border-white/5">
      <p className="text-sm text-gray-500 uppercase tracking-widest mb-2">Team Gap</p>
      <p className={`text-7xl font-black ${scoreColor}`}>
        {score > 0 ? "+" : ""}{score}
      </p>
      <p className={`mt-3 text-lg font-medium ${verdictColor}`}>{verdict}</p>
      <p className="mt-2 text-xs text-gray-600">{matchesAnalyzed} matches analyzed</p>
    </div>
  );
}
