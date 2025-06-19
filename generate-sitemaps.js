#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Read all markdown files from content/posts
const postsDir = "./content/posts";
const publicDir = "./public";
const sitemapsDir = path.join(publicDir, "sitemaps");

// Ensure sitemaps directory exists
if (!fs.existsSync(sitemapsDir)) {
  fs.mkdirSync(sitemapsDir, { recursive: true });
}

// Get all post files
const postFiles = fs
  .readdirSync(postsDir)
  .filter((file) => file.endsWith(".md"));

// Group posts by year/month
const postsByMonth = {};

postFiles.forEach((file) => {
  // Extract date from filename (format: YYYY-MM-DD-title.md)
  const dateMatch = file.match(/^(\d{4})-(\d{2})-(\d{2})-/);
  if (dateMatch) {
    const [, year, month] = dateMatch;
    const yearMonth = `${year}/${month}`;

    if (!postsByMonth[yearMonth]) {
      postsByMonth[yearMonth] = [];
    }

    // Create URL from filename
    const slug = file.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/\.md$/, "");
    const url = `https://newswriter.ai/news/posts/${slug}/`;

    // Get file stats for lastmod
    const filePath = path.join(postsDir, file);
    const stats = fs.statSync(filePath);
    const lastmod = stats.mtime.toISOString();

    postsByMonth[yearMonth].push({
      url,
      lastmod,
    });
  }
});

// Generate individual monthly sitemaps
Object.entries(postsByMonth).forEach(([yearMonth, posts]) => {
  const sitemapContent = `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${posts
  .map(
    (post) => `  <url>
    <loc>${post.url}</loc>
    <lastmod>${post.lastmod}</lastmod>
  </url>`
  )
  .join("\n")}
</urlset>`;

  const filename = path.join(sitemapsDir, `${yearMonth.replace("/", "")}.xml`);
  const dir = path.dirname(filename);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filename, sitemapContent);
  console.log(`Generated sitemap: ${filename}`);
});

// Generate sitemap index
const sitemapIndexContent = `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Object.keys(postsByMonth)
  .map((yearMonth) => {
    const posts = postsByMonth[yearMonth];
    const latestPost = posts.reduce((latest, post) =>
      new Date(post.lastmod) > new Date(latest.lastmod) ? post : latest
    );
    return `  <sitemap>
    <loc>https://newswriter.ai/news/sitemaps/${yearMonth.replace(
      "/",
      ""
    )}.xml</loc>
    <lastmod>${latestPost.lastmod}</lastmod>
  </sitemap>`;
  })
  .join("\n")}
  <sitemap>
    <loc>https://newswriter.ai/news/sitemaps/pages.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
</sitemapindex>`;

fs.writeFileSync(path.join(publicDir, "sitemap.xml"), sitemapIndexContent);
console.log("Generated sitemap index: ./public/sitemap.xml");

// Generate static pages sitemap
const pagesSitemapContent = `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://newswriter.ai/news/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>
  <url>
    <loc>https://newswriter.ai/news/posts/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>
</urlset>`;

fs.writeFileSync(path.join(sitemapsDir, "pages.xml"), pagesSitemapContent);
console.log("Generated pages sitemap: ./public/sitemaps/pages.xml");

console.log(`\nSitemap generation complete!`);
console.log(`Generated ${Object.keys(postsByMonth).length} monthly sitemaps`);
console.log(`Total posts: ${Object.values(postsByMonth).flat().length}`);
