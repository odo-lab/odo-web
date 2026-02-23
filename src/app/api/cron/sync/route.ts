import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";

export async function GET(request: Request) {
  console.log("🚀 Cron Job 시작: 기존 대시보드 로직 기반 데이터 동기화");

  try {
    // 1. 날짜 설정 (KST 기준 어제 구하기)
    const now = new Date();
    const KST_OFFSET = 9 * 60 * 60 * 1000;
    const todayKst = new Date(now.getTime() + KST_OFFSET);
    const yesterdayKst = new Date(todayKst.getTime() - (24 * 60 * 60 * 1000));
    const dateStr = yesterdayKst.toISOString().split('T')[0];

    // 쿼리 범위 설정 (기존 로직 방식: KST 날짜의 시작과 끝을 UTC로 계산)
    const start = new Date(dateStr + "T00:00:00Z"); // 실제로는 한국 시간 09시가 될 수 있으므로 주의 필요
    // 더 정확하게는 기존 로직의 start/end 설정을 따릅니다.
    const queryStart = new Date(new Date(dateStr).setHours(0,0,0,0));
    const queryEnd = new Date(new Date(dateStr).setHours(23,59,59,999));

    console.log(`📅 집계 대상 날짜(KST): ${dateStr}`);

    // 2. 기초 데이터 로드 (User, Artist)
    const [usersSnap, artistsSnap] = await Promise.all([
      adminDb.collection("monitored_users").get(),
      adminDb.collection("monitored_artists").get()
    ]);

    const userMap: Record<string, any> = {};
    usersSnap.forEach(d => {
      const data = d.data();
      if (data.lastfm_username) userMap[data.lastfm_username] = data;
    });

    const allowedArtists = new Set(artistsSnap.docs.map(d => d.id.trim().toLowerCase()));

    // 3. 로그 분석 (기존 syncMissingData 로직 이식)
    const historySnap = await adminDb.collection("listening_history")
      .where("timestamp", ">=", queryStart)
      .where("timestamp", "<=", queryEnd)
      .get();

    const uniqueRecords = new Map();
    historySnap.forEach(doc => {
      const d = doc.data();
      const userId = d.userId || d.user_id;
      if (!userId) return;
      
      const utcDate = d.timestamp instanceof admin.firestore.Timestamp 
        ? d.timestamp.toDate() 
        : new Date(d.timestamp);
      
      const dedupKey = `${userId}|${utcDate.getTime()}`;
      if (!uniqueRecords.has(dedupKey)) {
        uniqueRecords.set(dedupKey, { ...d, timestamp: utcDate, userId });
      }
    });

    // 4. KST 기준 집계
    const userDailyStats: Record<string, any> = {};
    uniqueRecords.forEach((record) => {
      if (!record.artist) return;
      const normalizedArtist = record.artist.trim().toLowerCase();
      if (!allowedArtists.has(normalizedArtist)) return;

      // 로그의 timestamp에 9시간을 더해 한국 날짜 판별
      const kstDate = new Date(record.timestamp.getTime() + KST_OFFSET);
      const rowDateStr = kstDate.toISOString().split('T')[0];
      
      if (rowDateStr !== dateStr) return; // 정확히 어제 데이터만 걸러냄

      const userKey = record.userId;
      if (!userDailyStats[userKey]) {
        userDailyStats[userKey] = { trackCounts: {} };
      }
      const trackKey = `${record.track}|${normalizedArtist}`;
      userDailyStats[userKey].trackCounts[trackKey] = (userDailyStats[userKey].trackCounts[trackKey] || 0) + 1;
    });

    // 5. 데이터 가공 및 500개씩 끊어서 Batch 저장
    const finalStats: any[] = [];
    Object.entries(userDailyStats).forEach(([userId, data]: any) => {
      let validPlays = 0;
      Object.values(data.trackCounts).forEach((count: any) => {
        validPlays += Math.min(count, 10); // DAILY_MAX_COUNT = 10
      });

      const userInfo = userMap[userId] || { store_name: "Unknown", franchise: "personal", owner_name: "Unknown" };
      finalStats.push({
        date: dateStr,
        lastfm_username: userId,
        play_count: validPlays,
        store_name: userInfo.store_name,
        franchise: userInfo.franchise,
        owner_name: userInfo.owner_name,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    // Batch Commit (500개 단위 처리)
    const batchSize = 500;
    for (let i = 0; i < finalStats.length; i += batchSize) {
      const batch = adminDb.batch();
      const chunk = finalStats.slice(i, i + batchSize);
      chunk.forEach(stat => {
        const ref = adminDb.collection("daily_stats").doc(`${stat.date}_${stat.lastfm_username}`);
        batch.set(ref, stat, { merge: true });
      });
      await batch.commit();
    }

    return NextResponse.json({ success: true, date: dateStr, count: finalStats.length });

  } catch (error: any) {
    console.error("❌ Cron Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}