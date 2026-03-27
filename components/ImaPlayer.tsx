"use client";

import { useEffect, useRef } from "react";

interface ImaPlayerProps {
  adTagUrl: string;
  onAdEvent?: (type: string) => void;
}

function loadImaScript(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return;
    if (document.getElementById("google-ima-sdk")) { resolve(); return; }
    const script = document.createElement("script");
    script.id = "google-ima-sdk";
    script.src = "https://imasdk.googleapis.com/js/sdkloader/ima3.js";
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

export default function ImaPlayer({ adTagUrl, onAdEvent }: ImaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const adContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adsManagerRef = useRef<any>(null);

  useEffect(() => {
    let destroyed = false;

    async function init() {
      await loadImaScript();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ima = (window as any).google?.ima;
      if (!ima || !videoRef.current || !adContainerRef.current) return;

      const adDisplayContainer = new ima.AdDisplayContainer(
        adContainerRef.current,
        videoRef.current
      );
      adDisplayContainer.initialize();

      const adsLoader = new ima.AdsLoader(adDisplayContainer);

      adsLoader.addEventListener(
        ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (e: any) => {
          if (destroyed) return;
          const settings = new ima.AdsRenderingSettings();
          settings.restoreCustomPlaybackStateOnAdBreakComplete = true;
          const mgr = e.getAdsManager(videoRef.current, settings);
          adsManagerRef.current = mgr;

          mgr.addEventListener(ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED, () => videoRef.current?.pause());
          mgr.addEventListener(ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, () => videoRef.current?.play());
          mgr.addEventListener(ima.AdEvent.Type.ALL_ADS_COMPLETED, () => onAdEvent?.("complete"));

          try {
            mgr.init(
              videoRef.current!.offsetWidth,
              videoRef.current!.offsetHeight,
              ima.ViewMode.NORMAL
            );
            mgr.start();
          } catch (err) {
            console.error("[ImaPlayer] start failed:", err);
            videoRef.current?.play();
          }
        }
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      adsLoader.addEventListener(ima.AdErrorEvent.Type.AD_ERROR, (e: any) => {
        console.error("[ImaPlayer] Ad error:", e.getError().toString());
        adsManagerRef.current?.destroy();
        videoRef.current?.play();
      });

      const req = new ima.AdsRequest();
      req.adTagUrl = adTagUrl;
      req.linearAdSlotWidth = videoRef.current.offsetWidth;
      req.linearAdSlotHeight = videoRef.current.offsetHeight;
      req.nonLinearAdSlotWidth = videoRef.current.offsetWidth;
      req.nonLinearAdSlotHeight = Math.floor(videoRef.current.offsetHeight / 3);
      adsLoader.requestAds(req);
    }

    init();

    return () => {
      destroyed = true;
      adsManagerRef.current?.destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adTagUrl]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
      />
      <div
        ref={adContainerRef}
        className="absolute inset-0"
        style={{ pointerEvents: "auto" }}
      />
    </div>
  );
}
