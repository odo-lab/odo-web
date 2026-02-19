"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. 구글 로그인 핸들러
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // 구글 인증 성공 후, 우리 DB에 있는 사람인지 확인하러 감
      await checkUserAndRedirect(user.uid, user.email || "");

    } catch (err: any) {
      console.error("구글 로그인 실패:", err);
      setError("로그인 창이 닫혔거나 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  // 2. 유저 상태 확인 및 페이지 이동 (분기점)
  const checkUserAndRedirect = async (uid: string, email: string) => {
    try {
      // (1) 관리자 여부 먼저 확인
      if (email) {
        const adminRef = doc(db, "admins", email);
        const adminSnap = await getDoc(adminRef);
        if (adminSnap.exists()) {
          router.push("/admin/dashboard");
          return;
        }
      }

      // (2) 일반 매장(기존 회원) 확인
      const storesRef = collection(db, "monitored_users");
      const q = query(storesRef, where("uid", "==", uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // 이미 등록된 유저 -> 대시보드로 이동
        router.push("/mypage");
        return;
      }

      // (3) 관리자도 아니고, 매장도 아님 -> 신규 회원가입 필요!
      // 여기서 알림을 띄우거나 바로 회원가입 페이지로 보냅니다.
      // (이미 구글 인증은 된 상태이므로 /signup 페이지에서 auth.currentUser를 통해 정보를 가져다 쓰면 됩니다)
      if (confirm("등록된 매장 정보가 없습니다.\n회원가입 페이지로 이동하여 추가 정보를 입력하시겠습니까?")) {
         router.push("/signup"); 
      } else {
         // 가입 거절 시 로그아웃 처리
         await signOut(auth);
         setLoading(false);
      }

    } catch (err) {
      console.error("DB 조회 실패", err);
      setError("사용자 정보를 확인하는 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: "calc(100vh - 200px)", 
      display: "flex", 
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      position: "relative" 
    }}>
      
      {/* 메인 로그인 카드 */}
      <div style={{ 
        maxWidth: "400px", width: "90%", padding: "40px 30px", 
        background: "#1f2937", borderRadius: "16px", color: "white",
        boxShadow: "0 10px 25px rgba(0,0,0,0.3)", textAlign: "center"
      }}>
        
        {/* 로고나 타이틀 영역 */}
        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "10px" }}>ODO 로그인</h1>
        <p style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "40px" }}>
          매장 관리를 위해 로그인해 주세요.
        </p>

        {/* 구글 로그인 버튼 */}
        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            background: "white",
            color: "#1f2937",
            fontSize: "15px",
            fontWeight: "bold",
            cursor: loading ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            transition: "background 0.2s"
          }}
        >
          {loading ? (
             <span>🔄 확인 중...</span>
          ) : (
            <>
              {/* Google SVG Logo */}
              <svg width="20" height="20" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.715H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.159 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Google 계정으로 계속하기
            </>
          )}
        </button>

        {error && (
          <div style={{ marginTop: "20px", color: "#fca5a5", fontSize: "13px", background: "rgba(239,68,68,0.1)", padding: "10px", borderRadius: "6px" }}>
            {error}
          </div>
        )}
      </div>

      {/* 관리자 페이지 은밀한 접근 링크 */}
      <div style={{ 
        position: "absolute",
        bottom: "-140px",
        right: "40px",
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