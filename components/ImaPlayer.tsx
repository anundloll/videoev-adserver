"use client";

import { useEffect, useRef, useState } from "react";

interface ImaPlayerProps {
  adTagUrl: string;
  onAdEvent?: (type: string) => void;
}

async function resolveVideoUrl(adTagUrl: string): Promise<string | null> {
  try {
    const res = await fetch(adTagUrl);
    const xml = await res.text();
    const doc = new DOMParser().parseFromString(xml, "text/xml");
    const url = doc.querySelector("MediaFile")?.textContent?.trim() ?? null;
    return url;
  } catch {
    return null;
  }
}

export default function ImaPlayer({ adTagUrl, onAdEvent }: ImaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    setSrc(null);
    resolveVideoUrl(adTagUrl).then((url) => {
      if (url) setSrc(url);
    });
  }, [adTagUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    video.src = src;
    video.play().catch(() => {});

    const onEnded = () => onAdEvent?.("complete");
    video.addEventListener("ended", onEnded);
    return () => video.removeEventListener("ended", onEnded);
  }, [src, onAdEvent]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
        autoPlay
        loop
      />
    </div>
  );
}
