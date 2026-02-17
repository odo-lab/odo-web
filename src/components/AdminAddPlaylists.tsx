"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function AdminAddPlaylist() {
  const [ytmUrl, setYtmUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    genre: "재즈/라운지",
    industry: "카페",
    energy: "MED",
    vocal: "LOW",
    duration: "",
    tracks: 0,
    tags: "",
    usecase: "",
    image: "", // 유튜브 썸네일 URL이 들어갈 자리
  });

  // 1. 유튜브 API를 통해 플리 정보 긁어오기
  const fetchPlaylistInfo = async () => {
    const listId = new URL(ytmUrl).searchParams.get("list");
    if (!listId) return alert("올바른 유튜브 리스트 주소를 입력하세요.");

    setLoading(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&id=${listId}&key=${apiKey}`
      );
      const data = await res.json();

      if (data.items && data.items.length > 0) {
        const item = data.items[0];
        const snippet = item.snippet;
        const contentDetails = item.contentDetails;

        // 고해상도 썸네일 우선 순위 (maxres > standard > high)
        const thumbnails = snippet.thumbnails;
        const bestImg = thumbnails.maxres?.url || thumbnails.standard?.url || thumbnails.high?.url;

        setFormData({
          ...formData,
          id: listId.substring(0, 10), // ID가 없으면 리스트 ID 앞글자 사용
          title: snippet.title,
          tracks: contentDetails.itemCount,
          image: bestImg,
        });
        alert("정보를 성공적으로 가져왔습니다!");
      }
    } catch (err) {
      console.error("API 호출 에러:", err);
      alert("정보를 가져오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 2. 최종 Firestore 등록
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.image) return alert("필수 정보가 부족합니다.");

    try {
      const playlistData = {
        ...formData,
        tags: formData.tags.split(",").map(t => t.trim()), // 콤마로 구분된 태그를 배열로 변환
        clicks: 0,
        createdAt: serverTimestamp(),
        ytmUrl: ytmUrl,
      };

      await setDoc(doc(db, "playlists", formData.id), playlistData);
      alert("플레이리스트가 DB에 성공적으로 등록되었습니다! 🚀");
    } catch (err) {
      console.error(err);
      alert("DB 저장 중 오류 발생");
    }
  };

  return (
    <div style={{ maxWidth: "500px", margin: "40px auto", color: "#fff", padding: "20px", background: "#111", borderRadius: "12px" }}>
      <h2 style={{ marginBottom: "20px" }}>신규 플리 등록 (YouTube API)</h2>
      
      {/* 주소 입력 및 정보 불러오기 */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input 
          type="text" 
          placeholder="유튜브 뮤직 플리 주소" 
          value={ytmUrl} 
          onChange={(e) => setYtmUrl(e.target.value)}
          style={inputStyle}
        />
        <button onClick={fetchPlaylistInfo} disabled={loading} style={btnStyle}>
          {loading ? "불러오는 중..." : "정보 로드"}
        </button>
      </div>

      <hr style={{ borderColor: "#333", marginBottom: "20px" }} />

      {/* 나머지 정보 입력 폼 */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <label>제목: <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={inputStyle}/></label>
        <label>관리 ID: <input type="text" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} style={inputStyle}/></label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <label>장르: <input type="text" value={formData.genre} onChange={e => setFormData({...formData, genre: e.target.value})} style={inputStyle}/></label>
          <label>업종: <input type="text" value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} style={inputStyle}/></label>
        </div>
        <label>태그 (쉼표로 구분): <input type="text" placeholder="카페, 오후, 편안함" onChange={e => setFormData({...formData, tags: e.target.value})} style={inputStyle}/></label>
        <label>사용 사례: <input type="text" placeholder="오픈 준비 시간" onChange={e => setFormData({...formData, usecase: e.target.value})} style={inputStyle}/></label>
        
        {formData.image && (
          <div style={{ marginTop: "10px" }}>
            <p style={{ fontSize: "12px", color: "#aaa" }}>미리보기</p>
            <img src={formData.image} alt="Thumbnail" style={{ width: "100%", borderRadius: "8px" }} />
          </div>
        )}

        <button type="submit" style={{ ...btnStyle, background: "#3b82f6", marginTop: "20px" }}>DB에 최종 등록</button>
      </form>
    </div>
  );
}

const inputStyle = { width: "100%", padding: "10px", background: "#222", border: "1px solid #444", color: "#fff", borderRadius: "6px" };
const btnStyle = { padding: "10px 15px", background: "#444", border: "none", color: "#fff", borderRadius: "6px", cursor: "pointer", whiteSpace: "nowrap" as any };