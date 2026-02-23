import { NextResponse } from "next/server";
import { db } from "@/lib/firebase"; // 서버용 firebase-admin 설정을 권장하지만 기존 설정 활용 가능
import { collection, getDocs, query, where, doc, writeBatch, Timestamp } from "firebase/firestore";

export async function GET(request: Request) {
  try {
    // 1. 날짜 설정 (KST 어제)
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const yesterday = new Date(now.getTime() + kstOffset - (24 * 60 * 60 * 1000));
    const dateStr = yesterday.toISOString().split('T')[0];

    // 2. 기초 데이터 로드 (유저/아티스트)
    const [usersSnap, artistsSnap] = await Promise.all([
      getDocs(collection(db, "monitored_users")),
      getDocs(collection(db, "monitored_artists"))
    ]);

    const userMap: any = {};
    usersSnap.forEach(d => {
      const data = d.data();
      if (data.lastfm_username) userMap[data.lastfm_username] = data;
    });
    const allowedArtists = new Set(artistsSnap.docs.map(d => d.id.trim().toLowerCase()));

    // 3. 어제 자 로그 집계
    const start = new Date(dateStr + "T00:00:00Z");
    const end = new Date(dateStr + "T23:59:59Z");
    
    const qHistory = query(collection(db, "listening_history"), where("timestamp", ">=", start), where("timestamp", "<=", end));
    const historySnap = await getDocs(qHistory);

    const uniqueRecords = new Map();
    historySnap.forEach(doc => {
      const d = doc.data();
      const userId = d.userId || d.user_id;
      const ts = d.timestamp instanceof Timestamp ? d.timestamp.toDate().getTime() : new Date(d.timestamp).getTime();
      uniqueRecords.set(`${userId}|${ts}`, { ...d, userId });
    });

    // 4. 집계 및 저장
    const userDailyStats: any = {};
    uniqueRecords.forEach((record) => {
      const artist = record.artist?.trim().toLowerCase();
      if (!allowedArtists.has(artist)) return;
      if (!userDailyStats[record.userId]) userDailyStats[record.userId] = { trackCounts: {} };
      const trackKey = `${record.track}|${artist}`;
      userDailyStats[record.userId].trackCounts[trackKey] = (userDailyStats[record.userId].trackCounts[trackKey] || 0) + 1;
    });

    const batch = writeBatch(db);
    Object.entries(userDailyStats).forEach(([userId, data]: any) => {
      let plays = 0;
      Object.values(data.trackCounts).forEach((c: any) => plays += Math.min(c, 10));
      const info = userMap[userId] || {};
      const ref = doc(db, "daily_stats", `${dateStr}_${userId}`);
      batch.set(ref, {
        date: dateStr, lastfm_username: userId, play_count: plays,
        store_name: info.store_name || "Unknown", franchise: info.franchise || "personal",
        updatedAt: Timestamp.now()
      }, { merge: true });
    });

    await batch.commit();
    return NextResponse.json({ success: true, date: dateStr });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}