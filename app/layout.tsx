import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zovo — AI Music Career Manager",
  description: "The AI music career manager for independent artists.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
