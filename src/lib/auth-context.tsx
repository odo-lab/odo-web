"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

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
  const router = useRouter();

  const logout = async () => {
    try {
      const targetPath = role === "admin" ? "/admin/login" : "/login";
      await signOut(auth);
      Cookies.remove("admin_logged_in");
      setRole(null);
      setUser(null);
      router.replace(targetPath); 
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // ✅ 중요: 유저 상태가 변할 때마다 DB 조회 전 로딩을 true로 걸어줍니다.
      setLoading(true); 
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
              Cookies.set("admin_logged_in", "true", { expires: 1 });
              setLoading(false);
              return; 
            }
          }

          // 2️⃣ 일반 매장(monitored_users) 확인
          const usersRef = collection(db, "monitored_users");
          const q = query(usersRef, where("uid", "==", currentUser.uid));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            setRole("user");
          } else {
            setRole(null); // 매장도 관리자도 아님 (신규 유저)
          }

        } catch (error) {
          console.error("권한 확인 실패:", error);
          setRole(null);
        }
      } else {
        setRole(null);
        Cookies.remove("admin_logged_in"); 
      }
      
      // ✅ 모든 처리가 끝나면 로딩 완료
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