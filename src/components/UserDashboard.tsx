"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
// 👇 getDoc 추가!
import { collection, query, where, getDocs, writeBatch, doc, Timestamp, getDoc } from "firebase/firestore";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface UserDashboardProps {
  targetId: string; // monitored_users의 문서 ID (또는 점주의 경우 UID)
  isAdmin?: boolean; 
}

export default function UserDashboard({ targetId, isAdmin = false }: UserDashboardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [storeInfo, setStoreInfo] = useState<any>(null);
  
  const [stats, setStats] = useState({ thisMonth: 0, lastMonth: 0, total: 0 });
  const [chartData, setChartData] = useState<any[]>([]);

  const formatYMD = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    async function initData() {
      if (!targetId) return;
      try {
        let storeData = null;
        let realLastfmId = "";

        // 1. 🎯 [수정됨] targetId가 "문서 ID"라고 하셨으므로, 바로 조회합니다.
        // 예: doc(db, "monitored_users", "dae-gao")
        const docRef = doc(db, "monitored_users", targetId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          // A. 문서 ID로 바로 찾은 경우
          storeData = docSnap.data();
          realLastfmId = storeData.lastfm_username;
        } else {
          // B. 만약 문서 ID로 못 찾았다면? (혹시 점주 로그인이라 UID가 넘어왔을 경우 대비)
          // 기존처럼 필드 검색으로 한 번 더 찾아주는 '안전장치'를 둡니다.
          const storesRef = collection(db, "monitored_users");
          const q = query(storesRef, where("uid", "==", targetId));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const d = querySnapshot.docs[0];
            storeData = d.data();
            realLastfmId = storeData.lastfm_username;
          }
        }

        if (storeData && realLastfmId) {
          setStoreInfo({ ...storeData, id: realLastfmId });
          // 데이터 조회 시작
          await fetchDashboardData(realLastfmId);
        } else {
          console.error("매장 정보를 찾을 수 없습니다:", targetId);
          setStoreInfo(null);
        }
      } catch (error) {
        console.error("로딩 에러:", error);
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, [targetId]);

  // ... (나머지 getDatesInRange, fetchDashboardData, render 부분은 기존과 동일) ...
  // ... (아래 코드는 기존 코드를 그대로 유지하세요) ...

  const getDatesInRange = (startDate: Date, endDate: Date) => {
    const dates = [];
    const theDate = new Date(startDate);
    theDate.setHours(0,0,0,0);
    const end = new Date(endDate);
    end.setHours(0,0,0,0);

    while (theDate <= end) {
      const offset = new Date().getTimezoneOffset() * 60000;
      const dateStr = new Date(theDate.getTime() - offset).toISOString().split('T')[0];
      dates.push(dateStr);
      theDate.setDate(theDate.getDate() + 1);
    }
    return dates;
  };

  const fetchDashboardData = async (lastfmId: string) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    const startDateStr = formatYMD(startOfMonth);
    const endDateStr = formatYMD(yesterday);

    const statsColl = collection(db, "daily_stats");
    const qStats = query(
      statsColl, 
      where("date", ">=", startDateStr),
      where("date", "<=", endDateStr)
    );
    const statsSnap = await getDocs(qStats);
    
    const myStats: any[] = [];
    statsSnap.forEach(doc => {
        const d = doc.data();
        if (d.lastfm_username === lastfmId || d.userId === lastfmId) {
            myStats.push(d);
        }
    });

    const existingDates = new Set(myStats.map(s => s.date));
    const requiredDates = getDatesInRange(startOfMonth, yesterday);
    const missingDates = requiredDates.filter(d => !existingDates.has(d));

    if (missingDates.length > 0) {
        console.log(`⚡ [${lastfmId}] 누락된 ${missingDates.length}일치 데이터 복구 시작`);
        missingDates.sort();
        const minDate = new Date(missingDates[0]); minDate.setHours(0,0,0,0);
        const maxDate = new Date(missingDates[missingDates.length-1]); maxDate.setHours(23,59,59,999);
        
        const historyRef = collection(db, "listening_history");
        const qHistory = query(
            historyRef, 
            where("timestamp", ">=", minDate), 
            where("timestamp", "<=", maxDate)
        );
        const historySnap = await getDocs(qHistory);
        
        const tempMap: Record<string, any> = {};
        historySnap.forEach(doc => {
            const d = doc.data();
            const uid = d.userId || d.user_id;
            if (uid !== lastfmId) return; 

            const utcDate = d.timestamp instanceof Timestamp ? d.timestamp.toDate() : new Date(d.timestamp);
            const kstDate = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000));
            const dateStr = kstDate.toISOString().split('T')[0];
            
            if (missingDates.includes(dateStr)) {
                if (!tempMap[dateStr]) {
                    tempMap[dateStr] = {
                        date: dateStr,
                        lastfm_username: lastfmId,
                        play_count: 0,
                        store_name: storeInfo?.store_name || "Unknown",
                        franchise: storeInfo?.franchise || "personal"
                    };
                }
                tempMap[dateStr].play_count++;
            }
        });
        
        const recovered = Object.values(tempMap);
        if (recovered.length > 0) {
            const batch = writeBatch(db);
            recovered.forEach(stat => {
                myStats.push(stat);
                const ref = doc(db, "daily_stats", `${stat.date}_${lastfmId}`);
                batch.set(ref, stat, { merge: true });
            });
            await batch.commit();
        }
    }

    let thisMonthCount = 0;
    const chartMap: Record<string, number> = {};
    requiredDates.forEach(d => chartMap[d] = 0);
    
    myStats.forEach(stat => {
        const count = stat.play_count !== undefined ? stat.play_count : (stat.playCount || 0);
        chartMap[stat.date] = count;
        thisMonthCount += count;
    });

    const finalChartData = requiredDates.map(date => ({
        name: date.slice(5),
        plays: chartMap[date]
    }));

    setStats({
        thisMonth: thisMonthCount,
        lastMonth: 0, 
        total: 0      
    });
    setChartData(finalChartData);
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#888" }}>데이터 분석 중...</div>;
  if (!storeInfo) return <div style={{ padding: 40, textAlign: "center", color: "white" }}>매장 정보를 찾을 수 없습니다.</div>;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px" }}>
      {isAdmin && (
        <button 
          onClick={() => router.back()}
          style={{ marginBottom: "20px", background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "14px" }}
        >
          ← 목록으로 돌아가기
        </button>
      )}

      <header style={{ marginBottom: "30px", borderBottom: "1px solid #333", paddingBottom: "20px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "white", marginBottom: "8px" }}>
          {isAdmin ? `📂 ${storeInfo.store_name} 상세 통계` : `👋 안녕하세요, ${storeInfo.store_name} 점주님!`}
        </h2>
        <div style={{ color: "#888", fontSize: "14px" }}>
          ID: {storeInfo.lastfm_username} | 유형: {storeInfo.franchise === 'seveneleven' ? '세븐일레븐' : '개인/기타'}
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "40px" }}>
        <StatCard title="이번 달 재생 수" count={stats.thisMonth} color="#3b82f6" subText={`1일 ~ 어제까지 합계`} />
        <StatCard title="지난 달 재생 수" count={stats.lastMonth} color="#9ca3af" subText="준비 중" />
        <StatCard title="총 누적 재생 수" count={stats.total} color="#10b981" subText="준비 중" />
      </div>

      <div style={{ background: "#222", padding: "30px", borderRadius: "16px", border: "1px solid #333" }}>
        <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "white", marginBottom: "20px" }}>
          📈 이번 달 일별 재생 추이 (어제 마감)
        </h3>
        <div style={{ height: "300px", width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#444" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Line type="monotone" dataKey="plays" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, count, color, subText }: any) {
  return (
    <div style={{ background: "#222", padding: "24px", borderRadius: "12px", borderTop: `4px solid ${color}` }}>
      <h4 style={{ color: "#aaa", fontSize: "14px", marginBottom: "8px" }}>{title}</h4>
      <div style={{ fontSize: "32px", fontWeight: "bold", color: "white", marginBottom: "4px" }}>
        {count.toLocaleString()} <span style={{ fontSize: "16px", fontWeight: "normal" }}>곡</span>
      </div>
      <div style={{ fontSize: "12px", color: "#666" }}>{subText}</div>
    </div>
  );
}