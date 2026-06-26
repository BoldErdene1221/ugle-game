import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Үглэ",
  description: "Дотоод оффисын өдөр тутмын үгийн тоглоом"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn">
      <body>{children}</body>
    </html>
  );
}
