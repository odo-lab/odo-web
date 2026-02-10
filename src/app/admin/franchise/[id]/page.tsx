"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell 
} from 'recharts';

export default function FranchiseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const franchiseId = params.id as string; // 'seveneleven' or 'personal'

  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");

  // 브랜드명 매핑
  const franchiseName = franchiseId === 'seveneleven' ? '세븐일레븐' : '개인/기타';
  const themeColor = franchiseId === 'seveneleven' ? '#008060' : '#6366f1';

  // 날짜 포맷팅
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

  const [summary, setSummary] = useState({ totalRevenue: 0, totalPlays: 0, activeStores: 0 });
  const [chartData, setChartData] = useState<any[]>([]); // 일별 추이
  const [storeList, setStoreList] = useState<any[]>([]); // 매장 리스트

  // 💰 정산금 계산 로직 (계단식)
  const calculateRevenue = (plays: number) => {
    let maxRevenue = 30000; // 개인/기타
    if (franchiseId === 'seveneleven') maxRevenue = 22000;

    if (plays < 2500) return 0;
    else if (plays < 5000) return Math.floor(maxRevenue / 3);
    else if (plays < 7500) return Math.floor((maxRevenue * 2) / 3);
    else return maxRevenue;
  };

  useEffect(() => {
    fetchDetailData();
  }, [dateRange]);

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

  const fetchDetailData = async () => {
    setLoading(true);
    setLoadingStatus("데이터 분석 중...");

    try {
      // 1. 유저 정보 로드 (매장명 매핑용)
      const usersSnap = await getDocs(collection(db, "monitored_users"));
      const userMap: Record<string, { name: string, franchise: string, uid: string }> = {};
      
      usersSnap.forEach(doc => {
        const d = doc.data();
        if (d.lastfm_username) {
          // franchise가 없는 경우 personal로 간주
          const userFranchise = d.franchise || 'personal';
          
          // 현재 조회 중인 브랜드와 일치하는 유저만 맵에 저장 (필터링 최적화)
          if (userFranchise === franchiseId) {
            userMap[d.lastfm_username] = {
                name: d.store_name || "이름 없음",
                franchise: userFranchise,
                uid: d.uid
            };
          }
        }
      });

      // 2. Daily Stats 조회
      const statsColl = collection(db, "daily_stats");
      const qStats = query(
        statsColl, 
        where("date", ">=", dateRange.start),
        where("date", "<=", dateRange.end)
      );
      const statsSnap = await getDocs(qStats);

      // 3. 데이터 집계
      const dailyAggregates: Record<string, number> = {}; // { 날짜: 총재생수 }
      const userAggregates: Record<string, number> = {};  // { 유저ID: 총재생수 }

      // 날짜 초기화 (0으로 채우기)
      const allDates = getDatesInRange(new Date(dateRange.start), new Date(dateRange.end));
      allDates.forEach(d => dailyAggregates[d] = 0);

      statsSnap.forEach(doc => {
        const d = doc.data();
        const uid = d.lastfm_username || d.userId;
        const count = d.play_count !== undefined ? d.play_count : (d.playCount || 0);

        // 우리 브랜드 매장인지 확인 (userMap에 있으면 우리 식구)
        // 주의: userMap에 없더라도 daily_stats에 franchise 필드가 있다면 그걸로도 확인 가능
        const isMyFranchise = userMap[uid] || (d.franchise === franchiseId);

        if (uid && isMyFranchise) {
            // 일별 합계
            if (dailyAggregates[d.date] !== undefined) {
                dailyAggregates[d.date] += count;
            }
            // 유저별 합계
            userAggregates[uid] = (userAggregates[uid] || 0) + count;
        }
      });

      // 4. 차트 데이터 생성 (일별 추이)
      const finalChartData = allDates.map(date => ({
        name: date.slice(5), // MM-DD
        plays: dailyAggregates[date]
      }));

      // 5. 매장 리스트 생성 및 정산금 계산
      let grandTotalRevenue = 0;
      let grandTotalPlays = 0;

      const finalStoreList = Object.keys(userAggregates).map(uid => {
        const totalPlays = userAggregates[uid];
        const revenue = calculateRevenue(totalPlays); // 구간별 로직 적용
        const storeName = userMap[uid]?.name || "Unknown Store";
        const firebaseUid = userMap[uid]?.uid || uid;

        grandTotalRevenue += revenue;
        grandTotalPlays += totalPlays;

        return {
            id: uid,
            firebaseUid,
            name: storeName,
            plays: totalPlays,
            revenue: revenue,
            avg: Math.floor(totalPlays / allDates.length) // 일평균
        };
      }).sort((a, b) => b.plays - a.plays); // 재생수 내림차순 정렬

      setSummary({
        totalRevenue: grandTotalRevenue,
        totalPlays: grandTotalPlays,
        activeStores: finalStoreList.length
      });
      setChartData(finalChartData);
      setStoreList(finalStoreList);

    } catch (e) {
      console.error(e);
      setLoadingStatus("오류 발생");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* 헤더 & 뒤로가기 */}
      <div style={{ marginBottom: "20px" }}>
        <button 
          onClick={() => router.back()}
          style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: "14px", marginBottom: "10px" }}
        >
          ← 전체 통계로 돌아가기
        </button>
        <div style={filterContainerStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h2 style={{ fontSize: "24px", fontWeight: "bold", margin: 0, color: themeColor }}>
                    {franchiseName} 상세 리포트
                </h2>
                <input type="date" value={dateRange.start} onChange={(e)=>setDateRange({...dateRange, start:e.target.value})} style={inputStyle} />
                <span style={{ color: "#888" }}>~</span>
                <input type="date" value={dateRange.end} onChange={(e)=>setDateRange({...dateRange, end:e.target.value})} style={inputStyle} />
                <button onClick={fetchDetailData} style={primaryBtnStyle}>조회</button>
            </div>
        </div>
      </div>

      {/* 1. 요약 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "30px" }}>
        <StatCard label="총 정산 금액" value={summary.totalRevenue} unit="원" color={themeColor} isHighlight={true} />
        <StatCard label="총 유효 재생" value={summary.totalPlays} unit="곡" color="#3b82f6" />
        <StatCard label="활성 매장 수" value={summary.activeStores} unit="개" />
      </div>

      {/* 2. 차트 (일별 추이) */}
      <div style={sectionBoxStyle}>
        <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "20px" }}>📈 {franchiseName} 전체 일별 추이</h3>
        <div style={{ width: "100%", height: "300px" }}>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{fontSize: 12, fill: '#888'}} dy={10} />
              <YAxis tickLine={false} axisLine={false} tick={{fontSize: 12, fill: '#888'}} />
              <Tooltip 
                contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                itemStyle={{ color: themeColor }}
              />
              <Legend />
              <Line type="monotone" dataKey="plays" name="재생수" stroke={themeColor} strokeWidth={3} dot={{r:4}} activeDot={{r:6}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. 소속 매장 랭킹 테이블 */}
      <div style={sectionBoxStyle}>
        <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "15px" }}>🏆 매장별 성과 (재생 순위)</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #eee", color: "#666", background: "#f9fafb" }}>
              <th style={thStyle}>순위</th>
              <th style={thStyle}>매장명 (ID)</th>
              <th style={thStyle}>기간 내 총 재생</th>
              <th style={thStyle}>일 평균</th>
              <th style={thStyle}>예상 정산금</th>
              <th style={thStyle}>관리</th>
            </tr>
          </thead>
          <tbody>
            {storeList.length > 0 ? (
                storeList.map((store, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #eee", height: "50px", background: idx < 3 ? "#fafafa" : "white" }}>
                    <td style={{ ...tdStyle, width: "60px", textAlign: "center" }}>
                        {idx < 3 ? <span style={{ fontWeight: "bold", color: themeColor }}>{idx + 1}위</span> : idx + 1}
                    </td>
                    <td style={tdStyle}>
                        <div style={{ fontWeight: "bold", color: "#333" }}>{store.name}</div>
                        <div style={{ fontSize: "11px", color: "#999" }}>{store.id}</div>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: "600" }}>{store.plays.toLocaleString()} 곡</td>
                    <td style={tdStyle}>{store.avg.toLocaleString()} 곡</td>
                    <td style={{ ...tdStyle, fontWeight: "bold", color: themeColor }}>{store.revenue.toLocaleString()} 원</td>
                    <td style={tdStyle}>
                        <button
                            onClick={() => router.push(`/admin/dashboard/${store.firebaseUid || store.id}`)}
                            style={{
                                padding: "6px 12px", borderRadius: "6px", border: "1px solid #ddd",
                                background: "white", cursor: "pointer", fontSize: "12px"
                            }}
                        >
                            상세보기
                        </button>
                    </td>
                </tr>
                ))
            ) : (
                <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#999" }}>해당 기간에 데이터가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// UI 컴포넌트
function StatCard({ label, value, unit, color = "#333", isHighlight = false, subText }: any) {
  return (
    <div style={{ 
        background: "white", padding: "24px", borderRadius: "12px", 
        boxShadow: isHighlight ? `0 4px 12px ${color}20` : "0 1px 3px rgba(0,0,0,0.05)", 
        border: "1px solid #eee", borderTop: isHighlight ? `4px solid ${color}` : "1px solid #eee"
    }}>
      <div style={{ color: "#6b7280", fontSize: "14px", marginBottom: "5px" }}>{label}</div>
      <div style={{ fontSize: "28px", fontWeight: "bold", color: color, marginBottom: "5px" }}>
        {value.toLocaleString()} <span style={{ fontSize: "14px", color: "#888", fontWeight: "normal" }}>{unit}</span>
      </div>
      {subText && <div style={{ fontSize: "12px", color: "#888" }}>{subText}</div>}
    </div>
  );
}

const filterContainerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", background: "white", padding: "15px 20px", borderRadius: "12px", border: "1px solid #eee" };
const sectionBoxStyle = { background: "white", padding: "25px", borderRadius: "12px", border: "1px solid #eee", marginBottom: "20px" };
const inputStyle = { border: "1px solid #ddd", borderRadius: "6px", padding: "8px 10px", fontSize: "14px", outline: "none" };
const primaryBtnStyle = { background: "#1f2937", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" };
const thStyle = { padding: "12px", textAlign: "left" as const, fontWeight: "600" };
const tdStyle = { padding: "12px", color: "#333" };