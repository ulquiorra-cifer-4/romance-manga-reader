// AniList GraphQL service: catalog, covers, metadata and official reading links.
// AniList allows direct browser calls (CORS enabled) so none of this depends on the
// Vercel proxy, which keeps the catalog and thumbnails working even if MangaDex is down.

const ENDPOINT = "https://graphql.anilist.co";

const MEDIA_FIELDS = `
  id
  title { romaji english native }
  coverImage { extraLarge large }
  bannerImage
  description(asHtml: false)
  startDate { year }
  status
  averageScore
  popularity
  favourites
  genres
  tags { name rank isMediaSpoiler }
  chapters
  countryOfOrigin
  staff(perPage: 2, sort: RELEVANCE) { edges { role node { name { full } } } }
  externalLinks { site url type language }
`;

const cache = new Map();

async function gql(query, variables = {}, retries = 2) {
  const key = JSON.stringify([query, variables]);
  if (cache.has(key)) return cache.get(key);

  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query, variables }),
      });
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
        lastErr = new Error("AniList rate limit");
        continue;
      }
      const json = await res.json();
      if (!res.ok || json.errors) throw new Error(json.errors?.[0]?.message || `HTTP ${res.status}`);
      cache.set(key, json.data);
      return json.data;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  throw lastErr;
}

const stripHtml = (s) =>
  (s || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const STATUS = {
  RELEASING: "ONGOING",
  FINISHED: "COMPLETED",
  NOT_YET_RELEASED: "UPCOMING",
  CANCELLED: "CANCELLED",
  HIATUS: "HIATUS",
};
const LANG = { JP: "JA", KR: "KO", CN: "ZH", TW: "ZH" };

// Official sites where the series can be read legally
const READ_SITES = /manga ?plus|viz|webtoon|tapas|comikey|comixology|kodansha|shonen jump|azuki|bookwalker|mangamo|j-novel|inkr|lezhin|tappytoon|pocket comics|kindle|amazon|ebookjapan|piccoma|comic walker|mangabox/i;

function officialLinks(m) {
  return (m.externalLinks || [])
    .filter((l) => l.type === "STREAMING" || (l.type === "INFO" && READ_SITES.test(l.site)))
    .filter((l) => (l.language ? /english/i.test(l.language) : true))
    .map((l) => ({ site: l.site, url: l.url }));
}

/** Turn an AniList media object into the app's manga shape. */
export function transformAniList(m) {
  const title = m.title?.english || m.title?.romaji || m.title?.native || "Untitled";
  const author =
    m.staff?.edges?.find((e) => /story|art/i.test(e.role || ""))?.node?.name?.full ||
    m.staff?.edges?.[0]?.node?.name?.full ||
    "Unknown";
  const cover = m.coverImage?.extraLarge || m.coverImage?.large || null;
  const score = m.averageScore ? m.averageScore / 10 : 8;
  const tags = (m.tags || []).filter((t) => !t.isMediaSpoiler).slice(0, 8).map((t) => t.name);

  return {
    id: `al-${m.id}`,
    anilistId: m.id,
    mangadexId: null, // resolved lazily when chapters are needed
    title,
    romajiTitle: m.title?.romaji || title,
    kanjiTitle: [m.title?.native, m.title?.romaji].filter(Boolean).join(" / "),
    storyAndArt: author,
    cover,
    banner: m.bannerImage || cover,
    year: m.startDate?.year || "—",
    status: STATUS[m.status] || "ONGOING",
    type: "MANGA",
    contentRating: "SAFE",
    lang: LANG[m.countryOfOrigin] || "JA",
    rank: 300,
    rating: score.toFixed(1),
    ratingVotes: m.popularity || 0,
    score: score.toFixed(2),
    followed: m.favourites || m.popularity || 0,
    views: `${Math.round((m.popularity || 0) / 100) / 10}K`,
    demographics: "Romance",
    genres: m.genres?.length ? m.genres : ["Romance"],
    tags: tags.length ? tags : ["Romance"],
    trackers: { anilist: `https://anilist.co/manga/${m.id}` },
    synopsis: stripHtml(m.description) || "No synopsis available.",
    highlights: "Discover this romance series.",
    featured: false,
    latestChapter: m.chapters || "?",
    chapters: [],
    officialLinks: officialLinks(m),
  };
}

/** Browse popular romance manga (optionally filtered by a search string). */
export async function searchAniList(search = "", limit = 20, page = 1) {
  const q = `query ($search: String, $page: Int, $perPage: Int, $sort: [MediaSort]) {
    Page(page: $page, perPage: $perPage) {
      media(type: MANGA, genre_in: ["Romance"], isAdult: false, search: $search, sort: $sort) { ${MEDIA_FIELDS} }
    }
  }`;
  const s = search.trim();
  const data = await gql(q, {
    search: s || undefined,
    page,
    perPage: limit,
    sort: s ? ["SEARCH_MATCH"] : ["POPULARITY_DESC"],
  });
  return (data.Page?.media || []).map(transformAniList);
}

/**
 * Fetch AniList data for several titles in ONE request (aliased queries).
 * Returns an array aligned with `titles` (null where nothing matched).
 */
export async function lookupAniListByTitles(titles) {
  const body = titles
    .map((t, i) => `q${i}: Media(type: MANGA, search: ${JSON.stringify(t)}, sort: SEARCH_MATCH) { ${MEDIA_FIELDS} }`)
    .join("\n");
  const data = await gql(`query { ${body} }`);
  return titles.map((_, i) => (data[`q${i}`] ? transformAniList(data[`q${i}`]) : null));
}
