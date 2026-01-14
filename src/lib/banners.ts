export type Banner = {
  id: string;
  title: string;
  subtitle?: string;
  image: string;   // 배너 이미지 (public 경로)
  href: string;    // 클릭 시 이동할 외부 링크
};

export const HERO_BANNERS: Banner[] = [
  {
    id: "hero-2",
    title: "",
    subtitle: "",
    image: "/images/hero2.jpg",
    href: "https://tally.so/r/KYQbRK",
  },
  {
    id: "hero-3",
    title: "",
    subtitle: "",
    image: "/images/hero3.jpg",
    href: "https://tally.so/r/GxKepQ",
  },
  {
    id: "hero-1",
    title: "",
    subtitle: "",
    image: "/images/hero1.jpg",
    href: "https://slashpage.com/b-and/7vgjr4m1q6vkgmdwpy86",
  },
];
