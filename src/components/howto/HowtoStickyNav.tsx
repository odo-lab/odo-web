"use client";

import React from "react";

export type SectionId = "howto" | "lastfm" | "faq" | "contact";

export type NavItem = {
  id: SectionId;
  label: string;
};

type Props = {
  items: NavItem[];
  activeId: SectionId;
  onClick: (id: SectionId) => void;
  /** SiteHeader 아래에 붙이기 위한 동적 top(px) */
  topPx: number;
};

export default function HowtoStickyNav({ items, activeId, onClick, topPx }: Props) {
  return (
    <div
      style={{ top: topPx }}
      className="
        fixed left-0 right-0 z-40
        border-b border-neutral-200/70 bg-white/85 backdrop-blur
      "
    >
      <div className="mx-auto max-w-6xl px-4">
        <nav className="flex gap-2 py-2">
          {items.map((it) => {
            const isActive = it.id === activeId;
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => onClick(it.id)}
                className={[
                  "rounded-full px-3 py-2 text-sm transition",
                  "hover:bg-neutral-100",
                  isActive ? "bg-neutral-900 text-white hover:bg-neutral-900" : "text-neutral-700",
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
