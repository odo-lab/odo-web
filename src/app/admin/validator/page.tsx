"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function IndependentValidator() {
  const [userId, setUserId] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [analysisDetails, setAnalysisDetails] = useState<any[]>([]);

  // 🔢 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const handleDeepAnalysis = async () => {
    if (!userId || !dateRange.start || !dateRange.end) return alert("검색 조건을 입력해주세요.");
    
    setLoading(true);
    setAnalysisDetails([]);
    setCurrentPage(1); // 분석 시 1페이지로 초기화
    
    try {
      const artistsSnap = await getDocs(collection(db, "monitored_artists"));
      const allowedArtists = new Set<string>();
      artistsSnap.forEach(doc => allowedArtists.add(doc.id.trim().toLowerCase()));

      const start = new Date(dateRange.start); start.setHours(0,0,0,0);
      const end = new Date(dateRange.end); end.setHours(23,59,59,999);
      
      const q = query(
        collection(db, "listening_history"),
        where("userId", "==", userId),
        where("timestamp", ">=", start),
        where("timestamp", "<=", end),
        orderBy("timestamp", "asc")
      );

      const snap = await getDocs(q);
      const dailyMap: Record<string, any> = {};
      const trackAnalysis: Record<string, any> = {};

      snap.forEach(doc => {
        const d = doc.data();
        const artistName = (d.artist || "Unknown").trim();
        const normalizedArtist = artistName.toLowerCase();
        const trackName = d.track || "Unknown";
        const trackKey = `${trackName} - ${artistName}`;

        if (!trackAnalysis[trackKey]) {
          trackAnalysis[trackKey] = { 
            track: trackName, 
            artist: artistName, 
            count: 0, 
            validCount: 0, 
            status: "정상",
            reason: ""
          };
        }
        trackAnalysis[trackKey].count++;

        if (!allowedArtists.has(normalizedArtist)) {
          trackAnalysis[trackKey].status = "제외";
          trackAnalysis[trackKey].reason = "아티스트 불일치";
          return;
        }

        if (trackAnalysis[trackKey].validCount < 10) {
          trackAnalysis[trackKey].validCount++;
        } else {
          trackAnalysis[trackKey].status = "삭감";
          trackAnalysis[trackKey].reason = "일일 10회 초과";
        }

        const dateKey = d.date;
        if (!dailyMap[dateKey]) dailyMap[dateKey] = { raw: 0, valid: 0 };
        dailyMap[dateKey].raw++;
        if (trackAnalysis[trackKey].validCount <= 10 && trackAnalysis[trackKey].status !== "제외") {
            dailyMap[dateKey].valid++;
        }
      });

      const detailsList = Object.values(trackAnalysis).sort((a: any, b: any) => b.count - a.count);
      setAnalysisDetails(detailsList);

      const summary = detailsList.reduce((acc: any, cur: any) => {
        acc.totalRaw += cur.count;
        acc.final += cur.validCount;
        if (cur.status === "제외") acc.rejected += cur.count;
        if (cur.status === "삭감") acc.capped += (cur.count - cur.validCount);
        return acc;
      }, { totalRaw: 0, rejected: 0, capped: 0, final: 0 });

      setReport(summary);
      setChartData(Object.keys(dailyMap).map(date => ({ date, ...dailyMap[date] })));

    } catch (e) {
      console.error(e);
      alert("분석 중 오류 발생");
    } finally {
      setLoading(false);
    }
  };

  // ✂️ 페이지네이션 데이터 슬라이싱 로직
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = analysisDetails.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(analysisDetails.length / itemsPerPage);

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      <h2 style={{ color: "#070707d5",fontSize: "22px", fontWeight: "bold", marginBottom: "20px" }}> 데이터 정합성 정밀 검증</h2>
      
      {/* 입력 섹션 */}
      <div style={{ display: "flex", gap: "10px", padding: "20px", background: "#f8fafc", borderRadius: "12px", marginBottom: "30px" }}>
        <input placeholder="검증할 유저 ID" value={userId} onChange={e => setUserId(e.target.value)} style={inputStyle} />
        <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start:e.target.value})} style={inputStyle} />
        <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end:e.target.value})} style={inputStyle} />
        <button onClick={handleDeepAnalysis} disabled={loading} style={primaryBtnStyle}>전수 조사 실행</button>
      </div>

      {report && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px", marginBottom: "30px" }}>
          <ResultCard label="원본 로그" value={report.totalRaw} color="#64748b" />
          <ResultCard label="아티스트 불일치" value={`-${report.rejected}`} color="#ef4444" />
          <ResultCard label="10회 초과 삭감" value={`-${report.capped}`} color="#f59e0b" />
          <ResultCard label="최종 인정(장부)" value={report.final} color="#10b981" />
        </div>
      )}

      {/* 곡별 상세 분석 테이블 */}
      {analysisDetails.length > 0 && (
        <div style={{ background: "white", padding: "25px", borderRadius: "12px", border: "1px solid #eee", marginTop: "30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{  color: "#070707d5", fontSize: "16px", fontWeight: "bold" }}>곡별 상세 분석 리스트 ({analysisDetails.length}건)</h3>
            <span style={{ fontSize: "13px", color: "#666" }}>{currentPage} / {totalPages} 페이지</span>
          </div>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead style={{ position: "sticky", top: 0, background: "#f8fafc" }}>
                <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                  <th style={thStyle}>상태</th>
                  <th style={thStyle}>곡 정보 / 아티스트</th>
                  <th style={thStyle}>총 재생</th>
                  <th style={thStyle}>인정</th>
                  <th style={thStyle}>제외 사유</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={tdStyle}><StatusBadge status={item.status} /></td>
                    <td style={tdStyle}>
                      <div style={{  color: "#070707d5",fontWeight: "bold" }}>{item.track}</div>
                      <div style={{ color: "#888", fontSize: "13px" }}>{item.artist}</div>
                    </td>
                    <td style={{  color: "#070707d5",fontWeight: "bold" }}>ㅤ{item.count}회</td>
                    <td style={{ ...tdStyle, color: "#10b981", fontWeight: "bold" }}>{item.validCount}회</td>
                    <td style={{ ...tdStyle, color: "#ef4444", fontSize: "12px" }}>{item.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 버튼 */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", marginTop: "30px" }}>
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} style={pageBtnStyle}>이전</button>
            <div style={{ display: "flex", gap: "5px" }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p >= currentPage - 2 && p <= currentPage + 2)
                .map(p => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    style={{
                      ...pageNumberStyle,
                      background: currentPage === p ? "#1e293b" : "#fff",
                      color: currentPage === p ? "#fff" : "#333",
                    }}
                  >{p}</button>
                ))}
            </div>
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} style={pageBtnStyle}>다음</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 보조 컴포넌트 & 스타일 ---
function StatusBadge({ status }: { status: string }) {
  const colors: any = {
    "정상": { bg: "#dcfce7", text: "#166534" },
    "제외": { bg: "#fee2e2", text: "#991b1b" },
    "삭감": { bg: "#fef3c7", text: "#92400e" }
  };
  const style = colors[status] || colors["정상"];
  return (
    <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", backgroundColor: style.bg, color: style.text }}>{status}</span>
  );
}

function ResultCard({ label, value, color }: any) {
    return (
      <div style={{ padding: "15px", background: "#fff", borderRadius: "10px", border: `1px solid ${color}33`, textAlign: "center" }}>
        <div style={{ fontSize: "12px", color: "#666" }}>{label}</div>
        <div style={{ fontSize: "20px", fontWeight: "bold", color }}>{value}</div>
      </div>
    );
}

const thStyle = { 
  padding: "12px 15px", 
  color: "#64748b", 
  fontWeight: "600", 
  borderBottom: "2px solid #e2e8f0" 
};

const tdStyle = { 
  padding: "12px 15px", 
  verticalAlign: "middle",
  lineHeight: "1.5" // 행간 여백 확보
};const inputStyle = { flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #ddd" };
const primaryBtnStyle = { background: "#1e293b", color: "#fff", padding: "10px 20px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "bold" };
const pageBtnStyle = { padding: "6px 12px", borderRadius: "6px", border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: "bold" };
const pageNumberStyle = { width: "30px", height: "30px", borderRadius: "6px", border: "1px solid #eee", cursor: "pointer", fontSize: "12px", display: "flex", justifyContent: "center", alignItems: "center" };