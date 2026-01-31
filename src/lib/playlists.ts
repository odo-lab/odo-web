export type Playlist = {
  id: string;
  title: string;
  genre: string;
  industry: string;
  energy: "LOW" | "MED" | "HIGH";
  vocal: "LOW" | "MED" | "HIGH";
  duration: string;
  tracks: number;
  tags: string[];
  usecase: string;
  ytmUrl: string;
  image: string; // public/ 경로
};

export const GENRES = [
  "전체",
  "재즈/라운지",
  "어쿠스틱",
  "R&B/소울",
  "인디/로파이",
  "클래식/피아노",
  "댄스(활기)",
  "팝(클린)",
] as const;

export const INDUSTRIES = [
  "전체",
  "카페",
  "식당",
  "주점",
  "헬스",
  "집",
  "편집샵",
  "사무공간",
  "호텔/라운지",
] as const;

export const PLAYLISTS: Playlist[] = [
  { id:"p1", title:"카페에서 듣기 좋은 음악", genre:"어쿠스틱", industry:"카페", energy:"LOW", vocal:"LOW", duration:"1시간 15분", tracks:30, tags:["LOW","인스트루멘탈","카페"], usecase:"오픈~점심 전", ytmUrl:"https://music.youtube.com/playlist?list=PLcuymYOCldOzgjfzHCdBr8DZJ0RU_gxRh", image:"/images/p1.jpg" },
  { id:"p2", title:"일하면서 듣기 좋은 음악", genre:"인디/로파이", industry:"사무공간", energy:"MED", vocal:"LOW", duration:"1시간 19분", tracks:30, tags:["MED","로파이","집중"], usecase:"업무 시간", ytmUrl:"https://music.youtube.com/playlist?list=PLcuymYOCldOzbZxv-UMPEChEY06yVAqa2", image:"/images/p2.jpg" },
  { id:"p3", title:"운동할 때 듣기 좋은 음악", genre:"댄스(활기)", industry:"헬스", energy:"HIGH", vocal:"MED", duration:"1시간 22분", tracks:30, tags:["HIGH","댄스","운동"], usecase:"운동 피크", ytmUrl:"https://music.youtube.com/playlist?list=PLcuymYOCldOwOqtXBsOs-ILJsRJsz2b77", image:"/images/p3.jpg" },
  { id:"p4", title:"드라이브할 때 듣기 좋은 음악", genre:"R&B/소울", industry:"사무공간", energy:"MED", vocal:"MED", duration:"1시간 28분", tracks:30, tags:["MED","드라이브","R&B"], usecase:"이동/드라이브", ytmUrl:"https://music.youtube.com/playlist?list=PLcuymYOCldOyAj0w5gOFtX-EFDTzq9NqN", image:"/images/p4.jpg" },
  { id:"p5", title:"샤워할 때 듣기 좋은 음익", genre:"클래식/피아노", industry:"집", energy:"LOW", vocal:"LOW", duration:"1시간 21분", tracks:30, tags:["LOW","피아노","편안"], usecase:"대기/케어", ytmUrl:"https://music.youtube.com/playlist?list=PLcuymYOCldOzRamcR_IyJBokbqeZ56zQL", image:"/images/p5.jpg" },
  { id:"p6", title:"공부할 때 듣기 좋은 음악", genre:"인디/로파이", industry:"사무공간", energy:"MED", vocal:"LOW", duration:"1시간 3분", tracks:25, tags:["MED","R&B","밤"], usecase:"공부/집중", ytmUrl:"https://music.youtube.com/playlist?list=PLcuymYOCldOxf2OfnSjWTfEy_1tzqIQtO", image:"/images/p6.jpg" },
  { id:"p7", title:"낮에 듣기 좋은 음악", genre:"팝(클린)", industry:"카페", energy:"MED", vocal:"MED", duration:"2시간 8분", tracks:46, tags:["MED","클린","무난"], usecase:"오후", ytmUrl:"https://music.youtube.com/playlist?list=PLcuymYOCldOzfmRcJUCStD1pS93f0kGSb", image:"/images/p7.jpg" },
  { id:"p13", title:"낮에 듣기 좋은 음악2", genre:"팝(클린)", industry:"카페", energy:"MED", vocal:"MED", duration:"4시간 57분", tracks:100, tags:["MED","클린","무난"], usecase:"오후", ytmUrl:"https://music.youtube.com/playlist?list=PLcuymYOCldOyXhX1wrDoMbztUnAeu1spl", image:"/images/p13.jpg" },
  { id:"p8", title:"밤에 듣기 좋은 음악", genre:"R&B/소울", industry:"주점", energy:"MED", vocal:"HIGH", duration:"2시간 18분", tracks:50, tags:["MED","소울","나이트"], usecase:"밤 시간대", ytmUrl:"https://music.youtube.com/playlist?list=PLcuymYOCldOz0OSt_9ogKUChDRgoYaWcE", image:"/images/p8.jpg" },
  { id:"p14", title:"밤에 듣기 좋은 음악2", genre:"R&B/소울", industry:"주점", energy:"MED", vocal:"HIGH", duration:"4시간 59분", tracks:100, tags:["MED","소울","나이트"], usecase:"밤 시간대", ytmUrl:"https://music.youtube.com/playlist?list=PLcuymYOCldOxDHnWRoruTjyoKt7NO70O1", image:"/images/p14.jpg" },
  { id:"p9", title:"잠이 안 올 때 듣기 좋은 음악", genre:"클래식/피아노", industry:"호텔/라운지", energy:"LOW", vocal:"LOW", duration:"1시간 5분", tracks:26, tags:["LOW","수면","피아노"], usecase:"야간/휴식", ytmUrl:"https://music.youtube.com/playlist?list=PLcuymYOCldOwAKzJ3bKhows-2Anxa7nTw", image:"/images/p9.jpg" },
  { id:"p10", title:"오늘은 왠지 예감이 좋아", genre:"팝(클린)", industry:"카페", energy:"MED", vocal:"MED", duration:"5시간 이상", tracks:120, tags:["MED","클린","무난"], usecase:"상시 운영", ytmUrl:"https://music.youtube.com/playlist?list=PLcuymYOCldOxOCP8jc9YA-AREFh5Ys0Wg", image:"/images/p10.jpg" },
  { id:"p11", title:"내가 있는 곳이 카페가 되는", genre:"재즈/라운지", industry:"사무공간", energy:"LOW", vocal:"LOW", duration:"5시간 이상", tracks:120, tags:["LOW","재즈","집중"], usecase:"업무/대기", ytmUrl:"https://music.youtube.com/playlist?list=PLcuymYOCldOz7YN9OxqiA616ZP8EzEEnK", image:"/images/p11.jpg" },
  { id:"p12", title:"크리스마스", genre:"재즈/라운지", industry:"카페", energy:"MED", vocal:"MED", duration:"1시간 2분", tracks:23, tags:["MED","시즌","크리스마스"], usecase:"연말 시즌", ytmUrl:"https://music.youtube.com/playlist?list=PLcuymYOCldOwwmgutP-fYzKY2g-ppt_vL", image:"/images/p12.jpg" }
  
];

export const NOW_RECO = ["p13","p11","p10","p14","p9","p6","p2"] as const;
export const DEFAULT_GENRE = "재즈/라운지";
export const DEFAULT_INDUSTRY = "카페";
