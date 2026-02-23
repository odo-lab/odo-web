import { NextResponse } from 'next/server';
import axios from 'axios';
// 1. 이미 검증된 초기화 인스턴스만 가져옵니다.
import { adminDb } from "@/lib/firebase-admin";
// 2. Timestamp와 FieldValue는 firestore 패키지에서 직접 가져와 충돌을 방지합니다.
import { Timestamp, FieldValue } from "firebase-admin/firestore";

// 캐시 방지 설정 (Next.js 빌드 시 정적 생성을 막음)
export const dynamic = 'force-dynamic';

/**
 * Last.fm API 스크래핑 및 저장 함수
 */
async function scrapeAndSaveUser(userId: string, from: number, to: number, targetDate: string) {
  try {
    const url = "https://ws.audioscrobbler.com/2.0/";
    const response = await axios.get(url, {
      params: {
        method: "user.getrecenttracks",
        user: userId,
        api_key: process.env.LASTFM_API_KEY,
        format: "json",
        from,
        to,
        limit: 200
      },
      timeout: 10000 // 10초 타임아웃 추가
    });

    const tracks = response.data.recenttracks?.track;
    if (!tracks) return { userId, success: true, saved: 0 };

    const trackArray = Array.isArray(tracks) ? tracks : [tracks];
    // 현재 재생 중인 트랙(@attr.nowplaying) 제외
    const completedTracks = trackArray.filter(t => !t["@attr"]?.nowplaying);

    if (completedTracks.length === 0) return { userId, success: true, saved: 0 };

    const batch = adminDb.batch();
    let savedCount = 0;

    for (const track of completedTracks) {
      const timestamp = parseInt(track.date?.uts);
      if (!timestamp) continue;

      // 지정하신 테스트용 컬렉션 명칭 확인: listening_history2
      const docRef = adminDb.collection("listening_history2").doc(`${userId}_${timestamp}`);
      
      batch.set(docRef, {
        userId,
        date: targetDate,
        timestamp: Timestamp.fromMillis(timestamp * 1000), // import한 Timestamp 사용
        artist: track.artist?.["#text"] || "Unknown Artist",
        track: track.name || "Unknown Track",
        album: track.album?.["#text"] || "Unknown Album",
        imageUrl: track.image?.[2]?.["#text"] || "",
        createdAt: FieldValue.serverTimestamp(), // import한 FieldValue 사용
      }, { merge: true });
      savedCount++;
    }

    await batch.commit();
    return { userId, success: true, saved: savedCount };
  } catch (error: any) {
    console.error(`[Scraper Error] ${userId}:`, error.message);
    return { userId, success: false, error: error.message };
  }
}

/**
 * GET Handler
 */
export async function GET(req: Request) {
  console.log("🚀 Last.fm 스크래퍼 테스트 시작 (2명)");

  try {
    // 1. monitored_users 컬렉션에서 유저 2명 가져오기 
    // (기존 syncMissingData 로직처럼 유저명 필드를 정확히 매칭해야 함)
    const usersSnapshot = await adminDb.collection("monitored_users")
      .limit(2)
      .get();

    if (usersSnapshot.empty) {
      console.warn("⚠️ monitored_users 컬렉션에 유저가 없습니다.");
      return NextResponse.json({ success: true, message: "No users found" });
    }

    // 문서 ID가 Last.fm 아이디인 경우 doc.id 사용
    const userIds = usersSnapshot.docs.map(doc => doc.id);

    // 2. KST 기준 어제 날짜 계산 (전과 동일)
    const now = new Date();
    const koreaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
    koreaTime.setDate(koreaTime.getDate() - 2);
    const targetDate = koreaTime.toISOString().split("T")[0];

    const from = Math.floor(new Date(`${targetDate}T00:00:00+09:00`).getTime() / 1000);
    const to = Math.floor(new Date(`${targetDate}T23:59:59+09:00`).getTime() / 1000);

    console.log(`📅 대상: ${targetDate} (From: ${from}, To: ${to})`);

    // 3. 순차적으로 스크래핑 실행
    const results = [];
    for (const userId of userIds) {
      const res = await scrapeAndSaveUser(userId, from, to, targetDate);
      results.push(res);
    }

    // 4. 로그 저장
    await adminDb.collection("scraper_logs").add({
      executedAt: FieldValue.serverTimestamp(),
      date: targetDate,
      type: "test_run_2_users",
      results
    });

    return NextResponse.json({ 
      success: true, 
      targetDate, 
      processedCount: userIds.length,
      results 
    });

  } catch (error: any) {
    console.error("🔥 Critical Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}