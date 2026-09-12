const $=s=>document.querySelector(s);
const html=document.documentElement;
const saved=localStorage.getItem("bitomancy-theme");
if(saved) html.dataset.theme=saved;
$("#themeBtn").addEventListener("click",()=>{html.dataset.theme=html.dataset.theme==="dark"?"light":"dark";localStorage.setItem("bitomancy-theme",html.dataset.theme)});
$("#menuBtn").addEventListener("click",()=>$("#mobileNav").classList.toggle("open"));
$("#mobileNav").style.display="none";
$("#menuBtn").addEventListener("click",()=>$("#mobileNav").style.display=$("#mobileNav").style.display==="block"?"none":"block");
$("#searchBtn").addEventListener("click",()=>{$("#searchOverlay").classList.add("open");$("#searchInput").focus()});
$("#closeSearch").addEventListener("click",()=>$("#searchOverlay").classList.remove("open"));
document.addEventListener("keydown",e=>{if(e.key==="Escape")$("#searchOverlay").classList.remove("open")});
const posts=[
["AI","How AI Agents Are Changing Everyday Work","/posts/ai-agents.html"],
["TECH","What Makes a Modern Website Fast?","/posts/technology-trends.html"],
["SEO","Internal Linking: A Simple Strategy That Scales","/posts/seo-system.html"],
["HOW-TO","Build a Smarter AI-Powered Workflow","/posts/ai-workflow.html"]
];
$("#searchInput").addEventListener("input",e=>{const q=e.target.value.toLowerCase().trim();$("#searchResults").innerHTML=q?posts.filter(p=>p[0].toLowerCase().includes(q)||p[1].toLowerCase().includes(q)).map(p=>`<div class="result"><b>${p[0]}</b><br><a href="${p[2]}">${p[1]}</a></div>`).join("")||"<p>No matching articles found.</p>":""});
$("#newsletterForm").addEventListener("submit",e=>{e.preventDefault();$("#formMsg").textContent="Thanks! Connect your newsletter provider to receive real subscriptions.";});
