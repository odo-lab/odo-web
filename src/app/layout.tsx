import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import MainLayout from "@/components/MainLayout"; // 👈 1. 새로 만든 컴포넌트 불러오기

export const metadata = {
  title: "ODO - 매장용 플레이리스트",
  description: "점주 운영형 플레이리스트 선택 콘솔 (Prototype)",
  // ... (기존 메타데이터 그대로 유지)
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          <SiteHeader />
          
          {/* 👇 2. 기존 <main className="container main"> 삭제하고 이걸로 교체! */}
          <MainLayout>
            {children}
          </MainLayout>
          
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}