function mapNewsItem(article) {
  if (!article) return null;

  return {
    id: article.url || generateId(),

    title: safeString(article.title, "Untitled"),

    excerpt: safeString(article.description, ""),

    source: safeString(article.source?.name, "Unknown"),

    url: safeString(article.url, "#"),

    time: formatTime(article.publishedAt),

    category: detectCategory(article),

    tags: extractTags(article),

    featured: false,
  };
}

/* ================= HELPERS ================= */

function safeString(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

/* ================= CATEGORY ================= */

function detectCategory(article) {
  const text = `${article.title || ""} ${article.description || ""}`.toLowerCase();

  if (text.includes("injury")) return "injuries";
  if (text.includes("transfer") || text.includes("sign")) return "transfers";
  if (text.includes("interview") || text.includes("says")) return "interviews";
  if (text.includes("press") || text.includes("conference")) return "press";
  if (text.includes("rumor") || text.includes("linked")) return "rumors";

  return "breaking";
}

/* ================= TAG EXTRACTION ================= */

function extractTags(article) {
  const text = `${article.title || ""} ${article.description || ""}`.toLowerCase();

  const keywords = [
    // Core nations
    "springbok",
    "springboks",
    "all blacks",
    "england",
    "france",
    "ireland",
    "scotland",
    "wales",
    "australia",
    "argentina",

    // ✅ NEW ADDITIONS
    "italy",
    "azzurri",

    "fiji",
    "fijian",
    "flying fijians",
  ];

  return keywords
    .filter((k) => text.includes(k))
    .map((k) => normalizeTag(k))
    .filter((v, i, arr) => arr.indexOf(v) === i); // remove duplicates
}

/* ================= NORMALIZATION ================= */

function normalizeTag(tag) {
  if (tag.includes("springbok")) return "South Africa";
  if (tag.includes("all blacks")) return "New Zealand";
  if (tag === "england") return "England";
  if (tag === "france") return "France";
  if (tag === "ireland") return "Ireland";
  if (tag === "scotland") return "Scotland";
  if (tag === "wales") return "Wales";
  if (tag === "australia") return "Australia";
  if (tag === "argentina") return "Argentina";

  // ✅ NEW
  if (tag.includes("italy") || tag.includes("azzurri")) return "Italy";
  if (tag.includes("fiji")) return "Fiji";

  return tag;
}

/* ================= TIME ================= */

function formatTime(dateString) {
  if (!dateString) return "";

  const diff = Date.now() - new Date(dateString).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

module.exports = { mapNewsItem };