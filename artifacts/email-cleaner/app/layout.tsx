import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Email Cleaner — Validate & Clean Email Lists Instantly",
  description:
    "Upload, validate, and download high-quality email lists in seconds.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        cssLayerName: "clerk",
        variables: {
          colorPrimary: "#4f46e5",
          colorForeground: "#0f172a",
          colorMutedForeground: "#64748b",
          colorBackground: "#ffffff",
          colorInput: "#f8fafc",
          colorInputForeground: "#0f172a",
          colorNeutral: "#e2e8f0",
          colorDanger: "#ef4444",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          borderRadius: "0.75rem",
        },
      }}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
