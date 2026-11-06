export type AnalyticsEvent =
  | "page_view"
  | "experience_view"
  | "destination_selected"
  | "trip_planner_started"
  | "trip_planner_completed"
  | "booking_started"
  | "booking_completed"
  | "custom_tour_started"
  | "custom_tour_completed"
  | "cta_clicked";

export type AnalyticsProps = Record<string, string | number | boolean>;

/**
 * Lightweight client-side event bus. No-ops until NEXT_PUBLIC_ANALYTICS_ID is
 * set, forwards to window.dataLayer (GA4-compatible) and keeps a local buffer
 * for debugging. Never sends personal data — callers must pass slugs/ids only.
 */
export function track(event: AnalyticsEvent, props: AnalyticsProps = {}) {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_ANALYTICS_ID) return;

  const payload = { event, ...props, ts: Date.now() };
  const w = window as unknown as {
    dataLayer?: unknown[];
    __azulAnalytics?: unknown[];
  };

  (w.__azulAnalytics ??= []).push(payload);
  if (Array.isArray(w.dataLayer)) w.dataLayer.push(payload);
}
