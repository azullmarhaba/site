"use client";

import { useEffect, useRef } from "react";
import { track, type AnalyticsEvent, type AnalyticsProps } from "@/lib/analytics";

/** Fires a single analytics event when the server-rendered page mounts. */
export function TrackEvent({
  name,
  props,
}: {
  name: AnalyticsEvent;
  props?: AnalyticsProps;
}) {
  const fired = useRef(false);
  const key = JSON.stringify(props ?? {});

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    track(name, props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, key]);

  return null;
}
