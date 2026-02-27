import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lastfmId = searchParams.get("id");
  const myUid = searchParams.get("myUid"); // 👈 프론트에서 내 UID를 같이 보내도록 추가

  if (!lastfmId) return NextResponse.json({ error: "아이디가 누락되었습니다." }, { status: 400 });

  try {
    const docRef = adminDb.collection("monitored_users").doc(lastfmId);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data();
      // 🔒 UID를 밖으로 주지 않고, 서버 안에서 "남의 것인지" 비교만 하고 끝냅니다.
      const isDuplicate = data?.uid !== myUid; 
      return NextResponse.json({ exists: true, isDuplicate });
    }

    return NextResponse.json({ exists: false, isDuplicate: false });
  } catch (error) {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}