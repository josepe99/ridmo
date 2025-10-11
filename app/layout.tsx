import { CountryProvider } from "@/context/country-context";
import { ClerkProvider } from "@clerk/nextjs";
import MainNav from "@/components/main-nav";
import Footer from "@/components/footer";
import { Inter } from "next/font/google";
import type React from "react";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "sonner";
import {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,
  NEXT_PUBLIC_CLERK_SIGN_IN_URL,
  NEXT_PUBLIC_CLERK_SIGN_UP_URL,
} from "@/lib/settings";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      publishableKey={NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      afterSignInUrl={NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL}
      afterSignUpUrl={NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL}
      signInUrl={NEXT_PUBLIC_CLERK_SIGN_IN_URL}
      signUpUrl={NEXT_PUBLIC_CLERK_SIGN_UP_URL}
    >
      <html lang="es">
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
        <body className={inter.className}>
          <CountryProvider>
            <div className="flex flex-col min-h-screen">
              <MainNav />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <Toaster />
          </CountryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
