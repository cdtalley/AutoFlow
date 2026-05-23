import type { Metadata } from "next";
import MLOpsThumbnailCanvas from "@/components/portfolio/MLOpsThumbnailCanvas";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AutoFlow · MLOps thumbnail",
  robots: "noindex, nofollow",
};

function firstParam(v: string | string[] | undefined): string | null {
  if (v === undefined) return null;
  const s = Array.isArray(v) ? v[0] : v;
  const t = s?.trim();
  return t ? t : null;
}

export default function PortfolioMLOpsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const runId = firstParam(searchParams.run);
  return <MLOpsThumbnailCanvas runId={runId} />;
}
