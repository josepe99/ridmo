import { AuthSessionProvider } from "@/modules/users";
import { getActiveCollectionLinks } from "@/modules/catalog/server";
import MainNav from "@/shared/layout/main-nav";
import Footer from "@/shared/layout/footer";
import type React from "react";
import Script from "next/script";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "sonner";

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
