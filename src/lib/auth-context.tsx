"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation"; // 👈 페이지 이동을 위해 추가
import Cookies from "js-cookie"; // 👈 쿠키 삭제를 위해 추가

interface AuthContextType {
  user: User | null;
  role: string | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // 👈 라우터 훅 사용

  // ✅ [수정됨] 완벽한 로그아웃 함수
  const logout = async () => {
    try {
      // 1. 파이어베이스 로그아웃
      await signOut(auth);
      
      // 2. 브라우저 쿠키(입장권) 파기 (이게 핵심!)
      Cookies.remove("admin_logged_in");

      // 3. 상태 초기화
      setRole(null);
      setUser(null);

      // 4. 로그인 페이지로 강제 이동
      router.replace("/admin/login"); 
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          // 1️⃣ 관리자(admins) 컬렉션 확인
          if (currentUser.email) {
            const adminRef = doc(db, "admins", currentUser.email);
            const adminSnap = await getDoc(adminRef);
            
            if (adminSnap.exists()) {
              const adminData = adminSnap.data();
              setRole(adminData.role || "admin");
              
              // 🍪 [추가됨] 관리자 확인 시 쿠키 발급 (미들웨어 통과용)
              Cookies.set("admin_logged_in", "true", { expires: 1 });
              
              setLoading(false);
              return; 
            }
          }

          // 2️⃣ 일반 매장(monitored_users) 확인
          // (일반 유저는 admin 쿠키를 굳이 구울 필요 없거나, 별도 처리)
          const usersRef = collection(db, "monitored_users");
          const q = query(usersRef, where("uid", "==", currentUser.uid));
          const querySnapshot = await getDocs(q); // getDocs 사용 (where 쿼리니까)

          if (!querySnapshot.empty) {
            setRole("user");
          } else {
            setRole(null); 
          }

        } catch (error) {
          console.error("권한 확인 실패:", error);
          setRole(null);
        }
      } else {
        // 유저가 없을 때 (로그아웃 상태 등)
        setRole(null);
        Cookies.remove("admin_logged_in"); // 확실하게 쿠키 제거
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);