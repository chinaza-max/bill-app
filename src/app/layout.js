import localFont from "next/font/local";
import "./globals.css";
import Providers from "./providers";
import ProvidersRedux from "./providers-redux";
import { Toaster } from "sonner";
import LocationProvider from "./component/LocationProvider";
import NotificationManager from "@/components/NotificationManager.jsx";
import CallLayout from "@/components/call/CallLayout";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const APP_NAME = "Fidopoint";
const APP_DEFAULT_TITLE = "Fidopoint — Cash, Anytime, Anywhere";
const APP_TITLE_TEMPLATE = "%s | Fidopoint";
const APP_DESCRIPTION =
  "Fidopoint connects people who need cash with verified nearby providers in real time — no ATM queues, no POS uncertainty.";

export const metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",

  // ── Favicon / icons ──────────────────────────────────────────────
  // Place these files directly inside your /app directory:
  //   app/favicon.ico        → browser tab icon (fallback)
  //   app/icon.png           → 32×32 or 192×192 PNG icon
  //   app/apple-icon.png     → 180×180 PNG for iOS home screen
  //
  // Next.js auto-detects them — no extra config needed for those.
  // The block below is only if you want explicit control or extra sizes:
  icons: {
    icon: [
      { url: "/icon-192x192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512x512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/icon-192x192.png", sizes: "180x180" }],
    shortcut: "/favicon.ico",
  },
  // ─────────────────────────────────────────────────────────────────

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
};

export const viewport = {
  themeColor: "#FFFFFF",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Toaster position="top-right" richColors />
        <NotificationManager />
        <ProvidersRedux>
          <CallLayout>
            <Providers>
              <LocationProvider>{children}</LocationProvider>
            </Providers>
          </CallLayout>
        </ProvidersRedux>
      </body>
    </html>
  );
}