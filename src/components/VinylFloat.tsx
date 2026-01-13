"use client";

import Image from "next/image";

export default function VinylFloat() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 12,
          transform: "translateX(-50%)",
          width: 320,
          height: 320,
          opacity: 0.28,
          filter: "drop-shadow(0 18px 40px rgba(0,0,0,.45))",
          animation: "vinylFloat 6s ease-in-out infinite",
        }}
      >
        <Image
          src="/images/lp-blue.png"
          alt=""
          fill
          sizes="320px"
          priority
          style={{
            objectFit: "contain",
            transformOrigin: "50% 50%",
            animation: "vinylWobble 3.2s ease-in-out infinite",
          }}
        />
      </div>

      <style jsx global>{`
        @keyframes vinylFloat {
          0%, 100% { transform: translateX(-50%) translateY(0px); }
          50% { transform: translateX(-50%) translateY(10px); }
        }
        @keyframes vinylWobble {
          0%, 100% { transform: rotate(-6deg); }
          50% { transform: rotate(6deg); }
        }
      `}</style>
    </div>
  );
}
