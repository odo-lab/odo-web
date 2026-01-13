// app/components/Hero.tsx (경로는 편한 곳에 두고 import 하세요)
"use client";

import styles from "./Hero.module.css";
import VinylFloat from "@/components/VinylFloat";

export default function Hero() {
  return (
    <section className={styles.wrapper}>
      <div className={styles.hero}>
        <div className={styles.heroText}>
          <h1 className={styles.h1}>
            틀기만 해도 포인트가 쌓이는
            <br />
            AI매장 음악 컨설팅
          </h1>

          <p className={styles.sub}>
            ODO는 점주를 위한 운영형 음악 서비스입니다. 아티스트가 아니라
            &quot;무드 기반 플레이리스트&quot;를 고르고, 재생은 YouTube Music에서
            진행됩니다.
          </p>

          <div className={styles.actions}>
            <button className={`${styles.btn} ${styles.primary}`}>
              플레이리스트 둘러보기
            </button>
            <button className={`${styles.btn} ${styles.ghost}`}>
              이용 방법 보기
            </button>
            <button className={`${styles.btn} ${styles.ghost}`}>
              FAQ / 운영가이드
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
