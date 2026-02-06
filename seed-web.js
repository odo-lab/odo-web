// seed-csv.js
const fs = require('fs');
const csv = require('csv-parser');
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// 1. Firebase 초기화
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// 2. CSV 파일 읽어서 DB에 넣기
const results = [];

console.log("📂 stores.csv 파일을 읽는 중입니다...");

fs.createReadStream('stores.csv') 
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', async () => {
    console.log(`🚀 총 ${results.length}개의 매장 정보를 발견했습니다. 초기 데이터 로드를 시작합니다...`);
    
    const batch = db.batch();
    let count = 0;

    results.forEach((row) => {
      // 3. 데이터 매핑 (보여주신 CSV 헤더명에 맞춤)
      const userId = row.user_id ? row.user_id.trim() : "";
      const ownerName = row.user_name ? row.user_name.trim() : ""; // 점주님 성함
      const storeName = row.user_store ? row.user_store.trim() : ""; // 매장명
      const franchise = row.user_tag ? row.user_tag.trim() : ""; // 태그(프랜차이즈)

      if (!userId) return; // 아이디 없으면 패스

      const docRef = db.collection("monitored_users").doc(userId);

      // 4. 저장할 데이터 설정
      // 최초 로드이므로 set()을 사용하여 문서를 새로 만들거나 덮어씁니다.
      batch.set(docRef, {
        lastfm_username: userId,
        owner_name: ownerName,    // 황숙경, 박영선 등
        store_name: storeName,    // 세븐일레븐 용산헤링턴스퀘어점 등
        franchise: franchise,     // seveneleven, grapes 등
        active: true,             // 활성 상태로 시작
        created_at: new Date().toISOString() // 생성일 기록
      }, { merge: true }); 

      count++;
    });

    // 5. 최종 전송
    await batch.commit();
    console.log(`✅ ${count}개의 초기 데이터가 DB에 성공적으로 저장되었습니다!`);
  });