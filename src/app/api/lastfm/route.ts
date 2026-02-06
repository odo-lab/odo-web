// src/app/api/lastfm/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, limit } from "firebase/firestore";
import axios from "axios";

// 기존 odo-webServer의 .env에 있던 키 값들
const API_KEY = process.env.NEXT_PUBLIC_LASTFM_API_KEY;
const USERNAME = "odo_user"; // 또는 동적으로 받기

// [GET 요청] 프론트에서 "/api/lastfm"을 호출하면 이 함수가 실행됨
export async function GET() {
  try {
    // 1. Last.fm API 호출 (기존 odo-webServer 로직)
    const response = await axios.get(`http://ws.audioscrobbler.com/2.0/`, {
        params: {
            method: 'user.getrecenttracks',
            user: USERNAME,
            api_key: API_KEY,
            format: 'json',
            limit: 1 // 가장 최근 1곡만 확인
        }
    });

    const track = response.data.recenttracks.track[0];
    
    // 2. Firebase 저장 로직 (중복 체크 후 저장)
    // (기존 서버에 있던 중복 방지 로직을 여기에 구현)
    
    // 예시: 무조건 저장하는 경우
    /*
    await addDoc(collection(db, "listening_history"), {
        artist: track.artist['#text'],
        track: track.name,
        album: track.album['#text'],
        played_at: new Date().toISOString()
    });
    */

    return NextResponse.json({ success: true, data: track });

  } catch (error) {
    console.error("Last.fm API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch" }, { status: 500 });
  }
}