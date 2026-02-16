import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/index.css";

export const metadata: Metadata = {
  title: "ImmoNext - Real Estate Management Platform",
  description: "Modern real estate management platform for customers and properties",
  keywords: ["real estate", "property management", "immonext"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-background text-foreground min-h-screen">
        <div className="flex flex-col min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
