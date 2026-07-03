import { DEFAULT_SITE_URL } from "../../src/utils/SeoHelper";

export async function loader() {
  const robotsText = `User-agent: *
Allow: /

Sitemap: ${DEFAULT_SITE_URL}/sitemap.xml`;

  return new Response(robotsText, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=86400"
    }
  });
}
