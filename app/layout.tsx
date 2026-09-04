import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Printer Floor · Production Monitor",
  description:
    "Live production lot and progress monitoring across the 3D printer floor.",
};

export const viewport: Viewport = {
  themeColor: "#0a0e13",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
