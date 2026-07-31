import { Playfair_Display, DM_Sans } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

/**
 * Fonts via next/font — self-hosted at build time (no layout shift, no extra
 * network call). Exposed as CSS variables that tailwind.config.js maps to
 * font-display (headings) and font-sans (body), per the Sembly design system.
 */
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-playfair",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dmsans",
  display: "swap",
});

export const metadata = {
  title: "Edvora — No. 1 School Management System",
  description: "Premium school management for Nigerian private schools.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body suppressHydrationWarning>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: { borderRadius: "12px", background: "#14201A", color: "#fff", fontSize: "14px" },
            success: { iconTheme: { primary: "#E8A020", secondary: "#fff" } },
          }}
        />
      </body>
    </html>
  );
}
