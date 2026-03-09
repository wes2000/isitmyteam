"use client";

interface GapBarProps {
  label: string;
  score: number;
  kdaDiff: number;
  goldDiff: number;
  matchesPlayed: number;
}

export default function GapBar({ label, score, kdaDiff, goldDiff, matchesPlayed }: GapBarProps) {
  const clampedScore = Math.max(-100, Math.min(100, score));
  const isPositive = clampedScore >= 0;
  const barWidth = Math.abs(clampedScore);

  const scoreColor = clampedScore > 15
    ? "text-green-400"
    : clampedScore < -15
      ? "text-red-400"
      : "text-gray-400";

  const barColor = clampedScore > 15
    ? "bg-green-500/70"
    : clampedScore < -15
      ? "bg-red-500/70"
      : "bg-gray-500/50";

  return (
    <div className="bg-[#1a1f35] rounded-xl p-5 border border-white/5 hover:border-white/10 transition-colors">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">{label}</span>
        <span className={`text-2xl font-bold ${scoreColor}`}>
          {clampedScore > 0 ? "+" : ""}{clampedScore}
        </span>
      </div>

      {/* Bar visualization */}
      <div className="relative h-3 bg-[#111827] rounded-full overflow-hidden mb-3">
        {/* Center line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20 z-10" />
        {isPositive ? (
          <div
            className={`absolute left-1/2 top-0 bottom-0 rounded-r-full ${barColor} transition-all duration-700`}
            style={{ width: `${barWidth / 2}%` }}
          />
        ) : (
          <div
            className={`absolute right-1/2 top-0 bottom-0 rounded-l-full ${barColor} transition-all duration-700`}
            style={{ width: `${barWidth / 2}%` }}
          />
        )}
      </div>

      {/* Details row */}
      <div className="flex gap-4 text-xs text-gray-500">
        <span>KDA diff: <span className={kdaDiff >= 0 ? "text-green-400" : "text-red-400"}>
          {kdaDiff >= 0 ? "+" : ""}{kdaDiff}
        </span></span>
        <span>Gold/min diff: <span className={goldDiff >= 0 ? "text-green-400" : "text-red-400"}>
          {goldDiff >= 0 ? "+" : ""}{goldDiff}
        </span></span>
        <span className="ml-auto">{matchesPlayed} games</span>
      </div>
    </div>
  );
}
