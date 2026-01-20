"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import Carousel from "@/components/Carousel";
import Chips from "@/components/Chips";
import PlaylistCard from "@/components/PlaylistCard";
import PlaylistModal from "@/components/PlaylistModal";
// BottomTripleSection은 사용되지 않는다면 제거해도 됩니다.
import BottomTripleSection from "@/components/BottomTripleSection";

import EventBanner from "@/components/EventBanner";
import { HERO_BANNERS } from "@/lib/banners";

import {
  DEFAULT_GENRE,
  DEFAULT_INDUSTRY,
  GENRES,
  INDUSTRIES,
  NOW_RECO,
  PLAYLISTS,
  Playlist,
} from "@/lib/playlists";

export default function HomeClient() {
  const [activeGenre, setActiveGenre] = useState<string>(DEFAULT_GENRE);
  const [activeIndustry, setActiveIndustry] = useState<string>(DEFAULT_INDUSTRY);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Playlist | null>(null);

  const nowList = useMemo(() => {
    const map = new Map(PLAYLISTS.map((p) => [p.id, p]));
    return NOW_RECO.map((id) => map.get(id)).filter(Boolean) as Playlist[];
  }, []);

  const genreList = useMemo(() => {
    const list =
      activeGenre === "전체"
        ? PLAYLISTS
        : PLAYLISTS.filter((p) => p.genre === activeGenre);
    return list.slice(0, 10);
  }, [activeGenre]);

  const industryList = useMemo(() => {
    const list =
      activeIndustry === "전체"
        ? PLAYLISTS
        : PLAYLISTS.filter((p) => p.industry === activeIndustry);
    return list.slice(0, 10);
  }, [activeIndustry]);

  const openDetail = (id: string) => {
    const p = PLAYLISTS.find((x) => x.id === id) ?? null;
    setSelected(p);
    setOpen(!!p);
  };

  return (
    <>
      <section>
        {/* ✅ 이벤트 배너 (기존 heroBanner 대체) */}
        <EventBanner items={HERO_BANNERS} autoPlay intervalMs={5000} />

        {/* NOW */}
        <div className="section no-bg">
          <div className="section-head">
            <div>
              <h3 className="section-title">실시간 추천</h3>
              <p className="section-desc">지금 매장 분위기에 잘 어울리는 플레이리스트</p>
            </div>

            <Link className="btn" href="/playlists" style={{ padding: "9px 12px" }}>
              전체 보기
            </Link>
          </div>

          <Carousel ariaLabel="지금 추천 캐러셀(Carousel)">
            {nowList.map((p) => (
              <PlaylistCard key={p.id} p={p} mode="carousel" onOpenDetail={openDetail} />
            ))}
          </Carousel>
        </div>

        {/* GENRE */}
        <div className="section">
          <div className="section-head">
            <div>
              <h3 className="section-title">장르별 추천</h3>
              <p className="section-desc">매장 분위기에 어울리는 장르를 골라보세요</p>
            </div>

            <Link className="btn" href="/playlists" style={{ padding: "9px 12px" }}>
              전체 보기
            </Link>
          </div>

          <Chips
            items={GENRES as unknown as string[]}
            active={activeGenre}
            onSelect={setActiveGenre}
          />

          <Carousel ariaLabel="장르별 추천 캐러셀(Carousel)">
            {genreList.map((p) => (
              <PlaylistCard key={p.id} p={p} mode="carousel" onOpenDetail={openDetail} />
            ))}
          </Carousel>
        </div>

        {/* INDUSTRY */}
        <div className="section">
          <div className="section-head">
            <div>
              <h3 className="section-title">업종별 추천</h3>
              <p className="section-desc">카페/식당 등 매장 유형에 최적화된 플레이리스트</p>
            </div>

            <Link className="btn" href="/playlists" style={{ padding: "9px 12px" }}>
              전체 보기
            </Link>
          </div>

          <Chips
            items={INDUSTRIES as unknown as string[]}
            active={activeIndustry}
            onSelect={setActiveIndustry}
          />

          <Carousel ariaLabel="업종별 추천 캐러셀(Carousel)">
            {industryList.map((p) => (
              <PlaylistCard key={p.id} p={p} mode="carousel" onOpenDetail={openDetail} />
            ))}
          </Carousel>
        </div>
      </section>

      <PlaylistModal open={open} playlist={selected} onClose={() => setOpen(false)} />
    </>
  );
}
const mobileOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0, // top:0 right:0 bottom:0 left:0
  zIndex: 200,
  background: "rgba(0,0,0,.45)",
  backdropFilter: "blur(6px)",
};

const mobilePanelStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,       // ✅ 최상단 고정
  left: 0,
  right: 0,
  maxHeight: "100dvh", // ✅ 모바일에서 주소창 변화 대응
  overflowY: "auto",
  padding: "14px 16px 18px",
  background: "rgba(10,10,12,.92)",
  borderBottom: "1px solid rgba(255,255,255,.10)",
};
