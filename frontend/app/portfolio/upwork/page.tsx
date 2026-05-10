import type { Metadata } from "next";
import UpworkThumbnailCanvas from "@/components/portfolio/UpworkThumbnailCanvas";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AutoFlow · Portfolio thumbnail",
  robots: "noindex, nofollow",
};

function firstParam(v: string | string[] | undefined): string | null {
  if (v === undefined) return null;
  const s = Array.isArray(v) ? v[0] : v;
  const t = s?.trim();
  return t ? t : null;
}

export default function PortfolioUpworkPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const runId = firstParam(searchParams.run);

  return (
    <div className="min-h-0 bg-black">
      <UpworkThumbnailCanvas runId={runId} />
    </div>
  );
}
