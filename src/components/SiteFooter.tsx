// src/components/SiteFooter.tsx
import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="legal-footer">
      <div className="container">
        <div className="legal-top">
          <div className="legal-links">
            <Link href="/terms">이용약관</Link>
            <span>|</span>
            <Link href="/privacy">개인정보처리방침</Link>
            <span>|</span>
            <Link href="/howto">서비스 이용안내</Link>
            <span>|</span>
            <a href="mailto:contact@grapes.my">고객센터</a>
            <span>|</span>
            <a href="https://pf.kakao.com/_xeuxjxjn/chat">카카오톡 문의하기</a>
          </div>

          <div className="legal-contact">
            고객센터 · 광고 · 사업 문의 :
            <a href="mailto:contact@grapes.my"> contact@grapes.my</a>
          </div>
        </div>

        <div className="legal-info">
          <p>
            (주)그레이프스 · 대표이사 홍영주 · 사업자등록번호 387-81-03198 · 통신판매업신고번호
            (사업자등록확인)
          </p>
          <p>
            주소: 서울시 광진구 천호대로 579 502 · 전화: 070-8983-2616 · 이메일: contact@grapes.my
          </p>
          <p>호스팅 서비스 제공</p>
        </div>

        <div className="legal-notice">
          <strong>(서비스 고지)</strong>
          <ul>
            <li>본 서비스는 AI 생성 음원 큐레이션 정보를 제공하며, 재생은 YouTube Music을 통해 이루어집니다.</li>
            <li>본 서비스의 플레이리스트 구성 및 큐레이션에 대한 권리는 (주)그레이프스에 있습니다.</li>
            <li>Copyright © GRAPES. All rights reserved.</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
