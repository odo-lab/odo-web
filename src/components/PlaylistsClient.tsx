"use client";

import { useEffect, useMemo, useState } from "react";
import Chips from "@/components/Chips";
import PlaylistCard from "@/components/PlaylistCard";
import PlaylistModal from "@/components/PlaylistModal";
import { GENRES, INDUSTRIES, Playlist } from "@/lib/playlists";
import { db } from "@/lib/firebase"; // Firebase 설정 임포트
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export default function PlaylistsClient() {
  // ✅ 상태 관리: DB에서 가져온 전체 리스트 저장
  const [allPlaylists, setAllPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeGenre, setActiveGenre] = useState<string>("전체");
  const [activeIndustry, setActiveIndustry] = useState<string>("전체");
  const [q, setQ] = useState("");

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Playlist | null>(null);

  // ✅ 1. 컴포넌트 마운트 시 DB에서 데이터 불러오기
  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        setLoading(true);
        const playlistsRef = collection(db, "playlists");
        // 생성일 순 또는 클릭수 순으로 정렬해서 가져올 수 있습니다.
        // PlaylistsClient.tsx 내부 수정
        const q = query(playlistsRef, orderBy("order", "asc")); 
        const querySnapshot = await getDocs(q);
        
        const list = querySnapshot.docs.map(doc => ({
          ...doc.data()
        })) as Playlist[];
        
        setAllPlaylists(list);
      } catch (error) {
        console.error("데이터 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, []);

  // ✅ 2. 필터링 로직 (allPlaylists 기반으로 변경)
  const list = useMemo(() => {
    let result = [...allPlaylists];

    if (activeGenre !== "전체") result = result.filter((p) => p.genre === activeGenre);
    if (activeIndustry !== "전체") result = result.filter((p) => p.industry === activeIndustry);

    const queryStr = q.trim().toLowerCase();
    if (queryStr) {
      result = result.filter((p) => {
        const hay = [
          p.title, 
          Array.isArray(p.tags) ? p.tags.join(" ") : p.tags, 
          p.genre, 
          p.industry
        ].join(" ").toLowerCase();
        return hay.includes(queryStr);
      });
    }
    return result;
  }, [allPlaylists, activeGenre, activeIndustry, q]);

  const reset = () => {
    setActiveGenre("전체");
    setActiveIndustry("전체");
    setQ("");
  };

  const openDetail = (id: string) => {
    const p = allPlaylists.find((x) => x.id === id) ?? null;
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

      {/* 필터 패널 */}
      <div className="card filter-panel" style={{ padding: "14px 14px 12px" }}>
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

      {/* ✅ 로딩 상태 및 결과 렌더링 */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "100px 0", color: "#666" }}>
          데이터를 불러오는 중입니다...
        </div>
      ) : (
        <div className="grid" style={{ marginTop: 12 }}>
          {list.length > 0 ? (
            list.map((p) => (
              <PlaylistCard key={p.id} p={p} mode="grid" onOpenDetail={openDetail} />
            ))
          ) : (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "80px 0", color: "#666" }}>
              검색 결과가 없습니다.
            </div>
          )}
        </div>
      )}

      <PlaylistModal
        open={open}
        playlist={selected}
        onClose={() => setOpen(false)}
      />
    </>
  );
}