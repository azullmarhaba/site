"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track, type AnalyticsEvent, type AnalyticsProps } from "@/lib/analytics";

export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    track("page_view", { path: pathname });
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = (event.target as Element | null)?.closest<HTMLElement>(
        "[data-event]"
      );
      if (!target) return;
      const name = target.dataset.event as AnalyticsEvent | undefined;
      if (!name) return;
      const props: AnalyticsProps = {};
      if (target.dataset.trackId) props.id = target.dataset.trackId;
      const href = target.getAttribute("href");
      if (href) props.href = href;
      track(name, props);
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
