"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FAQS } from "@/lib/faqs";

const PAGE_SIZE = 10;

function getAllCategories() {
  const set = new Set<string>();
  for (const f of FAQS) for (const c of f.categories || []) set.add(c);
  return ["전체보기", ...Array.from(set)];
}

export default function FaqPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const initialCat = sp.get("cat") ?? "전체보기";
  const initialQ = sp.get("q") ?? "";
  const initialPage = Number(sp.get("page") ?? "1") || 1;

  const [category, setCategory] = useState(initialCat);
  const [query, setQuery] = useState(initialQ);
  const [page, setPage] = useState(initialPage);

  const categories = useMemo(() => getAllCategories(), []);

  useEffect(() => setPage(1), [category, query]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== "전체보기") params.set("cat", category);
    if (query.trim()) params.set("q", query.trim());
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    router.replace(qs ? `/faq?${qs}` : `/faq`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, query, page]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...FAQS].sort(
      (a, b) => Number(!!b.pinned) - Number(!!a.pinned)
    );

    return sorted.filter((f) => {
      const catOk =
        category === "전체보기"
          ? true
          : (f.categories || []).includes(category);

      if (!catOk) return false;
      if (!q) return true;

      const hay = `${f.title}\n${f.content}`.toLowerCase();
      return hay.includes(q);
    });
  }, [category, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const paged = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  // ✅ 커스텀 드롭다운(포털 방식) — overflow/z-index 꼬임 방지
  const [ddOpen, setDdOpen] = useState(false);
  const [ddRect, setDdRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest(".faqDDPortal") && !t.closest(".faqDDTrigger")) {
        setDdOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const update = () => {
      if (!triggerRef.current) return;
      setDdRect(triggerRef.current.getBoundingClientRect());
    };

    if (ddOpen) update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [ddOpen]);

  return (
    <main className="container faqWrap">
      <h1 className="faqTitle">FAQ 자주 묻는 질문</h1>

      <div className="faqPanel">
        <div className="faqTopbar">
          <button
            ref={triggerRef}
            type="button"
            className="faqDDTrigger"
            onClick={() => setDdOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={ddOpen}
          >
            <span>{category}</span>
            <span className="faqDDChevron">▾</span>
          </button>

          <div className="faqTopbarSpacer" />

          <div className="faqSearchInline">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="faqSearchInput"
            />
            <button
              type="button"
              className="faqSearchBtn"
              onClick={() => setQuery((v) => v.trim())}
              aria-label="검색"
            >
              ⌕
            </button>
          </div>
        </div>

        <div className="faqTable">
          <div className="faqHead">
            <div className="faqColCat">카테고리</div>
            <div className="faqColTitle">제목</div>
          </div>

          <div className="faqBody">
            {paged.map((f) => (
              <Link
                key={f.id}
                href={`/faq/${encodeURIComponent(String(f.no))}`}
                className="faqRow"
              >
                <div className="faqCellCat">
                  {(f.categories || []).join(" · ")}
                  {f.pinned ? (
                    <span className="faqPinned">자주 묻는 질문</span>
                  ) : null}
                </div>
                <div className="faqCellTitle">{f.title}</div>
              </Link>
            ))}

            {paged.length === 0 && (
              <div className="faqEmpty">검색/필터 결과가 없습니다.</div>
            )}
          </div>
        </div>
      </div>

      <div className="faqPager">
        <button
          className="faqPagerBtn"
          disabled={safePage <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          aria-label="이전 페이지"
        >
          ‹
        </button>

        {Array.from({ length: totalPages }).slice(0, 10).map((_, i) => {
          const n = i + 1;
          return (
            <button
              key={n}
              className={`faqPageNum ${n === safePage ? "isActive" : ""}`}
              onClick={() => setPage(n)}
              type="button"
            >
              {n}
            </button>
          );
        })}

        <button
          className="faqPagerBtn"
          disabled={safePage >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          aria-label="다음 페이지"
        >
          ›
        </button>
      </div>

      {ddOpen && ddRect && (
        <div
          className="faqDDPortal"
          style={{
            position: "fixed",
            left: ddRect.left,
            top: ddRect.bottom + 8,
            width: ddRect.width,
            zIndex: 99999,
          }}
          role="listbox"
          aria-label="카테고리 선택"
        >
          {categories.map((opt) => (
            <button
              key={opt}
              type="button"
              className={`faqDDItem ${opt === category ? "isActive" : ""}`}
              onClick={() => {
                setCategory(opt);
                setDdOpen(false);
              }}
              role="option"
              aria-selected={opt === category}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
