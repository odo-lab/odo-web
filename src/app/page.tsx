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
    playlists = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Playlist[];
  } catch (error) {
    console.error("데이터 로딩 실패:", error);
  }

  // ✅ 정의된 인터페이스에 맞춰 데이터를 전달합니다.
  return <HomeClient initialPlaylists={playlists} />;
}