"use client";
import Link from "next/link";

export default function Page() {
  return (
    <section className="card auth-wrap">
      <h3 className="section-title" style={{ margin: "0 0 6px" }}>회원가입</h3>
      <p className="section-desc" style={{ margin: "0 0 14px" }}>
        단계적 수집(Onboarding: 계정 → 매장 연결 → 필요 시 정산) 구조를 전제로 합니다.
      </p>

      <div className="field">
        <label>이메일</label>
        <input className="input" placeholder="example@odo.com" />
      </div>
      <div className="field">
        <label>비밀번호</label>
        <input className="input" type="password" placeholder="••••••••" />
      </div>
      <div className="field">
        <label>매장 연결 코드(선택)</label>
        <input className="input" placeholder="초대/계약 코드 입력" />
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        <button className="btn btn-primary" type="button" onClick={() => alert("프로토타입: 가입 동작은 구현되지 않았습니다.")}>
          회원가입
        </button>
        <Link className="btn" href="/login">로그인</Link>
        <Link className="btn" href="/help">도움말</Link>
      </div>
    </section>
  );
}
