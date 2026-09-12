export async function GET(context) {
  const posts = Object.values(import.meta.glob("../content/posts/*.md", { eager: true }))
    .filter((post) => !post.frontmatter.draft)
    .map((post) => new URL(post.url, context.site).href);
  const urls = [new URL("/", context.site).href, ...posts]
    .map((url) => `  <url><loc>${url}</loc></url>`)
    .join("\n");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { "Content-Type": "application/xml" } },
  );
}
