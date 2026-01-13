import localFont from "next/font/local";

export const paperlogy = localFont({
  src: [
    { path: "../../public/fonts/Paperlogy-3Light.ttf", weight: "300", style: "normal" },
    { path: "../../public/fonts/Paperlogy-5Medium.ttf", weight: "500", style: "normal" },
  ],
  variable: "--font-paperlogy",
  display: "swap",
});
