// src/app/api/check-lastfm-id/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lastfmId = searchParams.get("id");

  if (!lastfmId) {
    return NextResponse.json({ error: "아이디가 누락되었습니다." }, { status: 400 });
  }

  try {
    // 서버(Admin) 권한으로 DB 조회 (보안 규칙의 영향을 받지 않음)
    const docRef = adminDb.collection("monitored_users").doc(lastfmId);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data();
      return NextResponse.json({ 
        exists: true, 
        uid: data?.uid // 기존 등록자의 uid 반환 (본인인지 체크하기 위함)
      });
    }

    return NextResponse.json({ exists: false });
  } catch (error) {
    console.error("중복 체크 에러:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}