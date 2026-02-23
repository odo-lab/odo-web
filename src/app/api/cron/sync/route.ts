import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";

export async function GET(request: Request) {
  console.log("🚀 Cron Job 시작: syncMissingData와 동일한 로직으로 실행");

  try {
    // 1. KST 기준 어제 날짜 문자열 구하기
    const KST_OFFSET = 9 * 60 * 60 * 1000;
    const now = new Date();
    const todayKst = new Date(now.getTime() + KST_OFFSET);
    const yesterdayKst = new Date(todayKst.getTime() - (24 * 60 * 60 * 1000));
    const dateStr = yesterdayKst.toISOString().split('T')[0];

    // 2. 쿼리 범위 설정 (syncMissingData와 동일하게 00:00:00 ~ 23:59:59 설정)
    // UTC 기준이 아닌 로컬 타임 숫자로 생성하여 Firestore Timestamp로 변환
    const start = new Date(dateStr); start.setHours(0, 0, 0, 0);
    const end = new Date(dateStr); end.setHours(23, 59, 59, 999);

    console.log(`📅 대상 날짜: ${dateStr} (범위: ${start.toISOString()} ~ ${end.toISOString()})`);

    // 3. 기초 데이터 로드 (User, Artist) - syncMissingData 1단계
    const [usersSnap, artistsSnap] = await Promise.all([
      adminDb.collection("monitored_users").get(),
      adminDb.collection("monitored_artists").get()
    ]);

    const userMap: Record<string, any> = {};
    usersSnap.forEach(doc => {
      const d = doc.data();
      if (d.lastfm_username) userMap[d.lastfm_username] = d;
    });

    const allowedArtists = new Set<string>();
    artistsSnap.forEach(doc => {
      allowedArtists.add(doc.id.trim().toLowerCase());
    });

    // 4. 전체 로그 분석 및 중복 제거 - syncMissingData 2단계
    const historySnap = await adminDb.collection("listening_history")
      .where("timestamp", ">=", start)
      .where("timestamp", "<=", end)
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

    // 5. KST 기준 집계 (가장 중요한 부분)
    const userDailyStats: Record<string, any> = {};
    uniqueRecords.forEach((record) => {
      if (!record.artist) return;
      const normalizedArtist = record.artist.trim().toLowerCase();
      if (!allowedArtists.has(normalizedArtist)) return;

      // syncMissingData와 동일하게 9시간 더해서 날짜 판별
      const kstDateForRecord = new Date(record.timestamp.getTime() + KST_OFFSET);
      const rowDateStr = kstDateForRecord.toISOString().split('T')[0];
      
      // 쿼리 범위 내에 있더라도 변환된 KST 날짜가 대상 날짜와 다르면 제외 (경계값 보정)
      if (rowDateStr !== dateStr) return;

      const userKey = `${rowDateStr}_${record.userId}`; 
      if (!userDailyStats[userKey]) {
        userDailyStats[userKey] = { date: rowDateStr, userId: record.userId, trackCounts: {} };
      }
      const trackKey = `${record.track}|${normalizedArtist}`;
      userDailyStats[userKey].trackCounts[trackKey] = (userDailyStats[userKey].trackCounts[trackKey] || 0) + 1;
    });

    // 6. 데이터 가공 (DAILY_MAX_COUNT 적용)
    const finalStats: any[] = [];
    const DAILY_MAX_COUNT = 10;

    Object.values(userDailyStats).forEach((dailyUser: any) => {
      let validPlays = 0;
      Object.values(dailyUser.trackCounts).forEach((count: any) => {
        validPlays += Math.min(count, DAILY_MAX_COUNT);
      });

      const userInfo = userMap[dailyUser.userId] || { store_name: "Unknown", franchise: "personal", owner_name: "Unknown" };
      finalStats.push({
        date: dailyUser.date,
        lastfm_username: dailyUser.userId,
        play_count: validPlays,
        store_name: userInfo.store_name,
        franchise: userInfo.franchise,
        owner_name: userInfo.owner_name || "Unknown",
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    // 7. 배치 저장 (500개 단위) - syncMissingData 3단계
    if (finalStats.length > 0) {
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
    }

    return NextResponse.json({ success: true, date: dateStr, count: finalStats.length });

  } catch (error: any) {
    console.error("❌ Cron Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}