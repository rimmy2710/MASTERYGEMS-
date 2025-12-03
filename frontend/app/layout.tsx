import Link from "next/link";
import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Mastery Gems",
  description: "Developer UI for Mastery Gems",
};

const layoutStyles: React.CSSProperties = {
  fontFamily: "Arial, sans-serif",
  margin: 0,
  padding: 0,
  backgroundColor: "#f7f7f7",
  minHeight: "100vh",
};

const headerStyles: React.CSSProperties = {
  backgroundColor: "#111827",
  color: "#ffffff",
  padding: "1rem",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const containerStyles: React.CSSProperties = {
  padding: "1.5rem",
  maxWidth: "960px",
  margin: "0 auto",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={layoutStyles}>
        <header style={headerStyles}>
          <div style={{ fontWeight: 700 }}>Mastery Gems</div>
          <nav style={{ display: "flex", gap: "1rem" }}>
            <Link href="/">Home</Link>
            <Link href="/lobby">Lobby</Link>
          </nav>
        </header>
        <main style={containerStyles}>{children}</main>
      </body>
    </html>
  );
}
