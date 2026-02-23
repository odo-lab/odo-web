import * as admin from "firebase-admin";

// 환경 변수에서 데이터를 가져올 때, 
// .env.local에 적힌 이름과 정확히 일치하는지 확인하세요.
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
// 개행 문자(\n)가 문자열로 들어오는 경우를 대비해 실제 줄바꿈으로 변환합니다.
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!admin.apps.length) {
  // 필수 값이 없을 경우 에러를 발생시켜 디버깅을 돕습니다.
  if (!projectId || !clientEmail || !privateKey) {
    console.error("❌ Firebase Admin 설정 값이 누락되었습니다. .env.local 파일을 확인하세요.");
  } else {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log("✅ Firebase Admin이 성공적으로 초기화되었습니다.");
    } catch (error) {
      console.error("❌ Firebase Admin 초기화 중 오류 발생:", error);
    }
  }
}

export const adminDb = admin.firestore();