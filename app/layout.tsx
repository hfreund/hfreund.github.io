import type { Metadata } from "next";

import "../assets/landing/landing.css";
import "./commonplace.css";

export const metadata: Metadata = {
  title: "Hugh Freund",
  description: "Hugh Freund — designer and builder.",
  authors: [{ name: "Hugh Freund" }],
  robots: "all",
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
