"use client";

import { usePathname } from "next/navigation";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // 마이페이지(/mypage)에서는 container 클래스를 제거해서 전체 너비를 쓰게 함
  // 다른 페이지(랜딩, 이용방법 등)는 여전히 container를 유지
  const isFullWidth = pathname === "/mypage";

  return (
    <main className={isFullWidth ? "main" : "container main"}>
      {children}
    </main>
  );
}