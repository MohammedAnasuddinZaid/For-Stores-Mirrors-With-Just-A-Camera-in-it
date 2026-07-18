import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Virtual Try-On Mirror',
  description: 'Try on clothes, glasses, and accessories virtually using your camera',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
