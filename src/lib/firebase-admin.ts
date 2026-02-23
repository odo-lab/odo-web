import * as admin from "firebase-admin";

// 1. 환경 변수 추출 및 전처리
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim(); // 앞뒤 공백 제거
// \n 이중 슬래시 처리 및 실제 줄바꿈 문자 보정
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ?.replace(/\\n/g, "\n")
  .replace(/\n/g, "\n");

// 2. 초기화 로직
if (!admin.apps.length) {
  console.log("🚀 [Firebase Admin] 초기화 시도 중...");

  // [디버깅 로그] Vercel Runtime Logs에서 확인 가능
  console.log("📊 현재 설정된 인증 정보 요약:", {
    projectId: projectId || "❌ 누락",
    clientEmail: clientEmail || "❌ 누락",
    privateKeyFound: privateKey ? "✅ 있음" : "❌ 없음",
    privateKeyLength: privateKey?.length || 0,
    privateKeyStart: privateKey?.substring(0, 25) + "...", // 형식 확인용
  });

  if (!projectId || !clientEmail || !privateKey) {
    console.error("❌ [Firebase Admin] 필수 설정 값이 없습니다. 환경 변수를 확인하세요.");
  } else {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log("✅ [Firebase Admin] 성공적으로 초기화되었습니다.");
    } catch (error: any) {
      console.error("❌ [Firebase Admin] 초기화 중 오류 발생:", error.message);
    }
  }
}

// 3. 인스턴스 내보내기
export const adminDb = admin.firestore();

// [중요] Firestore 연결 상태 확인을 위한 헬퍼 (선택 사항)
export const checkFirestoreConn = async () => {
  try {
    await adminDb.listCollections();
    return true;
  } catch (e) {
    return false;
  }
};