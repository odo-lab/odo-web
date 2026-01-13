"use client";

import Image from "next/image";
import Link from "next/link";
import { Playlist } from "@/lib/playlists";
import { useEffect } from "react";

export default function PlaylistModal({
  open,
  playlist,
  onClose,
}: {
  open: boolean;
  playlist: Playlist | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !playlist) return null;

  const hasUrl = Boolean(playlist.ytmUrl && playlist.ytmUrl.trim().length > 0);

  return (
    <div
      className="modal-backdrop show"
      role="dialog"
      aria-modal="true"
      aria-label="플레이리스트 상세 정보"
      onClick={(e) => {
        // 바깥(오버레이) 클릭만 닫기
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        onClick={(e) => {
          // 모달 내부 클릭은 오버레이로 전파되지 않게
          e.stopPropagation();
        }}
      >
        {/* 상단 헤더 */}
        <div className="modal-top">
          <strong>플레이리스트 정보</strong>
          <button
            className="modal-close"
            type="button"
            aria-label="닫기"
            onClick={onClose}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* 본문 */}
        <div className="modal-body">
          {/* 커버 이미지 (클릭 시 ytmUrl로 이동) */}
          {hasUrl ? (
            <Link
              href={playlist.ytmUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube Music에서 재생하기"
              title="YouTube Music에서 열기"
              className="modal-cover"
              style={{ cursor: "pointer" }}
              onClick={(e) => {
                // 링크 클릭이 모달 닫기 로직에 영향 주지 않도록
                e.stopPropagation();
              }}
            >
              <Image
                src={playlist.image}
                alt={playlist.title}
                fill
                style={{ objectFit: "cover", opacity: 0.95 }}
                priority
              />
            </Link>
          ) : (
            <div className="modal-cover">
              <Image
                src={playlist.image}
                alt={playlist.title}
                fill
                style={{ objectFit: "cover", opacity: 0.95 }}
                priority
              />
            </div>
          )}

          {/* 정보 영역 */}
          <div className="modal-info">
            <h2>{playlist.title}</h2>
            <p>
              {playlist.genre} · {playlist.industry}
            </p>

            <div className="info-grid">
              <div className="info-box">
                <b>추천 상황</b>
                <span>{playlist.usecase}</span>
              </div>

              <div className="info-box">
                <b>에너지 / 보컬</b>
                <span>
                  {playlist.energy} / VOCAL {playlist.vocal}
                </span>
              </div>

              <div className="info-box">
                <b>길이 · 곡 수</b>
                <span>
                  {playlist.duration} · {playlist.tracks}곡
                </span>
              </div>

              <div className="info-box">
                <b>태그</b>
                <span>{playlist.tags.join(" · ")}</span>
              </div>
            </div>

            {/* 🔹 안내 문구만 유지 */}
            <div className="note" style={{ marginTop: 14 }}>
              안내: ODO는 실제 YouTube Music 재생 상태를 자동으로 확인하지 않습니다.
              <br />
              재생은 카드 클릭을 통해 YouTube Music에서 직접 진행됩니다.
            </div>

            {/* (선택) 텍스트 링크도 추가하고 싶으면 아래 주석 해제
            {hasUrl && (
              <div style={{ marginTop: 12 }}>
                <a
                  href={playlist.ytmUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "underline" }}
                >
                  YouTube Music에서 열기
                </a>
              </div>
            )}
            */}
          </div>
        </div>
      </div>
    </div>
  );
}
