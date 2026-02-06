"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import AdminDashboard from "@/components/AdminDashboard";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  getCountFromServer,
  Timestamp,
} from "firebase/firestore";

/**
 * ✅ 목표:
 *  - listening_history 문서(=1회 재생) 중
 *    doc.userId == monitored_users.lastfm_username 인 문서 수를 센다.
 *  - 기간:
 *    * 이번달: 이번달 1일 00:00 ~ 오늘(now) (예: 2/15면 2/1~2/15)
 *    * 지난달: 지난달 1일 00:00 ~ 지난달 말일 23:59:59 (예: 1/1~1/31)
 *  - 월별(12개월) 카운트는 제거 (폭증 방지)
 */

type MonitoredUser = {
  uid: string;
  lastfm_username: string;
  store_name?: string;
  created_at?: any;
};

function UserDashboard({ userUid }: { userUid: string }) {
  const [loading, setLoading] = useState(true);
  const [storeInfo, setStoreInfo] = useState<MonitoredUser | null>(null);

  const [stats, setStats] = useState({
    thisMonth: 0,
    lastMonth: 0,
    total: 0, // 필요 없으면 제거 가능
  });

  useEffect(() => {
    async function init() {
      if (!userUid) return;

      try {
        // 1) 로그인 유저(uid) -> monitored_users에서 lastfm_username 찾기
        const ref = collection(db, "monitored_users");
        const q = query(ref, where("uid", "==", userUid));
        const snap = await getDocs(q);

        if (snap.empty) {
          console.error("monitored_users에서 uid로 문서를 찾지 못함:", userUid);
          setStoreInfo(null);
          return;
        }

        const data = snap.docs[0].data() as MonitoredUser;

        if (!data.lastfm_username) {
          console.error("monitored_users 문서에 lastfm_username이 없음:", snap.docs[0].id);
          setStoreInfo(data);
          return;
        }

        setStoreInfo(data);

        // 2) listening_history에서 userId==lastfm_username + 기간별 카운트
        await fetchCounts(data.lastfm_username);
      } catch (e) {
        console.error("대시보드 초기화 오류:", e);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [userUid]);

  const fetchCounts = async (lastfmUsername: string) => {
    const historyRef = collection(db, "listening_history");
    const now = new Date();

    // ✅ 이번달: 1일 00:00 ~ 지금(now)
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);

    // ✅ 지난달: 지난달 1일 00:00 ~ 지난달 말일 23:59:59
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // 핵심: doc.userId == lastfmUsername
    const qTotal = query(historyRef, where("userId", "==", lastfmUsername)); // 필요 없으면 제거
    const qThisMonth = query(
      historyRef,
      where("userId", "==", lastfmUsername),
      where("timestamp", ">=", thisMonthStart),
      where("timestamp", "<=", now)
    );
    const qLastMonth = query(
      historyRef,
      where("userId", "==", lastfmUsername),
      where("timestamp", ">=", lastMonthStart),
      where("timestamp", "<=", lastMonthEnd)
    );

    const [snapTotal, snapThis, snapLast] = await Promise.all([
      getCountFromServer(qTotal),      // total 필요 없으면 이 줄과 아래 setStats에서 제거
      getCountFromServer(qThisMonth),
      getCountFromServer(qLastMonth),
    ]);

    setStats({
      total: snapTotal.data().count,
      thisMonth: snapThis.data().count,
      lastMonth: snapLast.data().count,
    });
  };

  const createdAtText = useMemo(() => {
    if (!storeInfo?.created_at) return "-";
    try {
      const v: any = storeInfo.created_at;
      if (v instanceof Timestamp) return v.toDate().toLocaleDateString();
      if (v?.toDate) return v.toDate().toLocaleDateString();
      return new Date(v).toLocaleDateString();
    } catch {
      return "-";
    }
  }, [storeInfo]);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#888" }}>데이터 분석 중...</div>;

  if (!storeInfo)
    return (
      <div style={{ padding: 60, textAlign: "center", color: "white" }}>
        <h3 style={{ fontSize: "20px", marginBottom: "10px" }}>매장 정보를 찾을 수 없습니다.</h3>
        <p style={{ color: "#888" }}>monitored_users에서 UID로 문서를 찾지 못했습니다.<br />(UID: {userUid})</p>
      </div>
    );

  if (!storeInfo.lastfm_username)
    return (
      <div style={{ padding: 60, textAlign: "center", color: "white" }}>
        <h3 style={{ fontSize: "20px", marginBottom: "10px" }}>lastfm_username이 설정되지 않았습니다.</h3>
        <p style={{ color: "#888" }}>monitored_users 문서에 lastfm_username 필드가 필요합니다.<br />(UID: {userUid})</p>
      </div>
    );

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px" }}>
      <header style={{ marginBottom: "30px", borderBottom: "1px solid #333", paddingBottom: "20px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "white", marginBottom: "8px" }}>
          👋 안녕하세요, {storeInfo.store_name ?? storeInfo.lastfm_username} 점주님!
        </h2>
        <div style={{ color: "#888", fontSize: "14px" }}>
          가입일: {createdAtText} | Last.fm ID: {storeInfo.lastfm_username}
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
        <StatCard title="이번 달 재생 수" count={stats.thisMonth} subText="이번달 1일~오늘 기준" />
        <StatCard title="지난 달 재생 수" count={stats.lastMonth} subText="지난달 1일~말일 기준" />
        <StatCard title="총 누적 재생 수" count={stats.total} subText="전체 기간 (원치 않으면 제거 권장)" />
      </div>
    </div>
  );
}

function StatCard({ title, count, subText }: any) {
  return (
    <div style={{ background: "#222", padding: "24px", borderRadius: "12px", borderTop: `4px solid #3b82f6` }}>
      <h4 style={{ color: "#aaa", fontSize: "14px", marginBottom: "8px" }}>{title}</h4>
      <div style={{ fontSize: "32px", fontWeight: "bold", color: "white", marginBottom: "4px" }}>
        {Number(count || 0).toLocaleString()} <span style={{ fontSize: "16px", fontWeight: "normal" }}>회</span>
      </div>
      <div style={{ fontSize: "12px", color: "#666" }}>{subText}</div>
    </div>
  );
}

export default function MyPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading) return <div style={{ padding: 50, textAlign: "center", color: "#fff" }}>로딩 중...</div>;
  if (!user) return null;

  const isAdmin = role === "admin" || role === "super";

  return (
    <section style={{ width: "100%", minHeight: "100vh", backgroundColor: "#111" }}>
      {isAdmin ? <AdminDashboard /> : <UserDashboard userUid={user.uid} />}
    </section>
  );
}
