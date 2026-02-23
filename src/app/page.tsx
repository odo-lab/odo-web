import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import HomeClient from "@/components/HomeClient";
import type { Playlist } from "@/components/HomeClient";

interface HomeClientProps {
  initialPlaylists: Playlist[];
}

// 💡 마법의 코드 (ISR): 3600초(1시간)마다 딱 한 번만 파이어베이스 DB를 읽어옵니다.
// 그 사이(1시간 내)에 들어오는 수만 명의 유저에게는 DB 조회 비용 0원으로 서버 캐시를 보여줍니다!
export const revalidate = 3600; 

export default async function Page() {
  let playlists: Playlist[] = [];

  try {
    // ✅ 유저의 브라우저가 아닌 '서버'에서 파이어베이스 데이터를 안전하게 가져옵니다.
    const querySnapshot = await getDocs(collection(db, "playlists"));
    playlists = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Playlist[];
  } catch (error) {
    console.error("서버에서 플레이리스트 로딩 실패:", error);
  }

  // ✅ 완성된 데이터를 자식 컴포넌트(HomeClient)에게 props로 넘겨줍니다.
  // page.tsx 수정
  return <HomeClient initialPlaylists={playlists as Playlist[]} />;
}