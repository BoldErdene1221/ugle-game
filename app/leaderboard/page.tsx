"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Row = {
  rank: number;
  name: string;
  solved: boolean;
  failed: boolean;
  attempts: number;
  durationSeconds: number | null;
  finishedAt: string | null;
};

function formatDuration(seconds: number | null) {
  if (seconds === null) return "-";
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function formatFinish(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("mn-MN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(value));
}

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [message, setMessage] = useState("Түр хүлээнэ үү...");

  useEffect(() => {
    fetch("/api/leaderboard/today")
      .then((response) => response.json())
      .then((data) => {
        setRows(data.rows ?? []);
        setMessage(data.game ? "" : "Өнөөдрийн үг бүртгэгдээгүй байна.");
      })
      .catch(() => setMessage("Чансаа уншихад алдаа гарлаа."));
  }, []);

  return (
    <main className="page-shell">
      <nav className="top-nav">
        <Link className="brand" href="/">
          Үглэ
        </Link>
        <div className="nav-links">
          <Link href="/">Тоглох</Link>
          <Link href="/admin">Админ</Link>
        </div>
      </nav>

      <section className="table-section">
        <h1>Чансаа</h1>
        {message ? <p className="message">{message}</p> : null}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Нэр</th>
                <th>Төлөв</th>
                <th>Алхам</th>
                <th>Хугацаа</th>
                <th>Дууссан</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.rank}-${row.name}`}>
                  <td>{row.rank}</td>
                  <td>{row.name}</td>
                  <td>{row.solved ? "Амжилттай" : "Амжилтгүй"}</td>
                  <td>{row.attempts}</td>
                  <td>{formatDuration(row.durationSeconds)}</td>
                  <td>{formatFinish(row.finishedAt)}</td>
                </tr>
              ))}
              {!rows.length && !message ? (
                <tr>
                  <td colSpan={6}>Одоогоор дуусгасан тоглогч алга.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
