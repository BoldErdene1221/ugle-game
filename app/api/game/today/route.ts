import { NextResponse } from "next/server";
import { getTodayGame, publicGame } from "@/lib/game";

export const dynamic = "force-dynamic";

export async function GET() {
  const game = await getTodayGame();
  if (!game) {
    return NextResponse.json({ game: null });
  }

  return NextResponse.json({ game: publicGame(game) });
}
