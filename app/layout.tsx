import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "imggeditzz — Image editor",
  description: "A focused, client-side image editor for quick creative work.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
