"use client";

import { useMemo, useState } from "react";
import Chips from "@/components/Chips";
import PlaylistCard from "@/components/PlaylistCard";
import PlaylistModal from "@/components/PlaylistModal";
import { GENRES, INDUSTRIES, PLAYLISTS, Playlist } from "@/lib/playlists";
import Link from "next/link";

export default function PlaylistsClient() {
  const [activeGenre, setActiveGenre] = useState<string>("전체");
  const [activeIndustry, setActiveIndustry] = useState<string>("전체");
  const [q, setQ] = useState("");

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Playlist | null>(null);

  const list = useMemo(() => {
    let result = [...PLAYLISTS];

    if (activeGenre !== "전체") result = result.filter((p) => p.genre === activeGenre);
    if (activeIndustry !== "전체") result = result.filter((p) => p.industry === activeIndustry);

    const query = q.trim().toLowerCase();
    if (query) {
      result = result.filter((p) => {
        const hay = [p.title, p.tags.join(" "), p.genre, p.industry].join(" ").toLowerCase();
        return hay.includes(query);
      });
    }
    return result;
  }, [activeGenre, activeIndustry, q]);

  const reset = () => {
    setActiveGenre("전체");
    setActiveIndustry("전체");
    setQ("");
  };

  const openDetail = (id: string) => {
    const p = PLAYLISTS.find((x) => x.id === id) ?? null;
    setSelected(p);
    setOpen(!!p);
  };

return (
  <>
    <div className="section-head" style={{ marginTop: 6 }}>
      <div>
        <h3 className="section-title">전체 플레이리스트</h3>
      </div>
    </div>

    {/* ✅ 필터 패널(검색 + 칩들) */}
    <div className="card filter-panel" style={{ padding: "14px 14px 12px" }}>
      {/* 검색 */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-start" }}>
        <input
          className="input"
          placeholder="플레이리스트 검색(제목/태그)"
          style={{ width: "min(420px, 100%)" }}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn" type="button" onClick={reset}>
          처음부터
        </button>
      </div>

      {/* 장르 */}
      <div style={{ marginTop: 12 }}>
        <div style={{ color: "var(--muted)", fontWeight: 800, fontSize: 13, marginBottom: 8 }}>
          장르
        </div>
        <Chips
          items={GENRES as unknown as string[]}
          active={activeGenre}
          onSelect={(v) => setActiveGenre(v)}
        />
      </div>

      {/* 업종 */}
      <div style={{ marginTop: 10 }}>
        <div style={{ color: "var(--muted)", fontWeight: 800, fontSize: 13, marginBottom: 8 }}>
          업종
        </div>
        <Chips
          items={INDUSTRIES as unknown as string[]}
          active={activeIndustry}
          onSelect={(v) => setActiveIndustry(v)}
        />
      </div>
    </div>

    <div className="grid" style={{ marginTop: 12 }}>
      {list.map((p) => (
        <PlaylistCard key={p.id} p={p} mode="grid" onOpenDetail={openDetail} />
      ))} 
    </div>

    ...
  </>
);

}
