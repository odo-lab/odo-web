import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
// 👇 기존 UI 컴포넌트 import는 다 지우고, 이거 하나만 부릅니다.
import ClientLayout from "@/components/ClientLayout"; 

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          {/* 👇 여기서 ClientLayout이 "관리자냐 아니냐"를 판단해서 화면을 그려줍니다 */}
          <ClientLayout>
            {children}
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}