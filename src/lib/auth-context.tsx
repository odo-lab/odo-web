"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, User, signOut } from "firebase/auth"; // signOut 추가됨
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  role: string | null;
  loading: boolean;
  logout: () => Promise<void>; // ✅ 여기에 logout 함수 타입 정의 추가!
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  logout: async () => {}, // 초기값 추가
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ 로그아웃 함수 구현
  const logout = async () => {
    try {
      await signOut(auth);
      setRole(null); // 로그아웃 시 권한도 초기화
      setUser(null);
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
            setRole(null); 
          }

        } catch (error) {
          console.error("권한 확인 실패:", error);
          setRole(null);
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ✅ value에 logout 추가
  return (
    <AuthContext.Provider value={{ user, role, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);