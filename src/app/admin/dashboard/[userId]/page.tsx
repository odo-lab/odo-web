import UserDashboard from "@/components/UserDashboard"; 

// Next.js 15부터 params는 Promise입니다.
export default async function AdminUserDetailPage({ 
  params 
}: { 
  params: Promise<{ userId: string }> 
}) {
  // 1. await로 파라미터를 먼저 꺼냅니다.
  const resolvedParams = await params;
  const userId = resolvedParams.userId;

  return (
    <section style={{ width: "100%", minHeight: "100vh", backgroundColor: "#111", paddingBottom: "50px" }}>
      {/* 2. 꺼낸 userId를 넘겨줍니다. */}
      <UserDashboard targetId={userId} isAdmin={true} />
    </section>
  );
}