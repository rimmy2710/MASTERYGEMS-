import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_BASE = process.env.BACKEND_INTERNAL_URL ?? "http://127.0.0.1:3001";

function getPathSegments(req: NextRequest): string[] {
  const pathname = req.nextUrl.pathname;
  const prefix = "/api/backend/";
  if (!pathname.startsWith(prefix)) return [];
  const rest = pathname.slice(prefix.length);
  return rest ? rest.split("/").filter(Boolean) : [];
}

function errInfo(e: any) {
  return {
    name: e?.name,
    message: e?.message ?? "",
    code: e?.code,
    errno: e?.errno,
    syscall: e?.syscall,
    address: e?.address,
    port: e?.port,
    stack: e?.stack,
  };
}

async function handler(req: NextRequest) {
  const path = getPathSegments(req);

  if (path.length === 1 && path[0] === "__ping") {
    return NextResponse.json({
      ok: true,
      where: "frontend/app/api/backend/[...path]/route.ts",
      backendBase: BACKEND_BASE,
    });
  }

  if (path.length === 1 && path[0] === "__probe") {
    try {
      const r = await fetch(`${BACKEND_BASE}/health`, {
        method: "GET",
        headers: { accept: "application/json" },
        cache: "no-store",
        redirect: "manual",
      });
      const text = await r.text();
      return NextResponse.json({ ok: r.ok, status: r.status, backendHealthBody: text });
    } catch (e: any) {
      return NextResponse.json({ error: "probe_failed", backendBase: BACKEND_BASE, err: errInfo(e) }, { status: 500 });
    }
  }

  const target = `${BACKEND_BASE}/${path.join("/")}${req.nextUrl.search}`;

  try {
    // Forward most headers except ones that commonly break proxying
    const headers = new Headers(req.headers);
    headers.set("accept", "application/json");
    headers.delete("host");
    headers.delete("content-length");

    const init: RequestInit = {
      method: req.method,
      headers,
      cache: "no-store",
      redirect: "manual",
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      const buf = Buffer.from(await req.arrayBuffer());
      init.body = buf.length ? buf : undefined;
    }

    const r = await fetch(target, init);
    const outHeaders = new Headers();

    // Preserve content-type if present
    const ct = r.headers.get("content-type") ?? "application/json";
    outHeaders.set("content-type", ct);

    const body = Buffer.from(await r.arrayBuffer());
    return new NextResponse(body, { status: r.status, headers: outHeaders });
  } catch (e: any) {
    return NextResponse.json({ error: "proxy_failed", target, err: errInfo(e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) { return handler(req); }
export async function POST(req: NextRequest) { return handler(req); }
export async function PUT(req: NextRequest) { return handler(req); }
export async function PATCH(req: NextRequest) { return handler(req); }
export async function DELETE(req: NextRequest) { return handler(req); }
