import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "LogWatch — Real-Time Log Monitoring",
    template: "%s | LogWatch"
  },
  description: "Production-grade Real-time AWS log monitoring dashboard.",
  keywords: ["logs", "monitoring", "AWS", "CloudWatch", "observability", "Next.js"],
  authors: [{ name: "Shiva", url: "https://github.com/Shiva-1432" }],
  openGraph: {
    title: "LogWatch",
    description: "Real-time AWS log monitoring dashboard",
    type: "website",
    siteName: "LogWatch"
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#0d0f14] text-[#e8ecf0]">
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
