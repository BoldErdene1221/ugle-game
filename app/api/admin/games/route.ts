import { NextResponse } from "next/server";
import { isAdminRequest, unauthorized } from "@/lib/adminAuth";
import { encryptAnswer, decryptAnswer } from "@/lib/crypto";
import { dateOnly, formatDateKey, isCyrillicWord, normalizeWord } from "@/lib/game";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdminRequest()) return unauthorized();

  const games = await prisma.game.findMany({
    orderBy: { date: "desc" },
    include: { _count: { select: { players: true, guesses: true } } }
  });

  return NextResponse.json({
    games: games.map((game) => ({
      id: game.id,
      date: formatDateKey(game.date),
      answer: decryptAnswer(game.answerEncrypted),
      wordLength: game.wordLength,
      maxAttempts: game.maxAttempts,
      isActive: game.isActive,
      players: game._count.players,
      guesses: game._count.guesses,
      createdAt: game.createdAt,
      updatedAt: game.updatedAt
    }))
  });
}

export async function POST(request: Request) {
  if (!isAdminRequest()) return unauthorized();

  const body = await request.json().catch(() => null);
  const answer = normalizeWord(String(body?.answer ?? ""));
  const date = String(body?.date ?? "");
  const wordLength = Number(body?.wordLength ?? [...answer].length);
  const maxAttempts = Number(body?.maxAttempts ?? 6);

  if (!answer || !date) {
    return NextResponse.json({ error: "Үг болон огноо шаардлагатай." }, { status: 400 });
  }

  if (!isCyrillicWord(answer)) {
    return NextResponse.json({ error: "Зөвхөн кирилл үсэг оруулна уу." }, { status: 400 });
  }

  if (![...answer].length || [...answer].length !== wordLength) {
    return NextResponse.json({ error: "Үгийн урт хариутай таарах ёстой." }, { status: 400 });
  }

  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 12) {
    return NextResponse.json({ error: "Оролдлогын тоо 1-12 хооронд байна." }, { status: 400 });
  }

  const game = await prisma.game.upsert({
    where: { date: dateOnly(date) },
    update: {
      answerEncrypted: encryptAnswer(answer),
      wordLength,
      maxAttempts,
      isActive: true
    },
    create: {
      date: dateOnly(date),
      answerEncrypted: encryptAnswer(answer),
      wordLength,
      maxAttempts,
      isActive: true
    }
  });

  return NextResponse.json({
    game: {
      id: game.id,
      date: formatDateKey(game.date),
      answer,
      wordLength: game.wordLength,
      maxAttempts: game.maxAttempts,
      isActive: game.isActive
    }
  });
}
