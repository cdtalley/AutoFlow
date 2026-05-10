import HomeDashboard from "./home-dashboard";

/** Per-request `searchParams` (Playwright `?capture=thumb`, deep links). */
export const dynamic = "force-dynamic";

function firstParam(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export default function Page({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const run = firstParam(searchParams.run);
  const tab = firstParam(searchParams.tab);
  const portfolioThumb = firstParam(searchParams.capture) === "thumb";

  return <HomeDashboard portfolioThumb={portfolioThumb} initialRunId={run} initialTab={tab} />;
}
