import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";
import Providers from "@/app/providers";
import CookieConsent from "@/components/common/cookie-consent";
import MarketingScripts from "@/components/common/marketing-scripts";
import WhatsAppFloat from "@/components/common/whatsapp-float";
import EmailCapturePopup from "@/components/common/email-capture-popup";
import SiteChatbot from "@/components/common/site-chatbot";
import { siteConfig } from "@/lib/site-config";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope"
});

const display = Cormorant_Garamond({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-display"
});

export const metadata = {
  metadataBase: new URL(siteConfig.domain),
  icons: {
    icon: "/images/logo/brand-logo.jpeg",
    shortcut: "/images/logo/brand-logo.jpeg",
    apple: "/images/logo/brand-logo.jpeg"
  },
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.domain,
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "website"
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${display.variable}`}>
        <Providers>
          <MarketingScripts />
          <SiteHeader />
          <div className="page-shell">{children}</div>
          <SiteFooter />
          <EmailCapturePopup />
          <CookieConsent />
          <WhatsAppFloat />
          <SiteChatbot />
        </Providers>
      </body>
    </html>
  );
}
