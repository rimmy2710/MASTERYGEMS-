import { NextRequest, NextResponse } from "next/server";
import http from "node:http";
import https from "node:https";
import dns from "node:dns";

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
    port: e?.port
  };
}

function nodeRequest(
  urlStr: string,
  method: string,
  headers: Record<string, string>,
  body?: Buffer
): Promise<{ status: number; headers: Record<string, string | string[] | undefined>; body: Buffer }> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const lib = url.protocol === "https:" ? https : http;

    const req = lib.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers,
        lookup: (hostname, _opts, cb) => dns.lookup(hostname, { family: 4 }, cb as any)
      } as any,
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
        res.on("end", () => resolve({ status: res.statusCode ?? 500, headers: res.headers as any, body: Buffer.concat(chunks) }));
      }
    );

    req.on("error", reject);
    if (body && body.length > 0) req.write(body);
    req.end();
  });
}

async function handler(req: NextRequest) {
  const path = getPathSegments(req);

  if (path.length === 1 && path[0] === "__ping") {
    return NextResponse.json({ ok: true, where: "frontend/app/api/backend/[...path]/route.ts", backendBase: BACKEND_BASE });
  }

  if (path.length === 1 && path[0] === "__probe") {
    try {
      const r = await nodeRequest(`${BACKEND_BASE}/health`, "GET", { accept: "application/json" });
      return NextResponse.json({ ok: r.status >= 200 && r.status < 300, status: r.status, backendHealthBody: r.body.toString("utf-8") });
    } catch (e: any) {
      return NextResponse.json({ error: "probe_failed", backendBase: BACKEND_BASE, err: errInfo(e) }, { status: 500 });
    }
  }

  const target = `${BACKEND_BASE}/${path.join("/")}${req.nextUrl.search}`;

  try {
    const body =
      req.method === "GET" || req.method === "HEAD"
        ? undefined
        : Buffer.from(await req.arrayBuffer());

    const r = await nodeRequest(target, req.method, { accept: "application/json" }, body);

    const headers = new Headers();
    headers.set("content-type", (r.headers["content-type"] as string) ?? "application/json");
    return new NextResponse(r.body, { status: r.status, headers });
  } catch (e: any) {
    return NextResponse.json({ error: "proxy_failed", target, err: errInfo(e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) { return handler(req); }
export async function POST(req: NextRequest) { return handler(req); }
export async function PUT(req: NextRequest) { return handler(req); }
export async function PATCH(req: NextRequest) { return handler(req); }
export async function DELETE(req: NextRequest) { return handler(req); }
