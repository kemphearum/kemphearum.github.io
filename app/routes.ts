import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.jsx"),
  route("admin", "routes/admin.jsx", { id: "admin" }),
  route("projects", "routes/projects._index.jsx", { id: "projects" }),
  route("projects/:slug", "routes/projects.$slug.jsx", { id: "project-detail" }),
  route("blog", "routes/blog._index.jsx", { id: "blog" }),
  route("blog/:slug", "routes/blog.$slug.jsx", { id: "blog-post" }),
  route("sitemap.xml", "routes/sitemap[.]xml.jsx"),
  route(":section", "routes/section-redirect.jsx", { id: "section-redirect" }),
  route("*", "routes/$.jsx", { id: "not-found" }),
] satisfies RouteConfig;
