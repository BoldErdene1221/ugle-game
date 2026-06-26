import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getTodayGame, nameKey, normalizeName, publicGame } from "@/lib/game";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const displayName = normalizeName(String(body?.name ?? ""));

  if (!displayName) {
    return NextResponse.json({ error: "Нэрээ оруулна уу" }, { status: 400 });
  }

  const game = await getTodayGame();
  if (!game) {
    return NextResponse.json({ error: "Өнөөдрийн үг бүртгэгдээгүй байна." }, { status: 404 });
  }

  try {
    const player = await prisma.player.create({
      data: {
        gameId: game.id,
        name: displayName,
        nameKey: nameKey(displayName)
      }
    });

    return NextResponse.json({
      playerId: player.id,
      ...publicGame(game),
      startedAt: player.startedAt
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Энэ нэрээр өнөөдрийн тоглоомд бүртгэгдсэн байна." },
        { status: 409 }
      );
    }
    throw error;
  }
}
