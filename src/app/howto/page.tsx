"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type SectionId = "howto" | "lastfm" | "faq" | "contact";
type NavItem = { id: SectionId; label: string };

export default function HowtoPage() {
  const items: NavItem[] = useMemo(
    () => [
      { id: "howto", label: "이용방법" },
      { id: "lastfm", label: "LAST.FM 설치 가이드" },
      { id: "faq", label: "FAQ" },
      { id: "contact", label: "추가 문의하기" },
    ],
    []
  );

  const [activeId, setActiveId] = useState<SectionId>("howto");

  // 헤더 아래에 네비 붙이기 위한 동적 값
  const [navTop, setNavTop] = useState(0);
  const [navH, setNavH] = useState(52);
  const navRef = useRef<HTMLDivElement | null>(null);

  // 1) 헤더 bottom + 네비 높이 측정 (SiteHeader 숨김/등장 대응)
  useEffect(() => {
    let raf = 0;

    const measure = () => {
      raf = 0;

      // 우선순위: id 지정 -> header 태그
      const header =
        (document.getElementById("site-header") as HTMLElement | null) ||
        (document.getElementById("SiteHeader") as HTMLElement | null) ||
        (document.querySelector("header") as HTMLElement | null);

      const headerBottom = header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;

      const navEl = navRef.current;
      const nh = navEl ? Math.ceil(navEl.getBoundingClientRect().height) : 52;

      setNavTop(Math.ceil(headerBottom));
      setNavH(nh);
    };

    const onTick = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onTick, { passive: true });
    window.addEventListener("resize", onTick);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onTick);
      window.removeEventListener("resize", onTick);
    };
  }, []);

  // 2) 네비 클릭 시 섹션 이동 (offset 보정)
  const scrollTo = useCallback(
    (id: SectionId) => {
      const el = document.getElementById(id);
      if (!el) return;

      const offset = navTop + navH + 48; // 여백 포함
      const y = window.scrollY + el.getBoundingClientRect().top - offset;

      window.scrollTo({ top: y, behavior: "smooth" });
    },
    [navTop, navH]
  );

  // 3) 스크롤 시 active 변경
  useEffect(() => {
    const ids: SectionId[] = ["howto", "lastfm", "faq", "contact"];
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const v = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0));

        const id = v[0]?.target?.id as SectionId | undefined;
        if (id) setActiveId(id);
      },
      {
        root: null,
        rootMargin: "-20% 0px -70% 0px",
        threshold: [0.1, 0.2, 0.35, 0.5, 0.7],
      }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <main className="container" style={{ padding: "0px 0 0px" }}>
      {/* Title */}
      <header style={{ marginBottom: 18 }}>
        {/* <h1 style={{ margin: 0, fontSize: 28, fontWeight: 950, letterSpacing: -0.6 }}>
          이용방법 / FAQ
        </h1>
        <p style={{ margin: "10px 0 0", color: "var(--muted)", fontWeight: 700, fontSize: 13, lineHeight: 1.7 }}>
          필요한 섹션을 빠르게 이동하고, 각 항목을 문서형 레이아웃으로 확인할 수 있습니다.
        </p> */}
      </header>

      {/* ✅ 헤더 아래 fixed 네비 (Privacy 카드 톤에 맞춰 최소한으로) */}
      <div ref={navRef} style={{ ...navWrapFixedStyle, top: navTop }}>
        <div style={navInnerStyle}>
          <div style={navLabelStyle}>바로가기</div>
          <nav style={navListStyle}>
            {items.map((it) => {
              const on = it.id === activeId;
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => scrollTo(it.id)}
                  style={{ ...navBtnStyle, ...(on ? navBtnActiveStyle : null) }}
                >
                  {it.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* fixed 네비가 컨텐츠 가리지 않도록 spacer */}
      <div aria-hidden="true" style={{ height: navH + 14 }} />

      {/* Surface */}
            {/* ✅ Section Cards (각 항목별 컨테이너 분리) */}
      {/* ✅ Section Cards (각 항목별 컨테이너 분리) */}
<div style={stackStyle}>
  {/* 1) 이용방법 */}
  <section className="card" style={cardStyle} id="howto">
    {/* 컨테이너 진입 시 가장 먼저 보이는 제목 */}
    <h2 style={titleXLStyle}>이용방법</h2>

    <p style={pStyle}>
      ODO는{" "}
      <span style={keywordStyle}>당사를 통해 해외 정식 유통된 AI 음원</span>
      만을 활용한 매장 음악 큐레이션 서비스입니다.
    </p>

    <p style={pStyle}>
      복잡한 저작권 절차나 별도의 음원 구매 없이, 매장에서 바로 사용할 수 있도록
      준비된 플레이리스트를 제공합니다.
    </p>

    <p style={pStyle}>ODO를 이용하는 방법은 아래와 같이 간단합니다.</p>

    <hr style={hrStyle} />

    {/* 1번 단계 – 요청한 30px */}
    <h3 style={stepTitleStyle}>1. YouTube Music을 준비해주세요</h3>

    <p style={pStyle}>
      ODO의 플레이리스트는{" "}
      <span style={keywordStrongStyle}>YouTube Music 환경</span>을 기반으로
      재생됩니다. 개인 계정 또는 매장용 계정 중 어떤 계정이든 사용 가능합니다.
    </p>

    <p style={{ ...pStyle, color: "rgba(255,255,255,.62)" }}>
      ※ 별도의 플레이어나 전용 기기를 구매할 필요는 없습니다.
    </p>

    <h3 style={stepTitleStyle}>2. Last.fm을 연동해주세요</h3>
    <p style={pStyle}>
      음악 재생 이력 관리와 플레이리스트 연동을 위해 크롬 확장 프로그램인{" "}
      <span style={keywordStrongStyle}>Last.fm</span>을 설치 및 연동합니다.
    </p>
    <p style={pStyle}>
      Last.fm은 재생되는 음악 정보를 안정적으로 관리하기 위한 도구로, ODO의
      큐레이션 플레이리스트가 정상적으로 작동하는 데 필요한 과정입니다.
    </p>

    <h3 style={stepTitleStyle}>3. ODO 큐레이션 플레이리스트를 재생하세요</h3>
    <p style={pStyle}>
      연동이 완료되면 ODO에서 제공하는 매장용 큐레이션 플레이리스트를 그대로
      재생하시면 됩니다.
    </p>

    <ul style={listUlStyle}>
      <li>업종과 분위기에 맞게 선별된 음악</li>
      <li>매장 송출을 전제로 준비된 음원</li>
      <li>별도 선곡이나 관리 없이 자동 재생</li>
    </ul>

    <p style={pStyle}>
      이후에는 추가 설정 없이, 매장 운영 중 지속적으로 음악을 송출하실 수 있습니다.
    </p>

    <hr style={hrStyle} />

    <h3 style={h3Style}>왜 저작권 걱정이 없나요?</h3>
    <p style={pStyle}>
      ODO에서 제공하는 플레이리스트는{" "}
      <b style={bStyle}>AI로 제작되고, 당사를 통해 해외 스트리밍 플랫폼에 정식 유통된 음원만</b>
      으로 구성되어 있습니다.
    </p>
    <p style={pStyle}>
      매장 사용을 고려해 준비된 음원을 기반으로 큐레이션되기 때문에 매장 운영자가
      개별적으로 저작권을 확인하거나 관리할 필요가 없습니다.
    </p>

    <h3 style={h3Style}>이런 분들께 추천합니다</h3>
    <ul style={listUlStyle}>
      <li>매장에서 음악을 틀고 싶지만 저작권이 걱정되는 분</li>
      <li>기존 매장 음악 서비스 비용이 부담스러운 분</li>
      <li>매장 분위기에 맞는 음악을 직접 고르기 어려운 분</li>
      <li>그냥 켜두기만 하면 되는 음악 환경을 원하시는 분</li>
    </ul>
  </section>

  {/* 2) LAST.FM 설치 가이드 */}
  <section className="card" style={cardStyle} id="lastfm">
    <h2 style={titleXLStyle}>LAST.FM 설치 가이드</h2>
    <p style={pStyle}>
      ODO의 큐레이션 플레이리스트를 정상적으로 이용하기 위해{" "}
      <b style={bStyle}>크롬 확장 프로그램인 Last.fm 연동</b>이 필요합니다.
    </p>
    <p style={pStyle}>
      Last.fm은 재생 중인 음악을 인식하고 플레이리스트가 안정적으로 작동하도록
      돕는 도구로, 복잡한 설정 없이 누구나 쉽게 설치할 수 있습니다.
    </p>
    <p style={pStyle}>
      또한 Last.fm을 통해 확인되는 <b style={bStyle}>음악 재생 기록</b>은 ODO 서비스
      이용자가{" "}
      <b style={bStyle}>플레이리스트를 얼마나 이용했는지 확인하기 위한 기준 자료</b>로
      활용됩니다.
    </p>
    <p style={{ ...pStyle, color: "rgba(255,255,255,.62)" }}>
      해당 기록은 서비스 이용 현황 확인 및 내부 정산·운영 목적으로만 사용됩니다.
    </p>

    <div style={boxStyle}>
      <div style={installTextStyle}>
        설치 방법 안내
      </div>

      <p style={{ ...pStyle, marginBottom: 8 }}>
        설치 과정은 영상 또는 PDF 가이드 중 편한 방식으로 확인하실 수 있습니다.
      </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {/* ▶️ 유튜브 설치 가이드 영상 */}
        <a
          href="https://youtu.be/PkLTXdwuK6A?si=oP42hY4MNvFsHIm3"
          target="_blank"
          rel="noreferrer"
          style={linkBtnPrimaryStyle}
        >
          유튜브 설치 가이드 영상
        </a>

        {/* 📄 PDF 설치 가이드 (다운로드) */}
        <a
          href="/LAST.FM 설치 가이드.pdf"
          download
          style={linkBtnPrimaryStyle}
        >
          PDF 설치 가이드
        </a>
      </div>


      <p style={{ ...pStyle, marginTop: 10, color: "rgba(255,255,255,.62)" }}>
        ※ 설치는 최초 1회만 진행하면 되며, 설치 이후에는 별도의 조작 없이 사용 가능합니다.
      </p>
    </div>
  </section>

 {/* 3) FAQ */}
<section className="card" style={cardStyle} id="faq">
  <h2 style={titleXLStyle}>FAQ</h2>

  {/* Q1 */}
  <h3 style={faqQStyle}>
    수익 분배 및 정산 / 수익 분배는 어떻게 이뤄지나요?
  </h3>
  <p style={faqAStyle}>
    스트리밍 수익은 <b style={bStyle}>YouTube Music의 재생 횟수 및 광고 수익</b>을
    기반으로 계산됩니다.
  </p>
  <p style={faqAStyle}>
    개인별 수익은 <b style={bStyle}>ODO 서비스와 계약된 주체에 따라 비율로 산정</b>되며,
    자세한 사항은 <b style={bStyle}>영업팀을 통해 상담</b>받으실 수 있습니다.
  </p>

  <hr style={hrStyle} />

  {/* Q2 */}
  <h3 style={faqQStyle}>
    서비스 이용 / AI 음악이란 무엇인가요?
  </h3>
  <p style={faqAStyle}>
    AI 음악이란 <b style={bStyle}>생성형 AI 프로그램</b>을 활용해 작사, 작곡, 편곡,
    마스터링 등의 과정이 이루어진 음악을 말합니다.
  </p>
  <p style={faqAStyle}>
    AI의 도움을 받아 제작된 음악은 일반적으로 AI 음악으로 분류됩니다.
  </p>
  <p style={faqAStyle}>
    다만 ODO 서비스를 통해 제공되는 AI 음악은,
  </p>
  <ul style={listUlStyle}>
    <li>사람이 음악의 초기 기획과 최종 마감에 관여하고</li>
    <li>
      실제 제작 과정에서 가장 많은 시간과 리소스가 소요되는{" "}
      <b style={bStyle}>작사·작곡 단계</b>에 생성형 AI를 활용한 음악을 의미합니다.
    </li>
  </ul>

  <hr style={hrStyle} />

  {/* Q3 */}
  <h3 style={faqQStyle}>
    서비스 이용 / 개인도 이용할 수 있나요?
  </h3>
  <p style={faqAStyle}>
    네. ODO 서비스는 매장뿐만 아니라{" "}
    <b style={bStyle}>음원을 재생할 수 있는 인터넷 이용이 가능한 모든 환경</b>에서
    이용하실 수 있습니다.
  </p>
  <p style={faqAStyle}>
    개인 이용에 대한 자세한 사항은 <b style={bStyle}>운영팀을 통해 상담</b>받으실 수
    있습니다.
  </p>
</section>


  {/* 4) 추가 문의하기 */}
  <section className="card" style={cardStyle} id="contact">
    <h2 style={titleXLStyle}>추가 문의하기</h2>

    <div style={boxStyle}>
      <div style={infoRowStyle}>
        <span style={infoKeyStyle}>메일</span>
        <a style={infoValLinkStyle} href="mailto:contact@gragpes.my">
          contact@gragpes.my
        </a>
      </div>
      <div style={infoRowStyle}>
        <span style={infoKeyStyle}>카카오톡</span>
        <a
          style={infoValLinkStyle}
          href="https://pf.kakao.com/_xeuxjxjn/chat"
          target="_blank"
          rel="noreferrer"
        >
          https://pf.kakao.com/_xeuxjxjn/chat
        </a>
      </div>
    </div>
  </section>
</div>


    </main>
  );
}
/* ===== FAQ 전용 ===== */
const faqQStyle: CSSProperties = {
  margin: "16px 0 6px",
  fontSize: 15,
  fontWeight: 800,
  letterSpacing: -0.2,
  color: "rgba(255,255,255,.95)",
};

const faqAStyle: CSSProperties = {
  margin: "0 0 8px",
  color: "rgba(255,255,255,.78)",
  fontSize: 13.5,
  lineHeight: 1.7,
  fontWeight: 500,
};

/* ===== PrivacyPage 톤 그대로 재사용 (tokens) ===== */
const stackStyle: CSSProperties = {
  display: "grid",
  gap: 24, // 카드 사이 간격
};
const installTextStyle: CSSProperties = {
  marginBottom: 8,
  fontSize: 20,          // 🔼 글자만 키움 (18~22 사이 추천)
  fontWeight: 900,
  letterSpacing: -0.3,
  color: "rgba(255,255,255,.95)",
};

const cardStyle: CSSProperties = {
  padding: "22px 18px",
  borderRadius: 18,
  scrollMarginTop: 50, // 네비 클릭 이동 시 상단 가림 방지(보조)
};

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
  fontSize: 15,
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

const sectionStyle: CSSProperties = {
  scrollMarginTop: 120, // 혹시 브라우저 기본 anchor 이동 대비
};

const boxStyle: CSSProperties = {
  marginTop: 10,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,.08)",
  background: "rgba(255,255,255,.03)",
  padding: 14,
};

/* ===== 네비 스타일 (Privacy 페이지 톤에 맞춘 “깔끔한 바”) ===== */

const navWrapFixedStyle: CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  zIndex: 60,
  backdropFilter: "blur(10px)",
  background: "rgba(10,10,12,.72)",
  borderBottom: "1px solid rgba(255,255,255,.08)",
};

const navInnerStyle: CSSProperties = {
  maxWidth: 1120, // container 폭과 비슷하게
  margin: "0 auto",
  padding: "10px 16px",
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const navLabelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: "0.22em",
  color: "rgba(255,255,255,.55)",
  whiteSpace: "nowrap",
};

const navListStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

const navBtnStyle: CSSProperties = {
  appearance: "none",
  border: "1px solid rgba(255,255,255,.10)",
  background: "transparent",
  color: "rgba(255,255,255,.72)",
  fontWeight: 850,
  fontSize: 12.5,
  padding: "8px 10px",
  borderRadius: 999,
  cursor: "pointer",
  lineHeight: 1,
};

const navBtnActiveStyle: CSSProperties = {
  border: "1px solid rgba(255,255,255,.22)",
  background: "rgba(255,255,255,.08)",
  color: "rgba(255,255,255,.92)",
};

/* ===== 링크 버튼 ===== */
const linkBtnPrimaryStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  textDecoration: "none",
  borderRadius: 999,
  padding: "10px 14px",
  minHeight: 38,                 // ✅ 버튼 높이 보정
  fontSize: 13,
  fontWeight: 900,
  lineHeight: 1,                 // ✅ 글자 위아래 여백 깨짐 방지
  whiteSpace: "nowrap",          // ✅ 줄바꿈 방지
  color: "rgba(255,255,255,.92)",
  background: "rgba(255,255,255,.10)",
  border: "1px solid rgba(255,255,255,.16)",
};

const linkBtnGhostStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  textDecoration: "none",
  borderRadius: 999,
  padding: "10px 14px",
  minHeight: 38,
  fontSize: 13,
  fontWeight: 900,
  lineHeight: 1,
  whiteSpace: "nowrap",
  color: "rgba(255,255,255,.78)",
  background: "transparent",
  border: "1px solid rgba(255,255,255,.12)",
};


/* ===== 문의 박스 row ===== */

const infoRowStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  padding: "6px 0",
  alignItems: "center",
};

const infoKeyStyle: CSSProperties = {
  width: 72,
  color: "rgba(255,255,255,.62)",
  fontWeight: 900,
  fontSize: 15,
};

const infoValLinkStyle: CSSProperties = {
  color: "rgba(255,255,255,.86)",
  fontWeight: 850,
  fontSize: 15,
  textDecoration: "underline",
  textUnderlineOffset: 3,
};
/* ===== 큰 제목 (컨테이너 진입용) ===== */
const titleXLStyle: CSSProperties = {
  margin: "0 0 14px",
  fontSize: 30,          // ✅ 요청한 40
  fontWeight: 900,
  letterSpacing: -0.8,
};

/* ===== Step 제목 (1번 단계 강조) ===== */
const stepTitleStyle: CSSProperties = {
  margin: "18px 0 8px",
  fontSize: 22,          // ✅ 요청한 30
  fontWeight: 800,
  letterSpacing: -0.4,
};


/* ===== 키워드 강조 ===== */
const keywordStyle: CSSProperties = {
  fontSize: "1.05em",
  fontWeight: 700,
  color: "rgba(255,255,255,.92)",
};

const keywordStrongStyle: CSSProperties = {
  fontSize: "1.08em",
  fontWeight: 800,
  letterSpacing: -0.2,
};
