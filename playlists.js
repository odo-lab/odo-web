import { db } from "@/lib/firebase"; // Firebase 설정 파일
import { doc, setDoc } from "firebase/firestore";
import { PLAYLISTS } from "@/lib/playlists"; // 기존 데이터

export const uploadPlaylistsToDB = async () => {
  try {
    const promises = PLAYLISTS.map((playlist) => {
      // id를 문서 ID로 사용하여 playlists 컬렉션에 저장
      const docRef = doc(db, "playlists", playlist.id);
      return setDoc(docRef, playlist);
    });

    await Promise.all(promises);
    console.log("모든 데이터가 성공적으로 DB에 등록되었습니다! 🚀");
  } catch (error) {
    console.error("데이터 업로드 중 오류 발생:", error);
  }
};