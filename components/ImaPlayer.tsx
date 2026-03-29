"use client";

import { useEffect, useRef } from "react";

interface Props {
  src: string; // direct S3 .mp4 URL or VAST endpoint
  onEnded?: () => void;
  loop?: boolean;
}

async function resolveVideoSrc(src: string): Promise<string> {
  if (src.includes(".mp4")) return src;
  try {
    const res = await fetch(src);
    const xml = await res.text();
    const doc = new DOMParser().parseFromString(xml, "text/xml");
    return doc.querySelector("MediaFile")?.textContent?.trim() ?? "";
  } catch {
    return "";
  }
}

export default function VideoAd({ src, onEnded, loop = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let cancelled = false;
    resolveVideoSrc(src).then((url) => {
      if (cancelled || !url || !videoRef.current) return;
      videoRef.current.src = url;
      videoRef.current.play().catch(() => {});
    });
    return () => { cancelled = true; };
  }, [src]);

  return (
    <div className="w-full h-full bg-black overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        autoPlay
        muted
        loop={loop}
        onEnded={onEnded}
      />
    </div>
  );
}
