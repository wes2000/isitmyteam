export interface GapRequest {
  gameName: string;
  tagLine: string;
  region: string;
  matchCount: number;
  season?: string;
}

export type Lane = "TOP" | "JUNGLE" | "MIDDLE" | "BOTTOM";

export interface LaneStats {
  lane: Lane;
  /** Average KDA ratio across matches */
  avgKda: number;
  /** Average gold per minute */
  avgGoldPerMin: number;
  /** Average KDA of the lane opponent */
  avgEnemyKda: number;
  /** Average gold per minute of the lane opponent */
  avgEnemyGoldPerMin: number;
  /** Number of matches included in this lane's stats */
  matchesPlayed: number;
}

export interface LaneGap {
  lane: Lane;
  label: string;
  /** -100 to +100 score. Positive = your team's laner won lane. */
  score: number;
  /** Breakdown details */
  kdaDiff: number;
  goldDiff: number;
  matchesPlayed: number;
}

export interface GapResult {
  summonerName: string;
  region: string;
  matchesAnalyzed: number;
  teamGap: number;
  lanes: LaneGap[];
}

/** Riot API region routing values */
export const REGIONS: Record<string, { platform: string; regional: string; label: string }> = {
  na1: { platform: "na1", regional: "americas", label: "NA" },
  euw1: { platform: "euw1", regional: "europe", label: "EUW" },
  eun1: { platform: "eun1", regional: "europe", label: "EUNE" },
  kr: { platform: "kr", regional: "asia", label: "KR" },
  br1: { platform: "br1", regional: "americas", label: "BR" },
  la1: { platform: "la1", regional: "americas", label: "LAN" },
  la2: { platform: "la2", regional: "americas", label: "LAS" },
  oc1: { platform: "oc1", regional: "sea", label: "OCE" },
  jp1: { platform: "jp1", regional: "asia", label: "JP" },
  tr1: { platform: "tr1", regional: "europe", label: "TR" },
  ru: { platform: "ru", regional: "europe", label: "RU" },
  ph2: { platform: "ph2", regional: "sea", label: "PH" },
  sg2: { platform: "sg2", regional: "sea", label: "SG" },
  th2: { platform: "th2", regional: "sea", label: "TH" },
  tw2: { platform: "tw2", regional: "sea", label: "TW" },
  vn2: { platform: "vn2", regional: "sea", label: "VN" },
};
