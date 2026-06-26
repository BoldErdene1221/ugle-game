"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type TileStatus = "correct" | "present" | "absent";
type TileResult = { letter: string; status: TileStatus };
type PublicGame = {
  playerId: string;
  gameId: string;
  date: string;
  wordLength: number;
  maxAttempts: number;
};

const keys = [
  ["Ф", "Ц", "У", "Ж", "Э", "Н", "Г", "Ш", "Ү", "З", "К"],
  ["Й", "Ы", "Б", "Ө", "А", "Х", "Р", "О", "Л", "Д", "П"],
  ["Я", "Ч", "Ё", "С", "М", "И", "Т", "Ь", "В", "Ю", "Е", "Щ", "Ъ"]
];

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export default function HomePage() {
  const [name, setName] = useState("");
  const [session, setSession] = useState<PublicGame | null>(null);
  const [current, setCurrent] = useState("");
  const [rows, setRows] = useState<TileResult[][]>([]);
  const [message, setMessage] = useState("");
  const [finished, setFinished] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [keyStatuses, setKeyStatuses] = useState<Record<string, TileStatus>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!startedAt || finished) return;
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [startedAt, finished]);

  const blankRows = useMemo(() => {
    if (!session) return [];
    const totalRows = Array.from({ length: session.maxAttempts }, (_, rowIndex) => {
      if (rows[rowIndex]) return rows[rowIndex];
      const letters = rowIndex === rows.length ? [...current] : [];
      return Array.from({ length: session.wordLength }, (_, index) => ({
        letter: letters[index] ?? "",
        status: "absent" as TileStatus
      }));
    });
    return totalRows;
  }, [current, rows, session]);

  async function startGame(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/player/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setMessage(data.error ?? "Алдаа гарлаа.");
      return;
    }
    setSession(data);
    setStartedAt(Date.now());
    setElapsed(0);
  }

  function addLetter(letter: string) {
    if (!session || finished) return;
    if (current.length < session.wordLength) {
      setCurrent((value) => value + letter);
    }
  }

  function removeLetter() {
    if (finished) return;
    setCurrent((value) => value.slice(0, -1));
  }

  async function submitGuess() {
    if (!session || finished || loading) return;
    if ([...current].length !== session.wordLength) {
      setMessage(`Үг ${session.wordLength} үсэгтэй байх ёстой.`);
      return;
    }

    setLoading(true);
    setMessage("");
    const response = await fetch("/api/game/guess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId: session.playerId,
        gameId: session.gameId,
        guess: current
      })
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error ?? "Алдаа гарлаа.");
      return;
    }

    const result = data.result as TileResult[];
    setRows((value) => [...value, result]);
    setCurrent("");
    setKeyStatuses((value) => {
      const priority: Record<TileStatus, number> = { absent: 0, present: 1, correct: 2 };
      const next = { ...value };
      for (const tile of result) {
        if ((priority[tile.status] ?? 0) >= (priority[next[tile.letter]] ?? -1)) {
          next[tile.letter] = tile.status;
        }
      }
      return next;
    });

    if (data.finished) {
      setFinished(true);
      setElapsed(data.durationSeconds ?? elapsed);
      setMessage(data.solved ? "Та зөв таалаа" : "Оролдлого дууслаа");
    }
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!session) return;
      if (event.key === "Enter") {
        void submitGuess();
        return;
      }
      if (event.key === "Backspace") {
        removeLetter();
        return;
      }
      const key = event.key.toUpperCase();
      if (/^[\u0400-\u04FF]$/u.test(key)) {
        addLetter(key);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <main className="page-shell">
      <nav className="top-nav">
        <div className="brand">Үглэ</div>
        <div className="nav-links">
          <Link href="/leaderboard">Чансаа</Link>
          <Link href="/admin">Админ</Link>
        </div>
      </nav>

      {!session ? (
        <section className="entry-panel">
          <h1>Өнөөдрийн үг</h1>
          <form onSubmit={startGame} className="entry-form">
            <label htmlFor="name">Нэрээ оруулна уу</label>
            <input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Жишээ: Бат"
              required
            />
            <button disabled={loading}>{loading ? "Түр хүлээнэ үү" : "Тоглоом эхлүүлэх"}</button>
          </form>
          {message ? <p className="message error">{message}</p> : null}
        </section>
      ) : (
        <section className="game-layout">
          <div className="game-header">
            <div>
              <span>Самбар</span>
              <strong>{session.date}</strong>
            </div>
            <div>
              <span>Хугацаа</span>
              <strong>{formatTime(elapsed)}</strong>
            </div>
            <div>
              <span>Алхам</span>
              <strong>
                {rows.length}/{session.maxAttempts}
              </strong>
            </div>
          </div>

          <div className="board" style={{ gridTemplateRows: `repeat(${session.maxAttempts}, 1fr)` }}>
            {blankRows.map((row, rowIndex) => (
              <div
                className="board-row"
                style={{ gridTemplateColumns: `repeat(${session.wordLength}, 1fr)` }}
                key={rowIndex}
              >
                {row.map((tile, tileIndex) => (
                  <div
                    className={`tile ${rows[rowIndex] ? tile.status : tile.letter ? "filled" : ""}`}
                    key={`${rowIndex}-${tileIndex}`}
                  >
                    {tile.letter}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {message ? <p className={`message ${finished ? "success" : "error"}`}>{message}</p> : null}

          <div className="keyboard" aria-label="Mongolian Cyrillic keyboard">
            {keys.map((row, index) => (
              <div className="key-row" key={index}>
                {index === 2 ? (
                  <button className="key action" onClick={submitGuess} disabled={loading || finished}>
                    OK
                  </button>
                ) : null}
                {row.map((letter) => (
                  <button
                    className={`key ${keyStatuses[letter] ?? ""}`}
                    onClick={() => addLetter(letter)}
                    disabled={finished}
                    key={letter}
                  >
                    {letter}
                  </button>
                ))}
                {index === 2 ? (
                  <button className="key action" onClick={removeLetter} disabled={finished}>
                    ⌫
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
