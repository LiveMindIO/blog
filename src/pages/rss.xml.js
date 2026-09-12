import rss from "@astrojs/rss";

export async function GET(context) {
  const posts = Object.values(import.meta.glob("../content/posts/*.md", { eager: true }))
    .filter((post) => !post.frontmatter.draft)
    .sort((a, b) => Date.parse(b.frontmatter.published) - Date.parse(a.frontmatter.published));

  return rss({
    title: "LiveMindIO Field Notes",
    description: "Field notes on experimental media, audience interaction, and the systems behind them.",
    site: context.site,
    items: posts.map((post) => ({
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      pubDate: new Date(post.frontmatter.published),
      link: post.url,
    })),
  });
}
