export type Faq = {
  id: string;            // 내부 고유키 (변경해도 됨)
  no: number;            // URL용 번호 (1,2,3...)
  pinned?: boolean;
  categories: string[];  // 최대 3개
  title: string;
  content: string;
};

export const FAQS: Faq[] = [
  {
    id: "faq-001",
    no: 1,
    pinned: true,
    categories: ["서비스 이용"],
    title: "여러 기기에서 동시에 재생 가능한가요?",
    content:
      "유튜브 뮤직은 한 계정에서 동시에 여러 기기 재생이 제한될 수 있습니다.",
  },
  {
    id: "faq-002",
    no: 2,
    categories: ["기술적 문제 및 고객 지원"],
    title: "고객 문의는 어떻게 하나요?",
    content: "고객 지원은 다음 방법으로 받을 수 있습니다...",
  },
  {
    id: "faq-003",
    no: 3,
    categories: ["수익 분배 및 정산"],
    title: "수익 내역 확인 방법",
    content: "담당자를 통해 직접 안내를 받으실 수 있습니다.",
  },
  {
    id: "faq-004",
    no: 4,
    categories: ["기술적 문제 및 고객 지원"],
    title: "사용 가능한 디바이스",
    content: "스마트폰, 태블릿, PC 등에서 사용 가능합니다.",
  },
  {
    id: "faq-005",
    no: 5,
    categories: ["기술적 문제 및 고객 지원"],
    title: "인터넷 연결 없이 사용할 수 있나요?",
    content: "아쉽게도 서비스는 온라인 환경에서만 제공됩니다.",
  },
];
