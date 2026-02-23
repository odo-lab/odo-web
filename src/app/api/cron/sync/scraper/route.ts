import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import axios from 'axios';

// Firebase Admin 초기화 (싱글톤)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

// --- Last.fm API 스크래핑 함수 ---
async function scrapeAndSaveUser(userId: string, from: number, to: number, targetDate: string) {
  try {
    const url = "https://ws.audioscrobbler.com/2.0/";
    const response = await axios.get(url, {
      params: {
        method: "user.getrecenttracks",
        user: userId,
        api_key: process.env.LASTFM_API_KEY,
        format: "json",
        from, to, limit: 200
      }
    });

    const tracks = response.data.recenttracks?.track;
    if (!tracks) return { userId, success: true, saved: 0 };

    const trackArray = Array.isArray(tracks) ? tracks : [tracks];
    const completedTracks = trackArray.filter(t => !t["@attr"]?.nowplaying);

    const batch = db.batch();
    let savedCount = 0;

    for (const track of completedTracks) {
      const timestamp = parseInt(track.date?.uts);
      if (!timestamp) continue;

      // 테스트 컬렉션: listening_history2
      const docRef = db.collection("listening_history2").doc(`${userId}_${timestamp}`);
      
      batch.set(docRef, {
        userId,
        date: targetDate,
        timestamp: admin.firestore.Timestamp.fromMillis(timestamp * 1000),
        artist: track.artist?.["#text"] || "Unknown",
        track: track.name || "Unknown",
        album: track.album?.["#text"] || "Unknown",
        imageUrl: track.image?.[2]?.["#text"] || "",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      savedCount++;
    }

    if (savedCount > 0) await batch.commit();
    return { userId, success: true, saved: savedCount };
  } catch (error: any) {
    console.error(`[Scraper Error] ${userId}:`, error.message);
    return { userId, success: false, error: error.message };
  }
}

// --- API Handler ---
export async function GET(req: Request) {
  try {
    // 1. monitored_user 컬렉션에서 유저 2명만 가져오기 (테스트용 limit)
    console.log("Fetching monitored users from Firestore...");
    const usersSnapshot = await db.collection("monitored_user")
      .limit(2) // 테스트를 위해 2명으로 제한
      .get();

    if (usersSnapshot.empty) {
      return NextResponse.json({ success: true, message: "No monitored users found." });
    }

    // 문서 ID 또는 별도 필드(예: lastfmId)를 유저명으로 사용 (DB 구조에 맞춰 수정 가능)
    const userIds = usersSnapshot.docs.map(doc => doc.id); 

    // 2. 날짜 설정 (한국 시간 기준 어제)
    const now = new Date();
    const koreaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
    koreaTime.setDate(koreaTime.getDate() - 1);
    const targetDate = koreaTime.toISOString().split("T")[0];

    const from = Math.floor(new Date(`${targetDate}T00:00:00+09:00`).getTime() / 1000);
    const to = Math.floor(new Date(`${targetDate}T23:59:59+09:00`).getTime() / 1000);

    // 3. 순차 처리 (테스트 2명이라 병렬 없이 진행)
    const results = [];
    for (const userId of userIds) {
      const result = await scrapeAndSaveUser(userId, from, to, targetDate);
      results.push(result);
    }

    // 4. 로그 저장
    await db.collection("scraper_logs").add({
      executedAt: admin.firestore.FieldValue.serverTimestamp(),
      date: targetDate,
      type: "cron_nextjs_test",
      targetCollection: "listening_history2",
      totalUsers: userIds.length,
      results
    });

    return NextResponse.json({ 
      success: true, 
      targetDate, 
      message: "Test run completed for 2 users.",
      results 
    });

  } catch (error: any) {
    console.error("Critical Scraper Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}