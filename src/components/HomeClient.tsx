"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

import Carousel from "@/components/Carousel";
import Chips from "@/components/Chips";
import PlaylistCard from "@/components/PlaylistCard";
import PlaylistModal from "@/components/PlaylistModal";
import EventBanner from "@/components/EventBanner";
import { HERO_BANNERS } from "@/lib/banners";

// 💡 기존 lib/playlists.ts 를 지우기 위해 타입과 상수를 직접 선언합니다.
export type Playlist = {
  id: string;
  title: string;
  genre: string;
  industry: string;
  energy: "LOW" | "MED" | "HIGH" | string;
  vocal: "LOW" | "MED" | "HIGH" | string;
  duration: string;
  tracks: number;
  tags: string[] | string;
  usecase: string;
  ytmUrl: string;
  image: string;
  clicks?: number; // DB 클릭수 추적용
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

export default function HomeClient() {
  const [activeGenre, setActiveGenre] = useState<string>(DEFAULT_GENRE);
  const [activeIndustry, setActiveIndustry] = useState<string>(DEFAULT_INDUSTRY);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Playlist | null>(null);
  
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ 컴포넌트 마운트 시 Firestore에서 데이터 가져오기
  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "playlists"));
        const fetchedData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Playlist[];
        
        setPlaylists(fetchedData);
      } catch (error) {
        console.error("플레이리스트 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, []);

  const nowList = useMemo(() => {
    const map = new Map(playlists.map((p) => [p.id, p]));
    return NOW_RECO.map((id) => map.get(id)).filter(Boolean) as Playlist[];
  }, [playlists]);

  const genreList = useMemo(() => {
    const list =
      activeGenre === "전체"
        ? playlists
        : playlists.filter((p) => p.genre === activeGenre);
    return list.slice(0, 10);
  }, [activeGenre, playlists]);

  const industryList = useMemo(() => {
    const list =
      activeIndustry === "전체"
        ? playlists
        : playlists.filter((p) => p.industry === activeIndustry);
    return list.slice(0, 10);
  }, [activeIndustry, playlists]);

  const openDetail = (id: string) => {
    const p = playlists.find((x) => x.id === id) ?? null;
    setSelected(p);
    setOpen(!!p);
  };

  return (
    <>
      <section>
        <section style={{ paddingTop: "30px" }}></section>
        <EventBanner items={HERO_BANNERS} autoPlay intervalMs={5000} />

        {loading && <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>데이터를 불러오는 중입니다...</div>}

        {!loading && (
          <>
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
          </>
        )}
      </section>

      <PlaylistModal open={open} playlist={selected} onClose={() => setOpen(false)} />
    </>
  );
}

const mobileOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 200,
  background: "rgba(0,0,0,.45)",
  backdropFilter: "blur(6px)",
};

const mobilePanelStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  maxHeight: "100dvh",
  overflowY: "auto",
  padding: "14px 16px 18px",
  background: "rgba(10,10,12,.92)",
  borderBottom: "1px solid rgba(255,255,255,.10)",
};