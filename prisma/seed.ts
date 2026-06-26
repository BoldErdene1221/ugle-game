import { PrismaClient } from "@prisma/client";
import { encryptAnswer } from "../lib/crypto";
import { dateOnly, todayDateKey } from "../lib/game";

const prisma = new PrismaClient();

async function main() {
  const answer = "НОМЫН";
  const date = dateOnly(todayDateKey());

  await prisma.game.upsert({
    where: { date },
    update: {
      answerEncrypted: encryptAnswer(answer),
      wordLength: [...answer].length,
      maxAttempts: 6,
      isActive: true
    },
    create: {
      date,
      answerEncrypted: encryptAnswer(answer),
      wordLength: [...answer].length,
      maxAttempts: 6,
      isActive: true
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
