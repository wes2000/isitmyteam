import { REGIONS } from "./types";

const API_KEY = process.env.RIOT_API_KEY!;

async function riotFetch(url: string) {
  const res = await fetch(url, {
    headers: { "X-Riot-Token": API_KEY },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Riot API ${res.status}: ${text}`);
  }
  return res.json();
}

/** Resolve Riot ID (gameName#tagLine) to a PUUID */
export async function getPuuid(
  gameName: string,
  tagLine: string,
  regionKey: string
): Promise<string> {
  const regional = REGIONS[regionKey].regional;
  const data = await riotFetch(
    `https://${regional}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
  );
  return data.puuid;
}

/** Queue IDs: 420=Solo/Duo, 440=Flex, 400=Normal Draft */
export const QUEUE_OPTIONS: Record<string, { id: number; label: string }> = {
  solo: { id: 420, label: "Solo/Duo" },
  flex: { id: 440, label: "Flex" },
  normal: { id: 400, label: "Normal Draft" },
};

/** Get recent match IDs for a PUUID, filtered by queue */
export async function getMatchIds(
  puuid: string,
  regionKey: string,
  count: number = 20,
  queueId?: number,
  startTime?: number,
  endTime?: number
): Promise<string[]> {
  const regional = REGIONS[regionKey].regional;
  let url = `https://${regional}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?count=${count}`;
  if (queueId) url += `&queue=${queueId}`;
  if (startTime) url += `&startTime=${startTime}`;
  if (endTime) url += `&endTime=${endTime}`;
  return riotFetch(url);
}

/** Get full match data */
export async function getMatch(matchId: string, regionKey: string) {
  const regional = REGIONS[regionKey].regional;
  return riotFetch(
    `https://${regional}.api.riotgames.com/lol/match/v5/matches/${matchId}`
  );
}

export interface ParsedParticipant {
  puuid: string;
  teamId: number;
  individualPosition: string;
  kills: number;
  deaths: number;
  assists: number;
  goldEarned: number;
  gameDurationSeconds: number;
  championName: string;
  win: boolean;
}

export interface ParsedMatch {
  matchId: string;
  gameCreation: number;
  gameDurationSeconds: number;
  participants: ParsedParticipant[];
}

/** Extract the relevant stats from a match for all participants */
export function parseMatch(matchData: any): ParsedMatch {
  const duration = matchData.info.gameDuration;
  return {
    matchId: matchData.metadata.matchId,
    gameCreation: matchData.info.gameCreation,
    gameDurationSeconds: duration,
    participants: matchData.info.participants.map((p: any) => ({
      puuid: p.puuid,
      teamId: p.teamId,
      individualPosition: p.individualPosition,
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      goldEarned: p.goldEarned,
      gameDurationSeconds: duration,
      championName: p.championName,
      win: p.win,
    })),
  };
}
