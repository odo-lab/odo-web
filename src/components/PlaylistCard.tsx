"use client";

import Image from "next/image";
import { db } from "@/lib/firebase";
import { doc, updateDoc, increment } from "firebase/firestore";

// ✅ HomeClient.tsx에 있는 타입과 100% 동일하게 맞춰주었습니다!
export type Playlist = {
  id: string;
  title: string;
  genre: string;
  industry: string;
  energy?: string;   // 옵셔널(?) 처리하여 에러 방지
  vocal?: string;    // 옵셔널(?) 처리하여 에러 방지
  duration: string;
  tracks: number;
  tags: string[] | string;
  usecase?: string;  // 옵셔널(?) 처리
  ytmUrl: string;
  image: string;
  clicks?: number;
};

export default function PlaylistCard({
  p,
  mode,
  onOpenDetail,
}: {
  p: Playlist; // 👈 이제 양쪽의 타입이 일치해서 빨간 줄이 사라집니다!
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
      <a
        className={mode === "grid" ? "g-link" : "p-link"}
        href={p.ytmUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${p.title} - YouTube Music에서 열기`}
        onClick={handleCardClick} // 👈 클릭 로그 수집 (DB 연동)
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
            unoptimized={p.image.includes("ytimg.com") || p.image.includes("firebasestorage")} 
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