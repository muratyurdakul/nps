import type { Metadata } from "next";
import "./globals.css";
import { Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weights: ["400", "500", "600", "700"],
} as any); // TS katılıyorsa weights yerine weight: ["400","500","600","700"] yaz

export const metadata: Metadata = {
  title: "AI x Product Management: The New Paradigm",
  description: "Net Promoter Score",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={spaceGrotesk.className}>{children}</body>
    </html>
  );
}