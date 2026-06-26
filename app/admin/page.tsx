"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Game = {
  id: string;
  date: string;
  answer: string;
  wordLength: number;
  maxAttempts: number;
  isActive: boolean;
  players: number;
  guesses: number;
};

type Result = {
  id: string;
  name: string;
  gameDate: string;
  startedAt: string;
  finishedAt: string | null;
  durationSeconds: number | null;
  attemptsUsed: number;
  solved: boolean;
  failed: boolean;
  guessesCount: number;
};

function todayInput() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ulaanbaatar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function formatDuration(seconds: number | null) {
  if (seconds === null) return "-";
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [message, setMessage] = useState("");
  const [games, setGames] = useState<Game[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [form, setForm] = useState({
    answer: "",
    date: todayInput(),
    wordLength: 5,
    maxAttempts: 6
  });

  async function loadAdminData() {
    const [gamesResponse, resultsResponse] = await Promise.all([
      fetch("/api/admin/games"),
      fetch("/api/admin/results")
    ]);

    if (gamesResponse.status === 401 || resultsResponse.status === 401) {
      setAuthed(false);
      return;
    }

    const gamesData = await gamesResponse.json();
    const resultsData = await resultsResponse.json();
    setGames(gamesData.games ?? []);
    setResults(resultsData.results ?? []);
    setAuthed(true);
  }

  useEffect(() => {
    void loadAdminData();
  }, []);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Нэвтрэхэд алдаа гарлаа.");
      return;
    }
    setAuthed(true);
    setPassword("");
    await loadAdminData();
  }

  async function createGame(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/admin/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Үг нэмэхэд алдаа гарлаа.");
      return;
    }
    setMessage("Үг амжилттай хадгалагдлаа.");
    setForm((value) => ({ ...value, answer: "" }));
    await loadAdminData();
  }

  return (
    <main className="page-shell admin-shell">
      <nav className="top-nav">
        <Link className="brand" href="/">
          Үглэ
        </Link>
        <div className="nav-links">
          <Link href="/">Тоглох</Link>
          <Link href="/leaderboard">Чансаа</Link>
        </div>
      </nav>

      {!authed ? (
        <section className="entry-panel">
          <h1>Админ</h1>
          <form onSubmit={login} className="entry-form">
            <label htmlFor="password">Нууц үг</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button>Нэвтрэх</button>
          </form>
          {message ? <p className="message error">{message}</p> : null}
        </section>
      ) : (
        <section className="admin-grid">
          <div className="admin-panel">
            <h1>Үг нэмэх</h1>
            <form onSubmit={createGame} className="admin-form">
              <label>
                Хариу үг
                <input
                  value={form.answer}
                  onChange={(event) => {
                    const answer = event.target.value.toUpperCase();
                    setForm((value) => ({
                      ...value,
                      answer,
                      wordLength: [...answer].length || value.wordLength
                    }));
                  }}
                  required
                />
              </label>
              <label>
                Огноо
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm((value) => ({ ...value, date: event.target.value }))}
                  required
                />
              </label>
              <label>
                Үгийн урт
                <input
                  type="number"
                  min={1}
                  value={form.wordLength}
                  onChange={(event) =>
                    setForm((value) => ({ ...value, wordLength: Number(event.target.value) }))
                  }
                  required
                />
              </label>
              <label>
                Оролдлогын тоо
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={form.maxAttempts}
                  onChange={(event) =>
                    setForm((value) => ({ ...value, maxAttempts: Number(event.target.value) }))
                  }
                  required
                />
              </label>
              <button>Хадгалах</button>
            </form>
            {message ? <p className="message">{message}</p> : null}
          </div>

          <div className="table-section wide">
            <h2>Тоглоомууд</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Огноо</th>
                    <th>Хариу</th>
                    <th>Үгийн урт</th>
                    <th>Оролдлого</th>
                    <th>Тоглогч</th>
                    <th>Таамаг</th>
                  </tr>
                </thead>
                <tbody>
                  {games.map((game) => (
                    <tr key={game.id}>
                      <td>{game.date}</td>
                      <td>{game.answer}</td>
                      <td>{game.wordLength}</td>
                      <td>{game.maxAttempts}</td>
                      <td>{game.players}</td>
                      <td>{game.guesses}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="table-section wide">
            <h2>Үр дүн</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Огноо</th>
                    <th>Нэр</th>
                    <th>Төлөв</th>
                    <th>Алхам</th>
                    <th>Таамаг</th>
                    <th>Хугацаа</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => (
                    <tr key={result.id}>
                      <td>{result.gameDate}</td>
                      <td>{result.name}</td>
                      <td>{result.solved ? "Амжилттай" : result.failed ? "Амжилтгүй" : "Тоглож байна"}</td>
                      <td>{result.attemptsUsed}</td>
                      <td>{result.guessesCount}</td>
                      <td>{formatDuration(result.durationSeconds)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
