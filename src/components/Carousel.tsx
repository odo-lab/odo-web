"use client";

import { useRef } from "react";

export default function Carousel({
  children,
  ariaLabel,
}: {
  children: React.ReactNode;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  const s = useRef({
    isDown: false,
    isDragging: false,
    startX: 0,
    startLeft: 0,
    pointerId: -1,
    blockClickUntil: 0,
  });

  const DRAG_THRESHOLD = 10; // 클릭 흔들림 방지용

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;

    if (e.pointerType === "mouse" && e.button !== 0) return;

    s.current.isDown = true;
    s.current.isDragging = false;
    s.current.pointerId = e.pointerId;
    s.current.startX = e.clientX;
    s.current.startLeft = el.scrollLeft;

    el.style.cursor = "grab";
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || !s.current.isDown) return;

    const dx = e.clientX - s.current.startX;

    // ✅ 임계값 넘기기 전에는 "클릭"로 유지 (링크 클릭 살아있음)
    if (!s.current.isDragging) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return;

      // ✅ 여기서부터 "드래그"로 전환
      s.current.isDragging = true;

      // ✅ 드래그가 시작된 순간에만 pointer capture
      try {
        el.setPointerCapture(s.current.pointerId);
      } catch {}

      // ✅ 드래그 중 스냅 끄면 덜 끊김
      el.style.scrollSnapType = "none";
      el.style.cursor = "grabbing";
    }

    // 드래그 스크롤
    const speed = 1.15;
    el.scrollLeft = s.current.startLeft - dx * speed;
  };

  const end = () => {
    const el = ref.current;
    if (!el) return;

    // 드래그였으면 "바로 직후 클릭"만 막기
    if (s.current.isDragging) {
      s.current.blockClickUntil = Date.now() + 250;
    }

    // 스냅 복구 (원하면 none으로 두셔도 됨)
    el.style.scrollSnapType = "x proximity";
    el.style.cursor = "grab";

    // pointer capture 해제
    try {
      if (s.current.pointerId !== -1) el.releasePointerCapture(s.current.pointerId);
    } catch {}

    s.current.isDown = false;
    s.current.isDragging = false;
    s.current.pointerId = -1;
  };

  return (
    <div className="carousel-wrap" aria-label={ariaLabel}>
      <div
        ref={ref}
        className="carousel"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={end}
        onPointerCancel={end}
        onPointerLeave={end}
        onDragStart={(e) => e.preventDefault()} // 브라우저 기본 DnD(🚫) 차단
        onClickCapture={(e) => {
          // ✅ 드래그 직후에만 클릭 차단 (평소 클릭은 통과)
          if (Date.now() < s.current.blockClickUntil) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
