const fs = require("fs");
const path = require("path");

// Configuration
const baseURL = "https://newswriter.ai";
const contentDir = "./content/news";
const outputDir = "./static/sitemaps";

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Function to get all markdown files recursively
function getAllMarkdownFiles(dir) {
  let files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files = files.concat(getAllMarkdownFiles(fullPath));
    } else if (item.endsWith(".md") && item !== "_index.md") {
      files.push(fullPath);
    }
  }

  return files;
}

// Function to extract front matter from markdown file
function extractFrontMatter(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const frontMatterMatch = content.match(/^\+\+\+\n([\s\S]*?)\n\+\+\+/);

  if (!frontMatterMatch) {
    return null;
  }

  const frontMatter = {};
  const lines = frontMatterMatch[1].split("\n");

  for (const line of lines) {
    const match = line.match(/^(\w+)\s*=\s*"([^"]*)"$/);
    if (match) {
      frontMatter[match[1]] = match[2];
    }
  }

  return frontMatter;
}

// Function to generate URL from file path and front matter
function generateURL(filePath, frontMatter) {
  // Use the url field from front matter if available
  if (frontMatter.url) {
    return `${baseURL}${frontMatter.url}`;
  }

  // Fallback to date-based generation if no url field
  if (!frontMatter.date) {
    return null;
  }

  const date = new Date(frontMatter.date);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  // Extract slug from file path
  const fileName = path.basename(filePath, ".md");
  const slug = fileName;

  return `${baseURL}/news/${year}${month}/${slug}`;
}

// Main function
function generateSitemaps() {
  console.log("Generating sitemaps...");

  // Get all markdown files
  const files = getAllMarkdownFiles(contentDir);
  console.log(`Found ${files.length} news articles`);

  // Group files by year-month
  const filesByMonth = {};

  for (const file of files) {
    const frontMatter = extractFrontMatter(file);
    if (!frontMatter || !frontMatter.date) {
      console.log(`Skipping ${file} - no date found`);
      continue;
    }

    // Extract yearMonth from URL field or fallback to date
    let yearMonth;
    if (frontMatter.url) {
      // Extract YYYYMM from URL like "/news/202506/article-title"
      const urlMatch = frontMatter.url.match(/\/news\/(\d{6})\//);
      if (urlMatch) {
        yearMonth = urlMatch[1];
      }
    }

    // Fallback to date-based grouping if no URL or URL doesn't match pattern
    if (!yearMonth) {
      const date = new Date(frontMatter.date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      yearMonth = `${year}${month}`;
    }

    if (!filesByMonth[yearMonth]) {
      filesByMonth[yearMonth] = [];
    }

    const url = generateURL(file, frontMatter);
    if (url) {
      filesByMonth[yearMonth].push({
        url: url,
        lastmod: frontMatter.date,
        file: file,
      });
    }
  }

  // Generate individual sitemap files
  for (const [yearMonth, articles] of Object.entries(filesByMonth)) {
    const sitemapContent = generateSitemapXML(articles);
    const sitemapPath = path.join(outputDir, `${yearMonth}.xml`);
    fs.writeFileSync(sitemapPath, sitemapContent);
    console.log(
      `Generated sitemap for ${yearMonth} with ${articles.length} articles`
    );
  }

  // Generate static pages sitemap
  const staticPages = [
    { url: `${baseURL}/news/`, lastmod: new Date().toISOString() },
    { url: `${baseURL}/contact/`, lastmod: new Date().toISOString() },
  ];

  const staticSitemapContent = generateSitemapXML(staticPages);
  const staticSitemapPath = path.join(outputDir, "pages.xml");
  fs.writeFileSync(staticSitemapPath, staticSitemapContent);
  console.log(
    `Generated static pages sitemap with ${staticPages.length} pages`
  );

  console.log("Sitemap generation complete!");
}

// Function to generate sitemap XML
function generateSitemapXML(urls) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const item of urls) {
    xml += "  <url>\n";
    xml += `    <loc>${item.url}</loc>\n`;

    // Format lastmod date
    const date = new Date(item.lastmod);
    const formattedDate = date.toISOString().split("T")[0];
    xml += `    <lastmod>${formattedDate}</lastmod>\n`;

    xml += "    <changefreq>weekly</changefreq>\n";
    xml += "    <priority>0.8</priority>\n";
    xml += "  </url>\n";
  }

  xml += "</urlset>\n";
  return xml;
}

// Run the script
if (require.main === module) {
  generateSitemaps();
}

module.exports = { generateSitemaps };
