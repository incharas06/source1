import type { Metadata } from "next";
import "./globals.css";
// app/layout.tsx  (or app/[locale]/layout.tsx)
import "leaflet/dist/leaflet.css";


export const metadata: Metadata = {
  title: {
    default: "VITAL",
    template: "%s | VITAL",
  },
  description:
    "VITAL (Village Issue Tracking & Action Link) — a rural governance issue reporting and resolution platform.",
  applicationName: "VITAL",
  keywords: ["VITAL", "Village", "Governance", "UBA", "Issue Tracking", "VVCE"],
  authors: [{ name: "VITAL Team" }],
  metadataBase: new URL("http://localhost:3000"),
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#16A34A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased">
        {children}
      </body>
    </html>
  );
}
