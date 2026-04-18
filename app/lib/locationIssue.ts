import type { Translations } from "../i18n/translations";

/** Machine-readable location / geolocation issue (set from `page.tsx`). */
export type LocationIssueCode =
  | ""
  | "device_unsupported"
  | "insecure_context"
  | "permission_denied"
  | "position_unavailable"
  | "timeout"
  | "generic";

export function locationIssueMessage(t: Translations, code: LocationIssueCode): string {
  const m = t.common.locationIssues;
  switch (code) {
    case "device_unsupported":
      return m.deviceUnsupported;
    case "insecure_context":
      return m.insecureContext;
    case "permission_denied":
      return m.permissionDenied;
    case "position_unavailable":
      return m.positionUnavailable;
    case "timeout":
      return m.timeout;
    case "generic":
      return m.generic;
    default:
      return "";
  }
}
