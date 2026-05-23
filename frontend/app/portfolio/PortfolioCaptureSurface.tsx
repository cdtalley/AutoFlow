"use client";

import { useLayoutEffect } from "react";

/** Full-bleed 1000×750 capture — kill root body gradients so PNG matches Sentinel / DocuMind tiles. */
export function PortfolioCaptureSurface({ children }: { children: React.ReactNode }) {
  useLayoutEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlBg = html.style.background;
    const prevBodyBg = body.style.background;
    const prevBodyBgImg = body.style.backgroundImage;
    const prevBodyAttach = body.style.backgroundAttachment;
    const prevBodyMinH = body.style.minHeight;
    html.style.background = "#000000";
    body.style.background = "#000000";
    body.style.backgroundImage = "none";
    body.style.backgroundAttachment = "scroll";
    body.style.minHeight = "750px";
    return () => {
      html.style.background = prevHtmlBg;
      body.style.background = prevBodyBg;
      body.style.backgroundImage = prevBodyBgImg;
      body.style.backgroundAttachment = prevBodyAttach;
      body.style.minHeight = prevBodyMinH;
    };
  }, []);

  return (
    <div className="relative m-0 box-border h-[750px] w-[1000px] overflow-hidden bg-black p-0">{children}</div>
  );
}
