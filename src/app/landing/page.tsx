// app/landing/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import React from "react";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "ODO | 랜딩",
  description: "매장 음악 랜딩 페이지(러프 구현)",
};

function PillButton({
  children,
  href,
}: {
  children: React.ReactNode;
  href?: string;
}) {
  const inner = <span className={styles.pill}>{children}</span>;
  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ✅ 클릭 “안 하는” 표시용 박스
function PillBox({ children }: { children: React.ReactNode }) {
  return <span className={`${styles.pill} ${styles.pillStatic} ${styles.pillEqual}`}>{children}</span>;
}

export default function LandingPage() {

  return (
    <div className={styles.page}>
      <div className={styles.stageScroll}>
        <main className={styles.main}>
          {/* HERO */}
            <div className={styles.heroCard}>
              <div className={styles.heroMedia}>
                <img
                  src="/images/landing.jpg"
                  alt="hero"
                  className={styles.heroImg}
                />
                <div className={styles.heroDim} />
              </div>
            </div>

          {/* STATEMENT (여기가 “무조건 가운데”) */}
          <section className={styles.statementSection} id="howto">
            <div className={styles.statementStage}>
              <div className={styles.statementInner}>
                <h2 className={styles.h2}>
                  ODO는 매장 음악을
                  <br />
                  
                  <span className={styles.strike}>비용을 내지 않는,</span>
                  <br />
                  <span className={styles.accent}>혜택받는 구조</span>로 바꿨습니다.
                </h2>

                <p className={styles.desc}>
                  매장에서 음악을 틀어준 만큼
                  <br />
                  매장에 혜택이 돌아갑니다.
                </p>
              </div>
            </div>

            {/* 혜택 Pills */}
            <div className={styles.benefitWrap}>
              <div className={styles.benefitGrid}>
                <div className={styles.benefitLeft}>
                  <PillBox >월 최대 3만원 상당 혜택</PillBox>
                </div>
                <div className={styles.benefitRight}>
                  <PillBox>추가 비용 없음</PillBox>
                </div>
              </div>

              <div className={styles.spacer} />

              {/* 불편 포인트 */}
              <div className={styles.problemGrid}>
                <div className={styles.problemTitle}>
                  <h3 className={styles.h3}>
                    매장 음악,
                    <br />
                    사실 이런 점이 <span className={styles.br} aria-hidden="true"><br /></span>불편했습니다.
                  </h3>
                </div>

                <ul className={styles.problemList}>
                  <li>매장에서 틀어도 되는지 늘 애매한 음악</li>
                  <li>매달 빠져나가는 음악 비용</li>
                  <li>직접 골라야 하고 관리해야 하는 번거로움</li>
                </ul>
              </div>

              <div className={styles.closing}>음악은 틀지만, 남는 건 없었습니다</div>
            </div>
          </section>
         
          {/* STATEMENT (여기가 “무조건 가운데”) */}
            <div className={styles.statementStage}>
              <div className={styles.statementInner}>
                <h2 className={styles.h2}>
                  ODO는 매장 음악을
                  <br />
                  '틀고 끝'이 아니라
                  <br />
                  <span className={styles.accent}>'틀어준 만큼 받는 구조'</span>로 <span className={styles.br} aria-hidden="true"><br /></span>설계했습니다.
                </h2>
              </div>
            </div>
            {/* 이미지 2*/}

            <section className={styles.heroSection} id="hero">
            <div className={styles.heroCard}>
              <div className={styles.heroMedia}>
                <img
                  src="/images/text1.jpg"
                  alt="hero"
                  className={styles.heroImg}
                />
                <div className={styles.heroDim} />
              </div>
            </div>
            {/* 으아아아*/}
            <div className={styles.closing}>이런 음악이 매장에서 재생됩니다</div>
            <div className={styles.statementStage}>
                <div className={styles.ytEmbed}>
                  <div className={styles.ytRatio}>
                    <iframe
                        src="https://www.youtube.com/embed/ntVJYQtyQ0s?rel=0"
                        title="YouTube video player"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                    />
                  </div>
                </div>
            </div>


          </section>

           <div className={styles.pillStage}>
            <span className={`${styles.pillsm} ${styles.p1}`}>매장 전용</span>
            <span className={`${styles.pillsm} ${styles.p2}`}>광고 없음</span>
            <span className={`${styles.pillsm} ${styles.p3}`}>저작권 클리어</span>
          </div>

          <div id="cta" style={{ height: 1 }} />
        </main>
      </div>
    </div>
  );
}
