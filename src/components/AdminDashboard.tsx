"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase"; // 리스트 조회용 (추후 이것도 API로 변경 가능)
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import styles from "./AdminDashboard.module.css";

// 차트 플러그인 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AdminDashboard() {
  // 1. 상태 관리
  // 통계 수치 (백엔드 API에서 받아올 것)
  const [stats, setStats] = useState({
    totalPlays: 0,
    totalUsers: 0,
    todayPlays: 0,
  });
  
  // 상세 로그 및 차트 데이터 (일단 여기서 직접 조회 - 추후 이것도 API로 뺄 수 있음)
  const [logs, setLogs] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any>({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // ---------------------------------------------------------
        // A. 통계 데이터 가져오기 (백엔드 활용! - 서버 부하 감소)
        // ---------------------------------------------------------
        const statsRes = await fetch("/api/stats");
        const statsJson = await statsRes.json();
        
        if (statsJson.success) {
          setStats(statsJson.data);
        }

        // ---------------------------------------------------------
        // B. 상세 로그 및 차트용 데이터 가져오기
        // (리스트는 데이터가 많으므로 아직은 직접 긁어옵니다)
        // ---------------------------------------------------------
        const q = query(
          collection(db, "listening_history"),
          orderBy("played_at", "desc"),
          limit(20) // 최근 20개만
        );
        const snapshot = await getDocs(q);
        const logsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLogs(logsData);

        // 차트 데이터 가공 (간단히 날짜별 집계)
        const dateCounts: Record<string, number> = {};
        logsData.forEach((log: any) => {
          if (log.played_at) {
            // "2023-10-25 14:00" -> "10-25" 추출
            const dateStr = log.played_at.substring(5, 10);
            dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
          }
        });
        
        const sortedLabels = Object.keys(dateCounts).sort();
        setChartData({
          labels: sortedLabels,
          datasets: [
            {
              label: "일별 청취 수",
              data: sortedLabels.map((d) => dateCounts[d]),
              borderColor: "#3b82f6",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              fill: true,
              tension: 0.4,
              pointRadius: 4,
            },
          ],
        });

      } catch (error) {
        console.error("대시보드 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  return (
    <div className={styles.container}>
      {/* 1. 사이드바 */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTitle}>ODO Board</div>
        <nav>
          <div className={`${styles.menuItem} ${styles.active}`}>📊 대시보드</div>
          <div className={styles.menuItem}>🎵 재생 기록</div>
          <div className={styles.menuItem}>👥 사용자 관리</div>
          <div className={styles.menuItem}>⚙️ 설정</div>
        </nav>
      </aside>

      {/* 2. 메인 콘텐츠 */}
      <main className={styles.main}>
        {/* 상단 헤더 */}
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}>
           <h1 className={styles.sectionHeader} style={{marginBottom:0}}>대시보드</h1>
           <div style={{color:'#666', fontSize:'14px'}}>
              데이터 동기화 상태: <span style={{color:'#3b82f6', fontWeight:'bold'}}>● 실시간</span>
           </div>
        </div>

        {/* ✅ 핵심: 백엔드 API에서 가져온 숫자를 뿌려주는 카드 */}
        <div className={styles.statsGrid}>
          {/* 총 사용자 */}
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {loading ? "-" : stats.totalUsers.toLocaleString()}
            </div>
            <div className={styles.statLabel}>총 사용자</div>
          </div>

          {/* 총 재생 횟수 */}
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {loading ? "-" : stats.totalPlays.toLocaleString()}
            </div>
            <div className={styles.statLabel}>총 재생 횟수</div>
          </div>

          {/* 오늘 재생된 곡 */}
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {loading ? "-" : stats.todayPlays.toLocaleString()}
            </div>
            <div className={styles.statLabel}>오늘 재생된 곡</div>
          </div>
        </div>

        {/* 차트 영역 */}
        <div className={styles.contentCard}>
          <div className={styles.cardTitle}>최근 청취 트렌드</div>
          <div style={{ height: "300px", width: "100%" }}>
            {loading ? (
               <div style={{height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#666'}}>
                 로딩 중...
               </div>
            ) : (
                <Line
                data={chartData}
                options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                    x: { grid: { display: false, color: "#333" }, ticks: { color: "#888" } },
                    y: { grid: { color: "#222" }, ticks: { color: "#888" }, beginAtZero: true },
                    },
                }}
                />
            )}
          </div>
        </div>

        {/* 상세 로그 테이블 */}
        <div className={styles.contentCard}>
          <div className={styles.cardTitle}>실시간 상세 로그</div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>아티스트</th>
                <th>곡명</th>
                <th>앨범</th>
                <th style={{ textAlign: "right" }}>재생 시간</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: any) => (
                <tr key={log.id}>
                  <td style={{ fontWeight: "bold", color: "#fff" }}>
                    {log.artist || "Unknown"}
                  </td>
                  <td>{log.track || "Unknown"}</td>
                  <td style={{ color: "#666" }}>{log.album || "-"}</td>
                  <td style={{ textAlign: "right", color: "#888", fontSize: "13px" }}>
                    {log.played_at ? log.played_at.replace('T', ' ').substring(0, 16) : "-"}
                  </td>
                </tr>
              ))}
              {!loading && logs.length === 0 && (
                 <tr><td colSpan={4} style={{textAlign:'center', padding:'40px'}}>데이터가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}