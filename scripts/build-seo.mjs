// Zero-dependency SEO build: node scripts/build-seo.mjs
// Scans /posts/*.html, then rewrites sitemap.xml, robots.txt (Sitemap line) and the
// <!--POSTS:all--> numbered list in index.html. Existing posts.json is used only to enrich metadata.
import fs from 'node:fs'; import path from 'node:path'; import { execSync } from 'node:child_process';
const SITE = 'https://bitomancy.in', R = process.cwd(), P = path.join(R, 'posts');
const read = f => fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const m1 = (h, re) => (h.match(re) || [])[1]?.trim();
const gitDate = f => { try { return execSync(`git log -1 --format=%cs -- "${f}"`, { cwd: R, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; } };
const iso = f => gitDate(f) || fs.statSync(path.join(R, f)).mtime.toISOString().slice(0, 10);
let known = []; try { known = JSON.parse(read(path.join(R, 'posts.json')) || '[]'); } catch {}
const byUrl = Object.fromEntries(known.map(p => [p.url, p]));
const posts = fs.existsSync(P) ? fs.readdirSync(P).filter(f => f.endsWith('.html')).map(f => {
  const url = `/posts/${f}`, h = read(path.join(P, f)), k = byUrl[url] || {};
  const title = (m1(h, /<title>([^<]+)<\/title>/) || k.title || f).replace(/\s*[|—–-]\s*BITOMANCY\s*$/i, '');
  const date = m1(h, /article:published_time"\s+content="(\d{4}-\d{2}-\d{2})/) || m1(h, /"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})/) || k.date || iso(`posts/${f}`);
  const mod = m1(h, /"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})/) || iso(`posts/${f}`);
  return { url, title, date, mod, cat: (k.category || m1(h, /article:section"\s+content="([^"]+)/) || 'ARTICLE').toUpperCase() };
}) : [];
posts.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
const fmt = d => new Date(d + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
// 1. homepage serial list
const idx = path.join(R, 'index.html'); let home = read(idx);
const list = posts.map(p => `<li><a href="${p.url}"><span class="doc-cat">${esc(p.cat)}</span><span class="doc-title">${esc(p.title)}</span><small>${fmt(p.date)}</small></a></li>`).join('');
home = home.replace(/<!--POSTS:all-->[\s\S]*?<!--\/POSTS:all-->/, `<!--POSTS:all-->${list}<!--/POSTS:all-->`); fs.writeFileSync(idx, home);
// 2. sitemap
const pages = [['', 1.0], ['blog.html', .9], ['bitomancy-scalper.html', .9], ['tools.html', .9], ['products.html', .7], ['shop.html', .7], ['about.html', .5], ['contact.html', .4], ['privacy.html', .2], ['terms.html', .2], ['disclaimer.html', .2], ['affiliate-disclosure.html', .2]]
  .filter(([f]) => !f || fs.existsSync(path.join(R, f)));
const today = new Date().toISOString().slice(0, 10);
const u = (loc, lm, cf, pr) => `<url><loc>${SITE}/${loc}</loc><lastmod>${lm}</lastmod><changefreq>${cf}</changefreq><priority>${pr.toFixed(1)}</priority></url>`;
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  pages.map(([f, pr]) => u(f, f ? iso(f) : (posts[0]?.date || today), f === '' || f === 'blog.html' ? 'daily' : 'monthly', pr)).join('\n') + '\n' +
  posts.map(p => u(p.url.slice(1), p.mod, 'monthly', .8)).join('\n') + '\n</urlset>\n';
fs.writeFileSync(path.join(R, 'sitemap.xml'), xml);
// 3. robots.txt
let rb = read(path.join(R, 'robots.txt')) || 'User-agent: *\nAllow: /\n';
if (!/^Sitemap:/mi.test(rb)) rb = rb.trimEnd() + `\n\nSitemap: ${SITE}/sitemap.xml\n`;
fs.writeFileSync(path.join(R, 'robots.txt'), rb);
console.log(`Done: ${posts.length} posts, ${pages.length} pages in sitemap.`);
