import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Web Logger Demo',
  description: 'Demo application for @cp949/web-logger and @cp949/web-logger-react',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
