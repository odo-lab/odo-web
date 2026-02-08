"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { updatePassword } from "firebase/auth";

export default function SetupPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 로그인 안 했으면 쫓아내기
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);
    setIsSaving(true);

    // 1. 유효성 검사
    if (password.length < 6) {
      setMessage("비밀번호는 최소 6자 이상이어야 합니다.");
      setIsError(true);
      setIsSaving(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage("비밀번호가 서로 일치하지 않습니다.");
      setIsError(true);
      setIsSaving(false);
      return;
    }

    if (!user) return;

    try {
      // 2. Firebase 비밀번호 업데이트 함수 호출
      await updatePassword(user, password);
      
      setMessage("✅ 비밀번호가 성공적으로 변경되었습니다.");
      setIsError(false);
      
      // 3. 잠시 후 대시보드로 이동
      setTimeout(() => {
        router.push("/mypage");
      }, 1500);

    } catch (error: any) {
      console.error("비밀번호 변경 오류:", error);
      setIsError(true);
      
      // 보안상 재로그인이 필요한 경우 처리
      if (error.code === 'auth/requires-recent-login') {
        setMessage("보안을 위해 다시 로그인한 후 시도해주세요.");
      } else {
        setMessage("비밀번호 변경 중 오류가 발생했습니다.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "#111", 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      padding: "20px" 
    }}>
      <div style={{ 
        width: "100%", 
        maxWidth: "400px", 
        background: "#1f2937", 
        padding: "30px", 
        borderRadius: "12px", 
        border: "1px solid #374151" 
      }}>
        <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
          {/* 뒤로가기 버튼 */}
          <button 
            onClick={() => router.back()}
            style={{ 
              background: "none", 
              border: "none", 
              color: "#aaa", 
              cursor: "pointer", 
              padding: "5px",
              display: "flex",
              alignItems: "center"
            }}
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 style={{ fontSize: "20px", fontWeight: "bold", color: "white", margin: 0 }}>
            환경설정
          </h1>
        </div>

        <h2 style={{ fontSize: "16px", color: "#e5e7eb", marginBottom: "20px", borderBottom: "1px solid #374151", paddingBottom: "10px" }}>
          비밀번호 변경
        </h2>

        <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          
          <div>
            <label style={{ display: "block", fontSize: "14px", color: "#9ca3af", marginBottom: "6px" }}>새 비밀번호</label>
            <input 
              type="password" 
              placeholder="6자 이상 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "14px", color: "#9ca3af", marginBottom: "6px" }}>새 비밀번호 확인</label>
            <input 
              type="password" 
              placeholder="한 번 더 입력"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* 메시지 출력 영역 */}
          {message && (
            <div style={{ 
              padding: "10px", 
              borderRadius: "6px", 
              fontSize: "14px", 
              textAlign: "center",
              background: isError ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)",
              color: isError ? "#ef4444" : "#10b981"
            }}>
              {message}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSaving}
            style={{ 
              marginTop: "10px",
              width: "100%", 
              padding: "12px", 
              background: isSaving ? "#4b5563" : "#3b82f6", 
              color: "white", 
              border: "none", 
              borderRadius: "6px", 
              fontWeight: "bold", 
              cursor: isSaving ? "default" : "pointer",
              transition: "background 0.2s"
            }}
          >
            {isSaving ? "변경 중..." : "변경하기"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", 
  padding: "12px", 
  background: "#374151", 
  border: "1px solid #4b5563", 
  borderRadius: "6px", 
  color: "white", 
  outline: "none", 
  fontSize: "15px"
};