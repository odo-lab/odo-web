"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; 
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, writeBatch, Timestamp } from "firebase/firestore";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import * as XLSX from 'xlsx';

export default function AdminDashboardPage() {
  const router = useRouter(); 
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false); 
  const [loadingStatus, setLoadingStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");      
  const [filterKeyword, setFilterKeyword] = useState(""); 

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

  // 검색 필터링 (매장명, ID, 예금주 통합 검색)
  const filteredUserList = userList.filter(user => 
    user.storeName.toLowerCase().includes(filterKeyword.toLowerCase()) ||
    user.id.toLowerCase().includes(filterKeyword.toLowerCase()) ||
    user.ownerName.toLowerCase().includes(filterKeyword.toLowerCase())
  );

  const handleSearch = () => {
    setFilterKeyword(searchTerm);
  };

  const handleDownload = (type: 'xlsx' | 'csv') => {
    if (filteredUserList.length === 0) {
      alert("다운로드할 데이터가 없습니다.");
      return;
    }

    const exportData = filteredUserList.map((user) => ({
      "매장명": user.storeName,
      "예금주": user.ownerName,
      "아이디(ID)": user.id,
      "유형": user.franchise === 'seveneleven' ? '세븐일레븐' : '개인/기타',
      "기간 내 총 재생": user.plays,
      "예상 정산금": user.revenue
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Performance");

    if (type === 'xlsx') {
      XLSX.writeFile(workbook, `성과지표_${dateRange.start}_${dateRange.end}.xlsx`);
    } else {
      const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob(["\uFEFF" + csvOutput], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `성과지표_${dateRange.start}_${dateRange.end}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const calculateRevenue = (franchise: string, plays: number) => {
    const revenueTable = franchise === 'seveneleven' ? [0, 7300, 14300, 22000] : [0, 10000, 20000, 30000];
    if (plays < 2500) return revenueTable[0];
    else if (plays < 5000) return revenueTable[1];
    else if (plays < 7500) return revenueTable[2];
    else return revenueTable[3];
  };

  const getDatesInRange = (startDate: Date, endDate: Date) => {
    const dates = [];
    const theDate = new Date(startDate);
    const end = new Date(endDate);
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
    setLoadingStatus("데이터 불러오는 중...");

    try {
      // 1. monitored_users에서 유저 정보(예금주 포함)를 먼저 로드
      const usersSnap = await getDocs(collection(db, "monitored_users"));
      const userMap: Record<string, any> = {};
      
      usersSnap.forEach(doc => {
        const d = doc.data();
        if (d.lastfm_username) {
          userMap[d.lastfm_username] = {
            ownerName: d.owner_name || "이름 없음", // 여기에 예금주 정보 저장
            store_name: d.store_name || "이름 없음", 
            franchise: d.franchise || "personal",
            uid: d.uid 
          };
        }
      });

      // 2. daily_stats 로드
      const statsColl = collection(db, "daily_stats");
      const qStats = query(
        statsColl, 
        where("date", ">=", dateRange.start),
        where("date", "<=", dateRange.end)
      );
      const statsSnap = await getDocs(qStats);

      let finalStats: any[] = [];
      statsSnap.forEach(doc => finalStats.push(doc.data()));

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

        const franchise = userMap[uid]?.franchise || stat.franchise || 'personal';
        
        const dailyEstimatedRevenue = franchise === 'seveneleven' 
            ? Math.floor((Math.min(count, 10) / 7500) * 22000) 
            : Math.floor((Math.min(count, 10) / 7500) * 30000);

        let chartKey = isDailyView ? stat.date : `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;

        if (!chartMap[chartKey]) chartMap[chartKey] = { plays: 0, revenue: 0 };
        chartMap[chartKey].plays += count;
        chartMap[chartKey].revenue += dailyEstimatedRevenue;

        if (!userPlayCounts[uid]) userPlayCounts[uid] = 0;
        userPlayCounts[uid] += count;
        totalPlaysInPeriod += count;
      });

      // 차트 데이터 가공
      const finalChartData = isDailyView 
        ? getDatesInRange(new Date(dateRange.start), new Date(dateRange.end)).map(dateStr => ({
            name: dateStr.slice(5),
            plays: chartMap[dateStr]?.plays || 0
          }))
        : Object.keys(chartMap).sort().map(month => ({
            name: `${month.split('-')[1]}월`,
            plays: chartMap[month].plays
          }));

      // 3. monitored_users 정보(userMap)와 play_counts를 합쳐 최종 리스트 생성
      const finalUserList = Object.keys(userPlayCounts).map(uid => {
        const p = userPlayCounts[uid] || 0;
        const info = userMap[uid] || {};

        return { 
            id: uid, 
            firebaseUid: info.uid || uid, 
            storeName: info.store_name || "Unknown", 
            ownerName: info.ownerName || "이름 없음", // userMap에서 예금주 매칭
            franchise: info.franchise || 'personal', 
            plays: p, 
            revenue: calculateRevenue(info.franchise || 'personal', p) 
        };
      }).sort((a,b) => b.plays - a.plays);

      const resultState = { 
        users: Object.keys(userMap).length, 
        newUsers: 0, 
        plays: totalPlaysInPeriod, 
        prevPlays: 0, 
        revenue: finalUserList.reduce((acc, cur) => acc + cur.revenue, 0), 
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

  const syncMissingData = async () => {
    if (!confirm(`${dateRange.start} ~ ${dateRange.end} 기간의 데이터를 재산출 하시겠습니까?`)) return;

    setSyncing(true);
    setLoadingStatus("🚀 1단계: 기초 데이터 로딩 중...");

    try {
      const usersSnap = await getDocs(collection(db, "monitored_users"));
      const userMap: Record<string, any> = {};
      usersSnap.forEach(doc => {
          const d = doc.data();
          if (d.lastfm_username) userMap[d.lastfm_username] = d;
      });

      const artistsSnap = await getDocs(collection(db, "monitored_artists"));
      const allowedArtists = new Set<string>();
      artistsSnap.forEach(doc => {
          allowedArtists.add(doc.id.trim().toLowerCase()); 
      });

      const start = new Date(dateRange.start); start.setHours(0,0,0,0);
      const end = new Date(dateRange.end); end.setHours(23,59,59,999);
      
      setLoadingStatus("⚡ 2단계: 전체 로그 분석 중...");

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
              uniqueRecords.set(dedupKey, { ...d, timestamp: utcDate, userId: userId });
          }
      });

      const userDailyStats: Record<string, any> = {};
      const KST_OFFSET = 9 * 60 * 60 * 1000; 

      uniqueRecords.forEach((record) => {
          if (!record.artist) return;
          const normalizedArtist = record.artist.trim().toLowerCase();
          if (!allowedArtists.has(normalizedArtist)) return;

          const kstDate = new Date(record.timestamp.getTime() + KST_OFFSET);
          const dateStr = kstDate.toISOString().split('T')[0]; 
          const userKey = `${dateStr}_${record.userId}`; 

          if (!userDailyStats[userKey]) {
              userDailyStats[userKey] = { date: dateStr, userId: record.userId, trackCounts: {} };
          }
          const trackKey = `${record.track}|${normalizedArtist}`;
          userDailyStats[userKey].trackCounts[trackKey] = (userDailyStats[userKey].trackCounts[trackKey] || 0) + 1;
      });

      const DAILY_MAX_COUNT = 10; 
      const finalStats: any[] = [];

      Object.values(userDailyStats).forEach((dailyUser: any) => {
          let validPlays = 0;
          Object.values(dailyUser.trackCounts).forEach((count: any) => {
              validPlays += Math.min(count, DAILY_MAX_COUNT);
          });
          const userInfo = userMap[dailyUser.userId] || { store_name: "Unknown", franchise: "personal" ,owner_name: "Unknown"};
          finalStats.push({
              date: dailyUser.date,
              lastfm_username: dailyUser.userId,
              play_count: validPlays,
              store_name: userInfo.store_name,
              franchise: userInfo.franchise,
              owner_name: userInfo.owner_name
          });
      });

      if (finalStats.length > 0) {
          setLoadingStatus(`💾 3단계: ${finalStats.length}개 통계 저장 중...`);
          const batchSize = 500;
          for (let i = 0; i < finalStats.length; i += batchSize) {
              const batch = writeBatch(db);
              const chunk = finalStats.slice(i, i + batchSize);
              chunk.forEach(stat => {
                  const ref = doc(db, "daily_stats", `${stat.date}_${stat.lastfm_username}`);
                  batch.set(ref, stat, { merge: true });
              });
              await batch.commit();
          }
          alert("동기화 완료!");
          fetchRealData(true); 
      } else {
          alert("재생 기록이 없습니다.");
      }

    } catch (e: any) {
      console.error(e);
      alert("오류가 발생했습니다.");
    } finally {
      setSyncing(false);
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto", paddingBottom: "100px" }}>
      
      <div style={filterContainerStyle}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: 0, marginRight: "10px" }}>통계 조회</h2>
          <input type="date" value={dateRange.start} onChange={(e)=>setDateRange({...dateRange, start:e.target.value})} style={inputStyle} />
          <span style={{ color: "#888" }}>~</span>
          <input type="date" value={dateRange.end} onChange={(e)=>setDateRange({...dateRange, end:e.target.value})} style={inputStyle} />
          <button onClick={() => fetchRealData(true)} style={primaryBtnStyle}>조회</button>
        </div>

        <button onClick={syncMissingData} disabled={syncing || loading} style={syncBtnStyle(syncing)}>
            {syncing ? "🔄 작업 중..." : "🔴 데이터 동기화"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "30px" }}>
        <StatCard label="총 사용자" value={stats.users} subText="전체 가입 매장" unit="명" loading={loading} />
        <StatCard label="조회 기간 재생" value={stats.plays} subText="유효 재생 합계" unit="곡" loading={loading} color="#3b82f6" />
        <StatCard label="조회 기간 정산" value={stats.revenue} subText="예상 정산금 합계" unit="원" loading={loading} color="#10b981" />
      </div>

      {(loading || syncing) && loadingStatus && (
        <div style={loadingStatusStyle}>⏳ {loadingStatus}</div>
      )}

      <div style={sectionBoxStyle}>
        <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "20px" }}>📈 전체 재생 추이</h3>
        <div style={{ width: "100%", height: "300px" }}>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{fontSize: 12, fill: '#888'}} dy={10} />
              <YAxis tickLine={false} axisLine={false} tick={{fontSize: 12, fill: '#888'}} />
              <Tooltip formatter={(value: any) => Number(value).toLocaleString()} />
              <Legend />
              <Line type="monotone" dataKey="plays" name="재생수" stroke="#3b82f6" strokeWidth={3} dot={{r:4}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={sectionBoxStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "bold" }}>사용자별 현황</h3>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <div style={downloadButtonGroupStyle}>
                  <button onClick={() => handleDownload('xlsx')} style={downloadBtnStyle}>Excel</button>
                  <button onClick={() => handleDownload('csv')} style={{ ...downloadBtnStyle, borderLeft: "1px solid #ddd" }}>CSV</button>
                </div>
                <div style={{ display: "flex", gap: "5px" }}>
                    <input type="text" placeholder="매장명, ID, 예금주 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }} style={searchInputStyle} />
                    <button onClick={handleSearch} style={primaryBtnStyle}>검색</button>
                </div>
            </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #eee", color: "#666" }}>
              <th style={thStyle}>매장명 (ID) / 예금주 / 유형</th>
              <th style={thStyle}>유효 재생수</th>
              <th style={thStyle}>예상 정산금</th>
              <th style={thStyle}>상세보기</th>
            </tr>
          </thead>
          <tbody>
            {filteredUserList.length > 0 ? (
              filteredUserList.map((user, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #f9fafb" }}>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ fontWeight: "bold", color: "#333" }}>{user.storeName}</div>
                        {/* 매장명 옆에 파란색 글씨로 예금주 표시 */}
                        <div style={{ fontSize: "12px", color: "#3b82f6", fontWeight: "500" }}>({user.ownerName})</div>
                    </div>
                    <div style={{ fontSize: "12px", color: "#999" }}>{user.id}</div>
                    <span style={badgeStyle(user.franchise)}>
                      {user.franchise === 'seveneleven' ? '세븐일레븐' : '개인/기타'}
                    </span>
                  </td>
                  <td style={tdStyle}>{user.plays.toLocaleString()} 곡</td>
                  <td style={{ ...tdStyle, color: "#10b981", fontWeight: "bold" }}>{user.revenue.toLocaleString()} 원</td>
                  <td style={tdStyle}>
                    <button onClick={() => router.push(`/admin/dashboard/${user.firebaseUid || user.id}`)} style={detailBtnStyle}>상세보기</button>
                  </td>
                </tr>
              ))
            ) : (
               <tr><td colSpan={4} style={{ padding: "30px", textAlign: "center", color: "#999" }}>데이터가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 스타일 정의 (생략 - 이전과 동일)
const filterContainerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", background: "white", padding: "15px 20px", borderRadius: "12px", border: "1px solid #eee" };
const sectionBoxStyle = { background: "white", padding: "25px", borderRadius: "12px", border: "1px solid #eee", marginBottom: "20px" };
const inputStyle = { border: "1px solid #ddd", borderRadius: "6px", padding: "8px 10px", fontSize: "14px", outline: "none" };
const searchInputStyle = { padding: "8px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", width: "200px", outline: "none" };
const primaryBtnStyle = { background: "#1f2937", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" };
const syncBtnStyle = (syncing: boolean) => ({ background: syncing ? "#fca5a5" : "#ef4444", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: syncing ? "not-allowed" : "pointer", fontWeight: "bold", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" });
const downloadButtonGroupStyle = { display: "flex", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden" };
const downloadBtnStyle = { background: "#f9fafb", color: "#374151", border: "none", padding: "8px 12px", fontSize: "13px", cursor: "pointer", fontWeight: "500" };
const thStyle = { padding: "12px", textAlign: "left" as const, fontWeight: "normal" };
const tdStyle = { padding: "12px", color: "#333" };
const badgeStyle = (f: string) => ({ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: f === 'seveneleven' ? "#008060" : "#6366f1", color: "white", marginTop: "4px", display: "inline-block" });
const detailBtnStyle = { background: "#1f2937", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" };
const loadingStatusStyle = { textAlign: "center" as const, padding: "20px", background: "#f0f9ff", color: "#0369a1", borderRadius: "8px", marginBottom: "20px" };

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