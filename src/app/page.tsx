import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import HomeClient from "@/components/HomeClient";
import type { Playlist } from "@/components/HomeClient";

// 💡 ISR: 1시간마다 캐시 갱신 (DB 비용 절감)
export const revalidate = 3600; 

export default async function Page() {
  let playlists: Playlist[] = [];

  try {
    // ✅ 서버 사이드에서 데이터 페칭
    const querySnapshot = await getDocs(collection(db, "playlists"));
    
    playlists = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      
      // 🚨 파이어베이스 Timestamp 객체를 직렬화 가능한 문자열로 변환
      let formattedCreatedAt = data.createdAt;
      if (formattedCreatedAt && typeof formattedCreatedAt.toDate === "function") {
        formattedCreatedAt = formattedCreatedAt.toDate().toISOString();
      }

      // 💡 타입스크립트 에러 해결: as unknown as Playlist 를 사용하여 타입 강제 지정
      return {
        ...data,
        id: doc.id,
        createdAt: formattedCreatedAt
      } as unknown as Playlist; 
    });
  } catch (error) {
    console.error("데이터 로딩 실패:", error);
  }

  // ✅ 정의된 인터페이스에 맞춰 데이터를 전달합니다.
  return <HomeClient initialPlaylists={playlists} />;
}