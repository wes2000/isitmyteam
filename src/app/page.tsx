"use client";

import { useState } from "react";
import GapBar from "@/components/GapBar";
import TeamGapScore from "@/components/TeamGapScore";
import type { GapResult } from "@/lib/types";
import { REGIONS } from "@/lib/types";

const SEASON_OPTIONS = [
  { value: "", label: "Last 20 games" },
  { value: "S15", label: "Season 2025" },
  { value: "S15-Split1", label: "S15 Split 1" },
  { value: "S14", label: "Season 2024" },
  { value: "S14-Split1", label: "S14 Split 1" },
  { value: "S14-Split2", label: "S14 Split 2" },
  { value: "S14-Split3", label: "S14 Split 3" },
];

export default function Home() {
  const [riotId, setRiotId] = useState("");
  const [region, setRegion] = useState("na1");
  const [season, setSeason] = useState("");
  const [matchCount, setMatchCount] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GapResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const parts = riotId.split("#");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      setError("Enter your Riot ID in the format: Name#TAG");
      return;
    }

    const [gameName, tagLine] = parts;
    setLoading(true);

    try {
      const params = new URLSearchParams({
        gameName,
        tagLine,
        region,
        count: String(matchCount),
      });
      if (season) params.set("season", season);

      const res = await fetch(`/api/gap?${params}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setResult(data);
    } catch {
      setError("Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black tracking-tight mb-2">
          Is It My Team?
        </h1>
        <p className="text-gray-500 text-sm">
          Analyze your ranked games to find out which lanes are winning — and which aren&apos;t.
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="bg-[#1a1f35] rounded-2xl p-6 border border-white/5 mb-8">
        <div className="flex flex-col gap-4">
          {/* Riot ID input */}
          <div>
            <label htmlFor="riotId" className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">
              Riot ID
            </label>
            <input
              id="riotId"
              type="text"
              value={riotId}
              onChange={(e) => setRiotId(e.target.value)}
              placeholder="Name#TAG"
              className="w-full bg-[#111827] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
              required
            />
          </div>

          {/* Region + Season row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="region" className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">
                Region
              </label>
              <select
                id="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-[#111827] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {Object.entries(REGIONS).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="season" className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">
                Timeframe
              </label>
              <select
                id="season"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="w-full bg-[#111827] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {SEASON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Match count */}
          <div>
            <label htmlFor="count" className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">
              Games to analyze: {matchCount}
            </label>
            <input
              id="count"
              type="range"
              min={5}
              max={50}
              step={5}
              value={matchCount}
              onChange={(e) => setMatchCount(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-gray-600 mt-1">
              <span>5</span><span>50</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing...
              </span>
            ) : (
              "Analyze Gap"
            )}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          <p className="text-center text-sm text-gray-500 mb-2">
            Results for <span className="text-white font-medium">{result.summonerName}</span> ({REGIONS[result.region]?.label})
          </p>

          <TeamGapScore score={result.teamGap} matchesAnalyzed={result.matchesAnalyzed} />

          <div className="grid gap-3">
            {result.lanes.map((lane) => (
              <GapBar
                key={lane.lane}
                label={lane.label}
                score={lane.score}
                kdaDiff={lane.kdaDiff}
                goldDiff={lane.goldDiff}
                matchesPlayed={lane.matchesPlayed}
              />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
