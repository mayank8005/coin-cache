import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { getSessionUser } from "@/lib/session";
import { getPalette, paletteCssVars } from "@/constants/palettes";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coin Cache",
  description: "Private, local-first household budget.",
  manifest: "/manifest.webmanifest",
  applicationName: "Coin Cache",
  appleWebApp: {
    capable: true,
    title: "Coin Cache",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F2F0E6",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  const palette = getPalette(user?.paletteId);
  return (
    <html lang="en" data-palette={palette.id} style={paletteCssVars(palette)}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
