"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc, getCountFromServer } from "firebase/firestore";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("artist"); // 기본 탭: 아티스트 관리

  return (
    <div style={{ padding: "40px", maxWidth: "1000px", margin: "0 auto" }}>
      <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "30px" }}>⚙️ 환경 설정</h2>

      {/* 탭 메뉴 */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "30px", borderBottom: "1px solid #ddd", paddingBottom: "10px" }}>
        <TabButton label="🎵 아티스트 관리" isActive={activeTab === "artist"} onClick={() => setActiveTab("artist")} />
        <TabButton label="💰 정산 기준 관리" isActive={activeTab === "settlement"} onClick={() => setActiveTab("settlement")} />
        <TabButton label="🏪 매장 관리" isActive={activeTab === "store"} onClick={() => setActiveTab("store")} />
      </div>

      {/* 탭 내용 영역 */}
      <div style={{ background: "white", padding: "30px", borderRadius: "12px", border: "1px solid #eee", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
        {activeTab === "artist" && <ArtistManager />}
        {activeTab === "settlement" && <SettlementManager />}
        {activeTab === "store" && <StoreManager />}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 1. 🎵 아티스트 관리 컴포넌트 (핵심 기능)
// ----------------------------------------------------------------------
function ArtistManager() {
  const [artists, setArtists] = useState<{ name: string, createdAt: string }[]>([]);
  const [newArtist, setNewArtist] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchArtists();
  }, []);

  // 목록 불러오기
  const fetchArtists = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "monitored_artists"));
      const list: { name: string, createdAt: string }[] = [];
      
      snap.forEach(doc => {
        const data = doc.data();
        list.push({
            name: doc.id, // 문서 ID가 곧 아티스트 이름
            createdAt: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : "-"
        });
      });
      
      // 가나다순 정렬
      list.sort((a, b) => a.name.localeCompare(b.name));
      setArtists(list);
    } catch (e) {
      console.error(e);
      alert("목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 아티스트 추가
  const handleAdd = async () => {
    const name = newArtist.trim();
    if (!name) return alert("아티스트 이름을 입력해주세요.");
    
    // 중복 체크 (대소문자 무시)
    if (artists.some(a => a.name.toLowerCase() === name.toLowerCase())) {
        return alert("이미 등록된 아티스트입니다.");
    }

    if (!confirm(`'${name}'을(를) 정산 대상 아티스트로 추가하시겠습니까?`)) return;

    try {
      await setDoc(doc(db, "monitored_artists", name), {
        createdAt: new Date().toISOString(),
        active: true
      });
      alert("추가되었습니다!");
      setNewArtist(""); 
      fetchArtists();   
    } catch (e) {
      console.error(e);
      alert("추가 중 오류가 발생했습니다.");
    }
  };

  // 아티스트 삭제
  const handleDelete = async (name: string) => {
    if (!confirm(`⚠️ 정말 삭제하시겠습니까?\n\n아티스트: ${name}\n\n삭제 후에는 해당 아티스트의 재생 로그가 정산 카운트에서 제외됩니다.`)) return;

    try {
      await deleteDoc(doc(db, "monitored_artists", name));
      alert("삭제되었습니다.");
      fetchArtists();
    } catch (e) {
      console.error(e);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  // 📊 DB 실제 개수 확인 (전수 조사)
  const checkTotalCount = async () => {
    try {
      const coll = collection(db, "monitored_artists");
      const snapshot = await getCountFromServer(coll);
      alert(`📊 현재 DB에 저장된 총 아티스트 수는 [ ${snapshot.data().count.toLocaleString()}명 ] 입니다.`);
    } catch (e) {
      console.error(e);
      alert("오류가 발생했습니다.");
    }
  };

  return (
    <div>
      {/* 헤더 섹션 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px" }}>
        <div>
            <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>정산 대상 아티스트 목록</h3>
            <p style={{ color: "#666", fontSize: "14px" }}>
                등록된 아티스트의 곡만 유효 재생으로 인정됩니다.
            </p>
        </div>
        <div style={{ textAlign: "right" }}>
            {/* DB 전수 조사 버튼 */}
            <button 
                onClick={checkTotalCount}
                style={{
                    background: "#fff", border: "1px solid #ddd", padding: "6px 12px", 
                    borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "bold",
                    color: "#555", marginRight: "10px"
                }}
            >
                📊 DB 전수 조사
            </button>
            <span style={{ fontSize: "13px", color: "#888" }}>
                화면 목록: <span style={{ fontWeight: "bold", color: "#333" }}>{artists.length}</span>팀
            </span>
        </div>
      </div>

      {/* 입력폼 */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "30px", padding: "20px", background: "#f9fafb", borderRadius: "8px" }}>
        <input 
          type="text" 
          placeholder="추가할 아티스트 이름 (예: NewJeans)" 
          value={newArtist}
          onChange={(e) => setNewArtist(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          style={inputStyle}
        />
        <button onClick={handleAdd} style={primaryBtnStyle}>+ 추가</button>
      </div>

      {/* 목록 테이블 */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>⏳ 목록을 불러오는 중...</div>
      ) : (
        <div style={{ border: "1px solid #eee", borderRadius: "8px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                    <tr style={{ background: "#f3f4f6", borderBottom: "1px solid #e5e7eb", color: "#4b5563" }}>
                        <th style={{ padding: "12px 20px", textAlign: "left" }}>NO</th>
                        <th style={{ padding: "12px 20px", textAlign: "left" }}>아티스트명</th>
                        <th style={{ padding: "12px 20px", textAlign: "center" }}>등록일</th>
                        <th style={{ padding: "12px 20px", textAlign: "center" }}>관리</th>
                    </tr>
                </thead>
                <tbody>
                    {artists.length > 0 ? (
                        artists.map((artist, idx) => (
                            // 🚨 Key 에러 방지: 이름과 인덱스를 조합하여 고유 Key 생성
                            <tr key={`${artist.name}-${idx}`} style={{ borderBottom: "1px solid #f9fafb", transition: "background 0.2s" }}>
                                <td style={{ padding: "12px 20px", color: "#9ca3af", width: "60px" }}>{idx + 1}</td>
                                <td style={{ padding: "12px 20px", fontWeight: "600", color: "#1f2937" }}>
                                    {artist.name}
                                </td>
                                <td style={{ padding: "12px 20px", textAlign: "center", color: "#6b7280" }}>
                                    {artist.createdAt}
                                </td>
                                <td style={{ padding: "12px 20px", textAlign: "center" }}>
                                    <button 
                                        onClick={() => handleDelete(artist.name)}
                                        style={{
                                            padding: "6px 12px", border: "1px solid #fee2e2", background: "#fff1f2",
                                            color: "#e11d48", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "bold"
                                        }}
                                    >
                                        삭제
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>
                                등록된 아티스트가 없습니다.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// 2. 💰 정산 기준 관리 (Placeholder)
// ----------------------------------------------------------------------
function SettlementManager() {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af" }}>
      <h3 style={{ marginBottom: "10px", color: "#374151" }}>🚧 준비 중인 기능입니다</h3>
      <p>일일 최대 인정 횟수(10회), 목표 곡수, 정산 상한액 등을 여기서 수정하게 될 예정입니다.</p>
    </div>
  );
}

// ----------------------------------------------------------------------
// 3. 🏪 매장 관리 (Placeholder)
// ----------------------------------------------------------------------
function StoreManager() {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af" }}>
      <h3 style={{ marginBottom: "10px", color: "#374151" }}>🚧 준비 중인 기능입니다</h3>
      <p>점주님 계정 추가, 정보 수정, 삭제 기능을 제공할 예정입니다.</p>
    </div>
  );
}

// ----------------------------------------------------------------------
// 스타일 컴포넌트 & 상수
// ----------------------------------------------------------------------
function TabButton({ label, isActive, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      style={{
        padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer",
        fontWeight: "bold", fontSize: "15px",
        background: isActive ? "#1f2937" : "transparent",
        color: isActive ? "white" : "#6b7280",
        transition: "all 0.2s"
      }}
    >
      {label}
    </button>
  );
}

const inputStyle = { 
  flex: 1, padding: "12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "15px", outline: "none" 
};

const primaryBtnStyle = { 
  background: "#3b82f6", color: "white", border: "none", padding: "0 24px", 
  borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "15px" 
};