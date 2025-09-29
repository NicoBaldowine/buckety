import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { AuthErrorHandler } from "@/components/auth/auth-error-handler";
import { ThemeInitializer } from "@/components/ui/theme-initializer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Buckety",
  description: "Smart savings with goal-based buckets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/fonts/Robuck Regular.otf" as="font" type="font/otf" crossOrigin="" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme');
                  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  const theme = savedTheme || systemTheme;
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}

                // Font loading detection
                document.documentElement.classList.add('font-loading');
                
                if ('fonts' in document) {
                  document.fonts.load('400 16px Robuck').then(function() {
                    document.documentElement.classList.remove('font-loading');
                    document.documentElement.classList.add('font-loaded');
                  }).catch(function() {
                    // If font fails to load, show fallback after timeout
                    setTimeout(function() {
                      document.documentElement.classList.remove('font-loading');
                      document.documentElement.classList.add('font-loaded');
                    }, 2000);
                  });
                } else {
                  // Fallback for browsers without Font Loading API
                  setTimeout(function() {
                    document.documentElement.classList.remove('font-loading');
                    document.documentElement.classList.add('font-loaded');
                  }, 1000);
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} antialiased`}
      >
        <AuthProvider>
          <ThemeInitializer />
          <AuthErrorHandler />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
