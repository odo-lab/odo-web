"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Carousel from "@/components/Carousel";
import Chips from "@/components/Chips";
import PlaylistCard from "@/components/PlaylistCard";
import PlaylistModal from "@/components/PlaylistModal";
import EventBanner from "@/components/EventBanner";
import { HERO_BANNERS } from "@/lib/banners";

// 💡 다른 곳에서도 쓸 수 있게 export 유지
export type Playlist = {
  id: string;
  title: string;
  genre: string;
  industry: string;
  energy: string;
  vocal: string;
  duration: string;
  tracks: number;
  tags: string[] | string;
  usecase: string;
  ytmUrl: string;
  image: string;
  clicks?: number;
};

const GENRES = [
  "전체", "재즈/라운지", "어쿠스틱", "R&B/소울", 
  "인디/로파이", "클래식/피아노", "댄스(활기)", "팝(클린)",
] as const;

const INDUSTRIES = [
  "전체", "카페", "식당", "주점", "헬스", 
  "집", "편집샵", "사무공간", "호텔/라운지",
] as const;

const DEFAULT_GENRE = "재즈/라운지";
const DEFAULT_INDUSTRY = "카페";
const NOW_RECO = ["p13", "p11", "p10", "p14", "p9", "p6", "p2"];

interface HomeClientProps {
  initialPlaylists: Playlist[];
}
// ✅ 부모(page.tsx)로부터 파이어베이스 데이터를 통째로 넘겨받습니다!
export default function HomeClient({ initialPlaylists }: { initialPlaylists: Playlist[] }) {
  const [activeGenre, setActiveGenre] = useState<string>(DEFAULT_GENRE);
  const [activeIndustry, setActiveIndustry] = useState<string>(DEFAULT_INDUSTRY);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Playlist | null>(null);

  // ❌ 로딩 상태(loading)와 useEffect 등은 모두 지웠습니다! (서버에서 이미 데이터를 가져왔으므로 로딩이 필요 없음)

  const nowList = useMemo(() => {
    const map = new Map(initialPlaylists.map((p) => [p.id, p]));
    return NOW_RECO.map((id) => map.get(id)).filter(Boolean) as Playlist[];
  }, [initialPlaylists]);

  const genreList = useMemo(() => {
    const list =
      activeGenre === "전체"
        ? initialPlaylists
        : initialPlaylists.filter((p) => p.genre === activeGenre);
    return list.slice(0, 10);
  }, [activeGenre, initialPlaylists]);

  const industryList = useMemo(() => {
    const list =
      activeIndustry === "전체"
        ? initialPlaylists
        : initialPlaylists.filter((p) => p.industry === activeIndustry);
    return list.slice(0, 10);
  }, [activeIndustry, initialPlaylists]);

  const openDetail = (id: string) => {
    const p = initialPlaylists.find((x) => x.id === id) ?? null;
    setSelected(p);
    setOpen(!!p);
  };

  return (
    <>
      <section>
        <section style={{ paddingTop: "30px" }}></section>
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