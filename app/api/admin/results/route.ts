import { NextResponse } from "next/server";
import { isAdminRequest, unauthorized } from "@/lib/adminAuth";
import { formatDateKey } from "@/lib/game";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdminRequest()) return unauthorized();

  const players = await prisma.player.findMany({
    orderBy: [
      { game: { date: "desc" } },
      { solved: "desc" },
      { attemptsUsed: "asc" },
      { durationSeconds: "asc" }
    ],
    include: {
      game: true,
      guesses: { orderBy: { attemptNumber: "asc" } }
    }
  });

  return NextResponse.json({
    results: players.map((player) => ({
      id: player.id,
      name: player.name,
      gameId: player.gameId,
      gameDate: formatDateKey(player.game.date),
      startedAt: player.startedAt,
      finishedAt: player.finishedAt,
      durationSeconds: player.durationSeconds,
      attemptsUsed: player.attemptsUsed,
      solved: player.solved,
      failed: player.failed,
      guessesCount: player.guesses.length,
      createdAt: player.createdAt,
      updatedAt: player.updatedAt
    }))
  });
}
