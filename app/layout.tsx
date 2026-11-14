import type { Metadata } from "next";
import "./template-fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "PostPilot by Neovia AI",
  description: "A month of on-brand posts. Approved on WhatsApp. Published on time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className="noise studio-bg min-h-dvh">{children}</body>
    </html>
  );
}
