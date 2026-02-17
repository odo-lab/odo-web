"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import styles from "./SiteHeader.module.css";

export default function SiteHeader() {
  const [open, setOpen] = useState(false); // 모바일 메뉴 오픈 상태
  const [hidden, setHidden] = useState(false); // 스크롤 시 헤더 숨김 상태
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const lastYRef = useRef(0);
  const tickingRef = useRef(false);

  const isActive = (href: string) => pathname === href;

  // ✅ 로고 클릭 핸들러: 홈이면 스크롤 업, 아니면 홈으로 이동
  const handleLogoClick = (e: React.MouseEvent) => {
    setOpen(false); // 메뉴가 열려있다면 닫기

    if (pathname === "/") {
      // 현재 홈 화면인 경우
      e.preventDefault(); // 기본 이동 동작 방지
      window.scrollTo({
        top: 0,
        behavior: "smooth", // 부드러운 스크롤 적용
      });
    }
    // 홈 화면이 아닌 경우는 <Link>의 기본 동작에 의해 "/"로 이동함
  };

  // 스크롤 감지 로직
  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY || 0;
      if (!tickingRef.current) {
        window.requestAnimationFrame(() => {
          const diff = currentY - lastYRef.current;
          
          if (currentY < 12) {
            setHidden(false);
          } else if (Math.abs(diff) > 8) {
            setHidden(diff > 0);
            if (diff > 0) setOpen(false); // 내릴 때 모바일 메뉴도 닫기
          }
          
          lastYRef.current = currentY;
          tickingRef.current = false;
        });
        tickingRef.current = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 로그인/로그아웃 버튼 렌더링
  const renderAuthButtons = () => {
    if (user) {
      return (
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Link href="/mypage" className={styles.btn}>마이페이지</Link>
          <button 
            onClick={() => { logout(); setOpen(false); }} 
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "12px", fontWeight: 700 }}
          >
            로그아웃
          </button>
        </div>
      );
    }

    return (
      <Link href="/login" className={`${styles.btn} ${styles.primary}`} onClick={() => setOpen(false)}>
        로그인
      </Link>
    );
  };

  return (
    <header className={`${styles.headerWrap} ${hidden ? styles.headerHidden : ""}`}>
      <div className={styles.headerBar}>
        <div className={styles.inner}>
          
          {/* 1. 로고 영역 - handleLogoClick 적용 */}
          <Link className={styles.brand} href="/" onClick={handleLogoClick}>
            <div className={styles.logo}>
              <Image src="/images/lp-blue.png" alt="ODO" width={28} height={28} priority />
            </div>
            <div className={styles.brandText}>
              <span className={styles.brandTop}>O.D.O</span>
              <span className={styles.brandSub}>하루종일 듣는 맞춤형 플레이리스트</span>
            </div>
          </Link>

          {/* 2. PC 네비게이션 */}
          <nav className={styles.nav}>
            <Link href="/howto" style={{ color: isActive("/howto") ? "#3b82f6" : undefined }}>이용 방법 / FAQ</Link>
            <Link href="/playlists" style={{ color: isActive("/playlists") ? "#3b82f6" : undefined }}>플레이리스트</Link>
            <a href="https://www.youtube.com/@Grapeskr/videos" target="_blank" rel="noopener noreferrer">음원 체험하기</a>
          </nav>

          {/* 3. 우측 영역 */}
          <div className={styles.right}>
            <div className={styles.pcOnlyAuth}>
              {renderAuthButtons()}
            </div>
            
            <button 
              className={styles.hamburger} 
              onClick={() => setOpen(!open)}
              aria-label="메뉴 열기"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 4. 모바일 플로팅 메뉴 */}
      {open && (
        <>
          <div className={styles.mobileDim} onClick={() => setOpen(false)} />
          <div className={styles.mobilePanel}>
            <Link href="/howto" onClick={() => setOpen(false)}>이용 방법 / FAQ</Link>
            <Link href="/playlists" onClick={() => setOpen(false)}>플레이리스트</Link>
            <a href="https://www.youtube.com/@Grapeskr/videos" target="_blank" rel="noopener noreferrer">음원 체험하기</a>
            <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.08)", margin: "8px 0" }} />
            <div style={{ padding: "8px 0" }}>
              {renderAuthButtons()}
            </div>
          </div>
        </>
      )}
    </header>
  );
}