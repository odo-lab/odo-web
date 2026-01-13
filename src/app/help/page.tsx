"use client";

import Link from "next/link";

export default function Page() {
  return (
    <section className="card auth-wrap">
      <h3 className="section-title" style={{ margin: "0 0 6px" }}>로그인</h3>
      <p className="section-desc" style={{ margin: "0 0 14px" }}>프로토타입 화면입니다(실제 인증(Auth) 구현 전).</p>

      <div className="field">
        <label>이메일 또는 휴대폰</label>
        <input className="input" placeholder="example@odo.com" />
      </div>
      <div className="field">
        <label>비밀번호</label>
        <input className="input" type="password" placeholder="••••••••" />
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        <button className="btn btn-primary" type="button" onClick={() => alert("프로토타입: 로그인 동작은 구현되지 않았습니다.")}>
          로그인
        </button>
        <Link className="btn" href="/signup">회원가입</Link>
        <Link className="btn" href="/help">도움말</Link>
      </div>
    </section>
  );
}
