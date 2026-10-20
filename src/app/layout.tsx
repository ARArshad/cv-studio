import type { Metadata } from "next";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "CV Studio: build a professional CV in minutes", template: "%s · CV Studio" },
  description: "Write your CV right on the page, choose from forty professional templates including premium designs, and download a print ready PDF. Free, private, no sign up needed.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
