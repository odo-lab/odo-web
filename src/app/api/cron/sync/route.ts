import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";

export async function GET(request: Request) {
  console.log("🚀 Cron Job 시작: /api/cron/sync");

  // [디버깅] 환경 변수 로드 상태 확인 (값은 노출 안함)
  console.log("🛠️ 환경 변수 체크:", {
    projectId: process.env.FIREBASE_PROJECT_ID ? "✅ 있음" : "❌ 없음",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? "✅ 있음" : "❌ 없음",
    privateKey: process.env.FIREBASE_PRIVATE_KEY ? "✅ 있음" : "❌ 없음",
    keyLength: process.env.FIREBASE_PRIVATE_KEY?.length,
  });

  try {
    // 1. 날짜 설정 (KST 어제)
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const yesterday = new Date(now.getTime() + kstOffset - (24 * 60 * 60 * 1000));
    const dateStr = yesterday.toISOString().split('T')[0];
    console.log(`📅 집계 대상 날짜: ${dateStr}`);

    // 2. 기초 데이터 로드 (여기서 인증 에러가 주로 발생함)
    console.log("📡 데이터베이스 쿼리 시작 (monitored_users, monitored_artists)");
    const [usersSnap, artistsSnap] = await Promise.all([
      adminDb.collection("monitored_users").get(),
      adminDb.collection("monitored_artists").get()
    ]);
    console.log(`✅ 데이터 로드 성공: 유저 ${usersSnap.size}명, 아티스트 ${artistsSnap.size}명`);

    const userMap: any = {};
    usersSnap.forEach(d => {
      const data = d.data();
      if (data.lastfm_username) userMap[data.lastfm_username] = data;
    });
    const allowedArtists = new Set(artistsSnap.docs.map(d => d.id.trim().toLowerCase()));

    // 3. 어제 자 로그 집계 (타임스탬프 쿼리)
    const start = admin.firestore.Timestamp.fromDate(new Date(dateStr + "T00:00:00Z"));
    const end = admin.firestore.Timestamp.fromDate(new Date(dateStr + "T23:59:59Z"));
    
    console.log("📡 listening_history 조회 시작...");
    const historySnap = await adminDb.collection("listening_history")
      .where("timestamp", ">=", start)
      .where("timestamp", "<=", end)
      .get();
    console.log(`✅ 기록 조회 성공: ${historySnap.size}개`);

    const uniqueRecords = new Map();
    historySnap.forEach(doc => {
      const d = doc.data();
      const userId = d.userId || d.user_id;
      const ts = d.timestamp instanceof admin.firestore.Timestamp ? d.timestamp.toDate().getTime() : new Date(d.timestamp).getTime();
      uniqueRecords.set(`${userId}|${ts}`, { ...d, userId });
    });

    // 4. 집계 로직
    const userDailyStats: any = {};
    uniqueRecords.forEach((record) => {
      const artist = record.artist?.trim().toLowerCase();
      if (!allowedArtists.has(artist)) return;
      if (!userDailyStats[record.userId]) userDailyStats[record.userId] = { trackCounts: {} };
      const trackKey = `${record.track}|${artist}`;
      userDailyStats[record.userId].trackCounts[trackKey] = (userDailyStats[record.userId].trackCounts[trackKey] || 0) + 1;
    });

    // 5. 배치 저장
    console.log("💾 일일 통계 배치 저장 중...");
    const batch = adminDb.batch();
    Object.entries(userDailyStats).forEach(([userId, data]: any) => {
      let plays = 0;
      Object.values(data.trackCounts).forEach((c: any) => plays += Math.min(c, 10));
      const info = userMap[userId] || {};
      const ref = adminDb.collection("daily_stats").doc(`${dateStr}_${userId}`);
      
      batch.set(ref, {
        date: dateStr,
        lastfm_username: userId,
        play_count: plays,
        store_name: info.store_name || "Unknown",
        franchise: info.franchise || "personal",
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });

    await batch.commit();
    console.log("🎉 Cron Job 완료!");
    
    return NextResponse.json({ 
      success: true, 
      date: dateStr,
      processedUsers: Object.keys(userDailyStats).length 
    });

  } catch (error: any) {
    // [디버깅] 에러 로그 상세 출력
    console.error("❌ Cron Error 상세:");
    console.error("- 메시지:", error.message);
    console.error("- 코드:", error.code); // 여기서 16이 찍히면 인증 문제입니다.
    console.error("- 스택:", error.stack);

    return NextResponse.json({ 
      success: false, 
      error: error.message,
      errorCode: error.code,
      debug: "Vercel Runtime Logs를 확인하세요."
    }, { status: 500 });
  }
}