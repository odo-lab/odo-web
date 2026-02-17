"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc, getCountFromServer } from "firebase/firestore";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("playlist"); // 기본 탭: 플레이리스트 관리

  return (
    <div style={{ padding: "40px", maxWidth: "1000px", margin: "0 auto" }}>
      <h2 style={{ color: "#444",fontSize: "24px", fontWeight: "bold", marginBottom: "30px" }}>⚙️ 환경 설정</h2>

      {/* 탭 메뉴 */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "30px", borderBottom: "1px solid #ddd", paddingBottom: "10px" }}>
        <TabButton label="🧑‍🎤🧑‍🎤 아티스트 관리" isActive={activeTab === "artist"} onClick={() => setActiveTab("artist")} />
        <TabButton label="💰 정산 기준 관리" isActive={activeTab === "settlement"} onClick={() => setActiveTab("settlement")} />
        <TabButton label="🎵 플레이리스트" isActive={activeTab === "playlist"} onClick={() => setActiveTab("playlist")} />
      </div>

      {/* 탭 내용 영역 */}
      <div style={{ background: "white", padding: "30px", borderRadius: "12px", border: "1px solid #eee", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
        {activeTab === "artist" && <ArtistManager />}
        {activeTab === "settlement" && <SettlementManager />}
        {activeTab === "playlist" && <PlaylistManager />}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 1. 🎵 아티스트 관리 컴포넌트
// ----------------------------------------------------------------------
function ArtistManager() {
  const [artists, setArtists] = useState<{ name: string, createdAt: string }[]>([]);
  const [newArtist, setNewArtist] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "monitored_artists"));
      const list: { name: string, createdAt: string }[] = [];
      snap.forEach(doc => {
        const data = doc.data();
        list.push({
          name: doc.id,
          createdAt: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : "-"
        });
      });
      list.sort((a, b) => a.name.localeCompare(b.name));
      setArtists(list);
    } catch (e) {
      console.error(e);
      alert("목록 불러오기 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    const name = newArtist.trim();
    if (!name) return alert("이름을 입력하세요.");
    if (artists.some(a => a.name.toLowerCase() === name.toLowerCase())) return alert("이미 존재합니다.");
    if (!confirm(`'${name}'을(를) 추가하시겠습니까?`)) return;

    try {
      await setDoc(doc(db, "monitored_artists", name), { createdAt: new Date().toISOString(), active: true });
      setNewArtist(""); 
      fetchArtists();   
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`정말 삭제하시겠습니까?`)) return;
    try {
      await deleteDoc(doc(db, "monitored_artists", name));
      fetchArtists();
    } catch (e) { console.error(e); }
  };

  return (
    <div>
      <div style={{ color: "#444",display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px" }}>
        <h3>정산 대상 아티스트</h3>
        <span>화면 목록: {artists.length}팀</span>
      </div>
      <div style={{ color: "#444",display: "flex", gap: "10px", marginBottom: "30px", padding: "20px", background: "#f9fafb", borderRadius: "8px" }}>
        <input type="text" placeholder="아티스트 이름" value={newArtist} onChange={(e) => setNewArtist(e.target.value)} style={inputStyle} />
        <button onClick={handleAdd} style={primaryBtnStyle}>+ 추가</button>
      </div>
      <table style={{color: "#444", width: "100%", fontSize: "14px" }}>
        <thead><tr style={{ background: "#f3f4f6" }}><th style={{ padding: "10px" }}>아티스트명</th><th style={{ padding: "10px" }}>관리</th></tr></thead>
        <tbody>
          {artists.map((a, i) => (
            <tr key={i}><td style={{ padding: "10px" }}>{a.name}</td><td style={{ textAlign: "center" }}><button onClick={() => handleDelete(a.name)}>삭제</button></td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ----------------------------------------------------------------------
// 2. 💰 정산 기준 관리
// ----------------------------------------------------------------------
function SettlementManager() {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af" }}>
      <h3>🚧 준비 중인 기능입니다</h3>
    </div>
  );
}

// ----------------------------------------------------------------------
// 3. 💿 플레이리스트 관리 컴포넌트 (사분할 썸네일 지원)
// ----------------------------------------------------------------------
function PlaylistManager() {
  const [ytmUrl, setYtmUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: "", title: "", genre: "재즈/라운지", industry: "카페",
    energy: "MED" as "LOW" | "MED" | "HIGH",
    vocal: "LOW" as "LOW" | "MED" | "HIGH",
    duration: "", tracks: 0, tags: "", usecase: "", image: ""
  });

  const parseISO8601Duration = (isoDuration: string) => {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || "0");
    const minutes = parseInt(match[2] || "0");
    const seconds = parseInt(match[3] || "0");
    return hours * 3600 + minutes * 60 + seconds;
  };

  const fetchPlaylistData = async () => {
    try {
      const urlObj = new URL(ytmUrl);
      const listId = urlObj.searchParams.get("list");
      if (!listId) return alert("올바른 유튜브 뮤직 주소를 입력하세요.");

      setLoading(true);
      const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

      // 1. 플레이리스트 기본 정보 (사분할 썸네일 추출 포인트)
      const resBase = await fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&id=${listId}&key=${API_KEY}`);
      const dataBase = await resBase.json();
      
      if (!dataBase.items || dataBase.items.length === 0) throw new Error("플레이리스트를 찾을 수 없습니다.");
      
      const item = dataBase.items[0];
      const snippet = item.snippet;

      // ✅ [개선] 사분할 썸네일 우선 추출 (maxres/standard 순)
      const thumbs = snippet.thumbnails;
      const officialImage = thumbs.maxres?.url || thumbs.standard?.url || thumbs.high?.url || thumbs.default?.url;

      // 2. 플레이리스트 아이템 ID 리스트 (최대 50개)
      const resItems = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId=${listId}&key=${API_KEY}`);
      const dataItems = await resItems.json();
      const videoIds = dataItems.items.map((i: any) => i.contentDetails.videoId).join(",");

      // 3. 비디오 상세 정보 합산
      const resVideos = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${API_KEY}`);
      const dataVideos = await resVideos.json();

      let totalSeconds = 0;
      dataVideos.items.forEach((v: any) => {
        totalSeconds += parseISO8601Duration(v.contentDetails.duration);
      });

      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);

      setFormData({
        ...formData,
        id: listId.substring(0, 10),
        title: snippet.title,
        tracks: item.contentDetails.itemCount,
        image: officialImage, 
        duration: h > 0 ? `${h}시간 ${m}분` : `${m}분`
      });

      alert("🎉 정보를 성공적으로 가져왔습니다!");
    } catch (e: any) {
      alert(e.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.image) return alert("필수 정보가 부족합니다.");

    try {
      const finalTags = typeof formData.tags === "string" 
        ? formData.tags.split(",").map(t => t.trim()).filter(t => t !== "") 
        : formData.tags;

      await setDoc(doc(db, "playlists", formData.id), {
        ...formData,
        tags: finalTags,
        ytmUrl,
        clicks: 0,
        createdAt: new Date().toISOString()
      });
      alert("등록 성공! 🚀");
      setYtmUrl("");
    } catch (e) { alert("저장 실패"); }
  };

  return (
    <div>
      <h3 style={{color: "#444", fontSize: "18px", fontWeight: "bold", marginBottom: "20px" }}>💿 플레이리스트 등록</h3>
      
      <div style={{ display: "flex", gap: "10px", marginBottom: "30px", padding: "20px", background: "#f3f4f6", borderRadius: "8px" }}>
        <input type="text" placeholder="유튜브 뮤직 주소 입력" value={ytmUrl} onChange={(e) => setYtmUrl(e.target.value)} style={inputStyle} />
        <button onClick={fetchPlaylistData} disabled={loading} style={primaryBtnStyle}>{loading ? "계산 중..." : "자동 정보 로드"}</button>
      </div>

      <form onSubmit={handleSave} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div style={{ gridColumn: "span 2" }}>
          <label style={formLabelStyle}>제목 (수정 가능)</label>
          <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={inputStyle} />
        </div>

        <div style={{ gridColumn: "span 2" }}>
          <label style={formLabelStyle}>썸네일 이미지 URL (사분할이 아니면 직접 수정)</label>
          <input type="text" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} style={inputStyle} />
        </div>
        
        <div>
          <label style={formLabelStyle}>재생 시간</label>
          <input type="text" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} style={inputStyle} />
        </div>
        
        <div>
          <label style={formLabelStyle}>트랙 수</label>
          <input type="number" value={formData.tracks} onChange={e => setFormData({...formData, tracks: Number(e.target.value)})} style={inputStyle} />
        </div>

        <div>
          <label style={formLabelStyle}>장르</label>
          <input type="text" value={formData.genre} onChange={e => setFormData({...formData, genre: e.target.value})} style={inputStyle} />
        </div>

        <div>
          <label style={formLabelStyle}>적합 업종</label>
          <input type="text" value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} style={inputStyle} />
        </div>

        <div style={{ gridColumn: "span 2" }}>
          <label style={formLabelStyle}>태그 (쉼표로 구분)</label>
          <input type="text" placeholder="오후, 산뜻한, 연주곡" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} style={inputStyle} />
        </div>

        {formData.image && (
          <div style={{ gridColumn: "span 2" }}>
            <label style={formLabelStyle}>미리보기</label>
            <img src={formData.image} alt="Thumbnail" style={{ width: "240px", aspectRatio: "1/1", objectFit: "cover", borderRadius: "8px", border: "1px solid #ddd" }} />
          </div>
        )}

        <button type="submit" style={{ ...primaryBtnStyle, gridColumn: "span 2", padding: "15px" }}>최종 DB 등록하기</button>
      </form>
    </div>
  );
}

// ----------------------------------------------------------------------
// 스타일 컴포넌트 & 상수
// ----------------------------------------------------------------------
const formLabelStyle = { display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600", color: "#4b5563" };

function TabButton({ label, isActive, onClick }: any) {
  return (
    <button onClick={onClick} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", background: isActive ? "#1f2937" : "transparent", color: isActive ? "white" : "#6b7280", transition: "all 0.2s" }}>
      {label}
    </button>
  );
}

const inputStyle = { flex: 1, padding: "12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "15px", outline: "none", width: "100%" };
const primaryBtnStyle = { background: "#3b82f6", color: "white", border: "none", padding: "0 24px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "15px" };