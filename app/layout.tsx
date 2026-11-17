import type { Metadata } from "next";
import { Barlow_Condensed, Orbitron } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSiteUrl } from "@/lib/env";
import "./globals.css";
import "./site-ui.css";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "DQ战队成长记录与成员社区平台",
    template: "%s | DQ战队成长记录与成员社区平台",
  },
  description:
    "DQ战队官网与成员社区平台，承载战队介绍、成长记录、荣誉墙、成员展示与内容社区。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      data-scroll-behavior="smooth"
      className={`${orbitron.variable} ${barlowCondensed.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main id="main-content" tabIndex={-1} className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
