import { prisma } from "./prisma";

export type TileStatus = "correct" | "present" | "absent";

export type TileResult = {
  letter: string;
  status: TileStatus;
};

export function normalizeWord(value: string) {
  return value.trim().toUpperCase();
}

export function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function nameKey(value: string) {
  return normalizeName(value).toLocaleLowerCase("mn-MN");
}

export function isCyrillicWord(value: string) {
  return /^[\u0400-\u04FF]+$/u.test(value);
}

export function todayDateKey() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ulaanbaatar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(new Date());
}

export function dateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export function formatDateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function evaluateGuess(guessInput: string, answerInput: string): TileResult[] {
  const guess = [...normalizeWord(guessInput)];
  const answer = [...normalizeWord(answerInput)];
  const result: TileResult[] = guess.map((letter) => ({ letter, status: "absent" }));
  const remaining = new Map<string, number>();

  for (let index = 0; index < answer.length; index += 1) {
    if (guess[index] === answer[index]) {
      result[index].status = "correct";
    } else {
      remaining.set(answer[index], (remaining.get(answer[index]) ?? 0) + 1);
    }
  }

  for (let index = 0; index < guess.length; index += 1) {
    if (result[index].status === "correct") continue;
    const count = remaining.get(guess[index]) ?? 0;
    if (count > 0) {
      result[index].status = "present";
      remaining.set(guess[index], count - 1);
    }
  }

  return result;
}

export async function getTodayGame() {
  return prisma.game.findFirst({
    where: {
      date: dateOnly(todayDateKey()),
      isActive: true
    }
  });
}

export function publicGame(game: {
  id: string;
  date: Date;
  wordLength: number;
  maxAttempts: number;
}) {
  return {
    gameId: game.id,
    gameNumber: Number(game.date.toISOString().slice(0, 10).replaceAll("-", "")),
    date: formatDateKey(game.date),
    wordLength: game.wordLength,
    maxAttempts: game.maxAttempts
  };
}

export function secondsBetween(start: Date, end: Date) {
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
}
