import type { Metadata } from "next";
import { Geist, Geist_Mono, Bebas_Neue } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "sonner";
import ErrorBoundary from "@/components/ErrorBoundary";
import DevErrorHandler from "@/components/DevErrorHandler";
import ConditionalLayout from "@/components/ConditionalLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "SpotFlix - Streaming",
  description: "Your premier destination for movies and series. Stream unlimited entertainment anytime, anywhere.",
  themeColor: "#121212",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" sizes="any" />
        <link rel="apple-touch-icon" href="/assets/favicon-180.png" sizes="180x180" />
        <link rel="icon" href="/assets/favicon-32.png" sizes="32x32" />
        <link rel="icon" href="/assets/favicon-16.png" sizes="16x16" />
        <link rel="manifest" href="/manifest.json" />
        {/* Theme color para barra de status/navegação */}
        <meta name="theme-color" content="#121212" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#121212" media="(prefers-color-scheme: light)" />
        <meta name="msapplication-navbutton-color" content="#121212" />
        <meta name="msapplication-TileColor" content="#121212" />
        {/* iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="SpotFlix" />
        {/* Android */}
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    },
                    function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bebasNeue.variable} antialiased min-h-screen bg-[#121212] text-white`}
      >
        <Providers>
          <ErrorBoundary>
            <ConditionalLayout>{children}</ConditionalLayout>
          </ErrorBoundary>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1f1f1f',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
              },
            }}
          />
          <DevErrorHandler />
        </Providers>
      </body>
    </html>
  );
}
