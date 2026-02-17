"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import UserDashboard from "@/components/UserDashboard"; // 공용 컴포넌트

export default function MyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) return <div style={{ padding: 50, textAlign: "center", color: "#fff" }}>로딩 중...</div>;
  if (!user) return null;

  return (
    <section style={{ width: "100%", minHeight: "100vh", backgroundColor: "#000" }}>
      {/* 점주 본인의 UID를 넘겨줍니다 */}
      <UserDashboard targetId={user.uid} isAdmin={false} />
    </section>
  );
}