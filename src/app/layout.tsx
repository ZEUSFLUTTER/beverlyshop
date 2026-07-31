import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "BEVERLY SHOP — Gestion de Stock Commerce Général",
  description: "Système de gestion de stock et de ventes pour commerce général. Gérez vos articles, commerçants, attributions et réconciliations.",
  keywords: "gestion stock, ventes, commerce général, inventaire, commerçants",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
