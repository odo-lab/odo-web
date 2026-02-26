"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, getDocs, doc, setDoc, deleteDoc, 
  query, orderBy, writeBatch 
} from "firebase/firestore";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import PlaylistManager from "@/components/PlaylistManager";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("playlist");

  return (
    <div style={{ padding: "40px", maxWidth: "1000px", margin: "0 auto" }}>
      <h2 style={{ color: "#444", fontSize: "24px", fontWeight: "bold", marginBottom: "30px" }}>⚙️ 환경 설정</h2>

      <div style={{ display: "flex", gap: "10px", marginBottom: "30px", borderBottom: "1px solid #ddd", paddingBottom: "10px" }}>
        <TabButton label="🧑‍🎤 아티스트 관리" isActive={activeTab === "artist"} onClick={() => setActiveTab("artist")} />
        <TabButton label="💰 정산 기준 관리" isActive={activeTab === "settlement"} onClick={() => setActiveTab("settlement")} />
        <TabButton label="🎵 플리 등록" isActive={activeTab === "playlist"} onClick={() => setActiveTab("playlist")} />
        <TabButton label="🔃 노출 순서 관리" isActive={activeTab === "order"} onClick={() => setActiveTab("order")} />
      </div>

      <div style={{ background: "white", padding: "30px", borderRadius: "12px", border: "1px solid #eee", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
        {activeTab === "artist" && <ArtistManager />}
        {activeTab === "settlement" && <SettlementManager />}
        {activeTab === "playlist" && <PlaylistManager />}
        {activeTab === "order" && <PlaylistOrderManager />}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 1. 🧑‍🎤 아티스트 관리 컴포넌트
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
      <div style={{ color: "#444", display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px" }}>
        <h3>정산 대상 아티스트</h3>
        <span>화면 목록: {artists.length}팀</span>
      </div>
      <div style={{ color: "#444", display: "flex", gap: "10px", marginBottom: "30px", padding: "20px", background: "#f9fafb", borderRadius: "8px" }}>
        <input type="text" placeholder="아티스트 이름" value={newArtist} onChange={(e) => setNewArtist(e.target.value)} style={inputStyle} />
        <button onClick={handleAdd} style={primaryBtnStyle}>+ 추가</button>
      </div>
      <table style={{ color: "#444", width: "100%", fontSize: "14px" }}>
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
// 2. 💰 정산 기준 관리 (준비 중)
// ----------------------------------------------------------------------
function SettlementManager() {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af" }}>
      <h3>🚧 준비 중인 기능입니다</h3>
    </div>
  );
}

// ----------------------------------------------------------------------
// 3. 💿 플레이리스트 등록 컴포넌트
// ----------------------------------------------------------------------


// ----------------------------------------------------------------------
// 4. 🔃 플레이리스트 순서 관리 컴포넌트 (Drag & Drop)
// ----------------------------------------------------------------------
function PlaylistOrderManager() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchList = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "playlists"), orderBy("order", "asc"));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({...doc.data() , id: doc.id}));
        setList(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchList();
  }, []);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(list);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setList(items);
  };

  const handleSaveOrder = async () => {
    if (!confirm("변경된 순서를 저장하시겠습니까?")) return;
    setSaving(true);
    const batch = writeBatch(db);
    list.forEach((item, index) => {
      batch.update(doc(db, "playlists", item.id), { order: index });
    });
    try {
      await batch.commit();
      alert("순서가 저장되었습니다! 🚀");
    } catch (e) { alert("저장 실패"); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ textAlign: "center", padding: "40px" }}>데이터 로딩 중...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", alignItems: "center" }}>
        <h3 style={{ color: "#444" }}>플레이리스트 노출 순서</h3>
        <button onClick={handleSaveOrder} disabled={saving} style={{ ...primaryBtnStyle, background: "#10b981" }}>
          {saving ? "저장 중..." : "순서 확정 및 저장"}
        </button>
      </div>
      <p style={{ fontSize: "13px", color: "#666", marginBottom: "20px" }}>항목 좌측의 ☰ 핸들을 잡고 드래그하여 순서를 조절하세요.</p>
      
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="playlist-order">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {list.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      style={{
                        ...provided.draggableProps.style,
                        padding: "15px",
                        background: snapshot.isDragging ? "#f0f7ff" : "white",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "15px",
                        boxShadow: snapshot.isDragging ? "0 5px 15px rgba(0,0,0,0.1)" : "none"
                      }}
                    >
                      <div {...provided.dragHandleProps} style={{ cursor: "grab", color: "#999", fontSize: "18px" }}>☰</div>
                      <img src={item.image} alt="" style={{ width: "40px", height: "40px", borderRadius: "4px", objectFit: "cover" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "bold", fontSize: "14px", color: "#333" }}>{item.title}</div>
                        <div style={{ fontSize: "12px", color: "#888" }}>{item.genre} · {item.industry}</div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

// ----------------------------------------------------------------------
// 스타일 및 공통 컴포넌트
// ----------------------------------------------------------------------
const formLabelStyle = { display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600", color: "#4b5563" };
const inputStyle = { flex: 1, padding: "12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "15px", outline: "none", width: "100%" };
const primaryBtnStyle = { background: "#3b82f6", color: "white", border: "none", padding: "10px 24px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "15px" };

function TabButton({ label, isActive, onClick }: any) {
  return (
    <button onClick={onClick} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", background: isActive ? "#1f2937" : "transparent", color: isActive ? "white" : "#6b7280", transition: "all 0.2s" }}>
      {label}
    </button>
  );
}