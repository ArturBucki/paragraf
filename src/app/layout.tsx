import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "paragraf — poznaj się przez grę",
  description:
    "Apka randkowa, w której match to dopiero początek. Zamiast pustego „hej” gracie razem.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "paragraf", statusBarStyle: "default" },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

// Na iPhonie powiadomienia działają dopiero po dodaniu apki do ekranu głównego,
// więc manifest i ikony to nie ozdoba, tylko warunek działania push.
export const viewport = {
  themeColor: "#FFF7EC",
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
