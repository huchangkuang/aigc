import type { Metadata } from 'next';
import Script from 'next/script';
import { Geist_Mono, Inter } from 'next/font/google';
import { ToastHost } from '@/components/toast-host';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const MATERIAL_SYMBOLS_URL =
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block';

export const metadata: Metadata = {
  title: 'AIGC 工作台',
  description: 'AIGC 内容生成工作台',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${inter.variable} ${geistMono.variable} h-full dark antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preload" href={MATERIAL_SYMBOLS_URL} as="style" />
        <link href={MATERIAL_SYMBOLS_URL} rel="stylesheet" />
      </head>
      <body
        className="min-h-full bg-background text-on-surface"
        suppressHydrationWarning
      >
        <Script id="material-symbols-ready" strategy="beforeInteractive">
          {`(() => {
            var mark = function () { document.documentElement.classList.add('icons-ready'); };
            if (document.fonts && document.fonts.load) {
              Promise.all([
                document.fonts.load('400 24px "Material Symbols Outlined"'),
                document.fonts.ready,
              ]).then(mark).catch(mark);
            } else {
              mark();
            }
            setTimeout(mark, 3000);
          })();`}
        </Script>
        {children}
        <ToastHost />
      </body>
    </html>
  );
}
