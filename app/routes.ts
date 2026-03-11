import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.jsx"),
  route("admin", "../src/pages/Admin.jsx"),
  route("projects", "../src/pages/ProjectsPage.jsx"),
  route("projects/:slug", "../src/pages/ProjectDetail.jsx"),
  route("blog", "../src/pages/Blog.jsx"),
  route("blog/:slug", "../src/pages/BlogPost.jsx"),
] satisfies RouteConfig;
