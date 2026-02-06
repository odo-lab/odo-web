// seed-web.js
const fs = require('fs');
const csv = require('csv-parser');

// 관리자(admin) 대신 웹 SDK를 사용합니다
const { initializeApp } = require("firebase/app");
const { getFirestore, doc, writeBatch } = require("firebase/firestore");

// 🔴 [여기!] 본인의 Firebase 설정값을 복사해서 덮어씌우세요!
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "odo-openboard.firebaseapp.com",
  projectId: "odo-openboard",
  storageBucket: "odo-openboard.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

// 접속 시작
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const results = [];
console.log("📂 stores.csv 파일을 읽는 중입니다... (Web Mode)");

fs.createReadStream('artists.csv') 
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', async () => {
    console.log(`🚀 총 ${results.length}개의 데이터를 발견했습니다. 업로드를 시작합니다...`);
    
    // 배치(Batch) 생성
    const batch = writeBatch(db);
    let count = 0;

    results.forEach((row) => {
      // CSV 헤더 이름(user_id, user_name, user_store, user_tag) 확인
      const userId = row.user_id ? row.user_id.trim() : "";
      
      if (!userId) return;

      // monitored_users 컬렉션에 저장
      const docRef = doc(db, "artists", userId);

      batch.set(docRef, {
        lastfm_username: userId,
        owner_name: row.user_name ? row.user_name.trim() : "",
        store_name: row.user_store ? row.user_store.trim() : "",
        franchise: row.user_tag ? row.user_tag.trim() : "",
        active: true,
        created_at: new Date().toISOString()
      }, { merge: true }); // 덮어쓰기 모드

      count++;
    });

    try {
      await batch.commit();
      console.log(`✅ ${count}개의 데이터가 성공적으로 저장되었습니다!`);
    } catch (e) {
      console.error("❌ 오류 발생:", e);
      console.log("힌트: Firestore [규칙] 탭에서 'if true'로 잘 바꿨는지 확인하세요!");
    }
  });