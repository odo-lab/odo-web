"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

// CSS module 사용 중이면 아래처럼 import
import styles from "./SiteHeader.module.css";

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const pathname = usePathname();

  const lastYRef = useRef(0);
  const tickingRef = useRef(false);

  const isActive = (href: string) => pathname === href;

  useEffect(() => {
    // 초기값
    lastYRef.current = window.scrollY || 0;

    const onScroll = () => {
      const currentY = window.scrollY || 0;

      // requestAnimationFrame으로 성능 최적화
      if (!tickingRef.current) {
        window.requestAnimationFrame(() => {
          const lastY = lastYRef.current;
          const diff = currentY - lastY;

          // 작은 흔들림 무시(트랙패드/모바일)
          const THRESHOLD = 8;

          // 상단 근처(예: 12px 이내)는 항상 보이기
          if (currentY < 12) {
            setHidden(false);
          } else if (Math.abs(diff) > THRESHOLD) {
            if (diff > 0) {
              // 아래로 스크롤 → 숨김
              setHidden(true);
              setOpen(false); // 모바일 메뉴 열려있으면 닫기
            } else {
              // 위로 스크롤 → 노출
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

  return (
    <header className={`${styles.header} ${hidden ? styles.headerHidden : ""}`}>
      <div className="container">
        <div className={styles.inner}>
       <Link className={styles.brand} href="/" onClick={() => setOpen(false)}>
  <div className={styles.logo}>
    <Image
      src="/images/lp-blue.png"
      alt="ODO"
      width={40}
      height={40}
      priority
    />
  </div>

  <div className={styles.brandText}>
    <div className={styles.brandTop}>O.D.O</div>
    <div className={styles.brandSub}>하루종일 듣는 맞춤형 플레이리스트  </div>
  </div>
</Link>
          {/* Main Navigation */}
          <nav className={styles.nav} aria-label="Main">
            <Link
              href="/test1"
              style={isActive("/test1") ? { color: "var(--text)", background: "rgba(255,255,255,.04)" } : undefined}
            >
              O.D.O 서비스란?
            </Link>
            <Link
              href="/faq"
              style={isActive("/faq") ? { color: "var(--text)", background: "rgba(255,255,255,.04)" } : undefined}
            >
              이용 방법 / FAQ
            </Link>
            <Link
              href="/playlists"
              style={isActive("/playlists") ? { color: "var(--text)", background: "rgba(255,255,255,.04)" } : undefined}
            >
              플레이리스트
            </Link>
            <Link href="/test2"style={isActive("/test2") ? { color: "var(--text)", background: "rgba(255,255,255,.04)" } : undefined}
            >LAST.FM 설치 가이드</Link>
              
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSf0yLS-x-d6LwdpYxA4G2k3V6xDYsAQR_rU13lNxZSwybKD6g/viewform"
              target="_blank"
              rel="noopener noreferrer"
            >
              신청하기
            </a>
          </nav>

          {/* Right Side */}
          <div className={styles.right}>
            {/* Mobile Hamburger */}
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

              {/* Mobile Overlay Menu */}
        {open && (
          <>
            {/* ✅ 뒤 배경 딤(투명도) */}
            <button
              type="button"
              className={styles.mobileDim}
              aria-label="메뉴 닫기"
              onClick={() => setOpen(false)}
            />

            {/* ✅ 메뉴 패널(겹쳐서 뜸) */}
            <div className={styles.mobilePanel} role="dialog" aria-modal="true">
              <Link href="/howto" onClick={() => setOpen(false)}>O.D.O 서비스란?</Link>
              <Link href="/help" onClick={() => setOpen(false)}>이용 방법 / FAQ</Link>
              <Link href="/playlists" onClick={() => setOpen(false)}>플레이리스트</Link>
              <Link href="/help" onClick={() => setOpen(false)}>LAST.FM 설치 가이드</Link>

              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSf0yLS-x-d6LwdpYxA4G2k3V6xDYsAQR_rU13lNxZSwybKD6g/viewform"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
              >
                신청하기
              </a>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
