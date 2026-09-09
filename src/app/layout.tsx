import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import Navbar from '@/components/Navbar';
import IncomingRequestBanner from '@/components/IncomingRequestBanner';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'TimeBank of India 🇮🇳 | Peer-to-Peer Skill Learning & Knowledge Exchange',
  description: 'Your Time. Your Knowledge. Your Growth. Exchange skills using Time Credits instead of direct monetary payments across India.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased transition-colors duration-200">
        <AppProvider>
          <Navbar />
          <IncomingRequestBanner />
          <main className="flex-grow">{children}</main>
          <Footer />
        </AppProvider>
      </body>
    </html>
  );
}
