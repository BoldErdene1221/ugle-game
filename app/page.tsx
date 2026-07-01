"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

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

function Loader({ label = "Уншиж байна" }: { label?: string }) {
  return <span className="loader" aria-label={label} role="status" />;
}

export default function HomePage() {
  const [name, setName] = useState("");
  const [session, setSession] = useState<PublicGame | null>(null);
  const [current, setCurrent] = useState("");
  const [rows, setRows] = useState<TileResult[][]>([]);
  const [message, setMessage] = useState("");
  const [finished, setFinished] = useState(false);
  const [solved, setSolved] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [keyStatuses, setKeyStatuses] = useState<Record<string, TileStatus>>({});
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!startedAt || finished) return;
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [startedAt, finished]);

  const blankRows = useMemo(() => {
    if (!session) return [];
    return Array.from({ length: session.maxAttempts }, (_, rowIndex) => {
      if (rows[rowIndex]) return rows[rowIndex];
      const letters = rowIndex === rows.length ? [...current] : [];
      return Array.from({ length: session.wordLength }, (_, index) => ({
        letter: letters[index] ?? "",
        status: "absent" as TileStatus
      }));
    });
  }, [current, rows, session]);

  const progress = session ? Math.round((rows.length / session.maxAttempts) * 100) : 0;

  async function startGame(event: React.FormEvent) {
    event.preventDefault();
    if (starting) return;

    setStarting(true);
    setMessage("");
    const response = await fetch("/api/player/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    const data = await response.json();
    setStarting(false);

    if (!response.ok) {
      setMessage(data.error ?? "Алдаа гарлаа.");
      return;
    }

    setSession(data);
    setStartedAt(Date.now());
    setElapsed(0);
  }

  const addLetter = useCallback(
    (letter: string) => {
      if (!session || finished || submitting) return;
      setCurrent((value) => ([...value].length < session.wordLength ? value + letter : value));
    },
    [finished, session, submitting]
  );

  const removeLetter = useCallback(() => {
    if (finished || submitting) return;
    setCurrent((value) => [...value].slice(0, -1).join(""));
  }, [finished, submitting]);

  const submitGuess = useCallback(async () => {
    if (!session || finished || submitting) return;
    if ([...current].length !== session.wordLength) {
      setMessage(`Үг ${session.wordLength} үсэгтэй байх ёстой.`);
      return;
    }

    setSubmitting(true);
    setMessage("");
    const guessedWord = current;
    const response = await fetch("/api/game/guess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId: session.playerId,
        gameId: session.gameId,
        guess: guessedWord
      })
    });
    const data = await response.json();
    setSubmitting(false);

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
      setSolved(Boolean(data.solved));
      setElapsed(data.durationSeconds ?? elapsed);
      setMessage(data.solved ? "Та зөв таалаа" : "Оролдлого дууслаа");
    }
  }, [current, elapsed, finished, session, submitting]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!session || event.isComposing) return;
      if (event.key === "Enter") {
        event.preventDefault();
        void submitGuess();
        return;
      }
      if (event.key === "Backspace") {
        event.preventDefault();
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
  }, [addLetter, removeLetter, session, submitGuess]);

  return (
    <main className="page-shell">
      <nav className="top-nav">
        <div className="brand-block">
          <div className="brand-mark">Ү</div>
          <div>
            <div className="brand">Үглэ</div>
            <span className="brand-subtitle">Өдөр бүрийн Монгол үг</span>
          </div>
        </div>
        <div className="nav-links">
          <Link href="/leaderboard">Чансаа</Link>
          <Link href="/admin">Админ</Link>
        </div>
      </nav>

      {!session ? (
        <section className="entry-hero">
          <div className="hero-copy">
            <span className="eyebrow">Оффисын өдөр тутмын сорил</span>
            <h1>Өнөөдрийн үгийг таагаад чансаанд нэрээ үлдээгээрэй.</h1>
            <p>Нууц үг зөвхөн сервер дээр хадгалагдана. Та зөвхөн таамгаа илгээнэ.</p>
          </div>

          <form onSubmit={startGame} className="entry-panel">
            <h2>Тоглоом эхлүүлэх</h2>
            <label htmlFor="name">Нэрээ оруулна уу</label>
            <div className="input-shell">
              <input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Жишээ: Бат"
                required
              />
            </div>
            <button className="primary-button" disabled={starting}>
              {starting ? <Loader label="Тоглоом эхлүүлж байна" /> : "Тоглоом эхлүүлэх"}
            </button>
            {message ? <p className="message error">{message}</p> : null}
          </form>
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

          <div className="progress-track" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>

          <div className={`board-wrap ${submitting ? "is-loading" : ""}`}>
            <div className="board" style={{ gridTemplateRows: `repeat(${session.maxAttempts}, 1fr)` }}>
              {blankRows.map((row, rowIndex) => (
                <div
                  className="board-row"
                  style={{ gridTemplateColumns: `repeat(${session.wordLength}, 1fr)` }}
                  key={rowIndex}
                >
                  {row.map((tile, tileIndex) => (
                    <div
                      className={`tile ${
                        rows[rowIndex] ? tile.status : tile.letter ? "filled" : ""
                      } ${rowIndex === rows.length && submitting ? "pending" : ""}`}
                      key={`${rowIndex}-${tileIndex}`}
                    >
                      {tile.letter}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {submitting ? (
              <div className="board-loader">
                <Loader label="Таамаг шалгаж байна" />
              </div>
            ) : null}
          </div>

          {message && !solved ? <p className={`message ${finished ? "success" : "error"}`}>{message}</p> : null}

          <div className="keyboard" aria-label="Mongolian Cyrillic keyboard">
            {keys.map((row, index) => (
              <div className="key-row" key={index}>
                {index === 2 ? (
                  <button
                    className="key action enter-key"
                    onClick={submitGuess}
                    disabled={submitting || finished}
                    aria-label="Таамаг илгээх"
                  >
                    {submitting ? <Loader label="Таамаг илгээж байна" /> : "Enter"}
                  </button>
                ) : null}
                {row.map((letter) => (
                  <button
                    className={`key ${keyStatuses[letter] ?? ""}`}
                    onClick={() => addLetter(letter)}
                    disabled={finished || submitting}
                    key={letter}
                  >
                    {letter}
                  </button>
                ))}
                {index === 2 ? (
                  <button
                    className="key action"
                    onClick={removeLetter}
                    disabled={finished || submitting}
                    aria-label="Сүүлийн үсэг устгах"
                  >
                    ⌫
                  </button>
                ) : null}
              </div>
            ))}
          </div>

          {solved ? (
            <div className="success-modal" role="dialog" aria-modal="true">
              <div className="success-card">
                <div className="success-rings" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="success-kicker">Амжилттай</span>
                <h2>Баяр хүргэе!</h2>
                <p>
                  Та өнөөдрийн үгийг {rows.length} алхамд, {formatTime(elapsed)} хугацаанд зөв таалаа.
                </p>
                <Link className="primary-button" href="/leaderboard">
                  Чансаа харах
                </Link>
              </div>
            </div>
          ) : null}
        </section>
      )}
    </main>
  );
}
