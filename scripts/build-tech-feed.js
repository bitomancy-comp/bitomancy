const fs = require("fs");
const https = require("https");

const feeds = [
  {
    name: "TechCrunch",
    url: "https://techcrunch.com/feed/"
  },
  {
    name: "The Verge",
    url: "https://www.theverge.com/rss/index.xml"
  },
  {
    name: "Ars Technica",
    url: "https://feeds.arstechnica.com/arstechnica/index"
  },
  {
    name: "MIT Technology Review",
    url: "https://www.technologyreview.com/feed/"
  },
  {
    name: "WIRED",
    url: "https://www.wired.com/feed/rss"
  }
];

function download(url){

  return new Promise((resolve,reject)=>{

    https.get(
      url,
      {
        headers:{
          "User-Agent":"BITOMANCY-Tech-Feed/1.0"
        }
      },
      response=>{

        let data="";

        response.on("data",chunk=>{
          data+=chunk;
        });

        response.on("end",()=>{

          if(response.statusCode >= 400){
            reject(
              new Error(
                `${response.statusCode}: ${url}`
              )
            );
            return;
          }

          resolve(data);
        });

      }
    ).on("error",reject);

  });

}

function cleanText(text){

  return String(text || "")
    .replace(/<!\[CDATA\[/g,"")
    .replace(/\]\]>/g,"")
    .replace(/<[^>]*>/g," ")
    .replace(/&amp;/g,"&")
    .replace(/&quot;/g,'"')
    .replace(/&#39;/g,"'")
    .replace(/&lt;/g,"<")
    .replace(/&gt;/g,">")
    .replace(/\s+/g," ")
    .trim();

}

function getTag(block,tag){

  const match=block.match(
    new RegExp(
      `<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,
      "i"
    )
  );

  return match ? cleanText(match[1]) : "";

}

function getLink(block){

  let match=block.match(
    /<link[^>]*href=["']([^"']+)["'][^>]*>/i
  );

  if(match) return match[1];

  match=block.match(
    /<link[^>]*>([\s\S]*?)<\/link>/i
  );

  return match ? cleanText(match[1]) : "";

}

function getImage(block){

  let match=block.match(
    /<media:content[^>]+url=["']([^"']+)["']/i
  );

  if(match) return match[1];

  match=block.match(
    /<media:thumbnail[^>]+url=["']([^"']+)["']/i
  );

  if(match) return match[1];

  match=block.match(
    /<enclosure[^>]+url=["']([^"']+)["']/i
  );

  if(match) return match[1];

  match=block.match(
    /<img[^>]+src=["']([^"']+)["']/i
  );

  return match ? match[1] : "";

}

function parseFeed(xml,source){

  const entries=[];

  const blocks=[
    ...(xml.match(/<item[\s\S]*?<\/item>/gi)||[]),
    ...(xml.match(/<entry[\s\S]*?<\/entry>/gi)||[])
  ];

  for(const block of blocks){

    const title=getTag(block,"title");

    const link=getLink(block);

    const description=
      getTag(block,"description") ||
      getTag(block,"summary") ||
      getTag(block,"content");

    const date=
      getTag(block,"pubDate") ||
      getTag(block,"published") ||
      getTag(block,"updated");

    if(!title || !link) continue;

    entries.push({

      title,

      link,

      description:description.slice(0,180),

      image:getImage(block),

      source,

      date:formatDate(date)

    });

  }

  return entries;

}

function formatDate(value){

  if(!value) return "";

  const date=new Date(value);

  if(Number.isNaN(date.getTime())) return "";

  return date.toISOString();

}

async function main(){

  let all=[];

  for(const feed of feeds){

    try{

      console.log("Fetching:",feed.name);

      const xml=await download(feed.url);

      const items=parseFeed(xml,feed.name);

      all.push(...items);

      console.log(
        `${feed.name}: ${items.length} articles`
      );

    }catch(error){

      console.log(
        `Skipping ${feed.name}: ${error.message}`
      );

    }

  }

  const unique=[];

  const seen=new Set();

  for(const item of all){

    if(seen.has(item.link)) continue;

    seen.add(item.link);

    unique.push(item);

  }

  unique.sort(
    (a,b)=>
      new Date(b.date || 0) -
      new Date(a.date || 0)
  );

  const finalFeed=unique.slice(0,30);

  fs.writeFileSync(
    "tech-feed.json",
    JSON.stringify(finalFeed,null,2)
  );

  console.log(
    `Created tech-feed.json with ${finalFeed.length} articles`
  );

}

main();
