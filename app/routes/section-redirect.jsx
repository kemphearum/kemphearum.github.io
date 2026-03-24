import { redirect } from "react-router";

const SECTION_REDIRECTS = {
  home: "/",
  about: "/#about",
  experience: "/#experience",
  contact: "/#contact",
  project: "/projects",
  projects: "/projects",
  blogs: "/blog"
};

export async function loader({ params }) {
  const key = String(params.section || "").toLowerCase();
  const target = SECTION_REDIRECTS[key];
  if (!target) {
    throw new Response("Not Found", { status: 404 });
  }
  return redirect(target);
}

export default function SectionRedirectRoute() {
  return null;
}
