/**
 * BITOMANCY index builder — zero cost, no API key, no AI calls.
 * ---------------------------------------------------------------
 * You write posts by hand (see templates/post-template.html). This script
 * scans every file in posts/*.html, reads its metadata, and rebuilds:
 *   - posts.json   (drives the homepage via script.js)
 *   - sitemap.xml  (for Google)
 *   - rss.xml      (for feed readers)
 *
 * Run it yourself anytime:   node scripts/build-index.js
 * Or let the GitHub Action run it automatically on every push that
 * touches posts/**.html (.github/workflows/update-index.yml).
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SITE_URL = "https://bitomancy.in";
const SITE_NAME = "BITOMANCY";

const POSTS_DIR = path.join(ROOT, "posts");
const POSTS_JSON = path.join(ROOT, "posts.json");
const SITEMAP_XML = path.join(ROOT, "sitemap.xml");
const RSS_XML = path.join(ROOT, "rss.xml");

const STATIC_PAGES = ["/", "/tools.html", "/shop.html", "/about.html", "/contact.html"];
const DEFAULT_IMAGE = "/assets/og.svg";

function escapeHTML(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function rfc822(dateISO) {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(dateISO) ? dateISO + "T09:00:00Z" : dateISO;
  return new Date(d).toUTCString();
}

/* ---- tiny, dependency-free HTML metadata readers ---- */

function metaByAttr(html, attr, key) {
  const re1 = new RegExp(`<meta[^>]*${attr}=["']${key}["'][^>]*content=["']([^"']*)["'][^>]*>`, "i");
  const m1 = html.match(re1);
  if (m1) return m1[1];
  const re2 = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*${attr}=["']${key}["'][^>]*>`, "i");
  const m2 = html.match(re2);
  return m2 ? m2[1] : null;
}
const metaName = (html, name) => metaByAttr(html, "name", name);
const metaProp = (html, prop) => metaByAttr(html, "property", prop);

function getTitle(html) {
  const m = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (!m) return null;
  return m[1].replace(/\s*[|—-]\s*BITOMANCY\s*$/i, "").trim();
}

function getFirstImage(html) {
  const mainIdx = html.search(/<main[\s>]/i);
  const slice = mainIdx === -1 ? html : html.slice(mainIdx);
  const tagMatch = slice.match(/<img\s+[^>]*>/i);
  if (!tagMatch) return {};
  const tag = tagMatch[0];
  const src = (tag.match(/src=["']([^"']*)["']/i) || [])[1];
  const alt = (tag.match(/alt=["']([^"']*)["']/i) || [])[1];
  return { src, alt };
}

function getFirstEyebrow(html) {
  const mainIdx = html.search(/<main[\s>]/i);
  const slice = mainIdx === -1 ? html : html.slice(mainIdx);
  const m = slice.match(/<div class=["']eyebrow["']>([^<]*)<\/div>/i);
  return m ? m[1].trim() : null;
}

function getJSONLDDate(html) {
  const m = html.match(/"datePublished"\s*:\s*"([^"]+)"/);
  return m ? m[1] : null;
}

function estimateReadTime(html) {
  const articleMatch = html.match(/<article[\s\S]*?<\/article>/i);
  const text = (articleMatch ? articleMatch[0] : html).replace(/<[^>]+>/g, " ");
  const words = (text.match(/\S+/g) || []).length;
  return Math.max(3, Math.round(words / 200));
}

function toRelativeImage(src) {
  if (!src) return null;
  if (src.startsWith(SITE_URL)) return src.slice(SITE_URL.length);
  return src;
}

/* ---- read one post file into a posts.json entry ---- */

function readPost(filePath, fileName) {
  const html = fs.readFileSync(filePath, "utf8");

  if ((metaName(html, "bitomancy:draft") || "").toLowerCase() === "true") {
    return null; // skip drafts — commit them anytime, they just won't be listed
  }

  const title = metaName(html, "bitomancy:title") || getTitle(html);
  const description = metaName(html, "bitomancy:description") || metaName(html, "description");

  if (!title || !description) {
    console.warn(`Skipping posts/${fileName}: missing <title> or meta description.`);
    return null;
  }

  const img = getFirstImage(html);
  const image =
    metaName(html, "bitomancy:image") ||
    toRelativeImage(metaProp(html, "og:image")) ||
    toRelativeImage(img.src) ||
    DEFAULT_IMAGE;
  const imageAlt = metaName(html, "bitomancy:imagealt") || img.alt || title;

  const category = metaName(html, "bitomancy:category") || getFirstEyebrow(html) || "TECH";

  let date = metaName(html, "bitomancy:date") || getJSONLDDate(html);
  if (!date) {
    date = fs.statSync(filePath).mtime.toISOString().slice(0, 10);
  }

  const readTimeRaw = metaName(html, "bitomancy:readtime");
  const readTime = readTimeRaw || `${estimateReadTime(html)} min read`;

  return {
    title,
    description,
    url: `/posts/${fileName}`,
    image,
    imageAlt,
    category,
    date,
    readTime,
  };
}

/* ---- rebuild sitemap.xml and rss.xml ---- */

function rebuildSitemap(posts) {
  const urls = [
    ...STATIC_PAGES.map((p) => `<url><loc>${SITE_URL}${p}</loc></url>`),
    ...posts.map((p) => `<url><loc>${SITE_URL}${p.url}</loc></url>`),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join(
    ""
  )}</urlset>`;
  fs.writeFileSync(SITEMAP_XML, xml);
}

function rebuildRSS(posts) {
  const items = posts
    .slice(0, 20)
    .map(
      (p) =>
        `<item><title>${escapeHTML(p.title)}</title><link>${SITE_URL}${p.url}</link><description>${escapeHTML(
          p.description
        )}</description><pubDate>${rfc822(p.date)}</pubDate><guid>${SITE_URL}${p.url}</guid></item>`
    )
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${SITE_NAME}</title><link>${SITE_URL}/</link><description>AI, Tech &amp; Digital Growth</description>${items}</channel></rss>`;
  fs.writeFileSync(RSS_XML, xml);
}

/* ---- main ---- */

function main() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.log("No posts/ directory found — nothing to build.");
    return;
  }

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".html"));
  const posts = [];

  for (const fileName of files) {
    const entry = readPost(path.join(POSTS_DIR, fileName), fileName);
    if (entry) posts.push(entry);
  }

  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  fs.writeFileSync(POSTS_JSON, JSON.stringify(posts, null, 2) + "\n");
  rebuildSitemap(posts);
  rebuildRSS(posts);

  console.log(`Indexed ${posts.length} post(s) from posts/*.html.`);
  posts.forEach((p) => console.log(` - ${p.date}  ${p.title}`));
}

main();
