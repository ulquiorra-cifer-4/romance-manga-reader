// Vercel serverless proxy for the MangaDex API (fallback for the plain /md-api rewrite).
// Usage: /api/md?path=manga/<id>/feed&limit=500&...   ->  https://api.mangadex.org/manga/<id>/feed?limit=500&...
// Why it exists: MangaDex rate-limits per IP (~5 req/s) and Vercel IPs are shared, so we
// send a descriptive User-Agent, drop the browser Referer, and cache responses at the edge.

const UPSTREAM = "https://api.mangadex.org";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "GET only" });
    return;
  }

  const incoming = new URL(req.url, "http://localhost");
  const path = (incoming.searchParams.get("path") || "").replace(/^\/+/, "");

  // Only allow the read-only endpoints this app actually uses
  const allowed = /^(manga(\/[0-9a-f-]{36}(\/feed)?)?|at-home\/server\/[0-9a-f-]{36}|ping)$/i;
  if (!allowed.test(path)) {
    res.status(400).json({ error: "Path not allowed" });
    return;
  }

  incoming.searchParams.delete("path");
  const qs = incoming.searchParams.toString();
  const target = `${UPSTREAM}/${path}${qs ? "?" + qs : ""}`;

  try {
    const upstream = await fetch(target, {
      headers: {
        "User-Agent": "AmoreComix/1.0 (+https://blush-comics.vercel.app)",
        Accept: "application/json",
      },
    });
    const body = await upstream.text();

    res.status(upstream.status);
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");
    // at-home responses hand out short-lived image-server URLs: never cache them
    if (upstream.ok && !path.startsWith("at-home")) {
      res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
    } else {
      res.setHeader("Cache-Control", "no-store");
    }
    res.send(body);
  } catch (err) {
    res.status(502).json({ error: "Upstream request failed", detail: String(err?.message || err) });
  }
}
