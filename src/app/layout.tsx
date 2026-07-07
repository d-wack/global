import { Auth0Provider } from "@auth0/nextjs-auth0";
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

export const metadata: Metadata = {
  title: "Planet Atlas",
  description: "An explorable atlas of the world's news, events, and history.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* Client provider for useUser(). Safe in open mode: with Auth0
            unconfigured there is no session, so useUser() yields no user. */}
        <Auth0Provider>{children}</Auth0Provider>
      </body>
    </html>
  );
}
