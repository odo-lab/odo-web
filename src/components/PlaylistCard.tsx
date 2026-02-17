"use client";

import Image from "next/image";
import { Playlist } from "@/lib/playlists"; // 타입 정의는 그대로 유지하거나 DB 타입으로 확장
import { db } from "@/lib/firebase";
import { doc, updateDoc, increment } from "firebase/firestore";

export default function PlaylistCard({
  p,
  mode,
  onOpenDetail,
}: {
  p: Playlist;
  mode: "carousel" | "grid";
  onOpenDetail: (id: string) => void;
}) {
  // ✅ DB에서 온 데이터가 배열인지 확인 후 처리 (안전장치)
  const tags = Array.isArray(p.tags) ? p.tags.join(" · ") : p.tags;
  const meta = `${p.duration} · ${p.tracks}곡`;

  // ✅ 클릭 시 DB의 누적 클릭 수를 1 증가시키는 함수
  const handleCardClick = async () => {
    try {
      const playlistRef = doc(db, "playlists", p.id);
      await updateDoc(playlistRef, {
        clicks: increment(1)
      });
    } catch (err) {
      console.error("클릭 수 업데이트 실패:", err);
    }
  };

  return (
    <div className={mode === "grid" ? "g-card" : "p-card"}>
      {/* 링크 영역: 클릭 시 handleCardClick 실행 */}
      <a
        className={mode === "grid" ? "g-link" : "p-link"}
        href={p.ytmUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${p.title} - YouTube Music에서 열기`}
        onClick={handleCardClick} // 👈 클릭 로그 수집
      >
        <div className={mode === "grid" ? "g-thumb" : "thumb"}>
          <Image
            src={p.image} // 👈 이제 외부 URL(firebasestorage 또는 ytimg)을 지원
            alt={p.title}
            fill
            sizes={mode === "grid" ? "(max-width: 820px) 50vw, 25vw" : "300px"}
            className="thumb-img"
            style={{ objectFit: "cover", opacity: 0.92 }}
            priority={mode === "carousel"}
            unoptimized={p.image.includes("ytimg.com")} // 유튜브 서버 이미지는 최적화 제외 권장
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