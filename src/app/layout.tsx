import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./_components/providers";
import { ToasterProvider } from "./_components/toaster-provider";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Eijex MCP",
  description: "BioDesign execution layer for AI agents — FactorForge CDS and bio-AI workflow tools",
  openGraph: {
    title: "Eijex MCP",
    description: "BioDesign execution layer for AI agents — FactorForge CDS and bio-AI workflow tools",
    url: "https://mcp.eijex.com",
    siteName: "Eijex MCP",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Eijex MCP",
    description: "BioDesign execution layer for AI agents — FactorForge CDS and bio-AI workflow tools",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${jetbrainsMono.variable} bg-[#0a0a0a] text-zinc-200 antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          <ToasterProvider />
          {children}
        </Providers>
      </body>
    </html>
  );
}
