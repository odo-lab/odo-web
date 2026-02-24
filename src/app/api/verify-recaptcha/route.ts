// app/api/verify-recaptcha/route.ts
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    const secretKey = process.env.RECAPTCHA_SECRET_KEY; // Vercel에 등록한 비밀 키

    if (!secretKey) {
      console.error("RECAPTCHA_SECRET_KEY가 없습니다.");
      return NextResponse.json({ success: false, error: "서버 설정 오류" }, { status: 500 });
    }

    // 구글 서버에 "이 토큰 진짜 사람 맞아?" 라고 물어보기
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;
    const response = await axios.post(verifyUrl);

    const { success, score } = response.data;

    // 점수(score)는 0.0(봇 확실) ~ 1.0(사람 확실) 사이로 나옵니다.
    // 보통 0.5 이상이면 사람으로 판정합니다.
    if (success && score >= 0.5) {
      return NextResponse.json({ success: true, score });
    } else {
      console.warn("🤖 매크로 봇 의심 요청 차단! 점수:", score);
      return NextResponse.json({ success: false, error: "Bot detected" }, { status: 400 });
    }
  } catch (error) {
    console.error("reCAPTCHA 검증 실패:", error);
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 });
  }
}