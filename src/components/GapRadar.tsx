"use client";

import { useState, useEffect } from "react";
import type { LaneGap } from "@/lib/types";

const LANE_SHORT: Record<string, string> = {
  TOP: "Top",
  JUNGLE: "Jng",
  MIDDLE: "Mid",
  BOTTOM: "Bot",
  UTILITY: "Sup",
};

// Pentagon points for 5 lanes, starting from top and going clockwise
function pentagonPoint(index: number, radius: number, cx: number, cy: number): [number, number] {
  const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
  return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
}

function pointsToPath(points: [number, number][]): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ") + " Z";
}

function scoreToRadius(score: number, maxR: number): number {
  // -100 to +100 mapped to 0 to maxR
  return ((score + 100) / 200) * maxR;
}

function scoreColor(score: number): string {
  if (score > 15) return "#4ade80";
  if (score < -15) return "#f87171";
  return "#fbbf24";
}

interface GapRadarProps {
  lanes: LaneGap[];
}

export default function GapRadar({ lanes }: GapRadarProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const cx = 150, cy = 150, maxR = 110;

  // Grid rings at 25%, 50%, 75%, 100%
  const rings = [0.25, 0.5, 0.75, 1.0];

  // Pentagon skeleton lines
  const outerPoints = lanes.map((_, i) => pentagonPoint(i, maxR, cx, cy));

  // Data shape
  const dataPoints = lanes.map((lane, i) =>
    pentagonPoint(i, mounted ? scoreToRadius(lane.score, maxR) : scoreToRadius(0, maxR), cx, cy)
  );

  // Zero line (score=0 → radius = maxR * 0.5)
  const zeroPoints = lanes.map((_, i) => pentagonPoint(i, maxR * 0.5, cx, cy));

  return (
    <div className="bg-gradient-to-b from-[#1a1f35] to-[#111827] rounded-2xl p-6 border border-white/5">
      <div className="relative">
        <svg viewBox="0 0 300 300" className="w-full max-w-[340px] mx-auto">
          {/* Grid rings */}
          {rings.map((r) => {
            const pts = lanes.map((_, i) => pentagonPoint(i, maxR * r, cx, cy));
            return (
              <polygon
                key={r}
                points={pts.map((p) => p.join(",")).join(" ")}
                fill="none"
                stroke="#374151"
                strokeWidth="0.5"
                opacity={0.4}
              />
            );
          })}

          {/* Axis lines from center to each vertex */}
          {outerPoints.map((p, i) => (
            <line
              key={`axis-${i}`}
              x1={cx} y1={cy}
              x2={p[0]} y2={p[1]}
              stroke="#374151"
              strokeWidth="0.5"
              opacity={0.3}
            />
          ))}

          {/* Zero line (dashed) */}
          <polygon
            points={zeroPoints.map((p) => p.join(",")).join(" ")}
            fill="none"
            stroke="#6b7280"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity={0.5}
          />

          {/* Data shape - filled */}
          <polygon
            points={dataPoints.map((p) => p.join(",")).join(" ")}
            fill="url(#radarGradient)"
            stroke="url(#radarStroke)"
            strokeWidth="2"
            className="transition-all duration-700 ease-out"
            opacity={0.9}
          />

          {/* Gradient definitions */}
          <defs>
            <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
            </radialGradient>
            <linearGradient id="radarStroke" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>

          {/* Data points (dots) */}
          {dataPoints.map((p, i) => {
            const isHovered = hoveredIndex === i;
            const color = scoreColor(lanes[i].score);
            return (
              <g key={`dot-${i}`}>
                {/* Glow */}
                {isHovered && (
                  <circle
                    cx={p[0]} cy={p[1]}
                    r="12"
                    fill={color}
                    opacity={0.2}
                    className="animate-pulse"
                  />
                )}
                <circle
                  cx={p[0]} cy={p[1]}
                  r={isHovered ? 6 : 4}
                  fill={color}
                  stroke="#0a0e1a"
                  strokeWidth="2"
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{ filter: `drop-shadow(0 0 4px ${color})` }}
                />
              </g>
            );
          })}

          {/* Lane labels around the pentagon */}
          {outerPoints.map((p, i) => {
            const lane = lanes[i];
            const color = scoreColor(lane.score);
            const isHovered = hoveredIndex === i;
            // Offset labels outward from the pentagon
            const labelPt = pentagonPoint(i, maxR + 28, cx, cy);
            return (
              <g
                key={`label-${i}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <text
                  x={labelPt[0]}
                  y={labelPt[1] - 6}
                  textAnchor="middle"
                  className={`text-[11px] font-bold transition-all duration-300 ${isHovered ? "opacity-100" : "opacity-70"}`}
                  fill={isHovered ? color : "#9ca3af"}
                >
                  {LANE_SHORT[lane.lane]}
                </text>
                <text
                  x={labelPt[0]}
                  y={labelPt[1] + 10}
                  textAnchor="middle"
                  className="text-[13px] font-black transition-all duration-300"
                  fill={color}
                >
                  {lane.score > 0 ? "+" : ""}{lane.score}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        {hoveredIndex !== null && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-[#0a0e1a]/95 border border-white/10 rounded-lg px-4 py-2.5 text-center backdrop-blur-sm pointer-events-none">
            <p className="text-xs font-semibold text-white mb-1">{lanes[hoveredIndex].label}</p>
            <div className="flex gap-4 text-[11px]">
              <span className="text-gray-400">KDA diff: <span className={lanes[hoveredIndex].kdaDiff >= 0 ? "text-green-400" : "text-red-400"}>
                {lanes[hoveredIndex].kdaDiff >= 0 ? "+" : ""}{lanes[hoveredIndex].kdaDiff}
              </span></span>
              <span className="text-gray-400">Gold/m diff: <span className={lanes[hoveredIndex].goldDiff >= 0 ? "text-green-400" : "text-red-400"}>
                {lanes[hoveredIndex].goldDiff >= 0 ? "+" : ""}{lanes[hoveredIndex].goldDiff}
              </span></span>
              <span className="text-gray-500">{lanes[hoveredIndex].matchesPlayed} games</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
