import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "edge";

export async function GET(request: Request) {
  const supabase = getSupabaseServerClient();
  const url = new URL(request.url);
  const site = (url.searchParams.get("site") || "").trim();

  let query = supabase
    .from("rum_events")
    .select("site, url, vitals, ts")
    .order("ts", { ascending: false })
    .limit(200);

  if (site) {
    query = query.eq("site", site);
  }

  const { data: events } = await query;

  const MAX_REASONABLE_MS = 120000;
  const normalizedEvents = (events ?? []).map((event) => {
    const vitals = (event.vitals as { domContentLoaded?: number; load?: number } | null) ?? null;
    const dcl = Number(vitals?.domContentLoaded ?? 0);
    const load = Number(vitals?.load ?? 0);

    return {
      ...event,
      vitals: {
        domContentLoaded: Number.isFinite(dcl) && dcl >= 0 && dcl <= MAX_REASONABLE_MS ? dcl : 0,
        load: Number.isFinite(load) && load >= 0 && load <= MAX_REASONABLE_MS ? load : 0,
      },
    };
  });

  const totalEvents = normalizedEvents.length;
  const uniquePages = new Set(normalizedEvents.map((event) => event.url).filter(Boolean)).size;
  const domContentLoadedAvg =
    normalizedEvents.length
      ? normalizedEvents.reduce((acc, event) => acc + (event.vitals?.domContentLoaded ?? 0), 0) /
        normalizedEvents.length
      : 0;
  const loadAvg =
    normalizedEvents.length
      ? normalizedEvents.reduce((acc, event) => acc + (event.vitals?.load ?? 0), 0) /
        normalizedEvents.length
      : 0;

  return NextResponse.json({
    totals: {
      pageviews: totalEvents,
      uniquePages,
      domContentLoadedAvg,
      loadAvg,
    },
    events: normalizedEvents.slice(0, 8),
  });
}
