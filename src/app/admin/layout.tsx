"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 🕵️‍♂️ [추가된 로직] 현재 페이지가 로그인 페이지인지 확인
  const isLoginPage = pathname === "/admin/login";

  // ✅ 로그인 페이지라면? 사이드바 없이 내용물(로그인 폼)만 쌩으로 보여줍니다.
  if (isLoginPage) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#111827" }}>
         {children}
      </div>
    );
  }

  // 👇 로그인 페이지가 아닐 때만 아래 사이드바 레이아웃을 렌더링합니다.
  const menuItems = [
    { name: "매장 통계", href: "/admin/dashboard", icon: "📊" },
    { name: "곡별 통계", href: "/admin/songs", icon: "🎵" },
    { name: "미청취 매장", href: "/admin/inactive", icon: "⚠️" },
    { name: "환경설정", href: "/admin/settings", icon: "⚙️" },
  ];

  return (
    <div className="admin-container">
      {/* ⬛️ 사이드바 */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h1 className="logo-text">ODO Admin</h1>
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
          
          <div className="logout-area">
            <button onClick={logout} className="logout-btn">
              로그아웃
            </button>
          </div>
        </nav>
      </aside>

      {/* ⬜️ 메인 콘텐츠 */}
      <main className="admin-content">
        {children}
      </main>

      {/* 🎨 스타일 (CSS-in-JS) */}
      <style jsx>{`
        .admin-container {
          display: flex;
          min-height: 100vh;
          background-color: #ffffff;
        }

        .admin-sidebar {
          width: 260px;
          background-color: #1f2937;
          color: white;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          transition: all 0.3s;
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
        }

        .mobile-toggle {
          display: none;
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
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

        .sidebar-nav li {
          margin-bottom: 5px;
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

        .logout-area {
          padding: 20px;
          border-top: 1px solid #374151;
        }

        .logout-btn {
          width: 100%;
          padding: 10px;
          background: transparent;
          border: 1px solid #4b5563;
          border-radius: 6px;
          color: #9ca3af;
          cursor: pointer;
        }

        .admin-content {
          flex: 1;
          overflow-y: auto;
          padding: 0;
        }

        @media (max-width: 768px) {
          .admin-container {
            flex-direction: column;
          }

          .admin-sidebar {
            width: 100%;
            height: auto;
          }

          .mobile-toggle {
            display: block;
          }

          .sidebar-nav {
            display: none;
            padding: 0;
          }

          .sidebar-nav.open {
            display: block;
            padding: 10px;
            border-bottom: 1px solid #374151;
          }
          
          .admin-content {
             min-height: calc(100vh - 80px); 
          }
        }
      `}</style>
    </div>
  );
}