"use client";

import { useState } from "react";
import type { MatchSummary } from "@/lib/types";

const LANE_DISPLAY: Record<string, string> = {
  TOP: "Top",
  JUNGLE: "Jungle",
  MIDDLE: "Mid",
  BOTTOM: "Bot",
  UTILITY: "Support",
};

function formatChampName(name: string): string {
  return name.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function scoreColor(score: number): string {
  if (score > 15) return "text-green-400";
  if (score < -15) return "text-red-400";
  return "text-gray-400";
}

export default function MatchCard({ match }: { match: MatchSummary }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-xl border transition-colors ${
        match.win
          ? "bg-[#1a2a1f] border-green-500/20"
          : "bg-[#2a1a1f] border-red-500/20"
      }`}
    >
      {/* Summary row — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer hover:brightness-110 transition-all"
      >
        {/* Win/Loss indicator */}
        <div
          className={`w-1 h-10 rounded-full flex-shrink-0 ${
            match.win ? "bg-green-500" : "bg-red-500"
          }`}
        />

        {/* Champion + lane */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white truncate">
            {formatChampName(match.playerChampion)}
          </p>
          <p className="text-xs text-gray-500">
            {LANE_DISPLAY[match.playerLane] || match.playerLane} · {match.durationMinutes}m
          </p>
        </div>

        {/* KDA */}
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-medium text-gray-200">{match.playerKda}</p>
          <p className="text-xs text-gray-500">{match.playerGoldPerMin} g/m</p>
        </div>

        {/* Team Gap score */}
        <div className="text-right flex-shrink-0 w-16">
          <p className={`text-lg font-bold ${scoreColor(match.teamGap)}`}>
            {match.teamGap > 0 ? "+" : ""}{match.teamGap}
          </p>
          <p className="text-[10px] text-gray-600 uppercase">team gap</p>
        </div>

        {/* Date */}
        <div className="text-right flex-shrink-0 w-16">
          <p className="text-xs text-gray-500">{formatDate(match.date)}</p>
        </div>

        {/* Expand chevron */}
        <svg
          className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-white/5">
          {/* Column headers */}
          <div className="flex items-center gap-2 text-[10px] text-gray-600 uppercase tracking-wider mb-2">
            <span className="w-14 flex-shrink-0">Lane</span>
            <span className="flex-1 text-right">Your Team</span>
            <span className="w-10 text-center">Gap</span>
            <span className="flex-1 text-left">Enemy Team</span>
          </div>

          <div className="space-y-2">
            {match.lanes.map((lane) => (
              <div key={lane.lane} className={`flex items-center gap-2 text-xs ${lane.isPlayerLane ? "opacity-50" : ""}`}>
                {/* Lane label */}
                <span className="w-14 text-gray-500 flex-shrink-0">
                  {lane.label.replace(" Gap", "")}
                </span>

                {/* Ally side */}
                <div className="flex-1 text-right">
                  {lane.isPlayerLane ? (
                    <span className="text-white font-bold">{formatChampName(lane.allyChampion)} <span className="text-gray-400 font-normal">(you)</span></span>
                  ) : (
                    <span className="text-gray-300">{formatChampName(lane.allyChampion)}</span>
                  )}
                  <span className="text-gray-500 ml-2">{lane.allyKda}</span>
                  <span className="text-gray-600 ml-1 text-[10px]">{lane.allyGoldPerMin}g/m</span>
                </div>

                {/* Score */}
                <span className={`w-10 text-center font-bold ${lane.isPlayerLane ? "text-gray-600" : scoreColor(lane.score)}`}>
                  {lane.isPlayerLane ? "—" : `${lane.score > 0 ? "+" : ""}${lane.score}`}
                </span>

                {/* Enemy side */}
                <div className="flex-1 text-left">
                  <span className="text-gray-400">{formatChampName(lane.enemyChampion)}</span>
                  <span className="text-gray-500 ml-2">{lane.enemyKda}</span>
                  <span className="text-gray-600 ml-1 text-[10px]">{lane.enemyGoldPerMin}g/m</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
