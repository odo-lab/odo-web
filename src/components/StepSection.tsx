"use client";

import Image from "next/image";
import styles from "./StepSection.module.css";

type Step = {
  no: number;
  title: React.ReactNode;
};


type Props = {
  /** 우측 카드에 들어갈 이미지 (public 기준 경로) */
  rightImageSrc: string;
  rightImageAlt?: string;
};

export default function StepsSection({
  rightImageSrc,
  rightImageAlt = "매장 음악 사용 예시",
}: Props) {
 const steps: Step[] = [
  { no: 1, title: "YouTube Music 준비" },
  {
    no: 2,
    title: (
      <>
        최초 1회 설정 <span className={styles.br} aria-hidden="true"><br /></span>
        (Last.fm 연동)
      </>
    ),
  },
  { no: 3, title: "플레이리스트 재생" },
];


  return (
    <section className={styles.wrap} aria-label="ODO 이용 가이드 요약">
      <div className={styles.container}>
        {/* 상단 Tip 카드 */}
        <div className={styles.tipCard}>
          <div className={styles.tipKicker}>ODO 실전 Tip</div>
          <div className={styles.tipTitle}>
            쉽고 간단하게,
            <br />
            ODO 서비스를 신청해보세요!
          </div>
        </div>

        {/* 하단 2컬럼 */}
        <div className={styles.grid}>
          {/* 좌측: 스텝 카드 3개 */}
          <div className={styles.leftCol}>
            {steps.map((s) => (
              <div key={s.no} className={styles.stepCard}>
                <div className={styles.stepNo}>STEP {s.no}</div>
                <div className={styles.stepTitle}>{s.title}</div>
              </div>
            ))}
          </div>

          {/* 우측: 이미지 카드(로고 대신) */}
          <div className={styles.rightCard} aria-label="사용 예시 이미지">
            <div className={styles.rightMedia}>
              <Image
                src="/images/pos.png"
                alt={rightImageAlt}
                fill
                sizes="(max-width: 820px) 46vw, 420px"
                className={styles.rightImg}
                priority={false}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
