import type { Metadata } from "next";
import "mapbox-gl/dist/mapbox-gl.css";

import "@/app/globals.css";
import { APP_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Map-first Bay Area commute monitoring for transit disruptions and traffic incidents."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
