import { NextResponse } from "next/server";
import { getTodayGame } from "@/lib/game";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const game = await getTodayGame();
  if (!game) {
    return NextResponse.json({ game: null, rows: [] });
  }

  const players = await prisma.player.findMany({
    where: { gameId: game.id, finishedAt: { not: null } },
    orderBy: [
      { solved: "desc" },
      { attemptsUsed: "asc" },
      { durationSeconds: "asc" },
      { finishedAt: "asc" }
    ]
  });

  return NextResponse.json({
    game: {
      date: game.date.toISOString().slice(0, 10),
      wordLength: game.wordLength,
      maxAttempts: game.maxAttempts
    },
    rows: players.map((player, index) => ({
      rank: index + 1,
      name: player.name,
      solved: player.solved,
      failed: player.failed,
      attempts: player.attemptsUsed,
      durationSeconds: player.durationSeconds,
      finishedAt: player.finishedAt
    }))
  });
}
