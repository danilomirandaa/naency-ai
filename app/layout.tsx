import { themeScript } from "@/lib/theme";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Naency",
  description: "Controle financeiro pessoal",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // O script do <head> ajusta a classe `.dark` antes da hidratação.
    <html
      lang="pt-BR"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      {/* Extensões do navegador (ex.: ColorZilla) adicionam atributos ao <body> antes da
          hidratação; o aviso vale só para os atributos deste elemento, não para os filhos. */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
