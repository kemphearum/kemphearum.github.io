import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.jsx"),
  route("admin", "routes/admin.jsx", { id: "admin" }),
  route("projects", "routes/projects._index.jsx", { id: "projects" }),
  route("projects/:slug", "routes/project-detail.jsx", { id: "project-detail" }),
  route("blog", "routes/blog._index.jsx", { id: "blog" }),
  route("blog/:slug", "routes/blog-detail.jsx", { id: "blog-post" }),
  route("*", "routes/$.jsx", { id: "not-found" }),
] satisfies RouteConfig;
