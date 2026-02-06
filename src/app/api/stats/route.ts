// src/app/api/stats/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getCountFromServer } from "firebase/firestore";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const todayStr = today.toISOString();

    // 1. 총 재생 수 (전체)
    const totalPlaysColl = collection(db, "listening_history");
    
    // 2. ⭐ [수정됨] 실제 운영 중인 매장 수 구하기
    // 조건: role이 'admin'이 아닌 사용자만 카운트 (즉, 일반 점주님들)
    // (나중에 lastfm_id 필드가 생긴다면 where("lastfm_id", "!=", null)로 바꾸면 더 정확합니다)
    const activeUsersQuery = query(
      collection(db, "users"),
      where("role", "!=", "admin") 
    );

    // 3. 오늘 재생 수
    const todayPlaysQuery = query(
      collection(db, "listening_history"),
      where("played_at", ">=", todayStr) 
    );

    // 병렬 실행
    const [totalPlaysSnap, activeUsersSnap, todayPlaysSnap] = await Promise.all([
      getCountFromServer(totalPlaysColl),
      getCountFromServer(activeUsersQuery), // 여기가 수정됨
      getCountFromServer(todayPlaysQuery)
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalPlays: totalPlaysSnap.data().count,
        totalUsers: activeUsersSnap.data().count, // 조건에 맞는 사람 수만 보냄
        todayPlays: todayPlaysSnap.data().count,
      }
    });

  } catch (error) {
    console.error("통계 API 에러:", error);
    return NextResponse.json({ success: false, error: "서버 에러" }, { status: 500 });
  }
}