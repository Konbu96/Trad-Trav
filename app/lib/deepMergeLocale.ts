/** Deep-merge plain JSON-like objects (for locale patch overlays). */
export function deepMergeLocale<T>(base: T, patch: unknown): T {
  if (patch == null || typeof patch !== "object" || Array.isArray(patch)) {
    return base;
  }
  const out = structuredClone(base) as Record<string, unknown>;
  const p = patch as Record<string, unknown>;
  for (const key of Object.keys(p)) {
    const pv = p[key];
    const ov = out[key];
    if (pv === undefined) continue;
    if (typeof pv === "string" || typeof pv === "number" || typeof pv === "boolean") {
      out[key] = pv;
    } else if (pv !== null && typeof pv === "object" && !Array.isArray(pv) && ov !== null && typeof ov === "object" && !Array.isArray(ov)) {
      out[key] = deepMergeLocale(ov, pv);
    }
  }
  return out as T;
}
