import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";

export async function GET(request: Request) {
  try {
    // 1. 날짜 설정 (KST 어제)
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const yesterday = new Date(now.getTime() + kstOffset - (24 * 60 * 60 * 1000));
    const dateStr = yesterday.toISOString().split('T')[0];

    // 2. 기초 데이터 로드 (Admin SDK용 get() 사용)
    const [usersSnap, artistsSnap] = await Promise.all([
      adminDb.collection("monitored_users").get(),
      adminDb.collection("monitored_artists").get()
    ]);

    const userMap: any = {};
    usersSnap.forEach(d => {
      const data = d.data();
      if (data.lastfm_username) userMap[data.lastfm_username] = data;
    });
    const allowedArtists = new Set(artistsSnap.docs.map(d => d.id.trim().toLowerCase()));

    // 3. 어제 자 로그 집계 (타임스탬프 쿼리)
    const start = admin.firestore.Timestamp.fromDate(new Date(dateStr + "T00:00:00Z"));
    const end = admin.firestore.Timestamp.fromDate(new Date(dateStr + "T23:59:59Z"));
    
    const historySnap = await adminDb.collection("listening_history")
      .where("timestamp", ">=", start)
      .where("timestamp", "<=", end)
      .get();

    const uniqueRecords = new Map();
    historySnap.forEach(doc => {
      const d = doc.data();
      const userId = d.userId || d.user_id;
      // Admin SDK에서는 timestamp.toDate() 사용
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

    // 5. 배치 저장 (adminDb.batch)
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
    return NextResponse.json({ success: true, date: dateStr });

  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}