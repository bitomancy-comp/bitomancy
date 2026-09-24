const $=s=>document.querySelector(s);
const html=document.documentElement;
const saved=localStorage.getItem("bitomancy-theme");
if(saved) html.dataset.theme=saved;

// ---- Theme toggle (present on most pages) ----
const themeBtn=$("#themeBtn");
if(themeBtn) themeBtn.addEventListener("click",()=>{
  html.dataset.theme = html.dataset.theme==="dark" ? "light" : "dark";
  localStorage.setItem("bitomancy-theme",html.dataset.theme);
});

// ---- Mobile menu (homepage only) ----
const mobileNav=$("#mobileNav");
const menuBtn=$("#menuBtn");
if(mobileNav) mobileNav.style.display="none";
if(menuBtn && mobileNav) menuBtn.addEventListener("click",()=>{
  mobileNav.style.display = mobileNav.style.display==="block" ? "none" : "block";
});

// ---- Search overlay (homepage / blog only) ----
const searchBtn=$("#searchBtn");
const searchOverlay=$("#searchOverlay");
const searchInput=$("#searchInput");
const closeSearch=$("#closeSearch");
const searchResults=$("#searchResults");

if(searchBtn && searchOverlay && searchInput){
  searchBtn.addEventListener("click",()=>{
    searchOverlay.classList.add("open");
    searchInput.focus();
  });
}
if(closeSearch && searchOverlay) closeSearch.addEventListener("click",()=>searchOverlay.classList.remove("open"));
if(searchOverlay){
  document.addEventListener("keydown",e=>{ if(e.key==="Escape") searchOverlay.classList.remove("open"); });
}

// ---- Newsletter form (homepage only) ----
const newsletterForm=$("#newsletterForm");
if(newsletterForm){
  newsletterForm.addEventListener("submit",e=>{
    e.preventDefault();
    const formMsg=$("#formMsg");
    if(formMsg) formMsg.textContent="Thanks! Connect your newsletter provider to receive real subscriptions.";
  });
}

// ---- Posts: loaded once from posts.json, used for homepage, blog page + search ----
let allPosts=[];

function formatDate(iso){
  if(!iso) return "";
  const d=new Date(iso+"T00:00:00");
  if(isNaN(d)) return iso;
  return d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
}

function heroCardHtml(p){
  return `
<div class="hero-media">
<a href="${p.url}"><img src="${p.image||""}" alt="${p.imageAlt||p.title}" loading="eager" onerror="this.closest('.hero-media').classList.add('image-fallback');this.remove()"></a>
<span class="image-label">${(p.category||"").toUpperCase()}</span>
</div>
<div class="hero-copy">
<span class="eyebrow">${(p.category||"").toUpperCase()} · ${formatDate(p.date)}</span>
<h1><a href="${p.url}">${p.title}</a></h1>
<p>${p.description||""}</p>
<a class="button" href="${p.url}">Read article</a>
</div>`;
}

function miniCardHtml(p){
  return `
<a class="mini-card" href="${p.url}">
<div class="mini-img"><img src="${p.image||""}" alt="${p.imageAlt||p.title}" loading="lazy" onerror="this.remove()"></div>
<span>${(p.category||"").toUpperCase()}</span>
<h3>${p.title}</h3>
<a>${formatDate(p.date)}${p.readTime?" · "+p.readTime:""}</a>
</a>`;
}

function articleCardHtml(p){
  return `
<article class="article-card">
<a class="card-image-link" href="${p.url}">
<div class="card-img"><img src="${p.image||""}" alt="${p.imageAlt||p.title}" loading="lazy" onerror="this.closest('.card-img').classList.add('image-fallback');this.remove()"></div>
</a>
<div class="card-body">
<span>${(p.category||"").toUpperCase()}</span>
<h3><a href="${p.url}">${p.title}</a></h3>
<p>${p.description||""}</p>
<small>${formatDate(p.date)}${p.readTime?" · "+p.readTime:""}</small>
</div>
</article>`;
}

function renderHomepage(posts){
  const heroMain=$("#heroMain");
  const heroSide=$("#heroSide");
  const latestPosts=$("#latestPosts");
  if(!heroMain||!latestPosts) return;

  if(!posts.length){
    heroMain.innerHTML=`<div class="loading-box">No posts yet — check back soon.</div>`;
    if(heroSide) heroSide.innerHTML="";
    latestPosts.innerHTML="";
    return;
  }

  const [hero,...rest]=posts;

  heroMain.classList.add("hero-main");
  heroMain.innerHTML=heroCardHtml(hero);

  if(heroSide){
    heroSide.innerHTML=rest.slice(0,3).map(miniCardHtml).join("");
  }

  const gridItems=rest.slice(0,6);
  latestPosts.innerHTML=gridItems.length
    ? gridItems.map(articleCardHtml).join("")
    : `<div class="loading-box">More posts coming soon.</div>`;
}

function renderBlogGrid(posts){
  const grid=$("#blogGrid");
  if(!grid) return;
  grid.innerHTML = posts.length
    ? posts.map(articleCardHtml).join("")
    : `<div class="loading-box">No posts published yet — check back soon.</div>`;
}

fetch("/posts.json")
  .then(r=>{ if(!r.ok) throw new Error("posts.json "+r.status); return r.json(); })
  .then(posts=>{
    allPosts = Array.isArray(posts) ? [...posts].sort((a,b)=>new Date(b.date)-new Date(a.date)) : [];
    renderHomepage(allPosts);
    renderBlogGrid(allPosts);
  })
  .catch(err=>{
    console.error("Failed to load posts.json:",err);
    const heroMain=$("#heroMain");
    if(heroMain) heroMain.innerHTML=`<div class="loading-box">Couldn't load posts right now.</div>`;
    const latestPosts=$("#latestPosts");
    if(latestPosts) latestPosts.innerHTML="";
    const grid=$("#blogGrid");
    if(grid) grid.innerHTML=`<div class="loading-box">Couldn't load posts right now.</div>`;
  });

// ---- Search (driven by live post data, not a hardcoded list) ----
if(searchInput && searchResults){
  searchInput.addEventListener("input",e=>{
    const q=e.target.value.toLowerCase().trim();
    searchResults.innerHTML = q
      ? (allPosts.filter(p=>(p.category||"").toLowerCase().includes(q)||(p.title||"").toLowerCase().includes(q))
          .map(p=>`<div class="result"><b>${(p.category||"").toUpperCase()}</b><br><a href="${p.url}">${p.title}</a></div>`)
          .join("") || "<p>No matching articles found.</p>")
      : "";
  });
}
