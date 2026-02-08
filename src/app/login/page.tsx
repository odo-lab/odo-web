"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  // 사용자는 'id'만 입력합니다. (이메일 아님)
  const [formData, setFormData] = useState({ id: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 🕵️‍♂️ [핵심] 아이디 뒤에 가짜 도메인을 붙여서 이메일 형식으로 만듭니다.
      const fakeEmail = `${formData.id}@odo.com`;

      // 1. Firebase Auth 로그인 시도
      await signInWithEmailAndPassword(auth, fakeEmail, formData.password);
      
      // 2. 로그인 성공 시, 매장 또는 관리자 정보 확인 후 이동
      checkUserAndRedirect(auth.currentUser!.uid, fakeEmail);

    } catch (err: any) {
      console.error("로그인 실패:", err);
      // Firebase 에러 코드를 사람이 읽기 좋게 변환
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
      // A. 일반 매장(User)인지 확인
      const storesRef = collection(db, "monitored_users");
      const q = query(storesRef, where("uid", "==", uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        console.log("매장 계정 확인됨");
        router.push("/mypage");
        return;
      }

      // B. 관리자(Admin)인지 확인 (매장이 없으면 여기를 체크)
      // 관리자는 이메일 자체가 문서 ID이므로 바로 조회
      const adminRef = doc(db, "admins", email);
      const adminSnap = await getDoc(adminRef);

      if (adminSnap.exists()) {
        console.log("관리자 계정 확인됨");
        router.push("/admin/dashboard");
        return;
      }

      // C. 둘 다 아니면 (DB에 정보가 없는 깡통 계정)
      alert("등록된 사용자 정보를 찾을 수 없습니다.");
      setLoading(false);

    } catch (err) {
      console.error("DB 조회 실패", err);
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "100px auto", padding: "30px", background: "#1f2937", borderRadius: "12px", color: "white" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "30px", textAlign: "center" }}>
        로그인
      </h1>

      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        
        {/* 아이디 입력 필드 */}
        <div>
            <label style={{display:"block", marginBottom:"6px", fontSize:"14px", color:"#9ca3af"}}>아이디</label>
            <input 
            type="text" 
            placeholder="예: hangyeol-7e" 
            value={formData.id}
            onChange={(e) => setFormData({...formData, id: e.target.value})}
            required
            style={inputStyle}
            />
        </div>
        
        {/* 비밀번호 입력 필드 */}
        <div>
            <label style={{display:"block", marginBottom:"6px", fontSize:"14px", color:"#9ca3af"}}>비밀번호</label>
            <input 
            type="password" 
            placeholder="비밀번호" 
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
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
        <a href="/signup" style={{ color: "#60a5fa", textDecoration: "none" }}>계정이 없으신가요? 회원가입</a>
      </div>
      <footer style={{
      position: "fixed",
      bottom: "20px",
      width: "100%",
      textAlign: "center"
    }}>
      <a 
        href="/admin/login" 
        style={{ color: "#4b5563", fontSize: "12px", textDecoration: "none" }}
      >
        Administrator Access
      </a>
    </footer>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "12px", background: "#374151", border: "1px solid #4b5563", borderRadius: "6px", color: "white", outline: "none", fontSize: "15px"
};

const buttonStyle = {
  width: "100%", padding: "12px", border: "none", borderRadius: "6px", color: "white", fontWeight: "bold", fontSize: "15px", cursor: "pointer", transition: "opacity 0.2s"
};