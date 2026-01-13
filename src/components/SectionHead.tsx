import Link from "next/link";
import styles from "./SectionHead.module.css";

export default function SectionHead({
  title,
  desc,
  actionHref,
  actionLabel,
}: {
  title: string;
  desc?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className={styles.head}>
      <div>
        <h3 className={styles.title}>{title}</h3>
        {desc && <p className={styles.desc}>{desc}</p>}
      </div>
      {actionHref && actionLabel && (
        <Link className={styles.action} href={actionHref}>
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
