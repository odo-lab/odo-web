"use client";
import Link from "next/link";

export default function Page() {
  return (
    <section className="card" style={{ padding: 22 }}>
      <h3 className="section-title" style={{ margin: "0 0 8px" }}>이용 방법</h3>
      <p className="section-desc" style={{ margin: "0 0 18px" }}>
        ODO는 “선곡 콘솔(Console)”, YouTube Music은 “재생기(Player)”로 생각하면 가장 이해가 쉽습니다.
      </p>

      <div className="info-grid" style={{ gridTemplateColumns: "1fr", gap: 12 }}>
        <div className="info-box">
          <b>1) ODO에서 무드/업종/장르로 플레이리스트 선택</b>
          <span>카드 클릭 시 YouTube Music으로 이동합니다. ‘상세’ 버튼은 정보 모달을 엽니다.</span>
        </div>
        <div className="info-box">
          <b>2) YouTube Music에서 재생</b>
          <span>수익 집계 요건 때문에 재생은 YouTube Music으로 전환됩니다(프로토타입에서는 링크로 이동).</span>
        </div>
        <div className="info-box">
          <b>3) 운영 안정성 체크</b>
          <span>절전/자동재생/네트워크 이슈는 Help에서 빠르게 해결하도록 동선을 제공합니다.</span>
        </div>
        <div className="info-box">
          <b>로테이션 안내</b>
          <span>특정 트랙/아티스트 편중을 줄이기 위해 유사 무드 내에서 추천/노출이 순환될 수 있습니다.</span>
        </div>
      </div>

      <div className="modal-actions">
        <Link className="btn btn-primary" href="/playlists">플레이리스트 둘러보기</Link>
        <Link className="btn" href="/help">FAQ/운영가이드</Link>
      </div>
    </section>
  );
}
