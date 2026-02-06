// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css"; // 스타일 파일이 없다면 일단 제외해도 됩니다.

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 로그인 처리 함수
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. 단순 아이디 입력 시 이메일 형식으로 자동 변환 (편의 기능)
      let loginEmail = email;
      if (!email.includes("@")) {
        loginEmail = `${email}@odo.com`; // 예: admin -> admin@odo.com
      }

      // 2. Firebase 로그인 요청
      await signInWithEmailAndPassword(auth, loginEmail, password);
      
      // 3. 성공 시 메인으로 이동 (또는 마이페이지)
      // AuthContext가 자동으로 상태를 감지하므로 리다이렉트만 하면 됨
      router.push("/"); 
      
    } catch (err: any) {
      console.error("로그인 실패:", err);
      // 에러 메시지 사용자 친화적으로 변환
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found") {
        setError("아이디 또는 비밀번호가 올바르지 않습니다.");
      } else if (err.code === "auth/too-many-requests") {
        setError("너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.");
      } else {
        setError("로그인 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card auth-wrap" style={{ maxWidth: 400, margin: "40px auto" }}>
      <h3 className="section-title" style={{ marginBottom: 20, textAlign: "center" }}>
        로그인
      </h3>

      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="field">
          <label style={{ fontWeight: 500, marginBottom: 4, display: "block" }}>아이디 (또는 이메일)</label>
          <input
            className="input"
            type="text"
            placeholder="admin 또는 user@odo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: "10px", borderRadius: 6, border: "1px solid #ddd" }}
          />
        </div>

        <div className="field">
          <label style={{ fontWeight: 500, marginBottom: 4, display: "block" }}>비밀번호</label>
          <input
            className="input"
            type="password"
            placeholder="비밀번호 입력"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "10px", borderRadius: 6, border: "1px solid #ddd" }}
          />
        </div>

        {error && (
          <p style={{ color: "#e74c3c", fontSize: 14, textAlign: "center", margin: 0 }}>
            {error}
          </p>
        )}

        <button
          className="btn btn-primary"
          type="submit"
          disabled={loading}
          style={{
            marginTop: 10,
            padding: "12px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 600
          }}
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>

      <div style={{ marginTop: 20, textAlign: "center", fontSize: 14, color: "#666" }}>
        계정이 없으신가요? <Link href="/signup" style={{ color: "#3b82f6", textDecoration: "underline" }}>회원가입</Link>
      </div>
    </section>
  );
}