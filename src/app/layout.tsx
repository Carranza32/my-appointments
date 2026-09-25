import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Open_Sans } from "next/font/google";
import Script from "next/script";
import "@/styles/globals.css";

const fontSans = Open_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fontHeading = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My Appointment",
  description: "SaaS de citas para profesionales",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          id="theme-loader"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className={`${fontSans.variable} ${fontHeading.variable} min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
