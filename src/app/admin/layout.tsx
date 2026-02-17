"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#111827" }}>
         {children}
      </div>
    );
  }

  const menuItems = [
    { name: "매장 통계", href: "/admin/dashboard", icon: "📊" },
    { name: "데이터 검증", href: "/admin/validator", icon: "🚨" },
    { name: "프랜차이즈 통계", href: "/admin/franchise", icon: "🏪" },
    { name: "환경설정", href: "/admin/settings", icon: "⚙️" },
  ];

  return (
    <div className="admin-container">
      {/* ⬛️ 사이드바 (고정됨) */}
      <aside className="admin-sidebar">
        
        <div className="sidebar-header">
          <h1 
            className="logo-text"
            onClick={() => router.push('/admin/dashboard')}
            style={{ cursor: 'pointer' }}
          >
            ODO Admin
          </h1>
          <button 
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            ☰
          </button>
        </div>

        <nav className={`sidebar-nav ${mobileMenuOpen ? "open" : ""}`}>
          <ul>
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`nav-link ${isActive ? "active" : ""}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>{item.icon}</span>
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* 底部 하단 영역: 메인 복귀 + 로그아웃 */}
        <div className="sidebar-footer">
          {/* 🏠 서비스 메인으로 돌아가는 버튼 */}
          <button 
            onClick={() => router.push('/')} 
            className="exit-btn"
            title="사용자 사이트로 이동"
          >
            <span style={{ fontSize: '14px' }}></span> 서비스 메인으로
          </button>

          <div className="logout-area">
            <button onClick={logout} className="logout-btn">
              로그아웃
            </button>
          </div>
        </div>
      </aside>

      {/* ⬜️ 메인 콘텐츠 */}
      <main className="admin-content">
        {children}
      </main>

      <style jsx>{`
        .admin-container {
          display: flex;
          min-height: 100vh;
          background-color: #f9fafb; /* 본문 배경을 살짝 밝은 회색으로 주면 더 고급짐 */
        }

        .admin-sidebar {
          width: 260px;
          background-color: #1f2937;
          color: white;
          display: flex;
          flex-direction: column;
          
          /* ✅ 사이드바 고정 핵심 로직 */
          position: fixed; 
          top: 0;
          left: 0;
          bottom: 0;
          z-index: 100;
        }

        .sidebar-header {
          padding: 24px;
          border-bottom: 1px solid #374151;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo-text {
          font-size: 20px;
          font-weight: bold;
          margin: 0;
          color: #f3f4f6;
        }

        .sidebar-nav {
          flex: 1;
          padding: 20px 10px;
          overflow-y: auto;
        }

        .sidebar-nav ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 15px;
          color: #9ca3af;
          text-decoration: none;
          transition: all 0.2s;
        }

        .nav-link:hover {
          color: white;
          background-color: rgba(255, 255, 255, 0.05);
        }

        .nav-link.active {
          color: #60a5fa;
          background-color: rgba(59, 130, 246, 0.1);
          font-weight: bold;
        }

        /* ✅ 하단 버튼 영역 스타일 */
        .sidebar-footer {
          padding: 16px;
          border-top: 1px solid #374151;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .exit-btn {
          width: 100%;
          padding: 12px;
          background-color: #374151;
          border: 1px solid #4b5563;
          border-radius: 8px;
          color: #e5e7eb;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .exit-btn:hover {
          background-color: #4b5563;
          border-color: #6b7280;
          color: white;
        }

        .logout-area {
          padding: 0;
        }

        .logout-btn {
          width: 100%;
          padding: 10px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 6px;
          color: #9ca3af;
          font-size: 13px;
          cursor: pointer;
          text-decoration: underline;
        }

        .logout-btn:hover {
          color: #ef4444;
        }

        .admin-content {
          flex: 1;
          /* ✅ 사이드바 너비만큼 왼쪽 마진을 주어 가려지지 않게 함 */
          margin-left: 260px; 
          padding: 0;
          min-height: 100vh;
        }

        .mobile-toggle { display: none; background: none; border: none; color: white; font-size: 24px; cursor: pointer; }

        @media (max-width: 768px) {
          .admin-sidebar {
            width: 100%;
            height: auto;
            position: relative; /* 모바일에서는 다시 풀어줌 */
          }
          .admin-content {
            margin-left: 0;
            min-height: auto;
          }
          .mobile-toggle { display: block; }
          .sidebar-nav { display: none; }
          .sidebar-nav.open { display: block; }
          .sidebar-footer { display: ${mobileMenuOpen ? 'flex' : 'none'}; }
        }
      `}</style>
    </div>
  );
}