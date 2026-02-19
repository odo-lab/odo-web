"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

export default function SignUpPage() {
  const router = useRouter();
  
  // 구글 로그인된 유저 정보 저장
  const [googleUser, setGoogleUser] = useState<any>(null);

  // 입력 폼 (비밀번호 제거됨)
  const [formData, setFormData] = useState({
    id: "",           // Last.fm 아이디 (필수)
    storeName: "",
    ownerName: ""
  });
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. 페이지 로드 시 로그인 상태 확인
  // (로그인 안 된 상태로 주소 치고 들어오면 튕겨내기)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setGoogleUser(user);
        console.log("현재 로그인된 사용자:", user.email);
      } else {
        alert("로그인 정보가 없습니다. 로그인 페이지로 이동합니다.");
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleUser) return;

    setLoading(true);
    setError("");

    try {
      const docId = formData.id.trim(); // Last.fm ID를 문서 키로 사용
      
      // 2. 이미 등록된 Last.fm 아이디인지 체크 (중복 방지)
      const docRef = doc(db, "monitored_users", docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        // 이미 다른 UID가 등록되어 있다면 -> 사용 불가
        if (data.uid && data.uid !== googleUser.uid) {
            setError("이미 다른 사용자가 등록한 Last.fm 아이디입니다.");
            setLoading(false);
            return;
        }
        // UID가 없다면? (기존 데이터 마이그레이션) -> 내 걸로 가져오기 가능
      }

      // 3. Firestore DB에 매장 정보 저장
      // 비밀번호 저장 X, 대신 googleUser.uid와 email을 저장
      await setDoc(doc(db, "monitored_users", docId), {
        uid: googleUser.uid,            // 구글 UID (핵심 연결고리)
        email: googleUser.email,        // 구글 이메일
        lastfm_username: docId,         // 입력받은 Last.fm ID
        store_name: formData.storeName,
        owner_name: formData.ownerName,
        role: "user",
        active: true,
        created_at: new Date().toISOString(),
        franchise: "personal" 
      }, { merge: true });

      alert("매장 정보 등록이 완료되었습니다! 마이페이지로 이동합니다.");
      router.push("/mypage");

    } catch (err: any) {
      console.error("등록 에러:", err);
      setError("정보 등록 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  if (!googleUser) {
    return <div style={{ padding: 50, textAlign: "center", color: "white" }}>로딩 중...</div>;
  }

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", padding: "30px", background: "#1f2937", borderRadius: "12px", color: "white" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "10px", textAlign: "center" }}>
        추가 정보 입력
      </h1>
      <p style={{ textAlign: "center", color: "#9ca3af", marginBottom: "30px", fontSize: "14px" }}>
        안녕하세요, <span style={{color:"#fff", fontWeight:"bold"}}>{googleUser.displayName || "점주"}</span>님!<br/>
        서비스 이용을 위해 매장 정보를 입력해주세요.
      </p>

      <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        
        {/* 아이디 */}
        <div>
          <label style={{display:"block", marginBottom:"5px", fontSize:"14px", color:"#9ca3af"}}>Last.fm 아이디 <span style={{color:"#ef4444"}}>*</span></label>
          <input 
            type="text" 
            placeholder="예: hangyeol-7e" 
            value={formData.id}
            onChange={(e) => setFormData({...formData, id: e.target.value})}
            required
            style={inputStyle}
          />
          <p style={{fontSize:"11px", color:"#6b7280", marginTop:"4px"}}>* 실제 사용 중인 Last.fm 계정 아이디를 입력하세요.</p>
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

        {/* 이메일 (읽기 전용) */}
        <div>
           <label style={{display:"block", marginBottom:"5px", fontSize:"14px", color:"#9ca3af"}}>연동된 이메일</label>
           <input 
             type="text" 
             value={googleUser.email || ""} 
             disabled 
             style={{...inputStyle, background: "#333", color: "#888", cursor: "not-allowed"}} 
           />
        </div>

        {error && <div style={{ color: "#ef4444", fontSize: "14px", textAlign: "center", background: "rgba(239, 68, 68, 0.1)", padding: "10px", borderRadius: "6px" }}>{error}</div>}

        <button 
          type="submit" 
          disabled={loading}
          style={{ ...buttonStyle, background: loading ? "#6b7280" : "#3b82f6" }}
        >
          {loading ? "저장 중..." : "정보 등록 완료"}
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "12px", background: "#374151", border: "1px solid #4b5563", borderRadius: "6px", color: "white", outline: "none", fontSize: "15px"
};

const buttonStyle = {
  width: "100%", padding: "12px", border: "none", borderRadius: "6px", color: "white", fontWeight: "bold", fontSize: "15px", cursor: "pointer", transition: "opacity 0.2s"
};