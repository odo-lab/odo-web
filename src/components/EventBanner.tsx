"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

type Banner = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;            // 클릭 시 이동할 외부 링크
  image: string;           // public/ 경로 또는 원격 URL
  bg?: string;             // 배경 그라데이션(옵션)
};

type Props = {
  items: Banner[];
  autoPlay?: boolean;
  intervalMs?: number;
  className?: string;
};

export default function EventBanner({
  items,
  autoPlay = true,
  intervalMs = 5000,
  className = "",
}: Props) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<number | null>(null);

  const count = items.length;

  const safeItems = useMemo(() => (Array.isArray(items) ? items : []), [items]);

  const go = (next: number) => {
    if (count <= 0) return;
    const n = (next + count) % count;
    setIdx(n);
  };

  const next = () => go(idx + 1);
  const prev = () => go(idx - 1);

  // autoplay
  useEffect(() => {
    if (!autoPlay || paused || count <= 1) return;

    timerRef.current = window.setInterval(() => {
      setIdx((v) => (v + 1) % count);
    }, intervalMs);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [autoPlay, paused, intervalMs, count]);

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  if (!safeItems.length) return null;

  const current = safeItems[idx];

  return (
    <section
      className={`eb ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="이벤트 배너"
    >
      <div className="ebShell" style={{ background: current.bg ?? undefined }}>
        {/* 클릭 영역: 기존처럼 외부 링크 이동 */}
        <a
          className="ebLink"
          href={current.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${current.title} 링크 열기`}
        >
          <div className="ebMedia">
            <Image
              src={current.image}
              alt={current.title}
              fill
              priority
              sizes="(max-width: 820px) 100vw, 1200px"
              style={{ objectFit: "cover" }}
            />
            <div className="ebOverlay" />
          </div>

          <div className="ebContent">
            <div className="ebTitle">{current.title}</div>
            {current.subtitle ? (
              <div className="ebSub">{current.subtitle}</div>
            ) : null}
          </div>
        </a>

        {/* Controls */}
        {count > 1 && (
          <>
            <button className="ebNav ebPrev" type="button" onClick={prev} aria-label="이전 배너">
              ⬅
            </button>
            <button className="ebNav ebNext" type="button" onClick={next} aria-label="다음 배너">
              ➡
            </button>

            <div className="ebDots" role="tablist" aria-label="배너 선택">
              {safeItems.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  className={`ebDot ${i === idx ? "isActive" : ""}`}
                  onClick={() => setIdx(i)}
                  aria-label={`${i + 1}번 배너`}
                  aria-current={i === idx}
                />
              ))}
            </div>

            {/* progress bar (autoplay 시각화) */}
            {autoPlay && !paused && (
              <div className="ebProgress" aria-hidden="true">
                <div
                  key={`${idx}-${paused}`}
                  className="ebProgressBar"
                  style={{ animationDuration: `${intervalMs}ms` }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
