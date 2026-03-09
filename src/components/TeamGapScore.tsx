"use client";

import { useEffect, useState } from "react";

interface TeamGapScoreProps {
  score: number;
  matchesAnalyzed: number;
}

export default function TeamGapScore({ score, matchesAnalyzed }: TeamGapScoreProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let start = 0;
    const end = score;
    const duration = 1200;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);
      setAnimatedScore(current);
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }, [score]);

  const verdict =
    score > 30 ? "Your team is carrying!" :
    score > 10 ? "Your team is doing fine" :
    score > -10 ? "It's about even" :
    score > -30 ? "Your team is struggling" :
    "It might be your team...";

  // Ring gauge: score maps from -100..+100 to 0..100% of the arc
  const normalized = (score + 100) / 200; // 0 to 1
  const circumference = 2 * Math.PI * 54; // radius 54
  const arcLength = circumference * 0.75; // 270 degree arc
  const offset = arcLength - arcLength * (mounted ? normalized : 0.5);

  // Color gradient based on score
  const hue = Math.round(normalized * 120); // 0=red, 60=yellow, 120=green
  const ringColor = `hsl(${hue}, 70%, 50%)`;
  const glowColor = `hsl(${hue}, 70%, 40%)`;
  const textColor =
    score > 15 ? "text-green-400" :
    score < -15 ? "text-red-400" :
    "text-yellow-400";

  const verdictColor =
    score > 30 ? "text-green-400" :
    score > 10 ? "text-green-300/80" :
    score > -10 ? "text-yellow-400/80" :
    score > -30 ? "text-red-300/80" :
    "text-red-400";

  return (
    <div className="relative flex flex-col items-center bg-gradient-to-b from-[#1a1f35] to-[#111827] rounded-2xl p-8 border border-white/5 overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute inset-0 opacity-20 blur-3xl transition-all duration-1000"
        style={{ background: `radial-gradient(circle at 50% 50%, ${glowColor}, transparent 70%)` }}
      />

      <p className="text-xs text-gray-500 uppercase tracking-[0.3em] mb-4 relative z-10">Team Gap</p>

      {/* Ring gauge */}
      <div className="relative w-44 h-44 mb-4">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-[135deg]">
          {/* Background track */}
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="#1f2937"
            strokeWidth="8"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Colored arc */}
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke={ringColor}
            strokeWidth="8"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{
              filter: `drop-shadow(0 0 6px ${glowColor})`,
            }}
          />
        </svg>

        {/* Score in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-5xl font-black tabular-nums ${textColor} transition-colors duration-500`}>
            {animatedScore > 0 ? "+" : ""}{animatedScore}
          </span>
        </div>
      </div>

      {/* Verdict */}
      <p className={`text-base font-semibold ${verdictColor} relative z-10 transition-colors duration-500`}>
        {verdict}
      </p>

      {/* Scale labels */}
      <div className="flex justify-between w-44 mt-2 text-[10px] text-gray-600 relative z-10">
        <span>-100</span>
        <span>0</span>
        <span>+100</span>
      </div>

      <p className="mt-3 text-[10px] text-gray-600 relative z-10">{matchesAnalyzed} matches analyzed</p>
    </div>
  );
}
