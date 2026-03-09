import type { Lane, LaneGap, GapResult } from "./types";
import {
  getPuuid,
  getMatchIds,
  getMatch,
  parseMatchParticipants,
  type ParsedParticipant,
} from "./riot";

const LANE_MAP: Record<string, Lane> = {
  TOP: "TOP",
  JUNGLE: "JUNGLE",
  MIDDLE: "MIDDLE",
  BOTTOM: "BOTTOM",
};

const LANE_LABELS: Record<Lane, string> = {
  TOP: "Top Gap",
  JUNGLE: "Jungle Gap",
  MIDDLE: "Mid Gap",
  BOTTOM: "Bot Gap",
};

function kda(p: ParsedParticipant): number {
  return (p.kills + p.assists) / Math.max(1, p.deaths);
}

function goldPerMin(p: ParsedParticipant): number {
  return p.goldEarned / Math.max(1, p.gameDurationSeconds / 60);
}

/**
 * Score a lane gap on a -100 to +100 scale.
 * KDA difference weighted 60%, gold/min difference weighted 40%.
 *
 * The raw differences are clamped and scaled:
 *   KDA diff of +-5 maps to +-100
 *   Gold/min diff of +-150 maps to +-100
 */
function scoreLane(
  allyKda: number,
  allyGpm: number,
  enemyKda: number,
  enemyGpm: number
): { score: number; kdaDiff: number; goldDiff: number } {
  const kdaDiff = allyKda - enemyKda;
  const goldDiff = allyGpm - enemyGpm;

  const kdaScore = Math.max(-100, Math.min(100, (kdaDiff / 5) * 100));
  const goldScore = Math.max(-100, Math.min(100, (goldDiff / 150) * 100));

  const score = Math.round(kdaScore * 0.6 + goldScore * 0.4);
  return { score, kdaDiff: Math.round(kdaDiff * 100) / 100, goldDiff: Math.round(goldDiff * 100) / 100 };
}

/** Season start timestamps (approximate patch dates, epoch seconds) */
const SEASON_TIMESTAMPS: Record<string, { start: number; end?: number }> = {
  "S14": { start: 1704844800 },           // Jan 10 2024
  "S14-Split1": { start: 1704844800, end: 1715558400 },
  "S14-Split2": { start: 1715558400, end: 1726876800 },
  "S14-Split3": { start: 1726876800, end: 1736467200 },
  "S15": { start: 1736467200 },           // Jan 10 2025
  "S15-Split1": { start: 1736467200, end: 1747180800 },
};

export async function calculateGap(
  gameName: string,
  tagLine: string,
  regionKey: string,
  matchCount: number = 20,
  season?: string
): Promise<GapResult> {
  const puuid = await getPuuid(gameName, tagLine, regionKey);

  let startTime: number | undefined;
  let endTime: number | undefined;
  if (season && SEASON_TIMESTAMPS[season]) {
    startTime = SEASON_TIMESTAMPS[season].start;
    endTime = SEASON_TIMESTAMPS[season].end;
  }

  const matchIds = await getMatchIds(puuid, regionKey, matchCount, startTime, endTime);

  // Per-lane accumulators
  const laneAccum: Record<Lane, { allyKdas: number[]; allyGpms: number[]; enemyKdas: number[]; enemyGpms: number[] }> = {
    TOP: { allyKdas: [], allyGpms: [], enemyKdas: [], enemyGpms: [] },
    JUNGLE: { allyKdas: [], allyGpms: [], enemyKdas: [], enemyGpms: [] },
    MIDDLE: { allyKdas: [], allyGpms: [], enemyKdas: [], enemyGpms: [] },
    BOTTOM: { allyKdas: [], allyGpms: [], enemyKdas: [], enemyGpms: [] },
  };

  for (const matchId of matchIds) {
    const matchData = await getMatch(matchId, regionKey);
    const participants = parseMatchParticipants(matchData);

    // Find the searched player
    const player = participants.find((p) => p.puuid === puuid);
    if (!player) continue;

    const playerTeamId = player.teamId;

    // Group participants by lane, skipping "Invalid" positions
    for (const p of participants) {
      const lane = LANE_MAP[p.individualPosition];
      if (!lane) continue;

      const acc = laneAccum[lane];
      if (p.teamId === playerTeamId) {
        acc.allyKdas.push(kda(p));
        acc.allyGpms.push(goldPerMin(p));
      } else {
        acc.enemyKdas.push(kda(p));
        acc.enemyGpms.push(goldPerMin(p));
      }
    }
  }

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  const lanes: LaneGap[] = (["TOP", "JUNGLE", "MIDDLE", "BOTTOM"] as Lane[]).map((lane) => {
    const acc = laneAccum[lane];
    const allyKdaAvg = avg(acc.allyKdas);
    const allyGpmAvg = avg(acc.allyGpms);
    const enemyKdaAvg = avg(acc.enemyKdas);
    const enemyGpmAvg = avg(acc.enemyGpms);

    const { score, kdaDiff, goldDiff } = scoreLane(allyKdaAvg, allyGpmAvg, enemyKdaAvg, enemyGpmAvg);

    return {
      lane,
      label: LANE_LABELS[lane],
      score,
      kdaDiff,
      goldDiff,
      matchesPlayed: Math.min(acc.allyKdas.length, acc.enemyKdas.length),
    };
  });

  const teamGap = lanes.length
    ? Math.round(lanes.reduce((sum, l) => sum + l.score, 0) / lanes.length)
    : 0;

  return {
    summonerName: `${gameName}#${tagLine}`,
    region: regionKey,
    matchesAnalyzed: matchIds.length,
    teamGap,
    lanes,
  };
}
