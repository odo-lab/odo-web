"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, writeBatch, doc } from "firebase/firestore";
import { Playlist } from "@/lib/playlists";

export default function AdminPlaylistOrder() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  // 1. 초기 데이터 불러오기 (order 순으로)
  useEffect(() => {
    const fetchPlaylists = async () => {
      const q = query(collection(db, "playlists"), orderBy("order", "asc"));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Playlist[];
      setPlaylists(list);
    };
    fetchPlaylists();
  }, []);

  // 2. 드래그 종료 시 실행되는 함수
  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(playlists);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setPlaylists(items); // 먼저 UI를 업데이트 (낙관적 업데이트)

    // 3. DB에 일괄 저장 (Batch 활용)
    const batch = writeBatch(db);
    items.forEach((item, index) => {
      const ref = doc(db, "playlists", item.id);
      batch.update(ref, { order: index }); // 새로운 순서(index)를 order 필드에 저장
    });

    try {
      await batch.commit();
      alert("순서가 저장되었습니다!");
    } catch (e) {
      console.error("순서 저장 실패:", e);
    }
  };

  return (
    <div className="admin-container">
      <h2>플레이리스트 순서 조정</h2>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="playlist-list">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="drag-list">
              {playlists.map((p, index) => (
                <Draggable key={p.id} draggableId={p.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="drag-item"
                      style={{
                        padding: "16px",
                        margin: "8px 0",
                        backgroundColor: "white",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        ...provided.draggableProps.style,
                      }}
                    >
                      {p.title}
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