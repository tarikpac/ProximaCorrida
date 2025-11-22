import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import Providers from "./providers";

export const metadata: Metadata = {
  title: "Próxima Corrida - Corridas de Rua na Paraíba",
  description: "Encontre as melhores corridas de rua na Paraíba. Calendário completo de eventos, inscrições e detalhes.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Próxima Corrida",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-zinc-950 text-zinc-50 selection:bg-lime-400 selection:text-black`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
