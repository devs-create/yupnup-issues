import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

export const metadata: Metadata = {
  title: 'YupNup — Issue Tracker',
  description: 'Internal issue tracking for YupNup',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans bg-[#0f1117] text-slate-100 antialiased`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e2130',
              color: '#e2e8f0',
              border: '1px solid #2d3142',
              borderRadius: '10px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#0ea5e9', secondary: '#0f1117' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#0f1117' } },
          }}
        />
      </body>
    </html>
  );
}
