// src/lib/auth-context.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut as firebaseSignOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

// 유저 권한 타입 정의 (admin, user, super 등)
type UserRole = "admin" | "user" | "super" | null;

interface AuthContextType {
  user: User | null;
  role: UserRole;
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
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Firebase 로그인 상태 감지 리스너
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // 로그인했다면 DB에서 '권한(role)' 가져오기
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setRole(userDoc.data().role as UserRole);
          } else {
            setRole("user"); // DB에 정보 없으면 기본 'user'로 취급
          }
        } catch (error) {
          console.error("권한 가져오기 실패:", error);
          setRole("user");
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await firebaseSignOut(auth);
    router.push("/"); // 로그아웃 후 메인으로 이동
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 다른 컴포넌트에서 쉽게 쓰기 위한 커스텀 훅
export const useAuth = () => useContext(AuthContext);