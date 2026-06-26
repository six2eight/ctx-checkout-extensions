import { json } from "@remix-run/node";
import prisma from "../db.server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-reviews-secret",
};

export async function loader({ request }) {
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const shop = url.searchParams.get("shop");
  if (!shop) {
    return json({ error: "Missing shop parameter" }, { status: 400, headers: CORS_HEADERS });
  }

  const cache = await prisma.reviewCache.findUnique({ where: { shop } });
  return json(cache?.reviews ?? [], { headers: CORS_HEADERS });
}

export async function action({ request }) {
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const secret = request.headers.get("x-reviews-secret");
  if (!secret || secret !== process.env.REVIEWS_SYNC_SECRET) {
    return json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
  }

  const shop = url.searchParams.get("shop");
  if (!shop) {
    return json({ error: "Missing shop parameter" }, { status: 400, headers: CORS_HEADERS });
  }

  let reviews;
  try {
    reviews = await request.json();
    if (!Array.isArray(reviews)) throw new Error("Body must be an array");
  } catch {
    return json({ error: "Invalid JSON body — expected an array" }, { status: 400, headers: CORS_HEADERS });
  }

  await prisma.reviewCache.upsert({
    where: { shop },
    update: { reviews },
    create: { shop, reviews },
  });

  return json({ ok: true }, { headers: CORS_HEADERS });
}
