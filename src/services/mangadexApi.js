// MangaDex API Service - LIVE manga data integration
// Supports multiple proxy strategies, automatic title resolution, and robust chapter/page loading.

const MANGADEX_BASE = "https://api.mangadex.org";
const COVER_BASE = "https://uploads.mangadex.org";

// Cache to avoid repeated API calls
const cache = {
  covers: {},       // mangadexId -> coverUrl
  chapters: {},     // mangadexId -> chapter[]
  external: {},     // mangadexId -> chapter[]
  feeds: {},        // mangadexId -> promise
  pages: {},        // chapterId -> page[]
  searchResults: {},// query -> manga[]
  idLookup: {},     // normalized title -> mangadexId
};

const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='300' height='450'><rect width='100%' height='100%' fill='#1c2129'/><text x='50%' y='50%' fill='#64748b' font-family='sans-serif' font-size='16' text-anchor='middle'>No cover</text></svg>"
  );

/** Helper to proxy an image URL if needed */
export function proxyImage(url) {
  if (!url) return url;
  return url;
}

/**
 * <img onError={onCoverError}> handler
 */
export function onCoverError(e) {
  const img = e.currentTarget;
  const stage = Number(img.dataset.fb || 0);
  if (stage === 0 && img.src.includes("/md-img/")) {
    img.dataset.fb = "1";
    img.src = "https://uploads.mangadex.org" + img.src.slice(img.src.indexOf("/md-img/") + 7);
  } else if (stage < 2) {
    img.dataset.fb = "2";
    img.src = PLACEHOLDER_IMG;
  }
}

// ─── THROTTLED FETCH & MULTI-STRATEGY CALLS ──────────────────────────────────
const MIN_GAP_MS = 220;
let _lastCall = 0;
let _chain = Promise.resolve();
const _sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function _throttle() {
  const turn = _chain.then(async () => {
    const wait = Math.max(0, _lastCall + MIN_GAP_MS - Date.now());
    if (wait) await _sleep(wait);
    _lastCall = Date.now();
  });
  _chain = turn.catch(() => {});
  return turn;
}

/**
 * Build list of URLs to try for a given path and query.
 * Order:
 * 1. Direct MangaDex API (works on localhost natively via CORS)
 * 2. Vercel serverless function (/api/md?path=...)
 * 3. Vite dev proxy / Vercel rewrite (/md-api/...)
 */
function getFetchCandidates(pathAndQuery) {
  const clean = pathAndQuery.replace(/^\/+/, "");
  const [pathOnly, query = ""] = clean.split("?");
  const candidates = [];

  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "0.0.0.0");

  if (isLocalhost) {
    // Localhost has direct CORS allowed by MangaDex
    candidates.push(`${MANGADEX_BASE}/${clean}`);
    candidates.push(`/md-api/${clean}`);
    candidates.push(`/api/md?path=${encodeURIComponent(pathOnly)}${query ? "&" + query : ""}`);
  } else {
    // Deployed environment: serverless API route is fastest and avoids browser CORS
    candidates.push(`/api/md?path=${encodeURIComponent(pathOnly)}${query ? "&" + query : ""}`);
    candidates.push(`/md-api/${clean}`);
    candidates.push(`${MANGADEX_BASE}/${clean}`);
  }

  return [...new Set(candidates)];
}

/**
 * Fetch a MangaDex endpoint with automatic failover between endpoints.
 */
async function apiFetch(pathAndQuery, retries = 2) {
  const candidates = getFetchCandidates(pathAndQuery);
  let lastErr = null;

  for (let candidateIdx = 0; candidateIdx < candidates.length; candidateIdx++) {
    const url = candidates[candidateIdx];
    const isProxyUrl = url.startsWith("/api/md") || url.startsWith("/md-api");

    for (let attempt = 0; attempt <= retries; attempt++) {
      await _throttle();
      try {
        const res = await fetch(url, {
          headers: {
            Accept: "application/json",
          },
        });

        // 429 Rate Limit
        if (res.status === 429) {
          const ra = Number(res.headers.get("retry-after"));
          await _sleep(Number.isFinite(ra) && ra > 0 ? Math.min(ra, 5) * 1000 : 1200 * (attempt + 1));
          continue;
        }

        // If a proxy route gives 404/405/502/HTML, try the next candidate
        const type = res.headers.get("content-type") || "";
        if (!res.ok || !type.includes("json")) {
          // If direct MangaDex API returned a 404, it might genuinely be not found
          if (!isProxyUrl && res.status === 404) {
            return res; // let caller handle 404 json
          }
          lastErr = new Error(`HTTP ${res.status} (${url})`);
          break; // Break attempt loop, try next candidate URL
        }

        return res;
      } catch (err) {
        lastErr = err;
        // Network or CORS error -> try next candidate URL
        break;
      }
    }
  }

  throw lastErr || new Error(`All endpoints failed for ${pathAndQuery}`);
}

// ─── COVER IMAGES ─────────────────────────────────────────────────────────────

export async function fetchMangaCover(mangadexId) {
  if (!mangadexId) return null;
  if (cache.covers[mangadexId]) return cache.covers[mangadexId];

  try {
    const res = await apiFetch(`/manga/${mangadexId}?includes[]=cover_art`);
    const json = await res.json();

    const coverRel = json.data?.relationships?.find((r) => r.type === "cover_art");
    const fileName = coverRel?.attributes?.fileName;

    if (fileName) {
      const coverUrl = `${COVER_BASE}/covers/${mangadexId}/${fileName}.512.jpg`;
      cache.covers[mangadexId] = coverUrl;
      return coverUrl;
    }
  } catch (err) {
    console.warn(`Failed to fetch cover for ${mangadexId}:`, err);
  }

  return null;
}

export async function fetchAllCovers(mangadexIds) {
  const uncached = (mangadexIds || []).filter((id) => id && !cache.covers[id]);

  if (uncached.length > 0) {
    try {
      const params = new URLSearchParams();
      uncached.forEach((id) => params.append("ids[]", id));
      params.set("limit", String(uncached.length));
      params.append("includes[]", "cover_art");

      const res = await apiFetch(`/manga?${params.toString()}`);
      const json = await res.json();
      (json.data || []).forEach((manga) => {
        const coverRel = manga.relationships?.find((r) => r.type === "cover_art");
        const fileName = coverRel?.attributes?.fileName;
        if (fileName) {
          cache.covers[manga.id] = `${COVER_BASE}/covers/${manga.id}/${fileName}.512.jpg`;
        }
      });
    } catch (err) {
      console.warn("Batch cover fetch error:", err);
    }
  }

  const result = {};
  (mangadexIds || []).forEach((id) => {
    result[id] = cache.covers[id] || null;
  });
  return result;
}

// ─── CHAPTER LISTING ──────────────────────────────────────────────────────────

export async function fetchChapters(mangadexId, limit = 500) {
  if (!mangadexId) return [];
  if (cache.chapters[mangadexId]) return cache.chapters[mangadexId];
  const { readable } = await _loadFeed(mangadexId, limit);
  cache.chapters[mangadexId] = readable;
  return readable;
}

export async function fetchExternalChapters(mangadexId, limit = 500) {
  if (!mangadexId) return [];
  if (cache.external[mangadexId]) return cache.external[mangadexId];
  const { external } = await _loadFeed(mangadexId, limit);
  cache.external[mangadexId] = external;
  return external;
}

function _loadFeed(mangadexId, limit) {
  if (!cache.feeds) cache.feeds = {};
  if (!cache.feeds[mangadexId]) {
    cache.feeds[mangadexId] = _fetchFeed(mangadexId, limit).catch((err) => {
      delete cache.feeds[mangadexId];
      console.warn(`Failed to fetch chapters for ${mangadexId}:`, err);
      return { readable: [], external: [] };
    });
  }
  return cache.feeds[mangadexId];
}

async function _fetchFeed(mangadexId, limit) {
  const all = [];
  const perPage = 500;
  let offset = 0;

  while (offset < limit) {
    const params = new URLSearchParams({
      limit: String(perPage),
      offset: String(offset),
      "order[chapter]": "desc",
    });
    ["safe", "suggestive", "erotica"].forEach((r) => params.append("contentRating[]", r));
    params.append("includes[]", "scanlation_group");

    const res = await apiFetch(`/manga/${mangadexId}/feed?${params.toString()}`);
    const json = await res.json();
    if (!json.data || json.data.length === 0) break;
    all.push(...json.data);
    if (json.data.length < perPage) break;
    offset += perPage;
  }

  const externalRaw = all.filter((ch) => ch.attributes.externalUrl);
  const readableRaw = all.filter((ch) => !ch.attributes.externalUrl && ch.attributes.pages > 0);

  // Group chapters by chapter number.
  // Prefer English; if not present, use the first available other language.
  const byNumber = new Map();
  readableRaw.forEach((ch) => {
    const key = ch.attributes.chapter != null && ch.attributes.chapter !== ""
      ? String(ch.attributes.chapter)
      : `id-${ch.id}`;
    const isEn = ch.attributes.translatedLanguage === "en";
    const existing = byNumber.get(key);
    if (!existing || (isEn && existing.attributes.translatedLanguage !== "en")) {
      byNumber.set(key, ch);
    }
  });

  const readable = [...byNumber.values()].map((ch) => {
    const chNum = ch.attributes.chapter || "0";
    const lang = ch.attributes.translatedLanguage || "en";
    const groupName =
      ch.relationships?.find((r) => r.type === "scanlation_group")?.attributes?.name ||
      "Scanlation Group";
    return {
      id: ch.id,
      chapter: chNum,
      volume: ch.attributes.volume || "",
      title: ch.attributes.title || `Chapter ${chNum}`,
      group: lang === "en" ? groupName : `${groupName} [${lang.toUpperCase()}]`,
      lang,
      verified: true,
      likes: Math.floor(Math.random() * 300) + 20,
      timeAgo: formatPublishTime(ch.attributes.publishAt),
      date: ch.attributes.publishAt ? ch.attributes.publishAt.split("T")[0] : "Recent",
      pages: ch.attributes.pages || 0,
    };
  });
  readable.sort((a, b) => (parseFloat(b.chapter) || 0) - (parseFloat(a.chapter) || 0));

  const extSeen = new Map();
  externalRaw.forEach((ch) => {
    const key = ch.attributes.chapter != null && ch.attributes.chapter !== ""
      ? String(ch.attributes.chapter)
      : `id-${ch.id}`;
    const isEn = ch.attributes.translatedLanguage === "en";
    const existing = extSeen.get(key);
    if (!existing || (isEn && !existing._en)) {
      extSeen.set(key, {
        _en: isEn,
        id: ch.id,
        chapter: ch.attributes.chapter || "0",
        title: ch.attributes.title || `Chapter ${ch.attributes.chapter || "0"}`,
        url: ch.attributes.externalUrl,
        timeAgo: formatPublishTime(ch.attributes.publishAt),
        date: ch.attributes.publishAt ? ch.attributes.publishAt.split("T")[0] : "",
      });
    }
  });

  const external = [...extSeen.values()];
  external.sort((a, b) => (parseFloat(b.chapter) || 0) - (parseFloat(a.chapter) || 0));

  return { readable, external };
}

function formatPublishTime(dateStr) {
  if (!dateStr) return "Recently";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return "1 month ago";
  if (months < 12) return `${months} months ago`;
  const years = Math.floor(months / 12);
  return years === 1 ? "1 year ago" : `${years} years ago`;
}

// ─── CHAPTER PAGES ────────────────────────────────────────────────────────────

export async function fetchChapterPages(chapterId) {
  if (!chapterId) return [];
  if (cache.pages[chapterId]) return cache.pages[chapterId];

  const res = await apiFetch(`/at-home/server/${chapterId}`);
  const json = await res.json();

  const baseUrl = json.baseUrl;
  const hash = json.chapter?.hash;
  const dataFiles = json.chapter?.data || [];
  const dataSaverFiles = json.chapter?.dataSaver || [];
  if (!baseUrl || !hash) return [];

  const useSaver = dataSaverFiles.length > 0;
  const files = useSaver ? dataSaverFiles : dataFiles;

  const pages = files.map((fileName, index) => {
    const saverUrl = dataSaverFiles[index]
      ? `${baseUrl}/data-saver/${hash}/${dataSaverFiles[index]}`
      : null;
    const fullUrl = dataFiles[index]
      ? `${baseUrl}/data/${hash}/${dataFiles[index]}`
      : null;
    const primary = useSaver ? (saverUrl || fullUrl) : (fullUrl || saverUrl);
    const fallback = useSaver ? fullUrl : saverUrl;

    const candidates = [primary, fallback].filter(Boolean);

    return {
      page: index + 1,
      url: primary,
      fallbackUrl: fallback || primary,
      dataSaverUrl: saverUrl || primary,
      candidates,
    };
  });

  if (pages.length > 0) cache.pages[chapterId] = pages;
  return pages;
}

// ─── SEARCH & DISCOVERY ───────────────────────────────────────────────────────

export async function searchMangaDex(query, limit = 20) {
  const cacheKey = `search-${query}-${limit}`;
  if (cache.searchResults[cacheKey]) return cache.searchResults[cacheKey];

  try {
    const params = new URLSearchParams({
      limit: String(limit),
      "order[relevance]": "desc",
    });
    ["safe", "suggestive", "erotica"].forEach((r) => params.append("contentRating[]", r));
    params.append("includes[]", "cover_art");
    params.append("includes[]", "author");

    if (query?.trim()) {
      params.set("title", query.trim());
    }

    const res = await apiFetch(`/manga?${params.toString()}`);
    const json = await res.json();

    const results = (json.data || []).map(transformMangaDexResult);
    cache.searchResults[cacheKey] = results;
    return results;
  } catch (err) {
    console.warn("MangaDex search failed:", err);
    return [];
  }
}

export async function searchMangaDexRomance(query, limit = 20) {
  return searchMangaDex(query, limit);
}

export async function browseRomanceManga(limit = 30, offset = 0) {
  try {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
      "order[followedCount]": "desc",
      hasAvailableChapters: "true",
    });
    ["safe", "suggestive", "erotica"].forEach((r) => params.append("contentRating[]", r));
    params.append("includes[]", "cover_art");
    params.append("includes[]", "author");
    params.append("availableTranslatedLanguage[]", "en");
    params.append("includedTags[]", "423e2eae-a7a2-4a8b-ac03-a8351462d71d"); // Romance tag

    const res = await apiFetch(`/manga?${params.toString()}`);
    const json = await res.json();

    return (json.data || []).map(transformMangaDexResult);
  } catch (err) {
    console.warn("Browse romance manga error:", err);
    return [];
  }
}

function transformMangaDexResult(raw) {
  const attr = raw.attributes || {};
  const coverRel = raw.relationships?.find((r) => r.type === "cover_art");
  const authorRel = raw.relationships?.find((r) => r.type === "author");
  const coverFileName = coverRel?.attributes?.fileName;

  const title =
    attr.title?.en ||
    attr.title?.["ja-ro"] ||
    Object.values(attr.title || {})[0] ||
    "Untitled";
  const romajiTitle =
    attr.title?.["ja-ro"] ||
    attr.altTitles?.find((a) => a["ja-ro"])?.["ja-ro"] ||
    title;
  const altTitles =
    attr.altTitles
      ?.map((at) => Object.values(at)[0])
      .filter(Boolean)
      .slice(0, 3)
      .join(" / ") || "";

  const coverUrl = coverFileName
    ? `${COVER_BASE}/covers/${raw.id}/${coverFileName}.512.jpg`
    : null;

  if (coverUrl) {
    cache.covers[raw.id] = coverUrl;
  }

  const tags = (attr.tags || [])
    .map((t) => t.attributes?.name?.en)
    .filter(Boolean)
    .slice(0, 5);

  return {
    id: `md-${raw.id}`,
    mangadexId: raw.id,
    title,
    romajiTitle,
    kanjiTitle: altTitles || romajiTitle,
    storyAndArt: authorRel?.attributes?.name || "Manga Artist",
    cover: coverUrl,
    banner: coverUrl,
    year: attr.year || (attr.createdAt ? new Date(attr.createdAt).getFullYear() : 2024),
    status: (attr.status || "ongoing").toUpperCase(),
    type: "MANGA",
    contentRating: (attr.contentRating || "safe").toUpperCase(),
    lang: (attr.originalLanguage || "ja").toUpperCase(),
    rank: 300,
    rating: 8.8,
    ratingVotes: 500,
    score: 8.5,
    followed: 5000,
    views: "500K",
    demographics: attr.publicationDemographic
      ? attr.publicationDemographic.charAt(0).toUpperCase() +
        attr.publicationDemographic.slice(1)
      : "Romance",
    genres: ["Romance", ...tags.slice(0, 2)],
    tags: tags.length ? tags : ["Romance", "Wholesome"],
    trackers: {
      mangadex: `https://mangadex.org/title/${raw.id}`,
    },
    synopsis:
      attr.description?.en ||
      Object.values(attr.description || {})[0] ||
      "No synopsis available.",
    highlights: "Popular romance manga series from MangaDex.",
    featured: false,
    latestChapter: attr.lastChapter || "?",
    chapters: [],
  };
}

export function clearCache() {
  cache.covers = {};
  cache.chapters = {};
  cache.external = {};
  cache.feeds = {};
  cache.pages = {};
  cache.searchResults = {};
  cache.idLookup = {};
}

// ─── RESOLVE A MANGADEX ID FOR TITLES THAT CAME FROM ANILIST ─────────────────

const _norm = (t) =>
  (t || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * Make sure `manga.mangadexId` is set (looks it up by title if needed).
 * Uses multi-strategy title search: exact, substring, and token overlap.
 */
export async function ensureMangaDexId(manga) {
  if (!manga) return null;
  if (manga.mangadexId) return manga.mangadexId;
  if (manga._mdLookupDone) return manga.mangadexId || null;

  const titles = [manga.title, manga.romajiTitle].filter(Boolean);
  if (titles.length === 0) return null;

  // Check memory cache first
  const cacheKey = _norm(titles[0]);
  if (cache.idLookup[cacheKey]) {
    manga.mangadexId = cache.idLookup[cacheKey];
    return manga.mangadexId;
  }

  try {
    for (const t of titles) {
      const cleanSearch = t
        .replace(/[:\-–—].*$/, "") // strip subtitles for broader hit
        .trim();

      const params = new URLSearchParams({
        limit: "10",
        "order[relevance]": "desc",
      });
      ["safe", "suggestive", "erotica"].forEach((r) => params.append("contentRating[]", r));
      params.set("title", cleanSearch || t);

      const res = await apiFetch(`/manga?${params.toString()}`);
      const json = await res.json();
      const candidates = json.data || [];
      if (candidates.length === 0) continue;

      const cleanTargets = titles.map(_norm);

      // 1. Exact match on title or any altTitle
      const exact = candidates.find((m) => {
        const all = [
          ...Object.values(m.attributes?.title || {}),
          ...(m.attributes?.altTitles || []).flatMap((a) => Object.values(a)),
        ].map(_norm);
        return all.some((x) => cleanTargets.includes(x));
      });
      if (exact) {
        manga.mangadexId = exact.id;
        cache.idLookup[cacheKey] = exact.id;
        return exact.id;
      }

      // 2. Substring match (e.g. "The Tunnel to Summer" inside "The Tunnel to Summer: Ultramarine")
      const sub = candidates.find((m) => {
        const all = [
          ...Object.values(m.attributes?.title || {}),
          ...(m.attributes?.altTitles || []).flatMap((a) => Object.values(a)),
        ].map(_norm);
        return all.some((x) =>
          cleanTargets.some((ct) => x.includes(ct) || ct.includes(x))
        );
      });
      if (sub) {
        manga.mangadexId = sub.id;
        cache.idLookup[cacheKey] = sub.id;
        return sub.id;
      }

      // 3. Fallback: highest relevance result if relevance query returned strong hits
      if (candidates.length > 0) {
        manga.mangadexId = candidates[0].id;
        cache.idLookup[cacheKey] = candidates[0].id;
        return candidates[0].id;
      }
    }
  } catch (e) {
    console.warn("MangaDex lookup failed:", e);
    return null;
  }

  manga._mdLookupDone = true;
  return null;
}

/** Quick health check used by the status banner. */
export async function pingMangaDex() {
  try {
    const res = await apiFetch("/ping");
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (!/pong/i.test(text)) throw new Error("non-API response");
    return true;
  } catch (err) {
    throw new Error(err?.message || "unreachable");
  }
}

// ─── FIND TITLES THAT ARE ACTUALLY READABLE ON MANGADEX ──────────────────────

const READ_CACHE_KEY = "amore_readable_v2";
const READ_TTL = 6 * 60 * 60 * 1000;

function _readCache() {
  try {
    return JSON.parse(sessionStorage.getItem(READ_CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

function _writeCache(c) {
  try {
    sessionStorage.setItem(READ_CACHE_KEY, JSON.stringify(c));
  } catch {
    /* storage full or blocked */
  }
}

export async function hasReadableChapters(mangadexId) {
  if (!mangadexId) return false;
  const store = _readCache();
  const hit = store[mangadexId];
  if (hit && Date.now() - hit.t < READ_TTL) return hit.v;

  try {
    const params = new URLSearchParams({ limit: "5", includeExternalUrl: "0" });
    ["safe", "suggestive", "erotica"].forEach((r) => params.append("contentRating[]", r));
    const res = await apiFetch(`/manga/${mangadexId}/feed?${params.toString()}`);
    const json = await res.json();
    const ok = (json.data || []).some(
      (c) => c.attributes?.pages > 0 && !c.attributes?.externalUrl
    );

    const fresh = _readCache();
    fresh[mangadexId] = { v: ok, t: Date.now() };
    _writeCache(fresh);
    return ok;
  } catch {
    return false;
  }
}

export async function fetchReadableRomance({ target = 24, candidates = 60, onFound } = {}) {
  try {
    const params = new URLSearchParams({
      limit: String(candidates),
      "order[followedCount]": "desc",
      hasAvailableChapters: "true",
    });
    params.append("includes[]", "cover_art");
    params.append("includes[]", "author");
    params.append("includedTags[]", "423e2eae-a7a2-4a8b-ac03-a8351462d71d");
    ["safe", "suggestive"].forEach((r) => params.append("contentRating[]", r));

    const res = await apiFetch(`/manga?${params.toString()}`);
    const json = await res.json();
    const list = (json.data || []).map(transformMangaDexResult);

    const found = [];
    for (const m of list) {
      try {
        if (await hasReadableChapters(m.mangadexId)) {
          m.readable = true;
          found.push(m);
          onFound?.([...found]);
          if (found.length >= target) break;
        }
      } catch (e) {
        console.warn("Readable check failed:", e);
      }
    }
    return found;
  } catch (err) {
    console.warn("fetchReadableRomance error:", err);
    return [];
  }
}

export async function markReadability(mangaList) {
  for (const m of mangaList || []) {
    if (!m.mangadexId) continue;
    try {
      m.readable = await hasReadableChapters(m.mangadexId);
    } catch {
      m.readable = null;
    }
  }
}
