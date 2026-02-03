import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "edge";

export async function GET() {
  const supabase = getSupabaseServerClient();

  const { data: events } = await supabase
    .from("rum_events")
    .select("url, vitals, ts")
    .order("ts", { ascending: false })
    .limit(200);

  const totalEvents = events?.length ?? 0;
  const uniquePages = new Set(events?.map((event) => event.url).filter(Boolean)).size;
  const domContentLoadedAvg =
    events && events.length
      ? events.reduce((acc, event) => acc + ((event.vitals as any)?.domContentLoaded ?? 0), 0) / events.length
      : 0;
  const loadAvg =
    events && events.length
      ? events.reduce((acc, event) => acc + ((event.vitals as any)?.load ?? 0), 0) / events.length
      : 0;

  return NextResponse.json({
    totals: {
      pageviews: totalEvents,
      uniquePages,
      domContentLoadedAvg,
      loadAvg,
    },
    events: (events ?? []).slice(0, 8),
  });
}
