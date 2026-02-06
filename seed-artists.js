// seed-artists.js
const fs = require('fs');
const csv = require('csv-parser');
const { initializeApp } = require("firebase/app");
const { getFirestore, doc, writeBatch } = require("firebase/firestore");

// 🔴 [필수] 본인의 설정값으로 덮어쓰세요!
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "odo-openboard.firebaseapp.com",
  projectId: "odo-openboard",
  storageBucket: "odo-openboard.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const results = [];
console.log("📂 artists.csv 파일을 읽는 중입니다...");

fs.createReadStream('artists.csv') 
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', async () => {
    console.log(`🚀 총 ${results.length}명의 아티스트를 발견했습니다.`);
    
    // Firestore는 한 번에 500개까지만 처리가능 -> 나눠서 처리(Chunking)
    const CHUNK_SIZE = 450; 
    let successCount = 0;

    for (let i = 0; i < results.length; i += CHUNK_SIZE) {
      const chunk = results.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      
      chunk.forEach((row) => {
        // 1. CSV 헤더 이름 'artist_name'을 찾습니다.
        const artistName = row.artist_name ? row.artist_name.trim() : "";
        const groupCode = row.group_code ? row.group_code.trim() : "etc";

        if (!artistName) return;

        // 2. 'monitored_artists' 컬렉션에 저장
        // 문서 ID를 아티스트 이름으로 해서 중복을 방지합니다.
        const docRef = doc(db, "monitored_artists", artistName);
        
        batch.set(docRef, {
          name: artistName,       // 검색용 이름
          group: groupCode,       // 소속사 등 (선택)
          active: true,           // 감시 활성화 여부
          created_at: new Date().toISOString()
        }, { merge: true });
      });

      await batch.commit();
      successCount += chunk.length;
      console.log(`... ${successCount} / ${results.length} 처리 완료`);
    }

    console.log(`✅ 모든 아티스트 업로드가 완료되었습니다!`);
  });