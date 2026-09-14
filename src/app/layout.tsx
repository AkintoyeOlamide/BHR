import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bitachon HR | Your work review portal",
  description:
    "Sign in to Bitachon HR, complete your review, and track your progress in one simple place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased overflow-x-hidden">
      <body className="min-h-full overflow-x-hidden">{children}</body>
    </html>
  );
}
