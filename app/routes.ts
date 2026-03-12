import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.jsx"),
  route("admin", "routes/admin.jsx"),
  route("projects", "routes/projects._index.jsx"),
  route("projects/:slug", "routes/projects.$slug.jsx"),
  route("blog", "routes/blog._index.jsx"),
  route("blog/:slug", "routes/blog.$slug.jsx"),
  route("*", "routes/$.jsx"),
] satisfies RouteConfig;
