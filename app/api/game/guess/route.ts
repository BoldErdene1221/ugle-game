import { NextResponse } from "next/server";
import { decryptAnswer } from "@/lib/crypto";
import {
  evaluateGuess,
  isCyrillicWord,
  normalizeWord,
  secondsBetween
} from "@/lib/game";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const playerId = String(body?.playerId ?? "");
  const gameId = String(body?.gameId ?? "");
  const guess = normalizeWord(String(body?.guess ?? ""));

  if (!playerId || !gameId || !guess) {
    return NextResponse.json({ error: "Мэдээлэл дутуу байна." }, { status: 400 });
  }

  const player = await prisma.player.findFirst({
    where: { id: playerId, gameId },
    include: { game: true, guesses: { orderBy: { attemptNumber: "asc" } } }
  });

  if (!player) {
    return NextResponse.json({ error: "Тоглогч олдсонгүй." }, { status: 404 });
  }

  if (player.finishedAt) {
    return NextResponse.json({ error: "Тоглоом дууссан байна." }, { status: 400 });
  }

  if ([...guess].length !== player.game.wordLength) {
    return NextResponse.json({ error: `Үг ${player.game.wordLength} үсэгтэй байх ёстой.` }, { status: 400 });
  }

  if (!isCyrillicWord(guess)) {
    return NextResponse.json({ error: "Зөвхөн кирилл үсэг оруулна уу." }, { status: 400 });
  }

  if (player.guesses.length >= player.game.maxAttempts) {
    return NextResponse.json({ error: "Оролдлого дууссан байна." }, { status: 400 });
  }

  const answer = decryptAnswer(player.game.answerEncrypted);
  const result = evaluateGuess(guess, answer);
  const attemptNumber = player.guesses.length + 1;
  const solved = result.every((tile) => tile.status === "correct");
  const finished = solved || attemptNumber >= player.game.maxAttempts;
  const failed = finished && !solved;
  const finishedAt = finished ? new Date() : null;
  const durationSeconds = finishedAt ? secondsBetween(player.startedAt, finishedAt) : null;

  await prisma.$transaction([
    prisma.guess.create({
      data: {
        playerId,
        gameId,
        attemptNumber,
        guess,
        resultJson: result
      }
    }),
    prisma.player.update({
      where: { id: playerId },
      data: {
        attemptsUsed: attemptNumber,
        solved,
        failed,
        finishedAt,
        durationSeconds
      }
    })
  ]);

  return NextResponse.json({
    result,
    attemptNumber,
    solved,
    finished,
    failed,
    durationSeconds
  });
}
