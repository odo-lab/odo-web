"use client";

import React from "react";

type Props = {
  items: readonly string[];
  active: string;
  /** 새 방식 */
  onSelect?: (v: string) => void;
  /** 구 방식(호환용) */
  onChange?: React.Dispatch<React.SetStateAction<string>> | ((v: string) => void);
  id?: string;
};

export default function Chips({ items, active, onSelect, onChange, id }: Props) {
  // onSelect 우선, 없으면 onChange 사용
  const handle = (v: string) => {
    if (onSelect) return onSelect(v);

    if (typeof onChange === "function") {
      // setState 함수 or 일반 콜백 둘 다 대응
      // setState는 (prev)=>next도 받을 수 있으므로 string 전달은 OK
      (onChange as (value: string) => void)(v);
    }
  };

  return (
    <div className="chips" role="tablist" aria-label={id ?? "chips"}>
      {items.map((it) => {
        const isActive = it === active;
        return (
          <button
            key={it}
            type="button"
            className={`chip ${isActive ? "active" : ""}`}
            role="tab"
            aria-selected={isActive}
            onClick={() => handle(it)}
          >
            {it}
          </button>
        );
      })}
    </div>
  );
}
