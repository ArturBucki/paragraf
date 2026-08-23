import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "paragraf — poznaj się przez grę",
  description:
    "Apka randkowa, w której match to dopiero początek. Zamiast pustego „hej” gracie razem.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
