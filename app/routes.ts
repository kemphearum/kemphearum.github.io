import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.jsx"),
  route("admin", "../src/pages/Admin.jsx", { id: "admin" }),
  route("projects", "../src/pages/ProjectsPage.jsx", { id: "projects" }),
  route("projects/:slug", "../src/pages/ProjectDetail.jsx", { id: "project-detail" }),
  route("blog", "../src/pages/Blog.jsx", { id: "blog" }),
  route("blog/:slug", "../src/pages/BlogPost.jsx", { id: "blog-post" }),
] satisfies RouteConfig;
