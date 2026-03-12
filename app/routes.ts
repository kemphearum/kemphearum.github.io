import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.jsx"),
  route("admin", "routes/admin.jsx"),
  route("projects", "routes/projects.jsx"),
  route("projects/:slug", "routes/project-detail.jsx"),
  route("blog", "routes/blog.jsx"),
  route("blog/:slug", "routes/blog-post.jsx"),
  route("*", "routes/not-found.jsx"),
] satisfies RouteConfig;
