import "./globals.css";
import SiteHeader from "@/components/SiteHeader";

import SiteFooter from "@/components/SiteFooter";
export const metadata = {
  title: "ODO - 매장용 플레이리스트",
  description: "점주 운영형 플레이리스트 선택 콘솔 (Prototype)",

  openGraph: {
    title: "ODO - 매장용 플레이리스트",
    description: "점주 운영형 플레이리스트 선택 콘솔 (Prototype)",
    type: "website",
    url: "https://odo-next.vercel.app/odo.png",
    images: [
      {
        url: "https://odo-next.vercel.app/odo.png",
        width: 1200,
        height: 630,
        alt: "ODO",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "ODO - 매장용 플레이리스트",
    description: "점주 운영형 플레이리스트 선택 콘솔 (Prototype)",
    images: ["https://odo-next.vercel.app/odo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <SiteHeader />
        <main className="container main">{children}</main>
        
        <SiteFooter />
      </body>
    </html>
  );
}
