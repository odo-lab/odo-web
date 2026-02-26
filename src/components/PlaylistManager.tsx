"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

// 스타일 정의 (재사용을 위해 내부 선언 혹은 별도 파일)
const formLabelStyle = { display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600", color: "#4b5563" };
const inputStyle = { flex: 1, padding: "12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "15px", outline: "none", width: "100%" };
const primaryBtnStyle = { background: "#3b82f6", color: "white", border: "none", padding: "10px 24px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "15px" };

function FormField({ label, children, fullWidth = false }: any) {
  return (
    <div style={{ gridColumn: fullWidth ? "span 2" : "span 1" }}>
      <label style={formLabelStyle}>{label}</label>
      {children}
    </div>
  );
}

export default function PlaylistManager() {
  const [ytmUrl, setYtmUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: "", title: "", genre: "재즈/라운지", industry: "카페",
    energy: "MED" as "LOW" | "MED" | "HIGH",
    vocal: "LOW" as "LOW" | "MED" | "HIGH",
    duration: "", tracks: 0, tags: "", image: ""
  });

  // ISO8601 시간을 초 단위로 변환
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

      const resBase = await fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&id=${listId}&key=${API_KEY}`);
      const dataBase = await resBase.json();
      
      if (!dataBase.items || dataBase.items.length === 0) throw new Error("플레이리스트를 찾을 수 없습니다.");
      
      const item = dataBase.items[0];
      const snippet = item.snippet;
      const thumbs = snippet.thumbnails;
      const officialImage = thumbs.maxres?.url || thumbs.standard?.url || thumbs.high?.url || thumbs.default?.url;

      const resItems = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId=${listId}&key=${API_KEY}`);
      const dataItems = await resItems.json();
      const videoIds = dataItems.items.map((i: any) => i.contentDetails.videoId).join(",");

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

      // 타임스탬프를 이용한 고유 ID 생성 로직 추가
      const now = new Date();
      const timestamp = now.toISOString().replace(/[-T:Z.]/g, ""); // 특수문자 제거
      const uniqueDocId = `${formData.id}_${timestamp}`;

      await setDoc(doc(db, "playlists", uniqueDocId), {
        ...formData,
        docId: uniqueDocId, // 내부 필드에도 저장해두면 관리가 편합니다
        tags: finalTags,
        ytmUrl,
        clicks: 0,
        order: 999,
        createdAt: now.toISOString()
      });
      alert("등록 성공! 🚀");
      
      // 폼 초기화 (다음 등록을 위해)
      setYtmUrl("");
      setFormData({
        id: "", title: "", genre: "재즈/라운지", industry: "카페",
        energy: "MED", vocal: "LOW", duration: "", tracks: 0, tags: "", image: ""
      });
    } catch (e) { 
      console.error(e);
      alert("저장 실패"); 
    }
  };

  return (
    <div>
      <h3 style={{ color: "#444", fontSize: "18px", fontWeight: "bold", marginBottom: "20px" }}>💿 플레이리스트 등록</h3>
      <div style={{ display: "flex", gap: "10px", marginBottom: "30px", padding: "20px", background: "#f3f4f6", borderRadius: "8px" }}>
        <input type="text" placeholder="유튜브 뮤직 주소 입력" value={ytmUrl} onChange={(e) => setYtmUrl(e.target.value)} style={inputStyle} />
        <button onClick={fetchPlaylistData} disabled={loading} style={primaryBtnStyle}>{loading ? "계산 중..." : "자동 정보 로드"}</button>
      </div>

      <form onSubmit={handleSave} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <FormField label="제목 (수정 가능)" fullWidth>
          <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={inputStyle} />
        </FormField>
        
        <FormField label="썸네일 이미지 URL" fullWidth>
          <input type="text" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} style={inputStyle} />
        </FormField>

        <FormField label="재생 시간">
          <input type="text" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} style={inputStyle} />
        </FormField>

        <FormField label="트랙 수">
          <input type="number" value={formData.tracks} onChange={e => setFormData({...formData, tracks: Number(e.target.value)})} style={inputStyle} />
        </FormField>

        <FormField label="장르">
          <input type="text" value={formData.genre} onChange={e => setFormData({...formData, genre: e.target.value})} style={inputStyle} />
        </FormField>

        <FormField label="적합 업종">
          <input type="text" value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} style={inputStyle} />
        </FormField>

        <FormField label="태그 (쉼표로 구분)" fullWidth>
          <input type="text" placeholder="오후, 산뜻한, 연주곡" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} style={inputStyle} />
        </FormField>

        {formData.image && (
          <FormField label="미리보기" fullWidth>
            <img src={formData.image} alt="Thumbnail" style={{ width: "240px", aspectRatio: "1/1", objectFit: "cover", borderRadius: "8px", border: "1px solid #ddd" }} />
          </FormField>
        )}
        <button type="submit" style={{ ...primaryBtnStyle, gridColumn: "span 2", padding: "15px" }}>최종 DB 등록하기</button>
      </form>
    </div>
  );
}