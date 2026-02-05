import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (!parsed.hostname.includes("screenshotone.com")) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  const response = await fetch(parsed.toString(), { cache: "no-store" });
  const contentType = response.headers.get("content-type") || "application/octet-stream";
  const buffer = await response.arrayBuffer();

  return new NextResponse(buffer, {
    status: response.status,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    },
  });
}
