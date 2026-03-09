import { NextRequest, NextResponse } from "next/server";
import { calculateGap } from "@/lib/gap";
import { REGIONS } from "@/lib/types";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const gameName = params.get("gameName");
  const tagLine = params.get("tagLine");
  const region = params.get("region") || "na1";
  const matchCount = Math.min(50, Math.max(1, Number(params.get("count") || 20)));
  const season = params.get("season") || undefined;

  if (!gameName || !tagLine) {
    return NextResponse.json(
      { error: "gameName and tagLine are required (e.g. ?gameName=Faker&tagLine=KR1)" },
      { status: 400 }
    );
  }

  if (!REGIONS[region]) {
    return NextResponse.json(
      { error: `Invalid region. Valid: ${Object.keys(REGIONS).join(", ")}` },
      { status: 400 }
    );
  }

  if (!process.env.RIOT_API_KEY || process.env.RIOT_API_KEY === "your-riot-api-key-here") {
    return NextResponse.json(
      { error: "RIOT_API_KEY is not configured. Set it in .env.local" },
      { status: 500 }
    );
  }

  try {
    const result = await calculateGap(gameName, tagLine, region, matchCount, season);
    return NextResponse.json(result);
  } catch (err: any) {
    const message = err.message || "Unknown error";
    const status = message.includes("404") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
