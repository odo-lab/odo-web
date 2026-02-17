"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ id: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const fakeEmail = `${formData.id}@odo.com`;
      await signInWithEmailAndPassword(auth, fakeEmail, formData.password);
      checkUserAndRedirect(auth.currentUser!.uid, fakeEmail);
    } catch (err: any) {
      console.error("로그인 실패:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError("아이디 또는 비밀번호가 일치하지 않습니다.");
      } else {
        setError("로그인 중 오류가 발생했습니다.");
      }
      setLoading(false);
    }
  };

  const checkUserAndRedirect = async (uid: string, email: string) => {
    try {
      const storesRef = collection(db, "monitored_users");
      const q = query(storesRef, where("uid", "==", uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        router.push("/mypage");
        return;
      }

      const adminRef = doc(db, "admins", email);
      const adminSnap = await getDoc(adminRef);

      if (adminSnap.exists()) {
        router.push("/admin/dashboard");
        return;
      }

      alert("등록된 사용자 정보를 찾을 수 없습니다.");
      setLoading(false);
    } catch (err) {
      console.error("DB 조회 실패", err);
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: "calc(100vh - 200px)", // 푸터 높이를 제외한 만큼 최소 높이 설정
      display: "flex", 
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      position: "relative" // 자식 요소의 위치 기준점
    }}>
      
      {/* 1. 메인 로그인 카드 */}
      <div style={{ maxWidth: "400px", width: "90%", padding: "30px", background: "#1f2937", borderRadius: "12px", color: "white" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "30px", textAlign: "center" }}>로그인</h1>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: "#9ca3af" }}>아이디</label>
            <input 
              type="text" 
              placeholder="예: last.fm 닉네임" 
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              required
              style={inputStyle}
            />
          </div>
          
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: "#9ca3af" }}>비밀번호</label>
            <input 
              type="password" 
              placeholder="비밀번호" 
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              style={inputStyle}
            />
          </div>
          
          {error && <div style={{ color: "#ef4444", fontSize: "14px", textAlign: "center", background: "rgba(239, 68, 68, 0.1)", padding: "10px", borderRadius: "6px" }}>{error}</div>}

          <button 
            type="submit" 
            disabled={loading}
            style={{ ...buttonStyle, background: loading ? "#6b7280" : "#3b82f6" }}
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>
        
        <div style={{ marginTop: "20px", textAlign: "center", fontSize: "14px" }}>
          <Link href="/signup" style={{ color: "#60a5fa", textDecoration: "none" }}>계정이 없으신가요? 회원가입</Link>
        </div>
      </div>

      {/* 2. 핵심 부분: 기존 레이아웃 푸터 바로 위에 위치시키기 */}
      {/* 이 div는 로그인 페이지의 가장 하단에 놓이며, 음수 marginBottom을 사용하여 
          layout에 있는 푸터의 특정 위치(이메일 위)로 텍스트를 보냅니다. */}
      <div style={{ 
        position: "absolute",
        bottom: "-140px",  // 레이아웃 푸터의 높이에 맞춰 조절 (보통 120~160px 사이)
        right: "40px",     // 푸터 우측 여백과 맞춤
        textAlign: "right",
        zIndex: 10
      }}>
        <Link 
          href="/admin/login" 
          style={{ 
            color: "#4b5563", 
            fontSize: "11px", 
            textDecoration: "none", 
            opacity: 0.6,
            transition: "opacity 0.2s"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
        >
          Administrator Access
        </Link>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "12px", background: "#374151", border: "1px solid #4b5563", borderRadius: "6px", color: "white", outline: "none", fontSize: "15px"
};

const buttonStyle = {
  width: "100%", padding: "12px", border: "none", borderRadius: "6px", color: "white", fontWeight: "bold", fontSize: "15px", cursor: "pointer", transition: "opacity 0.2s"
};