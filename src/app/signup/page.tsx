"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase"; 
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore"; 
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  
  // 입력받을 모든 데이터 상태 관리
  const [formData, setFormData] = useState({
    lastfmId: "",       // lastfm_username (문서 ID)
    storeName: "",      // store_name
    ownerName: "",      // owner_name
    franchise: "personal", // franchise (기본값: 개인)
    email: "",          // email (Auth & DB 저장용)
    password: "",       // 비밀번호
    confirmPassword: "" // 비밀번호 확인
  });
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 입력값 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // 1. 데이터 정리 (공백 제거)
    const cleanLastfmId = formData.lastfmId.trim();
    const cleanStoreName = formData.storeName.trim();
    const cleanOwnerName = formData.ownerName.trim();
    const cleanEmail = formData.email.trim();

    // 2. 유효성 검사 (빈칸 확인)
    if (!cleanLastfmId || !cleanStoreName || !cleanOwnerName || !cleanEmail || !formData.password) {
      setError("모든 정보를 입력해주세요.");
      setLoading(false);
      return;
    }

    // 3. 비밀번호 일치 확인 (필수 로직)
    if (formData.password !== formData.confirmPassword) {
      setError("비밀번호가 서로 일치하지 않습니다.");
      setLoading(false);
      return;
    }

    // 4. 비밀번호 길이 확인
    if (formData.password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      setLoading(false);
      return;
    }

    try {
      // 5. ID 중복 검사 (이미 등록된 매장인지?)
      const storeRef = doc(db, "monitored_users", cleanLastfmId);
      const storeSnap = await getDoc(storeRef);

      if (storeSnap.exists()) {
        throw new Error("❌ 이미 사용 중인 매장 ID(Last.fm ID)입니다. 다른 ID를 입력해주세요.");
      }

      // 6. Firebase Auth 계정 생성
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        cleanEmail, 
        formData.password
      );
      const user = userCredential.user;

      // 7. Firestore에 매장 정보 + 유저 정보 한 번에 저장
      // (보여주신 스크린샷 필드 구조 100% 반영)
      await setDoc(storeRef, {
        // 기존 매장 정보 필드들
        lastfm_username: cleanLastfmId, // ID
        store_name: cleanStoreName,     // 코카시안
        owner_name: cleanOwnerName,     // 신정훈
        franchise: formData.franchise,  // personal
        active: true,                   // 기본 활성
        created_at: new Date().toISOString(),

        // 추가되는 회원 정보 필드들
        uid: user.uid,                  // 사용자 코드 (Auth UID)
        email: cleanEmail,              // 이메일
        role: "user"                    // 역할
      });

      alert(`✅ [${cleanStoreName}] 등록이 완료되었습니다! 로그인 페이지로 이동합니다.`);
      router.push("/login"); 

    } catch (err: any) {
      console.error("가입 실패:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("이미 가입된 이메일 주소입니다.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "420px", margin: "60px auto", padding: "30px", background: "#1f2937", borderRadius: "12px", color: "white" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "30px", textAlign: "center" }}>
        점주님 회원가입
      </h1>
      
      <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {/* 섹션 1: 매장 정보 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: "#9ca3af" }}>매장 ID (Last.fm ID)</label>
            <input 
              name="lastfmId"
              type="text" 
              placeholder="예: Caucasian240" 
              value={formData.lastfmId}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: "#9ca3af" }}>매장명 (점포명)</label>
            <input 
              name="storeName"
              type="text" 
              placeholder="예: 코카시안" 
              value={formData.storeName}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: "#9ca3af" }}>점주님 성함</label>
              <input 
                name="ownerName"
                type="text" 
                placeholder="예: 신정훈" 
                value={formData.ownerName}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: "#9ca3af" }}>구분 (태그)</label>
              <select 
                name="franchise"
                value={formData.franchise}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="personal">개인 (personal)</option>
                <option value="seveneleven">세븐일레븐</option>
                <option value="grapes">그레이프스</option>
              </select>
            </div>
          </div>
        </div>

        <hr style={{ borderColor: "#374151", margin: "10px 0" }} />

        {/* 섹션 2: 계정 정보 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: "#9ca3af" }}>로그인 이메일</label>
            <input 
              name="email"
              type="email" 
              placeholder="example@grapes.my" 
              value={formData.email}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: "#9ca3af" }}>비밀번호</label>
            <input 
              name="password"
              type="password" 
              placeholder="6자리 이상" 
              value={formData.password}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: "#9ca3af" }}>비밀번호 확인</label>
            <input 
              name="confirmPassword"
              type="password" 
              placeholder="비밀번호를 다시 입력하세요" 
              value={formData.confirmPassword}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
        </div>

        {error && <div style={{ color: "#ef4444", fontSize: "14px", marginTop: "10px", textAlign: "center" }}>⚠️ {error}</div>}

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            marginTop: "10px",
            padding: "14px", 
            background: loading ? "#4b5563" : "#3b82f6", 
            color: "white", 
            border: "none", 
            borderRadius: "8px", 
            fontWeight: "bold",
            fontSize: "16px",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.2s"
          }}
        >
          {loading ? "가입 처리 중..." : "가입하기"}
        </button>
      </form>
    </div>
  );
}

// 스타일 객체 (재사용용)
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