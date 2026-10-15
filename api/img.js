// Vercel serverless image proxy for MangaDex pages & covers
// Bypasses ISP blocks (common in India/Asia) and CORS/Referer restrictions

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).send("GET only");
    return;
  }

  const { url } = req.query;
  if (!url || typeof url !== "string") {
    res.status(400).send("Missing url query param");
    return;
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    res.status(400).send("Invalid url");
    return;
  }

  // Only allow MangaDex image servers
  const isAllowed =
    parsed.hostname === "uploads.mangadex.org" ||
    parsed.hostname.endsWith(".mangadex.network") ||
    parsed.hostname.endsWith(".mangadex.org");

  if (!isAllowed) {
    res.status(403).send("Host not allowed");
    return;
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        "User-Agent": "AmoreComix/1.0 (+https://blush-comics.vercel.app)",
        Referer: "https://mangadex.org",
      },
    });

    if (!upstream.ok) {
      res.status(upstream.status).send(`Upstream returned ${upstream.status}`);
      return;
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400");

    const arrayBuffer = await upstream.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    res.status(502).send(String(err?.message || err));
  }
}
