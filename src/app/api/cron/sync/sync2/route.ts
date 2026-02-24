import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";

export async function GET(request: Request) {
  console.log("🚀 Cron Job 시작: syncMissingData 로직 완전 이식");

  try {
    // 1. KST 기준 어제 날짜 구하기
    const KST_OFFSET = 9 * 60 * 60 * 1000;
    const now = new Date();
    // 서버 시간을 KST로 변환 후 '어제' 날짜 문자열 추출
    const todayKst = new Date(now.getTime() + KST_OFFSET);
    const yesterdayKst = new Date(todayKst.getTime() - (24 * 60 * 60 * 1000));
    const dateStr = yesterdayKst.toISOString().split('T')[0];

    // 2. [중요] 날짜 경계값 설정 (수동 동기화 로직과 동일하게 KST 00:00:00 ~ 23:59:59)
    // 서버(UTC)에서 KST 00시를 맞추기 위해 직접 시간 차를 계산합니다.
    const start = new Date(`${dateStr}T00:00:00+09:00`);
    const end = new Date(`${dateStr}T23:59:59+09:00`);

    console.log(`📅 대상 날짜(KST): ${dateStr}`);
    console.log(`📏 쿼리 범위(UTC): ${start.toISOString()} ~ ${end.toISOString()}`);

    // 3. 기초 데이터 로드 (User, Artist)
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

    // 4. 전체 로그 분석 (syncMissingData의 2단계 로직)
    const historySnap = await adminDb.collection("listening_history2")
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

      // syncMissingData와 동일한 중복 제거 키 사용
      const dedupKey = `${userId}|${utcDate.getTime()}`;
      if (!uniqueRecords.has(dedupKey)) {
        uniqueRecords.set(dedupKey, { ...d, timestamp: utcDate, userId });
      }
    });

    // 5. KST 기준 집계
    const userDailyStats: Record<string, any> = {};

    uniqueRecords.forEach((record) => {
      if (!record.artist) return;
      const normalizedArtist = record.artist.trim().toLowerCase();
      if (!allowedArtists.has(normalizedArtist)) return;

      // syncMissingData와 동일한 KST 변환 로직
      const kstDateForRecord = new Date(record.timestamp.getTime() + KST_OFFSET);
      const rowDateStr = kstDateForRecord.toISOString().split('T')[0];
      
      // 대상 날짜와 일치하는 데이터만 선별
      if (rowDateStr !== dateStr) return;

      const userKey = `${rowDateStr}_${record.userId}`; 
      if (!userDailyStats[userKey]) {
        userDailyStats[userKey] = { date: rowDateStr, userId: record.userId, trackCounts: {} };
      }
      const trackKey = `${record.track}|${normalizedArtist}`;
      userDailyStats[userKey].trackCounts[trackKey] = (userDailyStats[userKey].trackCounts[trackKey] || 0) + 1;
    });

    // 6. 데이터 가공 (DAILY_MAX_COUNT = 10)
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
        owner_name: userInfo.owner_name,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    // 7. 배치 저장 (500개 단위 처리)
    if (finalStats.length > 0) {
      const batchSize = 500;
      for (let i = 0; i < finalStats.length; i += batchSize) {
        const batch = adminDb.batch();
        const chunk = finalStats.slice(i, i + batchSize);
        chunk.forEach(stat => {
          const ref = adminDb.collection("daily_stats2").doc(`${stat.date}_${stat.lastfm_username}`);
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