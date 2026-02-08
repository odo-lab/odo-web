"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, getCountFromServer, doc, getDoc } from "firebase/firestore";

export default function AdminDashboard() {
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [stats, setStats] = useState({
    storeCount: 0,      // 가맹점 수
    totalPlays: 0,      // 총 재생 수
    loading: true
  });

  useEffect(() => {
    async function fetchAdminData() {
      const user = auth.currentUser;
      if (!user) return;

      // 1. admins 컬렉션에서 내 권한 확인
      const adminRef = doc(db, "admins", user.email!);
      const adminSnap = await getDoc(adminRef);

      if (adminSnap.exists()) {
        const adminData = adminSnap.data();
        setAdminInfo(adminData);
        
        // 2. 내 구역(scope) 통계 내기
        calculateFranchiseStats(adminData.scope);
      } else {
        alert("관리자 정보가 없습니다.");
      }
    }

    fetchAdminData();
  }, []);

  const calculateFranchiseStats = async (scope: string) => {
    try {
      const usersRef = collection(db, "monitored_users");
      let qStores;

      // scope가 'all'이면 전체, 아니면 'personal' 같은 특정 태그만 조회
      if (scope === "all") {
        qStores = query(usersRef); 
      } else {
        qStores = query(usersRef, where("franchise", "==", scope));
      }

      // A. 매장 목록 확보
      const storeSnaps = await getDocs(qStores);
      const storeList = storeSnaps.docs.map(doc => doc.id); // 문서 ID가 곧 Last.fm ID

      // B. 각 매장의 재생 수 합산 (이번 달 기준)
      const historyRef = collection(db, "listening_history");
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // 병렬로 모든 매장의 재생 수 조회 (속도 최적화)
      const countPromises = storeList.map(storeId => {
        const qHistory = query(
          historyRef,
          where("user_id", "==", storeId),
          where("timestamp", ">=", thisMonthStart)
        );
        return getCountFromServer(qHistory);
      });

      const countResults = await Promise.all(countPromises);
      const totalPlays = countResults.reduce((sum, snap) => sum + snap.data().count, 0);

      // C. 결과 반영
      setStats({
        storeCount: storeList.length,
        totalPlays: totalPlays,
        loading: false
      });

    } catch (error) {
      console.error("통계 집계 실패:", error);
    }
  };

  if (stats.loading) return <div style={{padding:"40px", color:"white", textAlign:"center"}}>⏳ 관리자 데이터 분석 중...</div>;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" }}>
      <header style={{ marginBottom: "40px", borderBottom: "1px solid #333", paddingBottom: "20px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "white" }}>
          관리자 대시보드
        </h1>
        <div style={{ color: "#aaa", marginTop: "8px" }}>
          담당 구역: <span style={{ color: "#fbbf24", fontWeight: "bold" }}>{adminInfo?.scope === 'all' ? '전체 통합' : adminInfo?.scope}</span> 
          <span style={{ margin: "0 10px" }}>|</span> 
          관리자: {adminInfo?.name}
        </div>
      </header>

      {/* 통계 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
        
        {/* 카드 1: 가맹점 수 */}
        <div style={{ background: "#1f2937", padding: "30px", borderRadius: "12px", borderLeft: "5px solid #f59e0b" }}>
          <h3 style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "10px" }}>관리 중인 매장</h3>
          <div style={{ fontSize: "36px", fontWeight: "bold", color: "white" }}>
            {stats.storeCount.toLocaleString()} <span style={{ fontSize: "18px", fontWeight: "normal" }}>개소</span>
          </div>
        </div>

        {/* 카드 2: 총 재생 수 */}
        <div style={{ background: "#1f2937", padding: "30px", borderRadius: "12px", borderLeft: "5px solid #3b82f6" }}>
          <h3 style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "10px" }}>이번 달 총 재생 수</h3>
          <div style={{ fontSize: "36px", fontWeight: "bold", color: "white" }}>
            {stats.totalPlays.toLocaleString()} <span style={{ fontSize: "18px", fontWeight: "normal" }}>건</span>
          </div>
          <div style={{ color: "#6b7280", fontSize: "13px", marginTop: "10px" }}>
            예상 정산금 합계: {(stats.totalPlays * 5).toLocaleString()}원
          </div>
        </div>

      </div>
    </div>
  );
}