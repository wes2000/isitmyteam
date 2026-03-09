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

/** Get recent ranked match IDs for a PUUID */
export async function getMatchIds(
  puuid: string,
  regionKey: string,
  count: number = 20,
  startTime?: number,
  endTime?: number
): Promise<string[]> {
  const regional = REGIONS[regionKey].regional;
  let url = `https://${regional}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?type=ranked&count=${count}`;
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
}

/** Extract the relevant stats from a match for all participants */
export function parseMatchParticipants(matchData: any): ParsedParticipant[] {
  const duration = matchData.info.gameDuration; // seconds (post-patch)
  return matchData.info.participants.map((p: any) => ({
    puuid: p.puuid,
    teamId: p.teamId,
    individualPosition: p.individualPosition,
    kills: p.kills,
    deaths: p.deaths,
    assists: p.assists,
    goldEarned: p.goldEarned,
    gameDurationSeconds: duration,
  }));
}
