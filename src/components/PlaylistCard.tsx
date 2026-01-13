"use client";

import Image from "next/image";
import { Playlist } from "@/lib/playlists";

export default function PlaylistCard({
  p,
  mode,
  onOpenDetail,
}: {
  p: Playlist;
  mode: "carousel" | "grid";
  onOpenDetail: (id: string) => void;
}) {
  const tags = p.tags.join(" · ");
  const meta = `${p.duration} · ${p.tracks}곡`;

  return (
    <a
      className={mode === "grid" ? "g-card" : "p-card"}
      href={p.ytmUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${p.title} - YouTube Music에서 열기`}
    >
      <div className={mode === "grid" ? "g-thumb" : "thumb"}>
        <Image
          src={p.image}
          alt={p.title}
          fill
          sizes={mode === "grid" ? "(max-width: 820px) 50vw, 25vw" : "300px"}
          style={{ objectFit: "cover", opacity: 0.92 }}
          priority={mode === "carousel"}
        />

        {/* ✅ 상단 우측 '상세(ⓘ)' 버튼: mu:ah 스타일(작은 원형) */}
        <button
          className="info-btn"
          type="button"
          aria-label="상세 보기"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onOpenDetail(p.id);
          }}
        >
          i
        </button>
      </div>

      <div className={mode === "grid" ? "g-body" : "p-body"}>
        <h4 className="p-title">{p.title}</h4>
        <p className="p-tags">{tags}</p>
        <div className="p-meta">
          <span>{meta}</span>
          {/* ✅ 하단 '상세' 버튼 제거 */}
        </div>
      </div>
    </a>
  );
}
