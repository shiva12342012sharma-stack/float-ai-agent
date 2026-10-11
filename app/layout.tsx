import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "streamdown/styles.css"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Float — Autonomous AI Agent",
  description:
    "Float is an autonomous AI agent that plans, uses live tools, reasons out loud, and listens to your voice.",
}

export const viewport: Viewport = {
  themeColor: "#121417",
  colorScheme: "dark",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark h-full bg-background antialiased`}>
      <body className="h-full">{children}</body>
    </html>
  )
}
