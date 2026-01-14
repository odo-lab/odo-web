"use client";

import React from "react";

export type SectionId = "howto" | "lastfm" | "faq";

export type NavItem = {
  id: SectionId;
  label: string;
};

type Props = {
  items: NavItem[];
  activeId: SectionId;
  onClick: (id: SectionId) => void;

  // ✅ 추가: SiteHeader 높이만큼 아래에 sticky 붙이기
  topOffset?: number;
};

export default function HowtoStickyNav({
  items,
  activeId,
  onClick,
  topOffset = 0,
}: Props) {
  return (
    <div
      className="sticky z-50 border-b border-white/10 bg-black/70 backdrop-blur"
      style={{ top: topOffset }}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <span className="text-xs font-semibold tracking-widest text-white/60">
          HOW TO
        </span>

        <nav className="flex items-center gap-1">
          {items.map((it) => {
            const active = activeId === it.id;
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => onClick(it.id)}
                className={[
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/5",
                ].join(" ")}
              >
                {it.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
