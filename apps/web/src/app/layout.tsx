import type { Metadata } from "next";
import { AppNavigation } from '@/components/features/AppNavigation';
import { ToastProvider } from '@/components/ui';
import "../styles/index.css";

export const metadata: Metadata = {
  title: "ImmoNext - Real Estate Management Platform",
  description: "Modern real estate management platform for customers and properties",
  keywords: ["real estate", "property management", "immonext"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-background text-foreground min-h-screen">
        <ToastProvider>
          <div className="min-h-screen bg-background">
            {/* Navigation Bar */}
            <AppNavigation />

            {/* Main Content */}
            <main className="w-full">
              {children}
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
