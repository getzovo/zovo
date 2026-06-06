import type { Metadata } from "next";
import { Bebas_Neue } from "next/font/google";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
});

export const metadata: Metadata = {
  title: "Zovo — Run Independent Music",
  description: "The platform independent artists, managers, and labels use to pitch, distribute, plan releases, and grow — powered by AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={bebasNeue.variable}>{children}</body>
    </html>
  );
}
