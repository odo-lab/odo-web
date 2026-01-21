"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

import styles from "./SiteHeader.module.css";

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const pathname = usePathname();

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

  return (
    <header className={styles.headerWrap}>
      {/* ✅ 블러/애니메이션은 이 Bar에서만 */}
      <div className={`${styles.headerBar} ${hidden ? styles.headerHidden : ""}`}>
        <div className="container">
          <div className={styles.inner}>
            <Link className={styles.brand} href="/" onClick={() => setOpen(false)}>
              <div className={styles.logo}>
                <Image src="/images/lp-blue.png" alt="ODO" width={40} height={40} priority />
              </div>

              <div className={styles.brandText}>
                <div className={styles.brandTop}>O.D.O</div>
                <div className={styles.brandSub}>하루종일 듣는 맞춤형 플레이리스트</div>
              </div>
            </Link>

            {/* Main Navigation */}
            <nav className={styles.nav} aria-label="Main">
              <Link
                href="/landing"
                style={
                  isActive("/landing")
                    ? { color: "var(--text)", background: "rgba(255,255,255,.04)" }
                    : undefined
                }
              >
                O.D.O 서비스란?
              </Link>

              <Link
                href="/howto"
                style={
                  isActive("/howto")
                    ? { color: "var(--text)", background: "rgba(255,255,255,.04)" }
                    : undefined
                }
              >
                이용 방법 / FAQ
              </Link>

              <Link
                href="/playlists"
                style={
                  isActive("/playlists")
                    ? { color: "var(--text)", background: "rgba(255,255,255,.04)" }
                    : undefined
                }
              >
                플레이리스트
              </Link>

              <a href="https://www.youtube.com/@Grapeskr/videos" target="_blank" rel="noopener noreferrer">
                음원 체험하기
              </a>

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
              <button
                className={styles.hamburger}
                aria-label="메뉴 열기"
                onClick={() => setOpen((v) => !v)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 7h16M4 12h16M4 17h16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Mobile Overlay Menu: headerBar 밖(형제)로 빼기 */}
      {open && (
        <>
          <button
            type="button"
            className={styles.mobileDim}
            aria-label="메뉴 닫기"
            onClick={() => setOpen(false)}
          />

          <div className={styles.mobilePanel} role="dialog" aria-modal="true">
            <Link href="/landing" onClick={() => setOpen(false)}>
              O.D.O 서비스란?
            </Link>
            <Link href="/howto" onClick={() => setOpen(false)}>
              이용 방법 / FAQ
            </Link>
            <Link href="/playlists" onClick={() => setOpen(false)}>
              플레이리스트
            </Link>
            <a href="https://www.youtube.com/@Grapeskr/videos" target="_blank" rel="noopener noreferrer">
              음원 체험하기
            </a>
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
    </header>
  );
}
