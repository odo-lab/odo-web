"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where ,getCountFromServer} from "firebase/firestore";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, 
  PieChart, Pie, Cell 
} from 'recharts';


const checkTotalCount = async () => {
  try {
    const coll = collection(db, "monitored_artists");
    const snapshot = await getCountFromServer(coll);
    
    console.log("📊 현재 총 아티스트 수:", snapshot.data().count);
    alert(`현재 총 ${snapshot.data().count}명의 아티스트가 등록되어 있습니다.`);
  } catch (e) {
    console.error(e);
  }
};
export default function FranchiseStatsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");

  // 날짜 포맷팅
  const formatYMD = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 🗓️ 조회 기간: 이번 달 1일 ~ 어제
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const [dateRange, setDateRange] = useState({
    start: formatYMD(new Date(today.getFullYear(), today.getMonth(), 1)), 
    end: formatYMD(yesterday)
  });

  const [franchiseData, setFranchiseData] = useState<any[]>([]);
  const [totalStats, setTotalStats] = useState({ revenue: 0, plays: 0, stores: 0 });

  // 💰 정산금 계산 로직 (구간별 계단식 - 관리자 대시보드와 동일)
  const calculateRevenue = (franchise: string, plays: number) => {
    let maxRevenue = 30000; 
    if (franchise === 'seveneleven') maxRevenue = 22000;

    if (plays < 2500) return 0;
    else if (plays < 5000) return Math.floor(maxRevenue / 3);
    else if (plays < 7500) return Math.floor((maxRevenue * 2) / 3);
    else return maxRevenue;
  };

  useEffect(() => {
    fetchFranchiseData();
  }, []);

  const fetchFranchiseData = async () => {
    setLoading(true);
    setLoadingStatus("데이터 집계 중...");

    try {
      // 1. 유저 정보 매핑 (소속 프랜차이즈 확인용)
      const usersSnap = await getDocs(collection(db, "monitored_users"));
      const userMap: Record<string, string> = {}; // { userId: franchise }
      
      usersSnap.forEach(doc => {
        const d = doc.data();
        if (d.lastfm_username) {
          // franchise 필드가 없으면 'personal'로 간주
          userMap[d.lastfm_username] = d.franchise || 'personal';
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

      // 3. [Method A] 유저별 합산 -> 정산금 계산 -> 프랜차이즈별 집계
      const userAggregates: Record<string, number> = {}; // { userId: totalPlays }

      statsSnap.forEach(doc => {
        const d = doc.data();
        const uid = d.lastfm_username || d.userId;
        const count = d.play_count !== undefined ? d.play_count : (d.playCount || 0);
        
        if (uid) {
            userAggregates[uid] = (userAggregates[uid] || 0) + count;
        }
      });

      // 프랜차이즈별 집계 결과
      const franchiseStats: Record<string, { name: string, stores: number, plays: number, revenue: number, id: string }> = {
        'seveneleven': { id: 'seveneleven', name: '세븐일레븐', stores: 0, plays: 0, revenue: 0 },
        'personal': { id: 'personal', name: '개인/기타', stores: 0, plays: 0, revenue: 0 }
      };

      Object.entries(userAggregates).forEach(([uid, plays]) => {
        const franchiseKey = userMap[uid] || 'personal';
        
        // 데이터 구조에 키가 없으면 personal로 귀속 (안전장치)
        const targetKey = franchiseStats[franchiseKey] ? franchiseKey : 'personal';

        // 1. 매장별 정산금 계산 (Method A)
        const userRevenue = calculateRevenue(targetKey, plays);

        // 2. 프랜차이즈 통계에 누적
        franchiseStats[targetKey].stores += 1;
        franchiseStats[targetKey].plays += plays;
        franchiseStats[targetKey].revenue += userRevenue;
      });

      const resultData = Object.values(franchiseStats);

      // 전체 합계 계산
      const total = resultData.reduce((acc, cur) => ({
        revenue: acc.revenue + cur.revenue,
        plays: acc.plays + cur.plays,
        stores: acc.stores + cur.stores
      }), { revenue: 0, plays: 0, stores: 0 });

      setFranchiseData(resultData);
      setTotalStats(total);

    } catch (e) {
      console.error(e);
      setLoadingStatus("데이터 로드 실패");
    } finally {
      setLoading(false);
    }
  };

  // 차트용 컬러
  const COLORS = ['#008060', '#6366f1']; // 세븐일레븐(녹색), 개인(보라)

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* 상단 헤더 & 조회 */}
      <div style={filterContainerStyle}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <h2 style={{  color: "#2e2d2d" ,fontSize: "20px", fontWeight: "bold", margin: 0, marginRight: "10px" }}>🏢 프랜차이즈 통계</h2>
          <input type="date" value={dateRange.start} onChange={(e)=>setDateRange({...dateRange, start:e.target.value})} style={inputStyle} />
          <span style={{ color: "#888" }}>~</span>
          <input type="date" value={dateRange.end} onChange={(e)=>setDateRange({...dateRange, end:e.target.value})} style={inputStyle} />
          <button onClick={fetchFranchiseData} style={primaryBtnStyle}>조회</button>
        </div>
      </div>

      {/* 1. 종합 요약 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "30px" }}>
        <StatCard label="총 정산 예정 금액" value={totalStats.revenue} unit="원" color="#10b981" subText="모든 브랜드 합계" />
        <StatCard label="총 재생 수" value={totalStats.plays} unit="곡" color="#3b82f6" subText="유효 재생 기준" />
        <StatCard label="전체 매장 수" value={totalStats.stores} unit="개" subText="집계된 매장 수" />
      </div>

      {/* 로딩 표시 */}
      {loading && <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>⏳ {loadingStatus}</div>}

      {/* 2. 시각화 차트 (좌: 금액비교, 우: 점유율) */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", marginBottom: "30px" }}>
        
        {/* 막대 차트: 정산금 비교 */}
        <div style={sectionBoxStyle}>
          <h3 style={{ color: "#161616",fontSize: "16px", fontWeight: "bold", marginBottom: "20px" }}>📊 브랜드별 정산금 비교</h3>
          <div style={{ width: "100%", height: "300px" }}>
            <ResponsiveContainer>
              <BarChart data={franchiseData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
                <XAxis type="number" tickFormatter={(val) => val.toLocaleString()} />
                <YAxis dataKey="name" type="category" width={100} tick={{fontWeight:'bold'}} />
                <Tooltip formatter={(val:any) => `${val.toLocaleString()} 원`} cursor={{fill: '#f5f5f5'}} />
                <Legend />
                <Bar dataKey="revenue" name="정산금" fill="#8884d8" barSize={40}>
                  {franchiseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.id === 'seveneleven' ? '#008060' : '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 원형 차트: 매장 점유율 */}
        <div style={sectionBoxStyle}>
          <h3 style={{ color: "#161616",fontSize: "16px", fontWeight: "bold", marginBottom: "20px" }}>🥧 매장 점유율</h3>
          <div style={{ width: "100%", height: "300px" }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={franchiseData}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={90}
                  paddingAngle={5}
                  dataKey="stores"
                  nameKey="name"
                >
                  {franchiseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.id === 'seveneleven' ? '#008060' : '#6366f1'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. 상세 테이블 */}
      <div style={sectionBoxStyle}>
        <h3 style={{  color: "#161616",fontSize: "16px", fontWeight: "bold", marginBottom: "15px" }}>📋 브랜드별 상세 현황</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #eee", color: "#666", background: "#f9fafb" }}>
              <th style={thStyle}>브랜드명</th>
              <th style={thStyle}>매장 수</th>
              <th style={thStyle}>총 유효 재생</th>
              <th style={thStyle}>매장당 평균 재생</th>
              <th style={thStyle}>총 정산금</th>
              <th style={thStyle}>관리</th>
            </tr>
          </thead>
          <tbody>
            {franchiseData.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #eee", height: "50px" }}>
                <td style={tdStyle}>
                  <span style={{ 
                    fontWeight: "bold", color: item.id === 'seveneleven' ? '#008060' : '#6366f1',
                    display: "flex", alignItems: "center", gap: "6px"
                  }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: item.id === 'seveneleven' ? '#008060' : '#6366f1' }}></span>
                    {item.name}
                  </span>
                </td>
                <td style={tdStyle}>{item.stores.toLocaleString()} 개</td>
                <td style={tdStyle}>{item.plays.toLocaleString()} 곡</td>
                <td style={tdStyle}>
                  {item.stores > 0 ? Math.floor(item.plays / item.stores).toLocaleString() : 0} 곡
                </td>
                <td style={{ ...tdStyle, fontWeight: "bold", color: "#333" }}>{item.revenue.toLocaleString()} 원</td>
                <td style={tdStyle}>
                  {/* 상세 페이지 이동 버튼 (Next.js Dynamic Route) */}
                  <button 
                    onClick={() => router.push(`/admin/franchise/${item.id}`)}
                    style={{
                      padding: "6px 12px", borderRadius: "6px", border: "1px solid #ddd", 
                      background: "white", cursor: "pointer", fontSize: "12px", fontWeight: "bold", color: "#555"
                    }}
                  >
                    상세보기 →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// UI 컴포넌트 & 스타일
function StatCard({ label, value, unit, color = "#333", subText }: any) {
  return (
    <div style={{ background: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #eee" }}>
      <div style={{ color: "#6b7280", fontSize: "14px", marginBottom: "5px" }}>{label}</div>
      <div style={{ fontSize: "28px", fontWeight: "bold", color: color, marginBottom: "5px" }}>
        {value.toLocaleString()} <span style={{ fontSize: "14px", color: "#888", fontWeight: "normal" }}>{unit}</span>
      </div>
      <div style={{ fontSize: "13px", color: "#888" }}>{subText}</div>
    </div>
  );
}

const filterContainerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", background: "white", padding: "15px 20px", borderRadius: "12px", border: "1px solid #eee" };
const sectionBoxStyle = { background: "white", padding: "25px", borderRadius: "12px", border: "1px solid #eee", marginBottom: "20px" };
const inputStyle = { border: "1px solid #ddd", borderRadius: "6px", padding: "8px 10px", fontSize: "14px", outline: "none" };
const primaryBtnStyle = { background: "#1f2937", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" };
const thStyle = { padding: "12px", textAlign: "left" as const, fontWeight: "600" };
const tdStyle = { padding: "12px", color: "#333" };