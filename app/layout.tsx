import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Fraunces, Source_Sans_3, Noto_Serif_Devanagari, JetBrains_Mono } from "next/font/google";
import { LanguageProvider } from "@/components/language-provider";
import { AuthProvider } from "@/components/auth-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LANG_COOKIE, toLang } from "@/lib/lang-cookie";
import { getCustomer } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db/mysql";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  display: "swap",
});

const notoDevanagari = Noto_Serif_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["devanagari", "latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "हातमा वकिल — Haatma Okil",
  description:
    "Nepali legal documents with every clause tied to the statute it comes from, reviewed by Nepal Bar Council registered advocates.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Read before render, so the markup that leaves the server is already in the
  // reader's language rather than being corrected after hydration.
  const lang = toLang((await cookies()).get(LANG_COOKIE)?.value);

  // Resolved on the server so the first paint already knows who is signed in.
  const user = await getCustomer();

  return (
    <html lang={lang} suppressHydrationWarning>
      <body
        className={`${fraunces.variable} ${sourceSans.variable} ${notoDevanagari.variable} ${jetbrains.variable} antialiased`}
      >
        <LanguageProvider initialLang={lang}>
          <AuthProvider initialUser={user} configured={isDatabaseConfigured()}>
            <div className="flex min-h-screen flex-col">
              <SiteHeader />
              <main className="flex-1">{children}</main>
              <SiteFooter />
            </div>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
