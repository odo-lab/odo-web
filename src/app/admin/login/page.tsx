"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  
  // 1️⃣ 입력받을 상태를 'id'로 변경 (이메일 앞부분만 입력)
  const [id, setId] = useState(""); 
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 🚨 [설정] 관리자 이메일의 뒷부분 (도메인)
  // 예: 실제 계정이 'boss@music.com' 이라면 -> "@music.com" 입력
  const ADMIN_DOMAIN = "@odo.com"; 

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 2️⃣ 아이디 뒤에 도메인을 자동으로 붙여서 로그인 시도
      const fullEmail = id + ADMIN_DOMAIN;
      
      await signInWithEmailAndPassword(auth, fullEmail, password);
      
      // 로그인 성공 시 대시보드로 이동
      // (별도의 admins 컬렉션 확인 없이, 계정 정보만 맞으면 통과하도록 심플하게 변경)
      console.log("관리자 로그인 성공");
      router.push("/admin/dashboard");

    } catch (err: any) {
      console.error("관리자 로그인 실패:", err);
      setError("아이디 또는 비밀번호를 확인해주세요.");
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
          관리자 ID로 접속해주세요.
        </p>

        <form onSubmit={handleAdminLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          
          <div>
            <label style={{display:"block", marginBottom:"6px", fontSize:"14px", color:"#9ca3af"}}>관리자 ID</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input 
                  type="text" 
                  placeholder="admin" 
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  required
                  style={{ ...inputStyle, paddingRight: "100px" }} // 오른쪽 여백 확보
                />
                {/* 3️⃣ 도메인이 뒤에 붙는다는 걸 시각적으로 보여줌 */}
                <span style={{ 
                    position: "absolute", right: "15px", color: "#6b7280", 
                    fontSize: "14px", pointerEvents: "none" 
                }}>
                    {ADMIN_DOMAIN}
                </span>
            </div>
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
          
          {error && (
            <div style={{ 
                color: "#ef4444", fontSize: "14px", textAlign: "center", 
                background: "rgba(239, 68, 68, 0.1)", padding: "10px", borderRadius: "6px" 
            }}>
                {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            style={{ ...buttonStyle, background: loading ? "#4b5563" : "#f59e0b" }} 
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

// 스타일 (기존과 동일)
const inputStyle = {
  width: "100%", padding: "12px", background: "#374151", border: "1px solid #4b5563", borderRadius: "6px", color: "white", outline: "none", fontSize: "15px"
};

const buttonStyle = {
  width: "100%", padding: "12px", border: "none", borderRadius: "6px", color: "white", fontWeight: "bold", fontSize: "15px", cursor: "pointer", transition: "opacity 0.2s"
};