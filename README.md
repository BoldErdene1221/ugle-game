# Үглэ - Daily Mongolian Wordle

Lightweight internal office word game built with Next.js, TypeScript, Prisma, and Postgres.

## Requirements

- Node.js 18.18 or newer
- A Postgres database URL from Vercel Postgres, Neon, Supabase Postgres, or another hosted Postgres provider

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example`:

```bash
DATABASE_URL="postgresql://..."
ADMIN_PASSWORD="change-me"
WORD_SECRET_KEY="use-a-long-random-secret"
```

3. Create the database tables:

```bash
npx prisma migrate dev --name init
```

4. Add the sample daily game:

```bash
npm run prisma:seed
```

5. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Admin Flow

- Go to `/admin`.
- Log in with `ADMIN_PASSWORD`.
- Use `Үг нэмэх` to create or update a daily word.
- Admin can see the answer, games, and all player results.

## Player Flow

- Go to `/`.
- Enter a display name.
- The same name can be used only once per daily game.
- Guesses are sent to the backend; the browser receives only tile results.
- Timer starts after successful name registration and stops when the player solves or fails.

## Leaderboard

`/leaderboard` shows today's completed results sorted by:

1. solved first
2. fewer attempts
3. shorter duration

## Security Notes

- The plain answer is never sent to normal user pages or public API responses.
- The answer is encrypted in the database with AES-256-GCM.
- `WORD_SECRET_KEY` is required on the server to encrypt and decrypt answers.
- Do not expose `WORD_SECRET_KEY`, `DATABASE_URL`, or `ADMIN_PASSWORD` to client-side environment variables.
- Public routes return only game metadata, leaderboard rows, or tile evaluation results.

## Vercel Deployment

1. Push the project to GitHub/GitLab/Bitbucket.
2. Create a Vercel project from the repo.
3. Add environment variables in Vercel:

```bash
DATABASE_URL
ADMIN_PASSWORD
WORD_SECRET_KEY
```

4. Use a hosted Postgres database such as Vercel Postgres, Neon, or Supabase.
5. Run migrations against production:

```bash
npx prisma migrate deploy
```

You can run this locally with the production `DATABASE_URL`, or from a CI/deploy step.
