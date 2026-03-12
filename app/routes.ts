import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("route-entries/home.jsx"),
  route("admin", "route-entries/admin.jsx"),
  route("projects", "route-entries/projects.jsx"),
  route("projects/:slug", "route-entries/project-detail.jsx"),
  route("blog", "route-entries/blog.jsx"),
  route("blog/:slug", "route-entries/blog-post.jsx"),
  route("*", "route-entries/not-found.jsx"),
] satisfies RouteConfig;
