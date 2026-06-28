

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
  return new Response(null, { status: 302, headers: { Location: target } });
}

export default function SectionRedirectRoute() {
  return null;
}
