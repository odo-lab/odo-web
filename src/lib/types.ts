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
  coverUrl?: string;
  image : string;
};
