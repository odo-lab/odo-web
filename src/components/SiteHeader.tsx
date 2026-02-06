"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import styles from "./SiteHeader.module.css";

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const lastYRef = useRef(0);
  const tickingRef = useRef(false);

  const isActive = (href: string) => pathname === href;

  useEffect(() => {
    lastYRef.current = window.scrollY || 0;

    const onScroll = () => {
      const currentY = window.scrollY || 0;

      if (!tickingRef.current) {
        window.requestAnimationFrame(() => {
          const lastY = lastYRef.current;
          const diff = currentY - lastY;
          const THRESHOLD = 8;

          if (currentY < 12) {
            setHidden(false);
          } else if (Math.abs(diff) > THRESHOLD) {
            if (diff > 0) {
              setHidden(true);
              setOpen(false);
            } else {
              setHidden(false);
            }
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

  // 로그인 상태에 따른 버튼 렌더링
  const renderAuthButtons = (isMobile = false) => {
    // ✅ 폰트 상속(inherit) 추가: Paperlogy 폰트 적용됨
    const commonStyle = {
      fontFamily: "inherit", 
      fontWeight: 500,
    };

    const linkStyle = isMobile
      ? { ...commonStyle, color: "#3b82f6", display: "block", marginBottom: "10px", fontSize: "16px" }
      : {
          ...commonStyle,
          padding: "8px 20px",
          fontSize: "15px",
          borderRadius: "6px",
          border: "1px solid rgba(255,255,255,0.2)",
          background: "rgba(255,255,255,0.1)",
          color: "white",
          transition: "all 0.2s",
          display: "inline-flex",
          alignItems: "center",
          height: "40px",
          whiteSpace: "nowrap" as const // 줄바꿈 방지
        };

    if (user) {
      return (
        <div style={isMobile ? { marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #eee" } : { display: "flex", gap: "12px", alignItems: "center" }}>
          <Link
            href="/mypage"
            onClick={() => setOpen(false)}
            style={isMobile ? linkStyle : { ...linkStyle, background: "#3b82f6", border: "none" }}
          >
            마이페이지
          </Link>
          <button
            onClick={() => {
              logout();
              setOpen(false);
            }}
            style={
              isMobile
                ? { ...commonStyle, background: "none", border: "none", fontSize: "16px", color: "#666", cursor: "pointer", padding: 0 }
                : { 
                    ...commonStyle,
                    background: "transparent", 
                    border: "none", 
                    color: "rgba(255,255,255,0.7)", 
                    fontSize: "14px", 
                    cursor: "pointer" 
                  }
            }
          >
            로그아웃
          </button>
        </div>
      );
    }

    return (
      <div style={isMobile ? { marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #eee" } : {}}>
        <Link
          href="/login"
          onClick={() => setOpen(false)}
          style={isMobile ? linkStyle : { ...linkStyle, background: "#3b82f6", border: "none" }}
        >
          로그인
        </Link>
      </div>
    );
  };

  return (
    <header className={styles.headerWrap}>
      <div className={`${styles.headerBar} ${hidden ? styles.headerHidden : ""}`}>
        
        {/* ✅ CSS 클래스 무시하고 강제로 전체 너비 적용 (maxWidth: none, width: 100%) */}
        <div className={styles.inner} style={{ maxWidth: "none", width: "100%", padding: "0 40px", display: "flex", alignItems: "center" }}>
          
          <Link className={styles.brand} href="/" onClick={() => setOpen(false)} style={{ flexShrink: 0 }}>
            <div className={styles.logo}>
              <Image src="/images/lp-blue.png" alt="ODO" width={40} height={40} priority />
            </div>
            <div className={styles.brandText}>
              <div className={styles.brandTop} style={{ fontFamily: "inherit" }}>O.D.O</div>
              <div className={styles.brandSub} style={{ fontFamily: "inherit" }}>하루종일 듣는 맞춤형 플레이리스트</div>
            </div>
          </Link>

          {/* Main Navigation (PC) */}
          <nav className={styles.nav} aria-label="Main" style={{ marginLeft: "40px" }}>
            <Link href="/landing" style={isActive("/landing") ? { color: "var(--text)", background: "rgba(255,255,255,.04)" } : undefined}>O.D.O 서비스란?</Link>
            <Link href="/howto" style={isActive("/howto") ? { color: "var(--text)", background: "rgba(255,255,255,.04)" } : undefined}>이용 방법 / FAQ</Link>
            <Link href="/playlists" style={isActive("/playlists") ? { color: "var(--text)", background: "rgba(255,255,255,.04)" } : undefined}>플레이리스트</Link>
            <a href="https://www.youtube.com/@Grapeskr/videos" target="_blank" rel="noopener noreferrer">음원 체험하기</a>
          </nav>

          {/* ✅ 로그인 버튼 그룹을 nav 밖으로 분리 -> marginLeft: auto로 우측 끝으로 밀기 */}
          <div className="pc-auth-group" style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
            {/* 화면 좁아지면 PC 버튼 숨기고 햄버거만 보이게 하는 CSS가 필요하지만, 일단 인라인으로 처리 */}
            <div style={{ display: "none" }} className={styles.pcOnlyAuth}> 
               {/* NOTE: styles.pcOnlyAuth 클래스가 없을 수 있으므로 아래 미디어쿼리 방식 대신 JS로 제어하거나 CSS 수정이 필요할 수 있습니다. 
                   하지만 일단 flex 구조상 햄버거와 겹치지 않게 배치합니다. */}
            </div>
            {/* PC 화면에서만 보이는 버튼 (화면 작아지면 CSS로 숨겨야 함. 여기서는 구조적으로만 우측 배치) */}
            <div className={styles.nav}> 
                {/* 기존 nav 클래스 스타일(숨김 처리 등)을 활용하기 위해 감쌈 */}
               {renderAuthButtons(false)}
            </div>
          </div>

          {/* Right Side (Mobile Hamburger) */}
          {/* 모바일에서는 버튼들이 사라지고 이 햄버거만 남습니다 (CSS에 의해) */}
          <div className={styles.right}>
            <button
              className={styles.hamburger}
              aria-label="메뉴 열기"
              onClick={() => setOpen((v) => !v)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          
        </div>
      </div>

      {/* Mobile Overlay Menu */}
      {open && (
        <>
          <button type="button" className={styles.mobileDim} aria-label="메뉴 닫기" onClick={() => setOpen(false)} />
          <div className={styles.mobilePanel} role="dialog" aria-modal="true">
            <Link href="/landing" onClick={() => setOpen(false)}>O.D.O 서비스란?</Link>
            <Link href="/howto" onClick={() => setOpen(false)}>이용 방법 / FAQ</Link>
            <Link href="/playlists" onClick={() => setOpen(false)}>플레이리스트</Link>
            <a href="https://www.youtube.com/@Grapeskr/videos" target="_blank" rel="noopener noreferrer">음원 체험하기</a>
            
            {/* 로그인 버튼 (모바일) */}
            {renderAuthButtons(true)}
          </div>
        </>
      )}
    </header>
  );
}