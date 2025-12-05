import "@/styles/globals.css"
import { Inter } from "next/font/google"
import type React from "react"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster position="top-center" expand={true} richColors closeButton />
      </body>
    </html>
  )
}

export const metadata = {
  title: {
    default: "Fleet Management System",
    template: "%s | Fleet Management",
  },
  description:
    "Enterprise-grade fleet management system for trucks, cars, and bikes with booking workflow and operations tracking.",
  keywords: ["fleet management", "vehicle tracking", "booking system", "operations management", "logistics"],
  authors: [{ name: "Fleet Management Team" }],
  creator: "Fleet Management Team",
  publisher: "Fleet Management Team",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Fleet Management System",
    description:
      "Enterprise-grade fleet management system for trucks, cars, and bikes with booking workflow and operations tracking.",
    siteName: "Fleet Management",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fleet Management System",
    description:
      "Enterprise-grade fleet management system for trucks, cars, and bikes with booking workflow and operations tracking.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  generator: "Next.js",
}
