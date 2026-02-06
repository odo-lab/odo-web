// src/app/mypage/page.tsx
"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import AdminDashboard from "@/components/AdminDashboard";

function UserDashboard({ userId }: { userId: string }) {
  // 일반 유저는 기존처럼 좁은 폭(800px) 유지
  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 20px" }}>
      <div className="card">
        <h2 className="section-title">내 매장 관리</h2>
        <p>안녕하세요, {userId} 점주님!</p>
        <p>여기서 우리 매장의 플레이리스트 현황을 확인하실 수 있습니다.</p>
      </div>
    </div>
  );
}

export default function MyPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) return <div style={{ padding: 50, textAlign: "center", color: "#fff" }}>로딩 중...</div>;
  if (!user) return null;

  const isAdmin = role === "admin" || role === "super";

  return (
    // ✅ 여기가 핵심 수정 포인트!
    // 관리자(isAdmin)면 width: 100%로 꽉 채우고, 아니면 기존 스타일 유지
    <section style={isAdmin ? { 
      width: "100%", 
      padding: 0, 
      margin: 0,
      maxWidth: "none" // 상위 컨테이너 제약 무시 시도
    } : { 
      width: "100%",
      paddingTop: 40 
    }}>
      {isAdmin ? (
        <AdminDashboard /> 
      ) : (
        <UserDashboard userId={user.email?.split("@")[0] || "점주"} />
      )}
    </section>
  );
}