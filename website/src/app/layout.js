import { Playfair_Display, Inter, Great_Vibes } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: {
    default: "Antico Ristoranté | Fine Italian Dining in Sault Ste. Marie",
    template: "%s | Antico Ristoranté",
  },
  description: "Experience authentic Italian cuisine crafted by Chef Arturo Comegna. Antico Ristoranté offers an intimate fine dining experience in Sault Ste. Marie, Ontario.",
  keywords: ["Antico", "Italian restaurant", "fine dining", "Sault Ste Marie", "Chef Arturo", "reservations", "Ontario dining"],
  authors: [{ name: "Antigravity Solutions" }],
  openGraph: {
    type: "website",
    locale: "en_CA",
    siteName: "Antico Ristoranté",
    title: "Antico Ristoranté | Fine Italian Dining",
    description: "Authentic Italian cuisine by Chef Arturo Comegna in Sault Ste. Marie, Ontario. Reserve your unforgettable evening.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Antico Ristoranté | Fine Italian Dining",
    description: "Authentic Italian cuisine by Chef Arturo Comegna in Sault Ste. Marie.",
  },
  metadataBase: new URL("https://anticorestaurant.ca"),
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${inter.variable} ${greatVibes.variable}`}>
        {children}
      </body>
    </html>
  );
}
