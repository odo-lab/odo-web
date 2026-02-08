"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. [관리자] 이메일/비번으로 바로 로그인 (뒤에 @odo.com 안 붙임!)
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. 진짜 관리자인지 DB 확인 (보안 절차)
      // admins 컬렉션에서 해당 이메일 문서가 있는지 확인
      const adminRef = doc(db, "admins", user.email!); 
      const adminSnap = await getDoc(adminRef);

      if (adminSnap.exists()) {
        console.log("관리자 확인 완료");
        router.push("/admin/dashboard"); // 어드민 대시보드로 이동
      } else {
        // 로그인은 됐지만, 관리자 명단에 없는 경우 (일반 유저가 여기로 왔을 때)
        await auth.signOut(); // 로그아웃 시키기
        setError("관리자 권한이 없는 계정입니다.");
      }

    } catch (err: any) {
      console.error("관리자 로그인 실패:", err);
      setError("이메일 또는 비밀번호를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: "400px", padding: "40px", background: "#1f2937", borderRadius: "12px", border: "1px solid #374151" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "white", marginBottom: "10px", textAlign: "center" }}>
          관리자 로그인
        </h1>
        <p style={{ color: "#9ca3af", textAlign: "center", marginBottom: "30px", fontSize: "14px" }}>
          관리자 계정(이메일)으로 접속해주세요.
        </p>

        <form onSubmit={handleAdminLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          
          <div>
            <label style={{display:"block", marginBottom:"6px", fontSize:"14px", color:"#9ca3af"}}>이메일</label>
            <input 
              type="email" 
              placeholder="admin@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          
          <div>
            <label style={{display:"block", marginBottom:"6px", fontSize:"14px", color:"#9ca3af"}}>비밀번호</label>
            <input 
              type="password" 
              placeholder="비밀번호" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          
          {error && <div style={{ color: "#ef4444", fontSize: "14px", textAlign: "center", background: "rgba(239, 68, 68, 0.1)", padding: "10px", borderRadius: "6px" }}>{error}</div>}

          <button 
            type="submit" 
            disabled={loading}
            style={{ ...buttonStyle, background: loading ? "#4b5563" : "#f59e0b" }} // 관리자는 노란색/주황색 계열로 차별화
          >
            {loading ? "확인 중..." : "관리자 접속"}
          </button>
        </form>

        <div style={{ marginTop: "20px", textAlign: "center" }}>
           <a href="/login" style={{ fontSize: "13px", color: "#6b7280", textDecoration: "none" }}>← 점주님 로그인 페이지로 돌아가기</a>
        </div>
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