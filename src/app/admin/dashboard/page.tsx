"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, writeBatch, Timestamp } from "firebase/firestore";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  
  // 📅 날짜 포맷팅 헬퍼 (KST 기준)
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

  // 🗓️ 초기 날짜: 이번 달 1일 ~ 오늘
  const today = new Date();
  const yesterday = new Date(today); 
  yesterday.setDate(today.getDate() - 1)
  const [dateRange, setDateRange] = useState({
    start: formatYMD(new Date(today.getFullYear(), today.getMonth(), 1)), 
    end: formatYMD(yesterday)
  });

  useEffect(() => {
    fetchRealData();
  }, []);

  const calculateRevenue = (franchise: string, plays: number) => {
    const TARGET_SONGS = 7500; 
    if (franchise === 'personal' || !franchise) { 
      const MAX_REVENUE = 30000; 
      return plays >= TARGET_SONGS ? MAX_REVENUE : Math.floor(plays * (MAX_REVENUE / TARGET_SONGS));
    }
    if (franchise === 'seveneleven') {
      const MAX_REVENUE = 22000; 
      return plays >= TARGET_SONGS ? MAX_REVENUE : Math.floor(plays * (MAX_REVENUE / TARGET_SONGS));
    }
    return 0;
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
      // 1. 전체 유저 목록 로드 (출석부 명단)
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

      // 2. daily_stats 조회 (제출된 장부 확인)
      const statsColl = collection(db, "daily_stats");
      const qStats = query(
        statsColl, 
        where("date", ">=", dateRange.start),
        where("date", "<=", dateRange.end)
      );
      const statsSnap = await getDocs(qStats);

      // 3. 🕵️‍♂️ 누락된 (날짜 x 유저) 찾기
      const existingKeys = new Set<string>(); 
      statsSnap.forEach(doc => {
        const d = doc.data();
        const uid = d.lastfm_username || d.userId;
        existingKeys.add(`${d.date}_${uid}`);
      });

      const requiredDates = getDatesInRange(new Date(dateRange.start), new Date(dateRange.end));
      const missingTasks: { date: string, userId: string }[] = [];
      const missingDates = new Set<string>();

      // 모든 날짜, 모든 유저에 대해 체크!
      requiredDates.forEach(date => {
        allUserIds.forEach(userId => {
            const key = `${date}_${userId}`;
            if (!existingKeys.has(key)) {
                missingTasks.push({ date, userId });
                missingDates.add(date);
            }
        });
      });

      // 최종 통계 데이터를 담을 배열
      let finalStats: any[] = [];
      statsSnap.forEach(doc => finalStats.push(doc.data()));

      // 4. 누락된 데이터 생성 (Gap Filling)
      if (missingTasks.length > 0) {
        console.log(`⚡ 총 ${missingTasks.length}건의 누락 데이터 복구 시작`);
        setLoadingStatus(`누락 데이터 ${missingTasks.length}건 생성 중...`);

        const sortedMissingDates = Array.from(missingDates).sort();
        const minDateStr = sortedMissingDates[0];
        const maxDateStr = sortedMissingDates[sortedMissingDates.length - 1];

        const historyColl = collection(db, "listening_history");
        const sDate = new Date(minDateStr); sDate.setHours(0,0,0,0);
        const eDate = new Date(maxDateStr); eDate.setHours(23,59,59,999);

        // 해당 기간의 히스토리 가져오기
        const qHistory = query(historyColl, where("timestamp", ">=", sDate), where("timestamp", "<=", eDate));
        const historySnap = await getDocs(qHistory);
        
        const tempMap: Record<string, any> = {};
        const missingKeysSet = new Set(missingTasks.map(t => `${t.date}_${t.userId}`));

        historySnap.forEach(doc => {
          const d = doc.data();
          const utcDate = d.timestamp instanceof Timestamp ? d.timestamp.toDate() : new Date(d.timestamp);
          const kstDate = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000));
          const dateStr = kstDate.toISOString().split('T')[0];
          const lastfmId = d.userId || d.user_id;

          if (!lastfmId) return;

          const key = `${dateStr}_${lastfmId}`;

          // 우리가 찾던 "누락된 녀석"일 때만 집계
          if (missingKeysSet.has(key)) {
            if (!tempMap[key]) {
              const userInfo = userMap[lastfmId] || { store_name: "Unknown", franchise: "personal" };
              tempMap[key] = {
                date: dateStr,
                lastfm_username: lastfmId, 
                store_name: userInfo.store_name,
                franchise: userInfo.franchise,
                play_count: 0 
              };
            }
            tempMap[key].play_count++; 
          }
        });

        const recoveredStats = Object.values(tempMap);
        
        if (recoveredStats.length > 0) {
           const batch = writeBatch(db);
           let opCount = 0;
           recoveredStats.forEach(stat => {
             finalStats.push(stat); 
             const ref = doc(db, "daily_stats", `${stat.date}_${stat.lastfm_username}`);
             batch.set(ref, stat, { merge: true });
             opCount++;
           });
           if (opCount > 0) await batch.commit();
        }
      }

      // 5. 차트 및 리스트 가공 (반응형 차트)
      const diffTime = Math.abs(new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      const isDailyView = diffDays <= 60; // 60일 이하면 일별

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
        const revenue = calculateRevenue(franchise, count);

        let chartKey: string;
        if (isDailyView) {
            chartKey = stat.date; // 일별 키
        } else {
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            chartKey = `${year}-${month}`; // 월별 키
        }

        if (!chartMap[chartKey]) chartMap[chartKey] = { plays: 0, revenue: 0 };
        chartMap[chartKey].plays += count;
        chartMap[chartKey].revenue += revenue;

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

        return { 
            id: uid, 
            storeName: storeName, 
            franchise: franchise, 
            plays: p, 
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

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* 상단 필터 */}
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
        <StatCard label="조회 기간 정산" value={stats.revenue} subText="기간 내 합계" unit="원" loading={loading} color="#10b981" />
      </div>

      {/* 로딩 메시지 */}
      {loading && loadingStatus && (
        <div style={{ textAlign: "center", padding: "20px", background: "#f0f9ff", color: "#0369a1", borderRadius: "8px", marginBottom: "20px" }}>
          ⏳ {loadingStatus}
        </div>
      )}

      {/* 메인 그래프 */}
      <div style={sectionBoxStyle}>
        <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "20px" }}>📈 재생 추이</h3>
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
              <Line yAxisId="right" type="monotone" dataKey="revenue" name="금액(원)" stroke="#10b981" strokeWidth={3} dot={{r:4}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 사용자 리스트 */}
      <div style={sectionBoxStyle}>
        <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "15px" }}>사용자별 현황</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #eee", color: "#666" }}>
              <th style={thStyle}>매장명 (ID) / 유형</th>
              <th style={thStyle}>재생수</th>
              <th style={thStyle}>예상 정산금</th>
            </tr>
          </thead>
          <tbody>
            {userList.length > 0 ? (
              userList.map((user, idx) => (
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
              ))
            ) : (
               <tr><td colSpan={3} style={{ padding: "30px", textAlign: "center", color: "#999" }}>데이터가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 스타일
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