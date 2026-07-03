import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.jsx"),
  route("admin", "routes/admin.jsx", { id: "admin" }),
  route("projects", "routes/projects._index.jsx", { id: "projects" }),
  route("projects/:slug", "routes/projects.$slug.jsx", { id: "project-detail" }),
  route("blog", "routes/blog._index.jsx", { id: "blog" }),
  route("blog/:slug", "routes/blog.$slug.jsx", { id: "blog-post" }),
  route("api/contact", "routes/api.contact.jsx", { id: "api-contact" }),
  route("api/geo", "routes/api.geo.jsx", { id: "api-geo" }),
  route("api/auth-log", "routes/api.authLog.jsx", { id: "api-auth-log" }),
  route("api/db-sync", "routes/api.dbSync.jsx", { id: "api-db-sync" }),
  route("api/analytics", "routes/api.analytics.jsx", { id: "api-analytics" }),
  route("sitemap.xml", "routes/sitemap[.]xml.jsx"),
  route("rss.xml", "routes/rss[.]xml.jsx"),
  route("resume", "routes/resume.jsx", { id: "resume" }),
  route("card", "routes/card.jsx", { id: "card" }),
  route(":section", "routes/section-redirect.jsx", { id: "section-redirect" }),
  route("*", "routes/$.jsx", { id: "not-found" }),
] satisfies RouteConfig;
