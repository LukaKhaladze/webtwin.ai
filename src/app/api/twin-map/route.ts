import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "edge";

type RawEvent = {
  site: string | null;
  url: string | null;
  vitals: { domContentLoaded?: number; load?: number } | null;
  ts: string | null;
};

type NodeAgg = {
  key: string;
  hits: number;
  loadTotal: number;
  dclTotal: number;
};

function pageKeyFromUrl(input: string | null) {
  if (!input) return "/";
  try {
    const parsed = new URL(input);
    return parsed.pathname || "/";
  } catch {
    return input.startsWith("/") ? input : "/";
  }
}

export async function GET(request: Request) {
  const supabase = getSupabaseServerClient();
  const reqUrl = new URL(request.url);
  const site = (reqUrl.searchParams.get("site") || "").trim().toLowerCase();

  let query = supabase
    .from("rum_events")
    .select("site,url,vitals,ts")
    .order("ts", { ascending: true })
    .limit(500);

  if (site) {
    query = query.eq("site", site);
  }

  const { data } = await query;
  const events = ((data as RawEvent[] | null) ?? []).filter((e) => e.url);

  const nodeMap = new Map<string, NodeAgg>();
  const edgeMap = new Map<string, number>();

  for (let i = 0; i < events.length; i += 1) {
    const event = events[i];
    const key = pageKeyFromUrl(event.url);
    const load = Number(event.vitals?.load ?? 0);
    const dcl = Number(event.vitals?.domContentLoaded ?? 0);

    const existing = nodeMap.get(key) || { key, hits: 0, loadTotal: 0, dclTotal: 0 };
    existing.hits += 1;
    existing.loadTotal += Number.isFinite(load) && load >= 0 ? load : 0;
    existing.dclTotal += Number.isFinite(dcl) && dcl >= 0 ? dcl : 0;
    nodeMap.set(key, existing);

    if (i > 0) {
      const prev = events[i - 1];
      const from = pageKeyFromUrl(prev.url);
      const to = key;
      if (from !== to) {
        const edgeKey = `${from}|||${to}`;
        edgeMap.set(edgeKey, (edgeMap.get(edgeKey) || 0) + 1);
      }
    }
  }

  const nodes = Array.from(nodeMap.values())
    .map((n) => {
      const avgLoadMs = n.hits ? n.loadTotal / n.hits : 0;
      const avgDclMs = n.hits ? n.dclTotal / n.hits : 0;
      const status = avgLoadMs > 4000 ? "critical" : avgLoadMs > 2500 ? "warning" : "healthy";
      return {
        key: n.key,
        hits: n.hits,
        avgLoadMs: Math.round(avgLoadMs),
        avgDclMs: Math.round(avgDclMs),
        status,
      };
    })
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 20);

  const nodeKeys = new Set(nodes.map((n) => n.key));
  const edges = Array.from(edgeMap.entries())
    .map(([edgeKey, count]) => {
      const [from, to] = edgeKey.split("|||");
      return { from, to, count };
    })
    .filter((e) => nodeKeys.has(e.from) && nodeKeys.has(e.to))
    .sort((a, b) => b.count - a.count)
    .slice(0, 25);

  return NextResponse.json({
    nodes,
    edges,
    totals: {
      events: events.length,
      pages: nodes.length,
    },
  });
}

