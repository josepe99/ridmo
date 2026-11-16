import { AuthSessionProvider } from "@/modules/users";
import { getActiveCollectionLinks } from "@/modules/catalog/server";
import MainNav from "@/shared/layout/main-nav";
import Footer from "@/shared/layout/footer";
import type React from "react";
import Script from "next/script";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "sonner";
import type { Metadata } from "next";
import { JsonLd } from "@/shared/seo/json-ld";
import { SITE_KEYWORDS } from "@/shared/seo/keywords";
import { organizationSchema, websiteSchema } from "@/shared/seo/schemas";
import {
  SITE_DESCRIPTION,
  SITE_LOCALE,
  SITE_LOGO_PATH,
  SITE_NAME,
  SITE_ROBOTS,
  SITE_TITLE,
  SITE_URL,
  TWITTER_HANDLE,
} from "@/shared/seo/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: SITE_ROBOTS,
  openGraph: {
    type: "website",
    locale: SITE_LOCALE,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: SITE_LOGO_PATH, width: 1200, height: 630, alt: `${SITE_NAME} - Collares y relojes cubanos` }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [SITE_LOGO_PATH],
    creator: TWITTER_HANDLE,
  },
  other: {
    "geo.region": "PY",
    "geo.placename": "Asunción, Paraguay",
    ICBM: "-25.2637, -57.5759",
  },
};

const fontSans = localFont({
  src: "../public/fonts/NeueHaasDisplay.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--font-neue-haas",
});

const fontSerif = localFont({
  src: "../public/fonts/Canela-Regular.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--font-canela",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const collections = await getActiveCollectionLinks();

  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${fontSans.variable} ${fontSerif.variable}`}
    >
      <head>
        <Script id="clarity-script" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "t9d6rci8oo");
          `}
        </Script>
      </head>
      <body className="font-sans" suppressHydrationWarning>
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        <AuthSessionProvider>
          <div className="flex flex-col min-h-screen">
            <MainNav collections={collections} />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
