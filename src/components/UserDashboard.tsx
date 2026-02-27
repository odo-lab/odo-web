"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, writeBatch, doc, Timestamp, getDoc } from "firebase/firestore";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ✅ 인증 관련 훅 및 파이어베이스 탈퇴 함수 추가
import { useAuth } from "@/lib/auth-context";
import { deleteUser } from "firebase/auth";

interface UserDashboardProps {
  targetId: string; 
  isAdmin?: boolean; 
}

export default function UserDashboard({ targetId, isAdmin = false }: UserDashboardProps) {
  const router = useRouter();
  const { user } = useAuth(); // ✅ 현재 로그인된 유저 정보 가져오기
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [storeInfo, setStoreInfo] = useState<any>(null);
  
  const [stats, setStats] = useState({ 
    playCount: 0, 
    revenue: 0, 
    achievementRate: 0,
    growthRate: 0 ,
    hasPrevData: true
  });
  
  const [chartData, setChartData] = useState<any[]>([]);

  const formatYMD = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const [dateRange, setDateRange] = useState({
    start: formatYMD(new Date(today.getFullYear(), today.getMonth(), 1)), 
    end: formatYMD(yesterday)
  });

  const calculateRevenue = (franchise: string, plays: number) => {
    let maxRevenue = 30000;
    if (franchise === 'seveneleven') maxRevenue = 22000;

    if (plays < 2500) return 0;
    else if (plays < 5000) return Math.floor(maxRevenue / 3);
    else if (plays < 7500) return Math.floor((maxRevenue * 2) / 3);
    else return maxRevenue;
  };

  useEffect(() => {
    async function initData() {
      if (!targetId) return;
      setLoading(true);
      try {
        let storeData = null;
        let realLastfmId = "";

        // 💡 1. 헛스윙하던 getDoc 부분 삭제! 바로 uid로 검색(query)합니다.
        const storesRef = collection(db, "monitored_users");
        const q = query(storesRef, where("uid", "==", targetId));
        const querySnapshot = await getDocs(q);

        // 💡 2. 데이터가 있으면 가져오기
        if (!querySnapshot.empty) {
          const d = querySnapshot.docs[0];
          storeData = d.data();
          realLastfmId = storeData.lastfm_username;
        }

        // 💡 3. 정보 세팅
        if (storeData && realLastfmId) {
          setStoreInfo({ ...storeData, id: realLastfmId });
          await fetchDashboardData(realLastfmId, dateRange.start, dateRange.end, storeData.franchise);
        } else {
          setStoreInfo(null);
          if (isAdmin) {
            alert("해당 매장 정보를 찾을 수 없어 대시보드로 이동합니다.");
            router.push("/admin/dashboard");
          }
        }
      } catch (error) {
        console.error("로딩 에러:", error);
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, [targetId, isAdmin]);

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

  const fetchDashboardData = async (lastfmId: string, startStr: string, endStr: string, franchise: string) => {
    setLoading(true);
    try {
        const statsColl = collection(db, "daily_stats");
        
        // 🔒 [보안 & 성능 완벽 패치 1]
        // 전체 데이터를 긁어오지 않고, DB 쿼리 단계에서 "내 데이터(lastfm_username)"만 콕 집어서 가져옵니다.
        // 이렇게 해야 보안 규칙에서 튕기지 않으며, DB 읽기 요금이 수십 배 절약됩니다!
        const qStats = query(
            statsColl, 
            where("lastfm_username", "==", lastfmId), 
            where("date", ">=", startStr), 
            where("date", "<=", endStr)
        );
        
        const prevStart = new Date(startStr);
        prevStart.setMonth(prevStart.getMonth() - 1);
        const prevEnd = new Date(endStr);
        prevEnd.setMonth(prevEnd.getMonth() - 1);
        const prevStartStr = formatYMD(prevStart);
        const prevEndStr = formatYMD(prevEnd);

        // 이전 달 데이터도 동일하게 내 것만 콕 집어서!
        const qPrevStats = query(
            statsColl, 
            where("lastfm_username", "==", lastfmId), 
            where("date", ">=", prevStartStr), 
            where("date", "<=", prevEndStr)
        );

        const [statsSnap, prevStatsSnap] = await Promise.all([
            getDocs(qStats),
            getDocs(qPrevStats)
        ]);
        
        const myStats: any[] = [];
        // 이미 내 것만 가져왔으므로 필터링할 필요 없이 바로 담습니다.
        statsSnap.forEach(doc => myStats.push(doc.data()));

        let prevTotalCount = 0;
        prevStatsSnap.forEach(doc => {
            const d = doc.data();
            const count = d.play_count !== undefined ? d.play_count : (d.playCount || 0);
            prevTotalCount += count;
        });

        const requiredDates = getDatesInRange(new Date(startStr), new Date(endStr));
        let totalCount = 0;
        const chartMap: Record<string, number> = {};
        requiredDates.forEach(d => chartMap[d] = 0);
        
        myStats.forEach(stat => {
            const count = stat.play_count !== undefined ? stat.play_count : (stat.playCount || 0);
            chartMap[stat.date] = count;
            totalCount += count;
        });

        const finalChartData = requiredDates.map(date => ({
            name: date.slice(5),
            plays: chartMap[date]
        }));

        const estimatedRevenue = calculateRevenue(franchise || 'personal', totalCount);
        const achievementRate = Math.min((totalCount / 7500) * 100, 100);

        let growthRate = 0;
        let hasPrevData = false; 

        if (prevTotalCount > 0) {
          growthRate = ((totalCount - prevTotalCount) / prevTotalCount) * 100;
          hasPrevData = true; 
        } else {
          growthRate = 0;
          hasPrevData = false;
        }

        setStats({ 
            playCount: totalCount, 
            revenue: estimatedRevenue, 
            achievementRate: achievementRate,
            growthRate: growthRate, 
            hasPrevData: hasPrevData
        });
        setChartData(finalChartData);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const syncData = async () => {
      if (!storeInfo) return;
      const lastfmId = storeInfo.id;
      
      if (!confirm(`${dateRange.start} ~ ${dateRange.end} 기간의 데이터를 재산출 하시겠습니까?`)) return;

      setSyncing(true);
      try {
          const artistsSnap = await getDocs(collection(db, "monitored_artists"));
          const allowedArtists = new Set<string>();
          artistsSnap.forEach(doc => allowedArtists.add(doc.id.trim().toLowerCase()));

          const start = new Date(dateRange.start); start.setHours(0,0,0,0);
          const end = new Date(dateRange.end); end.setHours(23,59,59,999);
          
          const historyRef = collection(db, "listening_history");
          
          // 🔒 [보안 & 성능 완벽 패치 2] 어드민 재산출 시에도 전체 유저가 아닌 해당 유저 기록만 긁어옵니다.
          const qHistory = query(
              historyRef, 
              where("userId", "==", lastfmId),
              where("timestamp", ">=", start), 
              where("timestamp", "<=", end)
          );
          const historySnap = await getDocs(qHistory);
          
          const uniqueRecords = new Map();
          historySnap.forEach(doc => {
              const d = doc.data();
              const utcDate = d.timestamp instanceof Timestamp ? d.timestamp.toDate() : new Date(d.timestamp);
              // 이미 해당 유저 것만 가져왔으므로 uid 확인 로직 생략
              const dedupKey = `${lastfmId}|${utcDate.getTime()}`;
              
              if (!uniqueRecords.has(dedupKey)) {
                  uniqueRecords.set(dedupKey, { ...d, timestamp: utcDate });
              }
          });

          const userDailyStats: Record<string, Record<string, number>> = {};
          const KST_OFFSET = 9 * 60 * 60 * 1000;

          uniqueRecords.forEach((record) => {
              if (!record.artist) return;
              const normalizedArtist = record.artist.trim().toLowerCase();
              if (!allowedArtists.has(normalizedArtist)) return;

              const kstDate = new Date(record.timestamp.getTime() + KST_OFFSET);
              const dateStr = kstDate.toISOString().split('T')[0];

              if (!userDailyStats[dateStr]) userDailyStats[dateStr] = {};
              const trackKey = `${record.track}|${normalizedArtist}`;
              userDailyStats[dateStr][trackKey] = (userDailyStats[dateStr][trackKey] || 0) + 1;
          });

          const DAILY_MAX_COUNT = 10;
          const finalStats: any[] = [];

          Object.entries(userDailyStats).forEach(([date, trackCounts]) => {
              let validPlays = 0;
              Object.values(trackCounts).forEach(count => {
                  validPlays += Math.min(count, DAILY_MAX_COUNT);
              });

              finalStats.push({
                  date: date,
                  lastfm_username: lastfmId,
                  play_count: validPlays,
                  store_name: storeInfo.store_name,
                  franchise: storeInfo.franchise
              });
          });

          if (finalStats.length > 0) {
              const batch = writeBatch(db);
              finalStats.forEach(stat => {
                  const ref = doc(db, "daily_stats", `${stat.date}_${lastfmId}`);
                  batch.set(ref, stat, { merge: true });
              });
              await batch.commit();
              alert("동기화 완료! 통계가 재산출되었습니다.");
              fetchDashboardData(lastfmId, dateRange.start, dateRange.end, storeInfo.franchise);
          } else {
              alert("해당 기간에 유효한 재생 기록이 없습니다.");
          }

      } catch (e) {
          console.error(e);
          alert("오류 발생");
      } finally {
          setSyncing(false);
      }
  };

  // ✅ 회원 탈퇴 처리 함수
  const handleDeleteAccount = async () => {
    if (!user) return;

    const isConfirmed = confirm("정말로 회원을 탈퇴하시겠습니까?\n이 작업은 되돌릴 수 없으며 모든 정보가 삭제됩니다.");
    if (!isConfirmed) return;

    try {
      await deleteUser(user);
      alert("회원 탈퇴가 정상적으로 완료되었습니다.");
      router.push("/login"); 
    } catch (error: any) {
      console.error("회원 탈퇴 오류:", error);
      if (error.code === 'auth/requires-recent-login') {
        alert("보안을 위해 다시 로그인한 후 탈퇴를 진행해주세요.");
      } else {
        alert("탈퇴 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      }
    }
  };

  if (loading && !storeInfo) {
    return <div style={{ padding: 100, textAlign: "center", color: "#888" }}>⏳ 데이터를 불러오고 있습니다...</div>;
  }

  if (!storeInfo) {
    return (
      <div style={{ padding: 100, textAlign: "center", color: "white" }}>
        <p style={{ marginBottom: 20 }}>매장 정보를 찾을 수 없습니다.</p>
        <button onClick={() => router.push('/')} style={primaryBtnStyle}>메인으로 돌아가기</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px" }}>
      {/* 어드민 전용 상단 바 */}
      {isAdmin && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
          <button 
            onClick={() => router.back()}
            style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", gap: "5px" }}
          >
            ← 목록으로 돌아가기
          </button>
          
          <button 
            onClick={syncData} 
            disabled={syncing}
            style={{ ...primaryBtnStyle, background: syncing ? "#444" : "#ef4444", fontSize: "12px" }}
          >
            {syncing ? "🔄 동기화 중..." : "⚠️ 데이터 재산출"}
          </button>
        </div>
      )}

      {/* ✅ 헤더 (버튼 영역 추가됨) */}
      <header style={{ 
        display: "flex", 
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "30px", 
        borderBottom: "1px solid #333", 
        paddingBottom: "20px" 
      }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "white", marginBottom: "8px" }}>
            {isAdmin ? `📂 ${storeInfo.store_name} 상세 통계` : `👋 안녕하세요, ${storeInfo.store_name} 점주님!`}
          </h2>
          <div style={{ color: "#888", fontSize: "14px" }}>
            ID: {storeInfo.lastfm_username} | 유형: {storeInfo.franchise === 'seveneleven' ? '세븐일레븐' : '개인/기타'}
          </div>
        </div>

        {/* ✅ 어드민이 아닐 때(일반 점주님일 때)만 설정 버튼들 보이기 */}
        {!isAdmin && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button 
              onClick={() => router.push("/setup")}
              style={{ ...secondaryBtnStyle, background: "#374151", color: "white" }}
            >
              🔒 비밀번호 변경
            </button>
            <button 
              onClick={handleDeleteAccount}
              style={{ ...secondaryBtnStyle, background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid #ef4444" }}
            >
              ❌ 회원 탈퇴
            </button>
          </div>
        )}
      </header>

      {/* 날짜 컨트롤 */}
      <div style={filterContainerStyle}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <input type="date" value={dateRange.start} onChange={(e)=>setDateRange({...dateRange, start:e.target.value})} style={inputStyle} />
          <span style={{ color: "#888" }}>~</span>
          <input type="date" value={dateRange.end} onChange={(e)=>setDateRange({...dateRange, end:e.target.value})} style={inputStyle} />
          <button 
            onClick={() => fetchDashboardData(storeInfo.id, dateRange.start, dateRange.end, storeInfo.franchise)} 
            disabled={loading}
            style={primaryBtnStyle}
          >
            {loading ? "조회 중..." : "조회"}
          </button>
        </div>
      </div>

      {/* 📊 달성률 섹션 */}
      <div style={{ background: "#222", padding: "25px", borderRadius: "16px", border: "1px solid #333", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <div>
                <h3 style={{ color: "white", fontSize: "18px", fontWeight: "bold", marginBottom: "4px" }}>
                    이번 달 목표 달성률 <span style={{color:"#3b82f6"}}>{stats.achievementRate.toFixed(1)}%</span>
                </h3>
                <div style={{ color: "#888", fontSize: "13px" }}>목표 7,500곡 / 현재 {stats.playCount.toLocaleString()}곡</div>
            </div>
            
            <a href={`https://www.last.fm/user/${storeInfo.id}`} target="_blank" rel="noopener noreferrer" style={lastfmBtnStyle}>
                Last.fm 상세
            </a>
        </div>

        <div style={{ position: "relative", height: "24px", background: "#444", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ 
                width: `${stats.achievementRate}%`, 
                height: "100%", 
                background: "linear-gradient(90deg, #3b82f6 0%, #10b981 100%)",
                transition: "width 0.5s ease-in-out"
            }} />
            <div style={{ position: "absolute", left: "33.3%", top: 0, bottom: 0, borderLeft: "2px dashed rgba(255,255,255,0.3)" }} />
            <div style={{ position: "absolute", left: "66.6%", top: 0, bottom: 0, borderLeft: "2px dashed rgba(255,255,255,0.3)" }} />
        </div>
      </div>

      {/* 💳 통계 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "30px" }}>
        <StatCard title="조회 기간 재생 수" count={`${stats.playCount.toLocaleString()} 곡`} color="#3b82f6" subText="유효 재생수 합계" />
        <StatCard title="예상 정산금" count={`${stats.revenue.toLocaleString()} 원`} color="#10b981" subText="구간별 차등 지급 적용" isHighlight={true} />
        
        <StatCard 
          title="전월 대비 재생 수" 
          count={
            !stats.hasPrevData ? (
              <span style={{ fontSize: '20px', color: '#9ca3af' }}>-</span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {stats.growthRate > 0 ? '▲' : stats.growthRate < 0 ? '▼' : '-'} 
                {Math.abs(stats.growthRate).toFixed(1)}%
              </span>
            )
          }
          color={!stats.hasPrevData ? "#9ca3af" : (stats.growthRate >= 0 ? "#ef4444" : "#3b82f6")}
          subText={
            !stats.hasPrevData 
              ? "전월 기록이 없습니다" 
              : (stats.growthRate >= 0 ? "지난달보다 증가했어요" : "지난달보다 감소했어요")
          }
          isHighlight={false}
        />
      </div>

      {/* 📈 차트 */}
      <div style={{ background: "#222", padding: "30px", borderRadius: "16px", border: "1px solid #333" }}>
        <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "white", marginBottom: "20px" }}>📈 일별 재생 추이</h3>
        <div style={{ height: "300px", width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData}
              margin={{ top: 10, right: 10, left: -5, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#444" />
              
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#888', fontSize: 12 }} 
                dy={10} 
                padding={{ left: 10, right: 10 }} 
              />
              
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#888', fontSize: 12 }} 
                width={40} 
              />
              
              <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Line 
                type="monotone" 
                dataKey="plays" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                dot={{ r: 4 }} 
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, count, color, subText, isHighlight = false }: any) {
  return (
    <div style={{ background: "#222", padding: "24px", borderRadius: "12px", borderTop: `4px solid ${color}`, boxShadow: isHighlight ? "0 4px 20px rgba(16, 185, 129, 0.1)" : "none" }}>
      <h4 style={{ color: "#aaa", fontSize: "14px", marginBottom: "8px" }}>{title}</h4>
      <div style={{ fontSize: "28px", fontWeight: "bold", color: isHighlight ? "#10b981" : "white", marginBottom: "4px" }}>{count}</div>
      <div style={{ fontSize: "12px", color: "#666" }}>{subText}</div>
    </div>
  );
}

const secondaryBtnStyle = { 
  padding: "8px 16px", 
  borderRadius: "6px", 
  cursor: "pointer", 
  fontWeight: "bold",
  fontSize: "13px",
  border: "none",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  transition: "opacity 0.2s"
};

const lastfmBtnStyle = { background: "#333", color: "#ccc", padding: "8px 16px", borderRadius: "8px", textDecoration: "none", fontSize: "13px", border: "1px solid #444", display: "flex", alignItems: "center", gap: "6px" };
const filterContainerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", background: "#222", padding: "15px 20px", borderRadius: "12px", border: "1px solid #333" };
const inputStyle = { border: "1px solid #444", background: "#333", color: "white", borderRadius: "6px", padding: "8px 10px", fontSize: "14px", outline: "none" };
const primaryBtnStyle = { background: "#3b82f6", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" };