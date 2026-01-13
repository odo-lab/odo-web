"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import Carousel from "@/components/Carousel";
import Chips from "@/components/Chips";
import PlaylistCard from "@/components/PlaylistCard";
import PlaylistModal from "@/components/PlaylistModal";
import BottomTripleSection from "@/components/BottomTripleSection";

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
        
        <a
          href="https://slashpage.com/b-and/7vgjr4m1q6vkgmdwpy86"
          target="_blank"
          rel="noopener noreferrer"
          className="heroLink"
        >
          <div className="heroBanner" />
        </a>


      

        {/* NOW */}
        <div className="section no-bg">
          <div className="section-head">
            <div>
              <h3 className="section-title">실시간 추천</h3>
              <p className="section-desc">지금 매장 분위기에 가장 잘 어울리는 플레이리스트</p>
            </div>

            <Link className="btn" href="/playlists" style={{ padding: "9px 12px" }}>
              전체 보기
            </Link>
          </div>

          <Carousel ariaLabel="지금 추천 캐러셀(Carousel)">
            {nowList.map((p) => (
              <PlaylistCard
                key={p.id}
                p={p}
                mode="carousel"
                onOpenDetail={openDetail}
              />
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
              <PlaylistCard
                key={p.id}
                p={p}
                mode="carousel"
                onOpenDetail={openDetail}
              />
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
              <PlaylistCard
                key={p.id}
                p={p}
                mode="carousel"
                onOpenDetail={openDetail}
              />
            ))}
          </Carousel>
        </div>
      <footer className="legal-footer">
        <div className="container">
          <div className="legal-top">
            <div className="legal-links">
              <Link href="/terms">이용약관</Link>
              <span>|</span>
              <Link href="/privacy">개인정보처리방침</Link>
              <span>|</span>
              <a href="/howto">서비스 이용안내</a>
              <span>|</span>
              <a href="mailto:contact@grapes.my">고객센터</a>
            </div>

            <div className="legal-contact">
              고객센터 · 광고 · 사업 문의 :
              <a href="mailto:contact@grapes.my"> contact@grapes.my</a>
            </div>
          </div>

          <div className="legal-info">
            <p>
              (주)그레이프스 · 대표이사 홍영주 · 사업자등록번호 387-81-03198 ·
              통신판매업신고번호 (사업자등록확인)
            </p>
            <p>
              주소: 서울시 광진구 천호대로 579 502 · 전화: 070-8983-2616 · 이메일:
              contact@grapes.my
            </p>
            <p>호스팅 서비스 제공</p>
          </div>

          <div className="legal-notice">
            <strong>(서비스 고지)</strong>
            <ul>
              <li>본 서비스는 AI 생성 음원 큐레이션 정보를 제공하며, 재생은 YouTube Music을 통해 이루어집니다.</li>
              <li>본 서비스의 플레이리스트 구성 및 큐레이션에 대한 권리는 (주)그레이프스에 있습니다.</li>
              <li>Copyright © GRAPES. All rights reserved.</li>
            </ul>
          </div>
        </div>
      </footer>

        {/* <footer>
          <div className="footer-row">
            <div>© ODO (onedayofmusic) — 운영형 플레이리스트 서비스(프로토타입)</div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Link href="/help">FAQ/운영가이드</Link>
              <Link href="/howto">이용 방법</Link>
              <Link href="/login">로그인</Link>
            </div>
          </div>
        </footer> */}
      </section>

      <PlaylistModal open={open} playlist={selected} onClose={() => setOpen(false)} />
    </>
  );
}
