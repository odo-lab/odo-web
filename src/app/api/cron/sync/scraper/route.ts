import { NextResponse } from 'next/server';
import axios from 'axios';
import { adminDb } from "@/lib/firebase-admin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";

export const dynamic = 'force-dynamic';

/**
 * Last.fm API 스크래핑 및 저장 함수 (페이지네이션 완벽 적용)
 */
async function scrapeAndSaveUser(userId: string, from: number, to: number, targetDate: string) {
  try {
    const apiKey = process.env.LASTFM_API_KEY?.trim();
    if (!apiKey) throw new Error("LASTFM_API_KEY 환경 변수가 없습니다.");

    // 🔥 [추가] 누락 방지를 위한 페이지네이션 변수 설정
    let currentPage = 1;
    let totalPages = 1;
    let savedCount = 0;
    
    // 🔥 [추가] Firestore 500개 한도 초과 에러를 막기 위한 배치 분할
    const MAX_BATCH_SIZE = 450;
    let batch = adminDb.batch();
    let currentBatchSize = 0;

    const url = "https://ws.audioscrobbler.com/2.0/";

    // 🔥 [추가] 페이지가 끝날 때까지 반복해서 계속 가져옵니다.
    while (currentPage <= totalPages) {
      const apiParams = {
        method: "user.getrecenttracks",
        user: userId.trim(),
        api_key: apiKey,
        format: "json",
        from: Math.floor(from),
        to: Math.floor(to),
        limit: 200, // 한 번에 최대 200개씩
        page: currentPage // 현재 페이지 요청
      };

      const response = await axios.get(url, { params: apiParams });
      
      if (response.data.error) {
        throw new Error(`Last.fm 내부 에러: ${response.data.message}`);
      }

      const recentTracks = response.data.recenttracks;
      const tracks = recentTracks?.track;

      // 트랙이 없으면 루프 즉시 종료
      if (!tracks || (Array.isArray(tracks) && tracks.length === 0)) {
        break;
      }

      // 🔥 Last.fm이 알려주는 "이 유저의 총 페이지 수" 갱신
      if (recentTracks["@attr"] && recentTracks["@attr"].totalPages) {
        totalPages = parseInt(recentTracks["@attr"].totalPages, 10);
      }

      const trackArray = Array.isArray(tracks) ? tracks : [tracks];
      const completedTracks = trackArray.filter(t => !t["@attr"]?.nowplaying);

      for (const track of completedTracks) {
        const timestamp = parseInt(track.date?.uts);
        if (!timestamp) continue;

        const docId = `${userId}_${timestamp}`;
        const docRef = adminDb.collection("listening_history2").doc(docId); // 실전용 DB
        
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
        currentBatchSize++;

        // 🔥 Firestore 배치 한도(450) 도달 시 중간 저장하고 새 바구니 준비
        if (currentBatchSize >= MAX_BATCH_SIZE) {
          await batch.commit();
          batch = adminDb.batch();
          currentBatchSize = 0;
        }
      }
      
      console.log(`ℹ️ [${userId}] ${currentPage}/${totalPages} 페이지 수집 완료`);
      currentPage++; // 다음 페이지로 이동
    }

    // 🔥 루프가 끝난 후, 바구니에 남은 자투리 곡들이 있다면 최종 저장
    if (currentBatchSize > 0) {
      await batch.commit();
    }

    console.log(`✅ [${userId}] 총 ${savedCount}곡 누락 없이 저장 완료!`);
    return { userId, success: true, saved: savedCount };

  } catch (error: any) {
    const errorMessage = error.response?.data ? JSON.stringify(error.response.data) : error.message;
    console.error(`❌ [Scraper Error] ${userId} 실패 사유:`, errorMessage);
    return { userId, success: false, error: errorMessage };
  }
}

export async function GET(req: Request) {
  console.log("=========================================");
  console.log("🚀 Last.fm 스크래퍼 실전 모드 (무한 페이지네이션 적용)");
  console.log("=========================================");

  try {
    // 1. 전체 유저 가져오기 (.limit 제한 없음)
    const usersSnapshot = await adminDb.collection("monitored_users").get();

    if (usersSnapshot.empty) {
      console.warn("⚠️ monitored_users 컬렉션에 유저가 없습니다.");
      return NextResponse.json({ success: true, message: "No users found" });
    }

    const userIds = usersSnapshot.docs.map(doc => doc.id);

    // 2. 정확한 어제(-1) 날짜 계산
    const now = new Date();
    const koreaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
    koreaTime.setDate(koreaTime.getDate() - 1); 
    
    const targetDate = koreaTime.toISOString().split("T")[0];
    const from = Math.floor(new Date(`${targetDate}T00:00:00+09:00`).getTime() / 1000);
    const to = Math.floor(new Date(`${targetDate}T23:59:59+09:00`).getTime() / 1000);

    console.log(`📅 수집 대상 날짜: ${targetDate} (From: ${from}, To: ${to})`);

    const results = [];
    for (const userId of userIds) {
      const res = await scrapeAndSaveUser(userId, from, to, targetDate);
      results.push(res);
    }

    // 3. 로그 저장
    await adminDb.collection("scraper_logs").add({
      executedAt: FieldValue.serverTimestamp(),
      date: targetDate,
      type: "daily_run_production", 
      results
    });

    console.log("🎉 전체 유저 데이터 스크래핑 완료!");
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