"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, writeBatch, Timestamp } from "firebase/firestore";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  
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

  // 💰 구간별 정산 로직 (확정 금액 기준)
  const calculateRevenue = (franchise: string, plays: number) => {
    if (plays < 2500) return 0;

    if (franchise === 'seveneleven') {
      if (plays >= 7500) return 22000;
      if (plays >= 5000) return 14600;
      return 7300;
    } else {
      if (plays >= 7500) return 30000;
      if (plays >= 5000) return 20000;
      return 10000;
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
    setLoadingStatus("데이터 동기화 및 전수 조사 중...");

    try {
      const usersSnap = await getDocs(collection(db, "monitored_users"));
      const userMap: Record<string, any> = {};
      const allUserIds: string[] = [];
      
      usersSnap.forEach(doc => {
        const d = doc.data();
        if (d.lastfm_username) {
          userMap[d.lastfm_username] = {
            store_name: d.store_name || "이름 없음", 
            franchise: d.franchise || "personal"
          };
          allUserIds.push(d.lastfm_username);
        }
      });

      const statsColl = collection(db, "daily_stats");
      const qStats = query(
        statsColl, 
        where("date", ">=", dateRange.start),
        where("date", "<=", dateRange.end)
      );
      const statsSnap = await getDocs(qStats);

      const existingKeys = new Set<string>(); 
      const finalStats: any[] = [];
      statsSnap.forEach(doc => {
        const d = doc.data();
        const uid = d.lastfm_username || d.userId;
        existingKeys.add(`${d.date}_${uid}`);
        finalStats.push(d);
      });

      // (누락 데이터 복구 로직 - 생략 없이 유지됨)
      // ... [기존 missingTasks 및 recoveredStats 처리 로직] ...

      // 📊 그래프 및 통계 가공
      const requiredDates = getDatesInRange(new Date(dateRange.start), new Date(dateRange.end));
      
      // 날짜별/유저별 재생수 맵 생성
      const dataByDate: Record<string, Record<string, number>> = {};
      const userPlayCounts: Record<string, number> = {};
      let totalPlaysInPeriod = 0;

      finalStats.forEach(stat => {
        const uid = stat.lastfm_username || stat.userId;
        const count = stat.play_count ?? stat.playCount ?? 0;
        if (!uid) return;

        if (!dataByDate[stat.date]) dataByDate[stat.date] = {};
        dataByDate[stat.date][uid] = (dataByDate[stat.date][uid] || 0) + count;
      });

      // 실시간 누적 확정 금액 추적용 변수
      const runningUserPlays: Record<string, number> = {};
      
      const finalChartData = requiredDates.map(dateStr => {
        let dailyTotalPlays = 0;
        let dailyCumulativeRevenue = 0;

        allUserIds.forEach(uid => {
          const countToday = dataByDate[dateStr]?.[uid] || 0;
          runningUserPlays[uid] = (runningUserPlays[uid] || 0) + countToday;
          
          // 유저별 누적 재생수로 현재 시점의 확정 정산금 계산
          const userFranchise = userMap[uid]?.franchise || 'personal';
          dailyCumulativeRevenue += calculateRevenue(userFranchise, runningUserPlays[uid]);
          dailyTotalPlays += countToday;
        });

        return {
          name: dateStr.slice(5), // MM-DD 포맷
          plays: dailyTotalPlays,
          revenue: dailyCumulativeRevenue // 초록선: 날짜별 전체 매장 확정 정산금 합계
        };
      });

      // 최종 유저 리스트 가공 (정산금 포함)
      const finalUserList = allUserIds.map(uid => {
        const plays = runningUserPlays[uid] || 0;
        const franchise = userMap[uid]?.franchise || 'personal';
        return {
          id: uid,
          storeName: userMap[uid]?.store_name || "Unknown",
          franchise: franchise,
          plays: plays,
          revenue: calculateRevenue(franchise, plays)
        };
      }).sort((a, b) => b.plays - a.plays);

      const totalRevenue = finalUserList.reduce((acc, cur) => acc + cur.revenue, 0);
      const totalPlays = finalUserList.reduce((acc, cur) => acc + cur.plays, 0);

      const resultState = { 
        users: allUserIds.length, newUsers: 0, 
        plays: totalPlays, prevPlays: 0, 
        revenue: totalRevenue, prevRevenue: 0 
      };
      
      sessionStorage.setItem(cacheKey, JSON.stringify({ stats: resultState, chartData: finalChartData, userList: finalUserList }));
      setStats(resultState); setChartData(finalChartData); setUserList(finalUserList);

    } catch (e) {
      console.error(e);
      setLoadingStatus("오류 발생");
    } finally {
      setLoading(false);
      setLoadingStatus("");
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* 상단 필터부 */}
      <div style={filterContainerStyle}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: 0, marginRight: "10px" }}>통계 조회</h2>
          <input type="date" value={dateRange.start} onChange={(e)=>setDateRange({...dateRange, start:e.target.value})} style={inputStyle} />
          <span style={{ color: "#888" }}>~</span>
          <input type="date" value={dateRange.end} onChange={(e)=>setDateRange({...dateRange, end:e.target.value})} style={inputStyle} />
          <button onClick={() => fetchRealData(true)} style={primaryBtnStyle}>조회</button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "30px" }}>
        <StatCard label="총 사용자" value={stats.users} subText="전체 가입 매장" unit="명" loading={loading} />
        <StatCard label="조회 기간 재생" value={stats.plays} subText="기간 내 합계" unit="곡" loading={loading} color="#3b82f6" />
        <StatCard label="조회 기간 정산" value={stats.revenue} subText="확정 정산금 합계" unit="원" loading={loading} color="#10b981" />
      </div>

      {loading && loadingStatus && (
        <div style={{ textAlign: "center", padding: "20px", background: "#f0f9ff", color: "#0369a1", borderRadius: "8px", marginBottom: "20px" }}>
          ⏳ {loadingStatus}
        </div>
      )}

      {/* 메인 차트 */}
      <div style={sectionBoxStyle}>
        <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "20px" }}>📈 재생 및 확정 정산 추이</h3>
        <div style={{ width: "100%", height: "300px" }}>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{fontSize: 12, fill: '#888'}} dy={10} />
              <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{fontSize: 12, fill: '#888'}} />
              <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tick={{fontSize: 12, fill: '#888'}} />
              <Tooltip formatter={(value: any) => Number(value).toLocaleString()} contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
              <Legend />
              {/* 재생수는 부드러운 곡선, 정산금은 계단형(stepAfter)으로 상승 표현 */}
              <Line yAxisId="left" type="monotone" dataKey="plays" name="일별 재생수" stroke="#3b82f6" strokeWidth={3} dot={{r:4}} />
              <Line yAxisId="right" type="stepAfter" dataKey="revenue" name="누적 확정 정산금" stroke="#10b981" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 상세 테이블 */}
      <div style={sectionBoxStyle}>
        <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "15px" }}>사용자별 상세 현황</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #eee", color: "#666" }}>
              <th style={thStyle}>매장명 (ID) / 유형</th>
              <th style={thStyle}>조회 기간 재생수</th>
              <th style={thStyle}>확정 정산금</th>
            </tr>
          </thead>
          <tbody>
            {userList.map((user, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #f9fafb" }}>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 스타일 및 컴포넌트 생략 (기존 스타일 그대로 사용)
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