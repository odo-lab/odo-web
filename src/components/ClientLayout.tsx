"use client";

import { usePathname } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import MainLayout from "@/components/MainLayout";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // "/admin" 경로인지 확인
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    // 💡 핵심: 관리자는 MainLayout 없이 '쌩'으로 렌더링해야 여백이 사라짐!
    return <>{children}</>;
  }

  // 일반 유저는 기존 레이아웃 유지
  return (
    <>
      <SiteHeader />
      <MainLayout>
        {children}
      </MainLayout>
      <SiteFooter />
    </>
  );
}