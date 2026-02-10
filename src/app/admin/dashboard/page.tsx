"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; 
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, writeBatch, Timestamp } from "firebase/firestore";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function AdminDashboardPage() {
  const router = useRouter(); 
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false); // 동기화 로딩 상태
  const [loadingStatus, setLoadingStatus] = useState("");
  
  // 검색어 상태
  const [searchTerm, setSearchTerm] = useState("");      
  const [filterKeyword, setFilterKeyword] = useState(""); 

  // 날짜 포맷팅
  const formatYMD = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [stats, setStats] = useState({
    users: 0, newUsers: 0, plays: 0, prevPlays: 0, revenue: 0, prevRevenue: 0
  });

  const [chartData, setChartData] = useState<any[]>([]);
  const [userList, setUserList] = useState<any[]>([]);

  // 🗓️ 조회 기간: 이번 달 1일 ~ 어제
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const [dateRange, setDateRange] = useState({
    start: formatYMD(new Date(today.getFullYear(), today.getMonth(), 1)), 
    end: formatYMD(yesterday)
  });

  useEffect(() => {
    fetchRealData();
  }, []);

  // 검색 필터링 로직
  const filteredUserList = userList.filter(user => 
    user.storeName.toLowerCase().includes(filterKeyword.toLowerCase()) ||
    user.id.toLowerCase().includes(filterKeyword.toLowerCase())
  );

  const handleSearch = () => {
    setFilterKeyword(searchTerm);
  };

  // 💰 [수정됨] 구간별 정산 로직 (0 / 2500 / 5000 / 7500 계단식)
const calculateRevenue = (franchise: string, plays: number) => {
  // 구간별 고정 정산액 테이블
  const revenueTable =
    franchise === 'seveneleven'
      ? [0, 7300, 14300, 22000]
      : [0, 10000, 20000, 30000];

  // 구간 1: 2500곡 미만 (0원)
  if (plays < 2500) {
    return revenueTable[0];
  }
  // 구간 2: 2500곡 이상 ~ 5000곡 미만
  else if (plays < 5000) {
    return revenueTable[1];
  }
  // 구간 3: 5000곡 이상 ~ 7500곡 미만
  else if (plays < 7500) {
    return revenueTable[2];
  }
  // 구간 4: 7500곡 이상
  else {
    return revenueTable[3];
  }
};


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

  // 🚀 [1] 단순 조회 함수
  const fetchRealData = async (forceUpdate = false) => {
    const cacheKey = `dashboard_${dateRange.start}_${dateRange.end}`;
    if (!forceUpdate) {
      const cachedData = sessionStorage.getItem(cacheKey);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        setStats(parsed.stats); setChartData(parsed.chartData); setUserList(parsed.userList);
        return;
      }
    }

    setLoading(true);
    setLoadingStatus("통계 데이터 로드 중...");

    try {
      // 1. 유저 정보 매핑
      const usersSnap = await getDocs(collection(db, "monitored_users"));
      const userMap: Record<string, any> = {};
      
      usersSnap.forEach(doc => {
        const d = doc.data();
        if (d.lastfm_username) {
          userMap[d.lastfm_username] = {
            store_name: d.store_name || "이름 없음", 
            franchise: d.franchise || "personal",
            uid: d.uid 
          };
        }
      });

      // 2. daily_stats 조회
      const statsColl = collection(db, "daily_stats");
      const qStats = query(
        statsColl, 
        where("date", ">=", dateRange.start),
        where("date", "<=", dateRange.end)
      );
      const statsSnap = await getDocs(qStats);

      let finalStats: any[] = [];
      statsSnap.forEach(doc => finalStats.push(doc.data()));

      // 3. 차트/리스트 가공
      const diffTime = Math.abs(new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      const isDailyView = diffDays <= 60;

      const chartMap: Record<string, { plays: number, revenue: number }> = {};
      const userPlayCounts: Record<string, number> = {};
      let totalPlaysInPeriod = 0;

      finalStats.forEach(stat => {
        const dateObj = new Date(stat.date);
        const uid = stat.lastfm_username || stat.userId;
        const count = stat.play_count !== undefined ? stat.play_count : (stat.playCount || 0);
        
        if (!uid) return;

        const statFranchise = finalStats.find(s => (s.lastfm_username === uid || s.userId === uid))?.franchise;
        const franchise = statFranchise || userMap[uid]?.franchise || 'personal';
        
        // 정산금은 일별 합계가 아니라 '기간 내 총 합계'에 대해 계산해야 하므로 여기서는 skip
        // (단, 차트용 일별 추정치는 단순 비례로 계산)
        const dailyEstimatedRevenue = franchise === 'seveneleven' 
            ? Math.floor((Math.min(count, 10) / 7500) * 22000) // 차트용 단순 예시
            : Math.floor((Math.min(count, 10) / 7500) * 30000);

        let chartKey: string;
        if (isDailyView) {
            chartKey = stat.date;
        } else {
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            chartKey = `${year}-${month}`;
        }

        if (!chartMap[chartKey]) chartMap[chartKey] = { plays: 0, revenue: 0 };
        chartMap[chartKey].plays += count;
        chartMap[chartKey].revenue += dailyEstimatedRevenue;

        if (!userPlayCounts[uid]) userPlayCounts[uid] = 0;
        userPlayCounts[uid] += count;
        totalPlaysInPeriod += count;
      });

      let finalChartData = [];
      if (isDailyView) {
        const allDates = getDatesInRange(new Date(dateRange.start), new Date(dateRange.end));
        finalChartData = allDates.map(dateStr => ({
            name: dateStr.slice(5),
            plays: chartMap[dateStr]?.plays || 0,
            revenue: chartMap[dateStr]?.revenue || 0
        }));
      } else {
        let startM = new Date(dateRange.start); startM.setDate(1);
        const endM = new Date(dateRange.end); endM.setDate(1);
        while (startM <= endM) {
            const year = startM.getFullYear();
            const month = String(startM.getMonth() + 1).padStart(2, '0');
            const key = `${year}-${month}`;
            finalChartData.push({
                name: `${startM.getMonth() + 1}월`,
                plays: chartMap[key]?.plays || 0,
                revenue: chartMap[key]?.revenue || 0
            });
            startM.setMonth(startM.getMonth() + 1);
        }
      }

      const finalUserList = Object.keys(userPlayCounts).map(uid => {
        const p = userPlayCounts[uid] || 0;
        const sampleStat = finalStats.find(s => (s.lastfm_username === uid || s.userId === uid));
        const storeName = sampleStat?.store_name || userMap[uid]?.store_name || "Unknown";
        const franchise = sampleStat?.franchise || userMap[uid]?.franchise || 'personal';
        const firebaseUid = userMap[uid]?.uid || uid; 

        return { 
            id: uid, 
            firebaseUid: firebaseUid, 
            storeName: storeName, 
            franchise: franchise, 
            plays: p, 
            // 🔥 [중요] 기간 내 총 재생 수(p)를 기준으로 구간별 정산금 계산
            revenue: calculateRevenue(franchise, p) 
        };
      }).sort((a,b) => b.plays - a.plays);

      const totalRevenue = finalUserList.reduce((acc, cur) => acc + cur.revenue, 0);

      const resultState = { 
        users: Object.keys(userMap).length, 
        newUsers: 0, 
        plays: totalPlaysInPeriod, 
        prevPlays: 0, 
        revenue: totalRevenue, 
        prevRevenue: 0 
      };
      
      sessionStorage.setItem(cacheKey, JSON.stringify({ stats: resultState, chartData: finalChartData, userList: finalUserList }));
      setStats(resultState);
      setChartData(finalChartData);
      setUserList(finalUserList);

    } catch (e) {
      console.error(e);
      setLoadingStatus("오류 발생");
    } finally {
      setLoading(false);
      setLoadingStatus("");
    }
  };

  // 🔴 [핵심] 데이터 동기화 함수
  const syncMissingData = async () => {
    if (!confirm(`${dateRange.start} ~ ${dateRange.end} 기간의 데이터를 재산출 하시겠습니까?\n(기존 대시보드와 동일한 로직으로 계산됩니다)`)) return;

    setSyncing(true);
    setLoadingStatus("🚀 1단계: 기초 데이터(유저, 아티스트) 로딩 중...");

    try {
      const usersSnap = await getDocs(collection(db, "monitored_users"));
      const userMap: Record<string, any> = {};
      usersSnap.forEach(doc => {
          const d = doc.data();
          if (d.lastfm_username) {
            userMap[d.lastfm_username] = d;
          }
      });

      const artistsSnap = await getDocs(collection(db, "monitored_artists"));
      const allowedArtists = new Set<string>();
      artistsSnap.forEach(doc => {
          allowedArtists.add(doc.id.trim().toLowerCase()); 
      });

      const start = new Date(dateRange.start); start.setHours(0,0,0,0);
      const end = new Date(dateRange.end); end.setHours(23,59,59,999);
      
      setLoadingStatus("⚡ 2단계: 전체 로그 분석 중 (중복 제거 및 일일 캡 적용)...");

      const historyColl = collection(db, "listening_history");
      const qHistory = query(historyColl, where("timestamp", ">=", start), where("timestamp", "<=", end));
      const historySnap = await getDocs(qHistory);

      const uniqueRecords = new Map();

      historySnap.forEach(doc => {
          const d = doc.data();
          const userId = d.userId || d.user_id;
          if (!userId) return;

          const utcDate = d.timestamp instanceof Timestamp ? d.timestamp.toDate() : new Date(d.timestamp);
          const dedupKey = `${userId}|${utcDate.getTime()}`;
          
          if (!uniqueRecords.has(dedupKey)) {
              uniqueRecords.set(dedupKey, {
                  ...d,
                  timestamp: utcDate,
                  userId: userId
              });
          }
      });

      const userDailyStats: Record<string, { 
          date: string, 
          userId: string, 
          trackCounts: Record<string, number> 
      }> = {};

      const KST_OFFSET = 9 * 60 * 60 * 1000; 

      uniqueRecords.forEach((record) => {
          if (!record.artist) return;
          const normalizedArtist = record.artist.trim().toLowerCase();
          
          if (!allowedArtists.has(normalizedArtist)) return;

          const kstDate = new Date(record.timestamp.getTime() + KST_OFFSET);
          const dateStr = kstDate.toISOString().split('T')[0]; 

          const userId = record.userId;
          const userKey = `${dateStr}_${userId}`; 

          if (!userDailyStats[userKey]) {
              userDailyStats[userKey] = {
                  date: dateStr,
                  userId: userId,
                  trackCounts: {}
              };
          }

          const trackKey = `${record.track}|${normalizedArtist}`;
          if (!userDailyStats[userKey].trackCounts[trackKey]) {
              userDailyStats[userKey].trackCounts[trackKey] = 0;
          }
          userDailyStats[userKey].trackCounts[trackKey]++;
      });

      const DAILY_MAX_COUNT = 10; 
      const finalStats: any[] = [];

      Object.values(userDailyStats).forEach(dailyUser => {
          let validPlays = 0;
          Object.values(dailyUser.trackCounts).forEach(count => {
              validPlays += Math.min(count, DAILY_MAX_COUNT);
          });

          const userInfo = userMap[dailyUser.userId] || { store_name: "Unknown", franchise: "personal" };

          finalStats.push({
              date: dailyUser.date,
              lastfm_username: dailyUser.userId,
              play_count: validPlays,
              store_name: userInfo.store_name,
              franchise: userInfo.franchise
          });
      });

      if (finalStats.length > 0) {
          setLoadingStatus(`💾 3단계: 계산 완료된 ${finalStats.length}개 통계 저장 중...`);
          
          const batchSize = 500;
          let opCount = 0;
          
          for (let i = 0; i < finalStats.length; i += batchSize) {
              const batch = writeBatch(db);
              const chunk = finalStats.slice(i, i + batchSize);
              
              chunk.forEach(stat => {
                  const ref = doc(db, "daily_stats", `${stat.date}_${stat.lastfm_username}`);
                  batch.set(ref, stat, { merge: true });
                  opCount++;
              });
              
              await batch.commit();
          }
          
          alert(`동기화 완료!\n총 ${opCount}개의 데이터가 '일일 최대 10회 제한' 로직으로 재산출되었습니다.`);
          fetchRealData(true); 
      } else {
          alert("해당 기간에 조건에 맞는 재생 기록이 없습니다.");
          setSyncing(false);
          setLoadingStatus("");
      }

    } catch (e: any) {
      console.error(e);
      setLoadingStatus(`❌ 오류 발생: ${e.message}`);
      alert("오류가 발생했습니다.");
    } finally {
      setSyncing(false);
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto", paddingBottom: "100px" }}>
      {/* 상단 필터 & 동기화 버튼 */}
      <div style={filterContainerStyle}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: 0, marginRight: "10px" }}>통계 조회</h2>
          <input type="date" value={dateRange.start} onChange={(e)=>setDateRange({...dateRange, start:e.target.value})} style={inputStyle} />
          <span style={{ color: "#888" }}>~</span>
          <input type="date" value={dateRange.end} onChange={(e)=>setDateRange({...dateRange, end:e.target.value})} style={inputStyle} />
          <button onClick={() => fetchRealData(true)} style={primaryBtnStyle}>조회</button>
        </div>

        {/* 🔴 우측 상단 데이터 동기화 버튼 */}
        <button 
            onClick={syncMissingData} 
            disabled={syncing || loading}
            style={{
                background: syncing ? "#fca5a5" : "#ef4444", 
                color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", 
                cursor: syncing ? "not-allowed" : "pointer", fontWeight: "bold", fontSize: "14px",
                display: "flex", alignItems: "center", gap: "6px",
                transition: "background 0.2s"
            }}
        >
            {syncing ? "🔄 작업 중..." : "🔴 데이터 동기화"}
        </button>
      </div>

      {/* 요약 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "30px" }}>
        <StatCard label="총 사용자" value={stats.users} subText="전체 가입 매장" unit="명" loading={loading} />
        <StatCard label="조회 기간 재생" value={stats.plays} subText="유효 재생 합계" unit="곡" loading={loading} color="#3b82f6" />
        <StatCard label="조회 기간 정산" value={stats.revenue} subText="예상 정산금 합계" unit="원" loading={loading} color="#10b981" />
      </div>

      {/* 로딩 메시지 */}
      {(loading || syncing) && loadingStatus && (
        <div style={{ textAlign: "center", padding: "20px", background: "#f0f9ff", color: "#0369a1", borderRadius: "8px", marginBottom: "20px" }}>
          ⏳ {loadingStatus}
        </div>
      )}

      {/* 메인 그래프 */}
      <div style={sectionBoxStyle}>
        <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "20px" }}>📈 전체 재생 추이</h3>
        <div style={{ width: "100%", height: "300px" }}>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{fontSize: 12, fill: '#888'}} dy={10} />
              <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{fontSize: 12, fill: '#888'}} />
              <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tick={{fontSize: 12, fill: '#888'}} />
              <Tooltip formatter={(value: any) => Number(value).toLocaleString()} contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="plays" name="재생수" stroke="#3b82f6" strokeWidth={3} dot={{r:4}} />
              {/*<Line yAxisId="right" type="monotone" dataKey="revenue" name="금액(원)" stroke="#10b981" strokeWidth={3} dot={{r:4}} />*/}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 사용자 리스트 */}
      <div style={sectionBoxStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "bold" }}>사용자별 현황</h3>
            <div style={{ display: "flex", gap: "5px" }}>
                <input 
                    type="text" 
                    placeholder="매장명 또는 ID 검색..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                    style={{
                        padding: "8px 12px", border: "1px solid #ddd", borderRadius: "6px",
                        fontSize: "14px", width: "200px", outline: "none"
                    }}
                />
                <button 
                    onClick={handleSearch}
                    style={{
                        background: "#3b82f6", color: "white", border: "none", 
                        padding: "8px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "bold"
                    }}
                >
                    검색
                </button>
            </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #eee", color: "#666" }}>
              <th style={thStyle}>매장명 (ID) / 유형</th>
              <th style={thStyle}>유효 재생수</th>
              <th style={thStyle}>예상 정산금</th>
              <th style={thStyle}>상세보기</th>
            </tr>
          </thead>
          <tbody>
            {filteredUserList.length > 0 ? (
              filteredUserList.map((user, idx) => (
                <tr 
                  key={idx} 
                  style={{ borderBottom: "1px solid #f9fafb", transition: "background 0.2s" }} 
                  onMouseOver={(e) => e.currentTarget.style.background = "#f5f5f5"}
                  onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <td style={tdStyle}>
                    <div style={{ fontWeight: "bold", color: "#333" }}>{user.storeName}</div>
                    <div style={{ fontSize: "12px", color: "#999" }}>{user.id}</div>
                    <span style={{ 
                      fontSize: "10px", padding: "2px 6px", borderRadius: "4px", 
                      background: user.franchise === 'seveneleven' ? "#008060" : "#6366f1", 
                      color: "white", marginTop: "4px", display: "inline-block" 
                    }}>
                      {user.franchise === 'seveneleven' ? '세븐일레븐' : '개인/기타'}
                    </span>
                  </td>
                  <td style={tdStyle}>{user.plays.toLocaleString()} 곡</td>
                  <td style={{ ...tdStyle, color: "#10b981", fontWeight: "bold" }}>{user.revenue.toLocaleString()} 원</td>
                  <td style={tdStyle}>
                    <button
                        onClick={() => router.push(`/admin/dashboard/${user.firebaseUid || user.id}`)}
                        style={{
                            background: "#1f2937", color: "white", border: "none",
                            padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px"
                        }}
                    >
                        상세보기
                    </button>
                  </td>
                </tr>
              ))
            ) : (
               <tr><td colSpan={4} style={{ padding: "30px", textAlign: "center", color: "#999" }}>
                   {filterKeyword ? "검색 결과가 없습니다." : "데이터가 없습니다."}
               </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, subText, unit, loading, color = "#333" }: any) {
  return (
    <div style={{ background: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #eee" }}>
      <div style={{ color: "#6b7280", fontSize: "14px", marginBottom: "5px" }}>{label}</div>
      <div style={{ fontSize: "28px", fontWeight: "bold", color: loading ? "#eee" : color, marginBottom: "5px" }}>
        {loading ? "-" : value.toLocaleString()} <span style={{ fontSize: "14px", color: "#888", fontWeight: "normal" }}>{unit}</span>
      </div>
      <div style={{ fontSize: "13px", color: "#888" }}>{subText}</div>
    </div>
  );
}

const filterContainerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", background: "white", padding: "15px 20px", borderRadius: "12px", border: "1px solid #eee" };
const sectionBoxStyle = { background: "white", padding: "25px", borderRadius: "12px", border: "1px solid #eee", marginBottom: "20px" };
const inputStyle = { border: "1px solid #ddd", borderRadius: "6px", padding: "8px 10px", fontSize: "14px", outline: "none" };
const primaryBtnStyle = { background: "#1f2937", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" };
const thStyle = { padding: "12px", textAlign: "left" as const, fontWeight: "normal" };
const tdStyle = { padding: "12px", color: "#333" };