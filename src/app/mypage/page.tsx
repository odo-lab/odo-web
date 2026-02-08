"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, writeBatch, doc, Timestamp } from "firebase/firestore";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// 📊 [유저 대시보드 컴포넌트]
function UserDashboard({ userUid }: { userUid: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [storeInfo, setStoreInfo] = useState<any>(null);
  
  const [stats, setStats] = useState({ thisMonth: 0, lastMonth: 0, total: 0 });
  const [chartData, setChartData] = useState<any[]>([]);

  // 날짜 포맷팅 (KST)
  const formatYMD = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    async function initData() {
      if (!userUid) return;
      try {
        // 1. 매장 정보 가져오기
        const storesRef = collection(db, "monitored_users");
        const q = query(storesRef, where("uid", "==", userUid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const docSnapshot = querySnapshot.docs[0];
          const realLastfmId = docSnapshot.data().lastfm_username; 
          
          setStoreInfo({ 
            ...docSnapshot.data(), 
            id: realLastfmId 
          });
          
          await fetchDashboardData(realLastfmId);
        } else {
          console.error("매장 정보 없음");
        }
      } catch (error) {
        console.error("로딩 에러:", error);
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, [userUid]);

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
    const today = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const startDateStr = formatYMD(startOfMonth);
    const endDateStr = formatYMD(yesterday);

    // 1. daily_stats 조회 (이번 달)
    const statsColl = collection(db, "daily_stats");
    const qStats = query(
      statsColl, 
      where("date", ">=", startDateStr),
      where("date", "<=", endDateStr)
    );
    const statsSnap = await getDocs(qStats);
    
    // 내 데이터만 필터링
    const myStats: any[] = [];
    statsSnap.forEach(doc => {
        const d = doc.data();
        if (d.lastfm_username === lastfmId || d.userId === lastfmId) {
            myStats.push(d);
        }
    });

    // 2. 누락된 날짜 확인 및 복구 (Gap Filling)
    const existingDates = new Set(myStats.map(s => s.date));
    const requiredDates = getDatesInRange(startOfMonth, today);
    const missingDates = requiredDates.filter(d => !existingDates.has(d));

    if (missingDates.length > 0) {
        console.log(`⚡ [User] 누락된 ${missingDates.length}일치 데이터 복구 시작`);
        
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
            if (uid !== lastfmId) return; // 내 것만

            const utcDate = d.timestamp instanceof Timestamp ? d.timestamp.toDate() : new Date(d.timestamp);
            const kstDate = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000));
            const dateStr = kstDate.toISOString().split('T')[0];
            
            if (missingDates.includes(dateStr)) {
                if (!tempMap[dateStr]) {
                    tempMap[dateStr] = {
                        date: dateStr,
                        lastfm_username: lastfmId,
                        play_count: 0,
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
                // DB에 저장 (필드명 통일)
                const ref = doc(db, "daily_stats", `${stat.date}_${lastfmId}`);
                batch.set(ref, stat, { merge: true });
            });
            await batch.commit();
        }
    }

    // 3. 차트 및 통계 계산
    let thisMonthCount = 0;
    const chartMap: Record<string, number> = {};
    requiredDates.forEach(d => chartMap[d] = 0);
    
    myStats.forEach(stat => {
        const count = stat.play_count !== undefined ? stat.play_count : (stat.playCount || 0);
        chartMap[stat.date] = count;
        thisMonthCount += count;
    });

    const finalChartData = requiredDates.map(date => ({
        name: date.slice(5), // "02-08"
        plays: chartMap[date]
    }));

    setStats({
        thisMonth: thisMonthCount,
        lastMonth: 0, // 준비 중
        total: 0      // 준비 중
    });
    
    setChartData(finalChartData);
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#888" }}>데이터 분석 중...</div>;
  
  if (!storeInfo) return (
    <div style={{ padding: 60, textAlign: "center", color: "white" }}>
      <h3 style={{fontSize: "20px", marginBottom: "10px"}}>매장 정보를 찾을 수 없습니다.</h3>
      <p style={{color: "#888"}}>관리자에게 문의해주세요. (UID: {userUid})</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px" }}>
      <header style={{ 
        marginBottom: "30px", borderBottom: "1px solid #333", paddingBottom: "20px",
        display: "flex", justifyContent: "space-between", alignItems: "flex-start" 
      }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "white", marginBottom: "8px" }}>
            👋 안녕하세요, {storeInfo.store_name} 점주님!
          </h2>
          <div style={{ color: "#888", fontSize: "14px" }}>
            가입일: {storeInfo.created_at ? new Date(storeInfo.created_at).toLocaleDateString() : '-'} | ID: {storeInfo.id}
          </div>
        </div>
        <button 
          onClick={() => router.push("/setup")}
          style={{
            display: "flex", alignItems: "center", gap: "8px", background: "#333", color: "white", 
            border: "1px solid #444", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "14px"
          }}
        >
          설정
        </button>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "40px" }}>
        <StatCard title="이번 달 재생 수" count={stats.thisMonth} color="#3b82f6" subText="실시간 집계 (일별 합산)" />
        <StatCard title="지난 달 재생 수" count={stats.lastMonth} color="#9ca3af" subText="준비 중" />
        <StatCard title="총 누적 재생 수" count={stats.total} color="#10b981" subText="준비 중" />
      </div>

      <div style={{ background: "#222", padding: "30px", borderRadius: "16px", border: "1px solid #333" }}>
        <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "white", marginBottom: "20px" }}>
          📈 이번 달 일별 재생 추이
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

// UI 카드
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

// 메인 페이지
export default function MyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading) return <div style={{ padding: 50, textAlign: "center", color: "#fff" }}>로딩 중...</div>;
  if (!user) return null;

  return (
    <section style={{ width: "100%", minHeight: "100vh", backgroundColor: "#111" }}>
      <UserDashboard userUid={user.uid} />
    </section>
  );
}