import { NextResponse } from 'next/server';
import axios from 'axios';
import { adminDb } from "@/lib/firebase-admin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";

export const dynamic = 'force-dynamic';

/**
 * Last.fm API 스크래핑 및 저장 함수
 */
async function scrapeAndSaveUser(userId: string, from: number, to: number, targetDate: string) {
  try {
    const apiKey = process.env.LASTFM_API_KEY?.trim();
    
    // [디버깅 1] API 키가 실제로 존재하는지 확인 (길이만 출력하여 보안 유지)
    console.log(`🔑 [${userId}] API Key 체크: ${apiKey ? `존재함 (길이: ${apiKey.length})` : '❌ 누락됨!'}`);

    if (!apiKey) {
      throw new Error("LASTFM_API_KEY 환경 변수가 없습니다.");
    }

    const apiParams = {
      method: "user.getrecenttracks",
      user: userId.trim(),
      api_key: apiKey,
      format: "json",
      from: Math.floor(from),
      to: Math.floor(to),
      limit: 200
    };

    const url = "https://ws.audioscrobbler.com/2.0/";
    
    // [디버깅 2] Axios가 실제로 만들어낸 완벽한 URL을 출력 (주소창에 복사/붙여넣기 가능)
    const requestUrl = axios.getUri({ url, params: apiParams });
    console.log(`🔗 [${userId}] 요청 URL: ${requestUrl}`);

    const response = await axios.get(url, { params: apiParams });
    
    // API 응답 내부에 에러가 포함된 경우 처리
    if (response.data.error) {
      throw new Error(`Last.fm 내부 에러 (${response.data.error}): ${response.data.message}`);
    }

    const tracks = response.data.recenttracks?.track;

    // 트랙 데이터가 아예 없거나 빈 배열인 경우
    if (!tracks || (Array.isArray(tracks) && tracks.length === 0)) {
      console.log(`ℹ️ [${userId}] 해당 기간에 청취한 곡이 없습니다. (0곡)`);
      return { userId, success: true, saved: 0 };
    }

    const trackArray = Array.isArray(tracks) ? tracks : [tracks];
    const completedTracks = trackArray.filter(t => !t["@attr"]?.nowplaying);

    if (completedTracks.length === 0) {
      console.log(`ℹ️ [${userId}] 완료된 곡이 없습니다 (현재 재생 중인 곡만 있음).`);
      return { userId, success: true, saved: 0 };
    }

    const batch = adminDb.batch();
    let savedCount = 0;

    for (const track of completedTracks) {
      const timestamp = parseInt(track.date?.uts);
      if (!timestamp) continue;

      const docId = `${userId}_${timestamp}`;
      const docRef = adminDb.collection("listening_history2").doc(docId);
      
      // [복원] 이전 스크린샷과 100% 동일하게 모든 Mbid 및 URL 필드 추가
      batch.set(docRef, {
        userId,
        date: targetDate,
        timestamp: Timestamp.fromMillis(timestamp * 1000),
        artist: track.artist?.["#text"] || track.artist?.name || "Unknown Artist",
        artistMbid: track.artist?.mbid || "",
        track: track.name || "Unknown Track",
        trackMbid: track.mbid || "",
        album: track.album?.["#text"] || "Unknown Album",
        albumMbid: track.album?.mbid || "",
        url: track.url || "",
        imageUrl: track.image?.[2]?.["#text"] || "",
        createdAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      
      savedCount++;
    }

    await batch.commit();
    console.log(`✅ [${userId}] 성공: ${savedCount}곡 저장 완료`);
    return { userId, success: true, saved: savedCount };

  } catch (error: any) {
    // [디버깅 3] 400 에러 발생 시, Last.fm이 보내준 "진짜 이유"를 추출하여 출력
    const errorMessage = error.response?.data 
      ? JSON.stringify(error.response.data) 
      : error.message;
      
    console.error(`❌ [Scraper Error] ${userId} 실패 사유:`, errorMessage);
    return { userId, success: false, error: errorMessage };
  }
}

export async function GET(req: Request) {
  console.log("=========================================");
  console.log("🚀 Last.fm 스크래퍼 디버깅 모드 시작 (2명)");
  console.log("=========================================");

  try {
    const usersSnapshot = await adminDb.collection("monitored_users").limit(2).get();

    if (usersSnapshot.empty) {
      console.warn("⚠️ monitored_users 컬렉션에 유저가 없습니다.");
      return NextResponse.json({ success: true, message: "No users found" });
    }

    const userIds = usersSnapshot.docs.map(doc => doc.id);

    // KST 기준 그저께(-2) 날짜 계산 (테스트용)
    const now = new Date();
    const koreaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
    koreaTime.setDate(koreaTime.getDate() - 2);
    
    const targetDate = koreaTime.toISOString().split("T")[0];
    const from = Math.floor(new Date(`${targetDate}T00:00:00+09:00`).getTime() / 1000);
    const to = Math.floor(new Date(`${targetDate}T23:59:59+09:00`).getTime() / 1000);

    console.log(`📅 테스트 대상 날짜: ${targetDate} (From: ${from}, To: ${to})`);

    const results = [];
    for (const userId of userIds) {
      const res = await scrapeAndSaveUser(userId, from, to, targetDate);
      results.push(res);
    }

    // 로그 저장
    await adminDb.collection("scraper_logs").add({
      executedAt: FieldValue.serverTimestamp(),
      date: targetDate,
      type: "test_run_debug",
      results
    });

    console.log("🎉 디버깅 테스트 완료!");
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
      error: error.message
    }, { status: 500 });
  }
}