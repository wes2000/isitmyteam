import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IsItMyTeam - League of Legends Gap Analyzer",
  description: "Find out if it's really your team holding you back. Analyze lane gaps with KDA and gold stats.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
