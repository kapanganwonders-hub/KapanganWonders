import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from 'react-hot-toast';

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["latin"],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Kapangan Wonders - Discover the Beauty of Kapangan",
  description: "Explore the natural wonders, cultural heritage, and warm hospitality of Kapangan, Benguet. Your gateway to unforgettable adventures in the heart of the Philippines.",
  icons: {
    icon: "/icons/appicon.svg",
    apple: "/icons/appicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.className} antialiased border-4 border-black min-h-screen flex flex-col`}>
        <AuthProvider>
          <Navigation />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          <Toaster 
            position="bottom-right"
            toastOptions={{
              className: '!bg-white !text-gray-800 !border !border-gray-200 !shadow-lg',
              duration: 3000,
              style: {
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: 'white',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: 'white',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
