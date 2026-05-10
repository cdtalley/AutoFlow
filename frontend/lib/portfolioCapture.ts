/** Readable one-liner instead of a wall of JSON in orchestrator steps. */
export function formatAgentStepOutputForPortfolio(step: { action: string; output: string }): string {
  const o = step.output?.trim() ?? "";
  if (o.length < 180) return o;

  let cat = o.match(/category['"]\s*:\s*['"]([^'"]+)['"]/i);
  let conf = o.match(/confidence['"]\s*:\s*([0-9.]+)/i);
  if (!cat) cat = o.match(/'category'\s*:\s*'([^']+)'/);
  if (!conf) conf = o.match(/'confidence'\s*:\s*([\d.]+)/);
  const act = step.action.toLowerCase();
  if (cat && (act.includes("classif") || o.includes("category"))) {
    return `Intent: ${cat[1]}${conf ? ` (confidence ${conf[1]})` : ""}.`;
  }

  return o.length > 260 ? `${o.slice(0, 260)}…` : o;
}

export function formatFinalResponseForPortfolio(text: string, maxLen = 520): string {
  const t = text.trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen)}…`;
}
