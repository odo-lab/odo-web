export default function TermsPage() {
  return (
    <main className="container" style={{ padding: "40px 0 64px" }}>
      {/* Title */}
      <header style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 950, letterSpacing: -0.6 }}>
          [O.D.O] 이용약관
        </h1>
        <p style={{ margin: "10px 0 0", color: "var(--muted)", fontWeight: 700, fontSize: 13, lineHeight: 1.7 }}>
          본 약관은 O.D.O 서비스 이용에 관한 기본 사항을 규정합니다.
        </p>
      </header>

      {/* Surface */}
      <section
        className="card"
        style={{
          padding: "22px 18px",
          borderRadius: 18,
        }}
      >
        {/* 제1장 */}
        <h2 style={h2}>제1장 총칙</h2>

        <h3 style={h3}>제1조 (서비스의 성격)</h3>
        <p style={p}>
          본 서비스는 AI 기술로 생성된 음원을 큐레이션하여 외부 플랫폼(유튜브 뮤직 등)의 링크 형태로 제공하는 정보 제공 서비스입니다.
          음원 자체는 저작권법의 보호 대상이 아니나, 회사가 제공하는{" "}
          <b style={b}>플레이리스트의 구성 및 배열은 편집저작물로서 보호</b>받습니다.
        </p>

        <h3 style={h3}>제2조 (용어의 정의)</h3>
        <ol style={ol}>
          <li>
            <b style={b}>서비스:</b> 회사가 AI 기술로 생성된 음원을 테마별로 큐레이션하여 외부 플랫폼(유튜브 뮤직 등) 링크를 통해 제공하는 웹 서비스를 의미합니다.
          </li>
          <li>
            <b style={b}>이용자:</b> 본 약관에 따라 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.
          </li>
          <li>
            <b style={b}>콘텐츠:</b> 서비스 내에서 제공되는 플레이리스트, 테마별 분류, 곡 정보 등을 의미합니다.
          </li>
        </ol>

        <h3 style={h3}>제3조 (약관의 효력 및 변경)</h3>
        <ol style={ol}>
          <li>본 약관은 서비스 화면에 게시함으로써 효력이 발생합니다.</li>
          <li>
            회사는 법률의 개정이나 서비스 형태의 변화에 따라 약관을 변경할 수 있으며, 변경 시 최소 7일 전(중요한 사항은 30일 전) 공지사항을 통해 안내합니다.
          </li>
        </ol>

        <hr style={hr} />

        {/* 제2장 */}
        <h2 style={h2}>제2장 서비스 이용 계약 및 서비스 제공</h2>

        <h3 style={h3}>제4조 (서비스의 내용)</h3>
        <ol style={ol}>
          <li>회사는 AI 기술로 생성된 음원을 분류하고, 이를 편리하게 감상할 수 있도록 제3자 서비스(YouTube Music 등)의 링크를 연결하는 정보를 제공합니다.</li>
          <li>회사는 음원 파일 자체를 직접 제공하거나 전송(다운로드)하지 않습니다.</li>
        </ol>

        <h3 style={h3}>제5조 (외부 플랫폼 서비스의 이용)</h3>
        <ol style={ol}>
          <li>이용자는 본 서비스가 제공하는 링크를 통해 외부 플랫폼으로 이동하여 음원을 감상할 수 있습니다.</li>
          <li>이용자는 해당 외부 플랫폼(유튜브 뮤직)의 계정 보유 여부 및 해당 플랫폼의 이용약관에 따라 이용이 제한될 수 있습니다.</li>
        </ol>

        <hr style={hr} />

        {/* 제3장 */}
        <h2 style={h2}>제3장 지식재산권 및 상업적 이용</h2>

        <h3 style={h3}>제6조 (권리의 귀속)</h3>
        <ol style={ol}>
          <li>서비스에 포함된 개별 음원은 AI에 의해 자동 생성된 콘텐츠로, 현행 저작권법상 저작물로 인정되지 않음을 고지합니다.</li>
          <li>
            단, 회사가 수많은 음원 중 특정 테마에 맞춰 곡을 선별하고 배치한{" "}
            <b style={b}>플레이리스트 및 큐레이션 정보는 회사의 노력이 투입된 '편집저작물' 또는 '데이터베이스'로서 보호</b>받습니다.
          </li>
          <li>이용자는 회사의 사전 서면 동의 없이 플레이리스트의 구성 및 배열을 무단으로 복제하여 동일한 성격의 서비스를 운영하거나 재판매할 수 없습니다.</li>
        </ol>

        <h3 style={h3}>제7조 (매장 내 이용 가이드)</h3>
        <ol style={ol}>
          <li>이용자는 본 서비스의 플레이리스트 정보를 바탕으로 매장 등 상업 시설에서 배경음악(BGM)으로 활용할 수 있습니다.</li>
          <li>
            단, 실제 재생 시 발생하는{" "}
            <b style={b}>외부 플랫폼(유튜브 뮤직 등)의 정책 준수 책임은 이용자</b>에게 있습니다.
            유튜브 뮤직의 유료 비즈니스 요금제 사용 여부 등 상업적 이용 자격에 대한 책임은 이용자가 부담하며, 회사는 이와 관련한 제3자의 권리 침해에 책임을 지지 않습니다.
          </li>
        </ol>

        <hr style={hr} />

        {/* 제4장 */}
        <h2 style={h2}>제4장 책임 및 면책 조항</h2>

        <h3 style={h3}>제8조 (회사의 면책)</h3>
        <ol style={ol}>
          <li>회사는 천재지변, 외부 플랫폼(유튜브 등)의 시스템 장애, 정기 점검 등으로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
          <li>회사는 링크된 외부 콘텐츠의 신뢰성이나 정확성을 보증하지 않으며, 외부 서비스 이용 중 이용자에게 발생한 손해에 대해 책임지지 않습니다.</li>
          <li>AI 생성 음원의 특성상 발생할 수 있는 예술적 미비함이나 음질 등에 대해 회사는 어떠한 보증도 하지 않습니다.</li>
        </ol>

        <h3 style={h3}>제9조 (분쟁 해결)</h3>
        <p style={p}>
          본 약관과 관련하여 발생한 분쟁에 대해서는 <b style={b}>서울중앙지방법원</b>을 전담 관할 법원으로 하여 해결합니다.
        </p>

        <div style={{ marginTop: 18, color: "rgba(255,255,255,.62)", fontSize: 12.5, lineHeight: 1.7 }}>
          <p style={{ margin: 0 }}>
            최종 업데이트: <span style={{ fontWeight: 800 }}>2025.01.13</span>
          </p>
        </div>
      </section>
    </main>
  );
}

/* ===== inline style tokens (no CSS file required) ===== */
const h2: React.CSSProperties = {
  margin: "18px 0 10px",
  fontSize: 18,
  fontWeight: 950,
  letterSpacing: -0.4,
};

const h3: React.CSSProperties = {
  margin: "12px 0 6px",
  fontSize: 15,
  fontWeight: 900,
  letterSpacing: -0.2,
};

const p: React.CSSProperties = {
  margin: "0 0 10px",
  color: "rgba(255,255,255,.78)",
  fontSize: 13.5,
  lineHeight: 1.75,
  fontWeight: 650,
};

const ol: React.CSSProperties = {
  margin: "0 0 10px",
  paddingLeft: 18,
  color: "rgba(255,255,255,.78)",
  fontSize: 13.5,
  lineHeight: 1.75,
  fontWeight: 650,
};

const b: React.CSSProperties = {
  color: "rgba(255,255,255,.92)",
  fontWeight: 900,
};

const hr: React.CSSProperties = {
  border: "none",
  borderTop: "1px solid rgba(255,255,255,.06)",
  margin: "18px 0",
};
