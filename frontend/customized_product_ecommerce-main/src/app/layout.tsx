import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/Footer";
import { ToastProvider } from "@/contexts/ToastContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthInitializer } from "@/components/auth/AuthInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Custom School Stationary & Uniforms | Premium Quality Products",
    template: "%s | Custom Stationary Store"
  },
  description: "Discover our premium collection of customizable school stationary, uniforms, and educational products. High-quality materials with personalization options for schools and institutions.",
  keywords: "school stationary, custom uniforms, educational products, school supplies, personalized stationary, custom printing, school merchandise",
  authors: [{ name: "Custom Stationary Store" }],
  creator: "Custom Stationary Store",
  publisher: "Custom Stationary Store",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://yoursite.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://yoursite.com',
    siteName: 'Custom Stationary Store',
    title: 'Custom School Stationary & Uniforms | Premium Quality Products',
    description: 'Discover our premium collection of customizable school stationary, uniforms, and educational products.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Custom School Stationary Products',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Custom School Stationary & Uniforms',
    description: 'Premium quality customizable school products and uniforms.',
    images: ['/twitter-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Open+Sans:wght@400;600;700&family=Lato:wght@400;700&family=Montserrat:wght@400;600;700&family=Oswald:wght@400;600&family=Source+Sans+Pro:wght@400;600&family=Raleway:wght@400;600&family=PT+Sans:wght@400;700&family=Lora:wght@400;700&family=Merriweather:wght@400;700&family=Playfair+Display:wght@400;700&family=Poppins:wght@400;600&family=Nunito:wght@400;600&family=Ubuntu:wght@400;500&family=Crimson+Text:wght@400;600&family=Dancing+Script:wght@400;700&family=Pacifico&family=Lobster&family=Righteous&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <ToastProvider>
            <AuthInitializer />
            <Navigation />

            {children}
            
            <Footer />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
