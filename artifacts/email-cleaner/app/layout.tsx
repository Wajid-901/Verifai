import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Verifai — Validate & Clean Email Lists Instantly",
  description:
    "Upload, validate, and download high-quality email lists in seconds.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
