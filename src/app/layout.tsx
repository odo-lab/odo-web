import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import ClientLayout from "@/components/ClientLayout"; 
import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // 👈 핀치 줌(손가락 확대) 방지
  themeColor: "#1f2937", // 👈 아이폰 상단 상태바 색상 (아까 배경색과 통일)
};

export const metadata = {
  title: "ODO - 매장용 플레이리스트",
  description: "점주 운영형 플레이리스트 선택 콘솔 (Prototype)",
  openGraph: {
    title: "ODO - 매장용 플레이리스트",
    description: "점주 운영형 플레이리스트 선택 콘솔 (Prototype)",
    type: "website",
    url: "https://onedayofmusic.com/odo.png",
    images: [
      {
        url: "https://onedayofmusic.com/odo.png",
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
    images: ["https://onedayofmusic.com/odo.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // 실제 사용하시는 고객센터 링크로 변경해주세요
  const customerServiceUrl = "https://your-customer-service-url.com"; 

  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          {/* 👇 여기서 ClientLayout이 "관리자냐 아니냐"를 판단해서 화면을 그려줍니다 */}
          <ClientLayout>
            {children}
          </ClientLayout>
        </AuthProvider>

        {/* 👇 우측 하단 고객센터 플로팅 버튼 추가 */}
        <a
          href="https://pf.kakao.com/_xeuxjxjn/chat" // 👈 실제 링크로 변경하세요
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            width: "56px",
            height: "56px",
            backgroundColor: "#2563EB", // 파란색 버튼 (필요시 변경 가능)
            color: "white",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
            zIndex: 9999, // 💡 다른 모든 요소보다 무조건 위에 오도록 설정
            textDecoration: "none",
            cursor: "pointer"
          }}
          aria-label="고객센터 문의하기"
        >
          {/* 말풍선 모양 SVG 아이콘 */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={1.5} 
            stroke="currentColor" 
            style={{ width: "28px", height: "28px" }}
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" 
            />
          </svg>
        </a>
      </body>
    </html>
  );
}