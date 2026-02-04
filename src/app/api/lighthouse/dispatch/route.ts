import { NextResponse } from "next/server";

export const runtime = "nodejs";

function normalizeSite(input: string) {
  const trimmed = (input || "").trim().toLowerCase();
  if (!trimmed) return null;

  const withProtocol = trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    const host = parsed.hostname.toLowerCase();
    if (!host || !host.includes(".")) return null;
    return {
      site: host,
      url: `${parsed.protocol}//${host}`,
    };
  } catch {
    return null;
  }
}

type DispatchBody = {
  site?: string;
  strategy?: "both" | "mobile" | "desktop";
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as DispatchBody;
  const normalized = normalizeSite(body.site || "");

  if (!normalized) {
    return NextResponse.json({ error: "Invalid site" }, { status: 400 });
  }

  const strategy = body.strategy === "desktop" || body.strategy === "mobile" ? body.strategy : "both";

  const token = process.env.GITHUB_ACTIONS_TOKEN || "";
  const owner = process.env.GITHUB_REPO_OWNER || "";
  const repo = process.env.GITHUB_REPO_NAME || "";
  const workflowFile = process.env.GITHUB_WORKFLOW_FILE || "lighthouse-runner.yml";
  const ref = process.env.GITHUB_WORKFLOW_REF || "main";

  if (!token || !owner || !repo) {
    return NextResponse.json({ error: "Missing GitHub dispatch env vars" }, { status: 500 });
  }

  const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ref,
      inputs: {
        site: normalized.url,
        strategy,
      },
    }),
  });

  if (!ghRes.ok) {
    const text = await ghRes.text();
    return NextResponse.json({ error: `GitHub dispatch failed: ${ghRes.status} ${text}` }, { status: 502 });
  }

  return NextResponse.json({
    status: "queued",
    site: normalized.site,
    strategy,
  });
}

