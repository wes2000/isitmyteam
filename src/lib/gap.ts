import type { Lane, LaneGap, GapResult, MatchSummary, MatchLaneDetail } from "./types";
import {
  getPuuid,
  getMatchIds,
  getMatch,
  parseMatch,
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

function kdaRatio(p: ParsedParticipant): number {
  return (p.kills + p.assists) / Math.max(1, p.deaths);
}

function kdaString(p: ParsedParticipant): string {
  return `${p.kills}/${p.deaths}/${p.assists}`;
}

function goldPerMin(p: ParsedParticipant): number {
  return Math.round(p.goldEarned / Math.max(1, p.gameDurationSeconds / 60));
}

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

const SEASON_TIMESTAMPS: Record<string, { start: number; end?: number }> = {
  "S14": { start: 1704844800 },
  "S14-Split1": { start: 1704844800, end: 1715558400 },
  "S14-Split2": { start: 1715558400, end: 1726876800 },
  "S14-Split3": { start: 1726876800, end: 1736467200 },
  "S15": { start: 1736467200 },
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

  const laneAccum: Record<Lane, { allyKdas: number[]; allyGpms: number[]; enemyKdas: number[]; enemyGpms: number[] }> = {
    TOP: { allyKdas: [], allyGpms: [], enemyKdas: [], enemyGpms: [] },
    JUNGLE: { allyKdas: [], allyGpms: [], enemyKdas: [], enemyGpms: [] },
    MIDDLE: { allyKdas: [], allyGpms: [], enemyKdas: [], enemyGpms: [] },
    BOTTOM: { allyKdas: [], allyGpms: [], enemyKdas: [], enemyGpms: [] },
  };

  const matches: MatchSummary[] = [];

  for (const matchId of matchIds) {
    const matchData = await getMatch(matchId, regionKey);
    const parsed = parseMatch(matchData);
    const participants = parsed.participants;

    const player = participants.find((p) => p.puuid === puuid);
    if (!player) continue;

    const playerTeamId = player.teamId;

    // Build per-lane details for this match
    const lanePlayers: Record<string, { ally?: ParsedParticipant; enemy?: ParsedParticipant }> = {};

    for (const p of participants) {
      const lane = LANE_MAP[p.individualPosition];
      if (!lane) continue;

      if (!lanePlayers[lane]) lanePlayers[lane] = {};
      if (p.teamId === playerTeamId) {
        lanePlayers[lane].ally = p;

        const acc = laneAccum[lane];
        acc.allyKdas.push(kdaRatio(p));
        acc.allyGpms.push(goldPerMin(p));
      } else {
        lanePlayers[lane].enemy = p;

        const acc = laneAccum[lane];
        acc.enemyKdas.push(kdaRatio(p));
        acc.enemyGpms.push(goldPerMin(p));
      }
    }

    const matchLanes: MatchLaneDetail[] = (["TOP", "JUNGLE", "MIDDLE", "BOTTOM"] as Lane[])
      .filter((lane) => lanePlayers[lane]?.ally && lanePlayers[lane]?.enemy)
      .map((lane) => {
        const ally = lanePlayers[lane].ally!;
        const enemy = lanePlayers[lane].enemy!;
        const { score } = scoreLane(kdaRatio(ally), goldPerMin(ally), kdaRatio(enemy), goldPerMin(enemy));

        return {
          lane,
          label: LANE_LABELS[lane],
          allyChampion: ally.championName,
          allyKda: kdaString(ally),
          allyGoldPerMin: goldPerMin(ally),
          enemyChampion: enemy.championName,
          enemyKda: kdaString(enemy),
          enemyGoldPerMin: goldPerMin(enemy),
          score,
        };
      });

    const matchTeamGap = matchLanes.length
      ? Math.round(matchLanes.reduce((s, l) => s + l.score, 0) / matchLanes.length)
      : 0;

    matches.push({
      matchId: parsed.matchId,
      date: new Date(parsed.gameCreation).toISOString(),
      durationMinutes: Math.round(parsed.gameDurationSeconds / 60),
      win: player.win,
      playerChampion: player.championName,
      playerLane: player.individualPosition,
      playerKda: kdaString(player),
      playerGoldPerMin: goldPerMin(player),
      teamGap: matchTeamGap,
      lanes: matchLanes,
    });
  }

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  const lanes: LaneGap[] = (["TOP", "JUNGLE", "MIDDLE", "BOTTOM"] as Lane[]).map((lane) => {
    const acc = laneAccum[lane];
    const { score, kdaDiff, goldDiff } = scoreLane(avg(acc.allyKdas), avg(acc.allyGpms), avg(acc.enemyKdas), avg(acc.enemyGpms));

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
    matches,
  };
}
