import Image from "next/image";
import styles from "./LPBackground.module.css";

export default function LPBackground() {
  return (
    <div className={styles.wrap} aria-hidden="true">
      <Image
        src="/images/lp-blue.png"
        alt=""
        width={640}
        height={640}
        className={styles.lp}
        priority
      />
    </div>
  );
}
