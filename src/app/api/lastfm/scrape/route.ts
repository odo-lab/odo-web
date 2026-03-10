import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin"; // 표준 방식: 초기화된 db 객체 가져오기
import * as admin from "firebase-admin";
import axios from "axios";
import http from "http";
import https from "https";

// Vercel Pro 플랜 등에서 타임아웃을 연장해야 할 경우 주석 해제 (단위: 초)
// export const maxDuration = 60; 

const LASTFM_API_KEY = process.env.LASTFM_API_KEY || "216273c8ac319bbc4e9ec633fc69199e";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const axiosInstance = axios.create({
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
  timeout: 10000,
});

/**
 * 특정 사용자의 청취 기록을 가져와 Firestore에 저장하는 핵심 함수
 */
async function scrapeAndSaveUser(userId: string, from: number, to: number, targetDate: string) {
  try {
    let currentPage = 1;
    let totalPages = 1;
    let savedCount = 0;
    let skipCount = 0;
    
    // Firestore 배치 처리는 최대 500개까지 가능 (안전하게 450으로 설정)
    const MAX_BATCH_SIZE = 450;
    let batch = adminDb.batch();
    let currentBatchSize = 0;

    const url = "https://ws.audioscrobbler.com/2.0/";

    while (currentPage <= totalPages) {
      const apiParams = {
        method: "user.getrecenttracks",
        user: userId.trim(),
        api_key: LASTFM_API_KEY,
        format: "json",
        from: Math.floor(from),
        to: Math.floor(to),
        limit: 200,
        page: currentPage
      };

      let success = false;
      let retryCount = 0;
      const maxRetries = 3;
      let response: any;

      while (!success && retryCount < maxRetries) {
        try {
          response = await axiosInstance.get(url, { params: apiParams });
          if (response.data.error) throw new Error(response.data.message);
          success = true;
        } catch (err: any) {
          retryCount++;
          console.warn(`⚠️ API Retry [${retryCount}/${maxRetries}] for ${userId}: ${err.message}`);
          if (retryCount >= maxRetries) throw err;
          await delay(2000 * Math.pow(1.5, retryCount));
        }
      }

      if (!response) break;

      const recentTracks = response.data.recenttracks;
      const tracks = recentTracks?.track;
      if (!tracks || (Array.isArray(tracks) && tracks.length === 0)) break;

      if (recentTracks["@attr"]?.totalPages) {
        totalPages = parseInt(recentTracks["@attr"].totalPages, 10);
      }

      const trackArray = Array.isArray(tracks) ? tracks : [tracks];
      const completedTracks = trackArray.filter((t: any) => !t["@attr"]?.nowplaying);

      for (const track of completedTracks) {
        const timestamp = parseInt(track.date?.uts);
        if (!timestamp) {
          skipCount++;
          continue;
        }

        const docId = `${userId}_${timestamp}`;
        const docRef = adminDb.collection("listening_history").doc(docId);
        
        batch.set(docRef, {
          userId: userId,
          date: targetDate, // 예: "2024-03-10_to_2024-03-10"
          timestamp: admin.firestore.Timestamp.fromMillis(timestamp * 1000),
          artist: track.artist?.["#text"] || track.artist?.name || "Unknown Artist",
          track: track.name || "Unknown Track",
          album: track.album?.["#text"] || "Unknown Album",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        
        savedCount++;
        currentBatchSize++;

        if (currentBatchSize >= MAX_BATCH_SIZE) {
          await batch.commit();
          batch = adminDb.batch(); 
          currentBatchSize = 0;
        }
      }
      
      currentPage++; 
      await delay(300); // Last.fm API Rate Limit 보호
    }

    // 남은 배치 데이터 커밋
    if (currentBatchSize > 0) {
      await batch.commit();
    }

    return { success: true, saved: savedCount, skipped: skipCount };
  } catch (error: any) {
    console.error(`❌ Scraper Error [${userId}]:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 2. Next.js POST API 핸들러
 */
export async function POST(req: Request) {
  console.log("🚀 Scrape Job 시작: 사용자 데이터 수집");

  try {
    const body = await req.json();
    const { username, startDate, endDate } = body;

    if (!username || !startDate || !endDate) {
      console.error("❌ 파라미터 누락:", { username, startDate, endDate });
      return NextResponse.json({ success: false, message: "파라미터가 누락되었습니다." }, { status: 400 });
    }

    // 1. [중요] 날짜 경계값 설정 (표준 코드와 동일하게 KST 00:00:00 ~ 23:59:59)
    const startOfDayKST = new Date(`${startDate}T00:00:00+09:00`);
    const endOfDayKST = new Date(`${endDate}T23:59:59+09:00`);
    
    // Last.fm API는 Unix Timestamp(초)를 요구함
    const fromTimestamp = Math.floor(startOfDayKST.getTime() / 1000);
    const toTimestamp = Math.floor(endOfDayKST.getTime() / 1000);

    console.log(`📅 대상 유저: ${username}`);
    console.log(`📏 KST 쿼리 범위: ${startOfDayKST.toISOString()} ~ ${endOfDayKST.toISOString()}`);

    // 2. 스크래핑 및 저장 함수 실행
    const result = await scrapeAndSaveUser(username, fromTimestamp, toTimestamp, `${startDate}_to_${endDate}`);

    if (result.success) {
      console.log(`✅ 수집 완료: ${result.saved}곡 저장됨`);
      return NextResponse.json({ 
        success: true, 
        message: `데이터 수집 완료 (저장: ${result.saved}곡)` 
      });
    } else {
      console.error(`❌ 수집 실패 (내부 에러): ${result.error}`);
      return NextResponse.json({ 
        success: false, 
        message: "수집 실패", 
        error: result.error 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("❌ POST API Error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "서버 오류", 
      error: error.message 
    }, { status: 500 });
  }
}