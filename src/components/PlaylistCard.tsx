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
    <div className={mode === "grid" ? "g-card" : "p-card"}>
      {/* 링크 영역 */}
      <a
        className={mode === "grid" ? "g-link" : "p-link"}
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
            className="thumb-img"
            style={{ objectFit: "cover", opacity: 0.92 }}
            priority={mode === "carousel"}
          />
        </div>

        <div className={mode === "grid" ? "g-body" : "p-body"}>
          <h4 className="p-title">{p.title}</h4>
          <p className="p-tags">{tags}</p>
          <div className="p-meta">
            <span>{meta}</span>
          </div>
        </div>
      </a>

      {/* ✅ 상세 버튼은 링크 밖(가장 중요) */}
      <button
        className="info-btn"
        type="button"
        aria-label="상세 보기"
        onClick={() => onOpenDetail(p.id)}
      >
        i
      </button>
    </div>
  );
}
