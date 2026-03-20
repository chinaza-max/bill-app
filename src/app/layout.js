import localFont from "next/font/local";
import "./globals.css";
import Providers from "./providers";
import ProvidersRedux from "./providers-redux";
import { Toaster } from "sonner";
import LocationProvider from "./component/LocationProvider";
import NotificationManager from "@/components/NotificationManager.jsx";
import CallLayout from "@/components/call/CallLayout"; // ← new import

// ── remove these two lines entirely ──
// import { CallProvider } from "@/components/call/CallProvider";
// import { io } from "socket.io-client";
// const layoutSocket = io("https://fidopoint.onrender.com");

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
const APP_DEFAULT_TITLE = "Fido PWA App";
const APP_TITLE_TEMPLATE = "%s - PWA App";
const APP_DESCRIPTION = "Best p2p app";

export const metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Toaster position="top-right" richColors />
        <NotificationManager />
        <ProvidersRedux>
          <CallLayout>           {/* ← replaces CallProvider + socket */}
            <Providers>
              <LocationProvider>
                {children}
              </LocationProvider>
            </Providers>
          </CallLayout>
        </ProvidersRedux>
      </body>
    </html>
  );
}