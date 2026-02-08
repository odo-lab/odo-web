"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  
  // 입력 폼 상태 (이메일 없음, 아이디만 있음)
  const [formData, setFormData] = useState({
    id: "",           // Last.fm 아이디
    password: "",
    confirmPassword: "",
    storeName: "",
    ownerName: ""
  });
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 1. 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("비밀번호는 6자리 이상이어야 합니다.");
      setLoading(false);
      return;
    }

    try {
      const docId = formData.id.trim(); // 공백 제거한 순수 아이디
      
      // 2. 이미 존재하는 아이디인지 DB에서 먼저 체크 (중복 방지)
      const docRef = doc(db, "monitored_users", docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // 이미 문서가 있는데 uid까지 있다면 -> 이미 가입된 계정
        if (docSnap.data().uid) {
            setError("이미 가입된 아이디입니다. 로그인해주세요.");
            setLoading(false);
            return;
        }
        // 문서는 있는데 uid가 없다면? -> 마이그레이션 대상자이므로 아래 로직 진행 (덮어쓰기)
      }

      // 3. [핵심] 아이디 + @odo.com 조합으로 Auth 계정 생성
      const fakeEmail = `${docId}@odo.com`;
      const userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, formData.password);
      const user = userCredential.user;

      // 4. Firestore DB에 매장 정보 저장 (또는 업데이트)
      // setDoc에 { merge: true } 옵션을 주어 기존 데이터가 있으면 유지하면서 uid만 추가
      await setDoc(doc(db, "monitored_users", docId), {
        uid: user.uid,
        email: fakeEmail,         // 시스템 관리용 이메일
        lastfm_username: docId,   // 순수 아이디
        store_name: formData.storeName,
        owner_name: formData.ownerName,
        role: "user",
        active: true,
        created_at: new Date().toISOString(),
        franchise: "personal"     // 기본값 (필요 시 선택박스로 변경 가능)
      }, { merge: true });

      alert("회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.");
      router.push("/login");

    } catch (err: any) {
      console.error("회원가입 에러:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError("이미 사용 중인 아이디입니다.");
      } else {
        setError("회원가입 중 오류가 발생했습니다. (" + err.message + ")");
      }
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", padding: "30px", background: "#1f2937", borderRadius: "12px", color: "white" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "30px", textAlign: "center" }}>
        매장 등록 (회원가입)
      </h1>

      <form onSubmit={handleSignUp} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        
        {/* 아이디 */}
        <div>
          <label style={{display:"block", marginBottom:"5px", fontSize:"14px", color:"#9ca3af"}}>아이디 (Last.fm ID)</label>
          <input 
            type="text" 
            placeholder="예: hangyeol-7e" 
            value={formData.id}
            onChange={(e) => setFormData({...formData, id: e.target.value})}
            required
            style={inputStyle}
          />
        </div>

        {/* 매장명 */}
        <div>
          <label style={{display:"block", marginBottom:"5px", fontSize:"14px", color:"#9ca3af"}}>매장명</label>
          <input 
            type="text" 
            placeholder="예: 세븐일레븐 대전한결점" 
            value={formData.storeName}
            onChange={(e) => setFormData({...formData, storeName: e.target.value})}
            required
            style={inputStyle}
          />
        </div>

        {/* 점주명 */}
        <div>
          <label style={{display:"block", marginBottom:"5px", fontSize:"14px", color:"#9ca3af"}}>점주명</label>
          <input 
            type="text" 
            placeholder="예: 홍길동" 
            value={formData.ownerName}
            onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
            required
            style={inputStyle}
          />
        </div>

        {/* 비밀번호 */}
        <div>
          <label style={{display:"block", marginBottom:"5px", fontSize:"14px", color:"#9ca3af"}}>비밀번호</label>
          <input 
            type="password" 
            placeholder="6자리 이상 입력" 
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
            style={inputStyle}
          />
        </div>

        {/* 비밀번호 확인 */}
        <div>
          <label style={{display:"block", marginBottom:"5px", fontSize:"14px", color:"#9ca3af"}}>비밀번호 확인</label>
          <input 
            type="password" 
            placeholder="비밀번호 다시 입력" 
            value={formData.confirmPassword}
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            required
            style={inputStyle}
          />
        </div>
        
        {error && <div style={{ color: "#ef4444", fontSize: "14px", textAlign: "center", background: "rgba(239, 68, 68, 0.1)", padding: "10px", borderRadius: "6px" }}>{error}</div>}

        <button 
          type="submit" 
          disabled={loading}
          style={{ ...buttonStyle, background: loading ? "#6b7280" : "#10b981" }}
        >
          {loading ? "등록 중..." : "매장 등록 완료"}
        </button>
      </form>

      <div style={{ marginTop: "20px", textAlign: "center", fontSize: "14px" }}>
        <a href="/login" style={{ color: "#60a5fa", textDecoration: "none" }}>이미 계정이 있으신가요? 로그인</a>
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