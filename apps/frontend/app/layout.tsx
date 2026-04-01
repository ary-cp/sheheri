import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sheheri',
  description: 'Real anonymous stories about real places',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}