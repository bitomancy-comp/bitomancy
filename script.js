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

// ---- Posts: loaded once from posts.json, used for homepage, blog page + search ----
let allPosts=[];

fetch("/posts.json?v="+Date.now(), {cache:"no-store"})
  .then(r=>{ if(!r.ok) throw new Error("posts.json "+r.status); return r.json(); })
  .then(posts=>{ allPosts = Array.isArray(posts) ? posts : []; })
  .catch(err=>console.error("posts.json:",err));

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
