"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getCountFromServer } from "firebase/firestore";

interface Props {
  lastfmId: string; // 예: "Coinsinger"
}

// 💰 정산 기준 설정 (상수)
const PRICE_PER_PLAY = 5;       // 1곡당 5원
const MONTHLY_TARGET = 30000;   // 월 목표 금액 30,000원

export default function UserStats({ lastfmId }: Props) {
  const [stats, setStats] = useState({
    totalPlays: 0,      // 누적 재생 수
    thisMonthPlays: 0,  // 이번 달 재생 수
    lastMonthPlays: 0,  // 지난달 재생 수
    revenue: 0,         // 이번 달 정산 금액 (원)
    achievementRate: 0, // 달성률 (%)
    loading: true
  });

  useEffect(() => {
    async function fetchStats() {
      if (!lastfmId) return;

      try {
        const historyRef = collection(db, "listening_history");
        const now = new Date();

        // 📅 날짜 범위 계산
        // 1. 이번 달 시작일 (예: 2월 1일 00:00:00)
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // 2. 지난달 시작일 & 끝일
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        // 🔍 쿼리 준비 (단순 개수 세기)
        // 주의: DB에 저장된 날짜 필드명이 'played_at' 이라고 가정합니다. (다르면 수정 필요)
        const qTotal = query(
          historyRef, 
          where("user_id", "==", lastfmId)
        );

        const qThisMonth = query(
          historyRef,
          where("user_id", "==", lastfmId),
          where("played_at", ">=", thisMonthStart)
        );

        const qLastMonth = query(
          historyRef,
          where("user_id", "==", lastfmId),
          where("played_at", ">=", lastMonthStart),
          where("played_at", "<=", lastMonthEnd)
        );

        // 🚀 병렬 실행 (빠름)
        const [snapTotal, snapThis, snapLast] = await Promise.all([
          getCountFromServer(qTotal),
          getCountFromServer(qThisMonth),
          getCountFromServer(qLastMonth)
        ]);

        const thisMonthCount = snapThis.data().count;
        
        // 🧮 돈 계산 (순수 곱셈)
        const currentRevenue = thisMonthCount * PRICE_PER_PLAY;
        
        // 달성률 계산 (최대 100%까지만 표시할지, 넘겨도 될지 결정. 일단 제한 없음)
        const rate = (currentRevenue / MONTHLY_TARGET) * 100;

        setStats({
          totalPlays: snapTotal.data().count,
          thisMonthPlays: thisMonthCount,
          lastMonthPlays: snapLast.data().count,
          revenue: currentRevenue,
          achievementRate: parseFloat(rate.toFixed(1)), // 소수점 1자리
          loading: false
        });

      } catch (error) {
        console.error("통계 계산 실패:", error);
      }
    }

    fetchStats();
  }, [lastfmId]);

  if (stats.loading) return <div style={{color:"#888"}}>⏳ 정산 데이터 분석 중...</div>;

  return (
    <div>
      {/* 상단: 이번 달 핵심 정산 카드 */}
      <div style={{ 
        background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)", 
        padding: "30px", borderRadius: "16px", marginBottom: "30px",
        color: "white", boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.5)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h2 style={{ fontSize: "16px", opacity: 0.8, marginBottom: "8px" }}>이번 달 예상 정산금 (VAT 별도)</h2>
            <div style={{ fontSize: "42px", fontWeight: "bold" }}>
              {stats.revenue.toLocaleString()} <span style={{ fontSize: "20px" }}>원</span>
            </div>
            <div style={{ marginTop: "10px", fontSize: "14px", opacity: 0.9 }}>
              현재 재생 <strong>{stats.thisMonthPlays.toLocaleString()}건</strong> × 5원
            </div>
          </div>
          
          {/* 달성률 도넛 차트 흉내 (간단 버전) */}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "32px", fontWeight: "bold", color: "#93c5fd" }}>
              {stats.achievementRate}%
            </div>
            <div style={{ fontSize: "12px", opacity: 0.7 }}>
              목표 {MONTHLY_TARGET.toLocaleString()}원 달성률
            </div>
          </div>
        </div>
      </div>

      {/* 하단: 상세 통계 카드들 */}
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        
        {/* 카드 1: 지난달 비교 */}
        <div style={{ flex: 1, background: "#222", padding: "20px", borderRadius: "12px", border: "1px solid #333" }}>
          <h3 style={{ color: "#aaa", fontSize: "14px", marginBottom: "10px" }}>지난달 총 재생</h3>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "white" }}>
            {stats.lastMonthPlays.toLocaleString()} 회
          </div>
          <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
            정산금: {(stats.lastMonthPlays * PRICE_PER_PLAY).toLocaleString()}원
          </div>
        </div>

        {/* 카드 2: 전체 누적 */}
        <div style={{ flex: 1, background: "#222", padding: "20px", borderRadius: "12px", border: "1px solid #333" }}>
          <h3 style={{ color: "#aaa", fontSize: "14px", marginBottom: "10px" }}>서비스 가입 후 누적</h3>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "white" }}>
            {stats.totalPlays.toLocaleString()} 곡
          </div>
          <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
            총 누적 송출 횟수
          </div>
        </div>

      </div>
    </div>
  );
}