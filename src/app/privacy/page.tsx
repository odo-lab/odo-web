// app/privacy/page.tsx
import type { CSSProperties } from "react";

export default function PrivacyPage() {
  return (
    <main className="container" style={{ padding: "40px 0 64px" }}>
      {/* Title */}
      <header style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 950, letterSpacing: -0.6 }}>
          개인정보처리방침
        </h1>
        <p style={{ margin: "10px 0 0", color: "var(--muted)", fontWeight: 700, fontSize: 13, lineHeight: 1.7 }}>
          그레이프스(이하 ‘회사’)는 이용자의 개인정보를 소중하게 생각하며, 「개인정보 보호법」 등 관련 법령을 준수하고 있습니다. 회사는 본
          개인정보처리방침을 통해 이용자가 제공하는 개인정보가 어떤 용도와 방식으로 이용되고 있으며, 개인정보 보호를 위해 어떠한 조치가 취해지고
          있는지 알려드립니다.
        </p>
      </header>

      {/* Surface */}
      <section className="card" style={{ padding: "22px 18px", borderRadius: 18 }}>
        {/* 제1조 */}
        <h2 style={h2Style}>제1조 (개인정보의 처리 목적)</h2>
        <p style={pStyle}>
          회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이
          변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
        </p>
        <ol style={listOlStyle}>
          <li>
            <b style={bStyle}>서비스 제공:</b> AI 음원 플레이리스트 제공, 유튜브 뮤직 링크 연결, 맞춤형 큐레이션 서비스 제공 등.
          </li>
          <li>
            <b style={bStyle}>회원 관리:</b> 회원 가입 의사 확인, 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지, 각종 고지·통지 등.
          </li>
          <li>
            <b style={bStyle}>고객 상담 및 민원 처리:</b> 이용자의 문의사항 확인, 사실조사를 위한 연락·통지, 처리결과 통보 등.
          </li>
        </ol>

        <hr style={hrStyle} />

        {/* 제2조 */}
        <h2 style={h2Style}>제2조 (처리하는 개인정보의 항목)</h2>

        <h3 style={h3Style}>1. 개인정보의 처리 목적</h3>
        <p style={pStyle}>회사는 다음의 목적을 위해 개인정보를 처리하며, 목적이 변경될 경우 사전 동의를 구할 예정입니다.</p>
        <ul style={listUlStyle}>
          <li>
            <b style={bStyle}>회원 가입 및 관리:</b> 개인/매장 회원 식별, 가입 의사 확인, 본인 인증.
          </li>
          <li>
            <b style={bStyle}>서비스 제공 및 정산:</b> 매장 맞춤형 플레이리스트 제공, <b style={bStyle}>사업자 간 정산(송금), 세금계산서 및 현금계산서 발행</b>.
          </li>
          <li>
            <b style={bStyle}>서비스 고도화 및 리포트:</b> <b style={bStyle}>Last.fm 연동을 통한 서비스 이용 트래킹 및 정산 리포트 생성</b>.
          </li>
          <li>
            <b style={bStyle}>상품권 서비스:</b> 상품권 구매 확인, 발송 및 이용 내역 관리.
          </li>
        </ul>

        <h3 style={h3Style}>2. 처리하는 개인정보의 항목</h3>
        <p style={pStyle}>회사는 서비스 제공을 위해 아래와 같은 정보를 수집합니다.</p>

        {/* ✅ Table (스크린샷 기준 반영) */}
        <div style={tableWrapStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>구분</th>
                <th style={thStyle}>수집 항목</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdKeyStyle}>필수 정보</td>
                <td style={tdStyle}>성명, 이메일(ID), 비밀번호, 휴대폰 번호, 개인/매장 구분</td>
              </tr>
              <tr>
                <td style={tdKeyStyle}>매장 정보</td>
                <td style={tdStyle}>매장명, 매장 주소, 매장 연락처</td>
              </tr>
              <tr>
                <td style={tdKeyStyle}>정산 및 세무</td>
                <td style={tdStyle}>
                  사업자등록증(대표자명, 사업자번호 등), 통장 사본(은행명, 계좌번호, 예금주), 현금영수증 발행번호
                </td>
              </tr>
              <tr>
                <td style={tdKeyStyle}>연동 및 트래킹</td>
                <td style={tdStyle}>Last.fm 계정 정보 및 서비스 이용 기록(음악 청취 로그)</td>
              </tr>
              <tr>
                <td style={tdKeyStyle}>자동 수집</td>
                <td style={tdStyle}>IP주소, 쿠키, 서비스 이용 기록, 접속 로그, 기기 정보</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 제3조 */}
        <h2 style={h2Style}>제3조 (개인정보의 처리 및 보유 기간)</h2>
        <ol style={listOlStyle}>
          <li>
            회사는 법령에 따른 개인정보 보유·이용 기간 또는 이용자로부터 개인정보 수집 시에 동의받은 개인정보 보유·이용 기간 내에서 개인정보를
            처리·보유합니다.
          </li>
          <li>
            개인정보 보유 기간은 다음과 같습니다.
            <ul style={{ ...listUlStyle, marginTop: 8 }}>
              <li>
                <b style={bStyle}>회원 가입 및 관리:</b> 회원 탈퇴 시까지. (단, 법적 분쟁 대비 등을 위해 <b style={bStyle}>[0]개월</b>간 보관할 수 있음)
              </li>
              <li>
                <b style={bStyle}>관련 법령에 의한 보관:</b> 전자상거래법에 따른 결제 기록(5년), 접속 로그(3개월) 등.
              </li>
            </ul>
          </li>
        </ol>

        {/* 제4조 */}
        <h2 style={h2Style}>제4조 (개인정보의 제3자 제공)</h2>
        <p style={pStyle}>
          회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 이용자의 동의가 있거나 법률의 특별한 규정 등 「개인정보 보호법」
          제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.
        </p>

        {/* 제5조 */}
        <h2 style={h2Style}>제5조 (개인정보 처리의 위탁)</h2>
        <p style={pStyle}>회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다.</p>
        <ul style={listUlStyle}>
          <li>
            <b style={bStyle}>호스팅 서비스 운영:</b> [예: 네이버 클라우드, AWS 등 업체명]
          </li>
          <li style={{ opacity: 0.75 }}>
            <b style={bStyle}>결제 서비스 제공 (유료 시):</b> [예: 토스페이먼츠, 나이스페이먼츠 등 업체명]
          </li>
        </ul>

        {/* 제6조 */}
        <h2 style={h2Style}>제6조 (이용자의 권리·의무 및 그 행사방법)</h2>
        <ol style={listOlStyle}>
          <li>이용자는 회사에 대해 언제든지 개인정보 열람·정정·삭제·처리정지 요구 등의 권리를 행사할 수 있습니다.</li>
          <li>권리 행사는 서면, 전자우편 등을 통하여 하실 수 있으며 회사는 이에 대해 지체 없이 조치하겠습니다.</li>
        </ol>

        {/* 제7조 */}
        <h2 style={h2Style}>제7조 (개인정보의 파기 절차 및 방법)</h2>
        <ol style={listOlStyle}>
          <li>회사는 개인정보 보유 기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.</li>
          <li>전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제합니다.</li>
        </ol>

        {/* 제8조 */}
        <h2 style={h2Style}>제8조 (개인정보의 안전성 확보 조치)</h2>
        <p style={pStyle}>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
        <ol style={listOlStyle}>
          <li>
            <b style={bStyle}>관리적 조치:</b> 내부관리계획 수립·시행, 개인정보 취급자 최소화 및 교육.
          </li>
          <li>
            <b style={bStyle}>기술적 조치:</b> 개인정보의 암호화, 접속기록의 보관, 해킹 등에 대비한 보안프로그램 설치.
          </li>
        </ol>

        {/* 제9조 */}
        <h2 style={h2Style}>제9조 (개인정보 보호책임자)</h2>
        <p style={pStyle}>
          회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 이용자의 불만처리 및 피해구제 등을 위하여 아래와 같이
          개인정보 보호책임자를 지정하고 있습니다.
        </p>

        <div style={infoBoxStyle}>
          <div style={{ fontWeight: 900, color: "rgba(255,255,255,.92)", marginBottom: 6 }}>개인정보 보호책임자</div>
          <div style={infoRowStyle}>
            <span style={infoKeyStyle}>성명</span>
            <span style={infoValStyle}>김민서</span>
          </div>
          <div style={infoRowStyle}>
            <span style={infoKeyStyle}>연락처</span>
            <span style={infoValStyle}>contact@grapes.my</span>
          </div>
        </div>

        {/* 제10조 */}
        <h2 style={h2Style}>제10조 (개인정보 처리방침의 변경)</h2>
        <p style={pStyle}>
          이 개인정보 처리방침은 <b style={bStyle}>2026년 1월 1일</b>부터 적용됩니다.
        </p>
      </section>
    </main>
  );
}

/* ===== inline style tokens (avoid tag-name collisions) ===== */
const h2Style: CSSProperties = {
  margin: "18px 0 10px",
  fontSize: 18,
  fontWeight: 950,
  letterSpacing: -0.4,
};

const h3Style: CSSProperties = {
  margin: "12px 0 6px",
  fontSize: 15,
  fontWeight: 900,
  letterSpacing: -0.2,
};

const pStyle: CSSProperties = {
  margin: "0 0 10px",
  color: "rgba(255,255,255,.78)",
  fontSize: 13.5,
  lineHeight: 1.75,
  fontWeight: 650,
};

const listOlStyle: CSSProperties = {
  margin: "0 0 10px",
  paddingLeft: 18,
  color: "rgba(255,255,255,.78)",
  fontSize: 13.5,
  lineHeight: 1.75,
  fontWeight: 650,
};

const listUlStyle: CSSProperties = {
  margin: "0 0 10px",
  paddingLeft: 18,
  color: "rgba(255,255,255,.78)",
  fontSize: 13.5,
  lineHeight: 1.75,
  fontWeight: 650,
};

const bStyle: CSSProperties = {
  color: "rgba(255,255,255,.92)",
  fontWeight: 900,
};

const hrStyle: CSSProperties = {
  border: "none",
  borderTop: "1px solid rgba(255,255,255,.06)",
  margin: "18px 0",
};

const tableWrapStyle: CSSProperties = {
  marginTop: 10,
  marginBottom: 12,
  borderRadius: 14,
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,.08)",
  background: "rgba(255,255,255,.02)",
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "12px 12px",
  fontSize: 12.5,
  fontWeight: 900,
  color: "rgba(255,255,255,.9)",
  background: "rgba(255,255,255,.04)",
  borderBottom: "1px solid rgba(255,255,255,.08)",
};

const tdKeyStyle: CSSProperties = {
  width: 160,
  verticalAlign: "top",
  padding: "12px 12px",
  fontSize: 12.5,
  fontWeight: 900,
  color: "rgba(255,255,255,.88)",
  borderBottom: "1px solid rgba(255,255,255,.06)",
};

const tdStyle: CSSProperties = {
  verticalAlign: "top",
  padding: "12px 12px",
  fontSize: 12.5,
  fontWeight: 650,
  color: "rgba(255,255,255,.78)",
  borderBottom: "1px solid rgba(255,255,255,.06)",
  lineHeight: 1.65,
};

const infoBoxStyle: CSSProperties = {
  marginTop: 10,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,.08)",
  background: "rgba(255,255,255,.03)",
  padding: 14,
};

const infoRowStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  padding: "6px 0",
};

const infoKeyStyle: CSSProperties = {
  width: 92,
  color: "rgba(255,255,255,.62)",
  fontWeight: 800,
  fontSize: 12.5,
};

const infoValStyle: CSSProperties = {
  color: "rgba(255,255,255,.86)",
  fontWeight: 800,
  fontSize: 12.5,
};
