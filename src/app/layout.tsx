import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Additive Eyewear",
  description: "Plateforme e-commerce expérientielle pour lunettes sur mesure imprimées en 3D.",
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
