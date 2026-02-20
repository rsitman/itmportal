import { Inter, Source_Code_Pro } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import ClientLayout from "@/components/ClientLayout";

const inter = Inter({ 
  variable: "--font-inter", 
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"]
});

const sourceCodePro = Source_Code_Pro({ 
  variable: "--font-source-code-pro", 
  subsets: ["latin"],
  display: "swap"
});

export const metadata = {
  title: 'Servisní portál',
  description: 'Servisní manažerský systém',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs">
      <body className={`${inter.variable} ${sourceCodePro.variable} antialiased font-sans`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}