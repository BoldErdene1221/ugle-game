import crypto from "crypto";

const algorithm = "aes-256-gcm";

function getKey() {
  const secret = process.env.WORD_SECRET_KEY;
  if (!secret) {
    throw new Error("WORD_SECRET_KEY is required");
  }
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptAnswer(answer: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(answer.toUpperCase(), "utf8"),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptAnswer(payload: string) {
  const [ivB64, tagB64, encryptedB64] = payload.split(":");
  if (!ivB64 || !tagB64 || !encryptedB64) {
    throw new Error("Invalid encrypted answer");
  }

  const decipher = crypto.createDecipheriv(
    algorithm,
    getKey(),
    Buffer.from(ivB64, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedB64, "base64")),
    decipher.final()
  ]);
  return decrypted.toString("utf8");
}
