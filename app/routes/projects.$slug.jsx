import ProjectDetail, { loader as serverLoader, meta } from "../../src/pages/ProjectDetail";

export default ProjectDetail;
export const loader = serverLoader;
export { meta };

export async function clientLoader({ serverLoader }) {
  try {
    return await serverLoader();
  } catch (err) {
    // If the server loader fails (due to 404.html fallback on GitHub pages, 
    // missing .data files, or parsing errors), fallback gracefully to client-side 
    // Firestore fetching by returning null.
    console.warn("Server loader unavailable, falling back to client-side Firebase.", err);
    return null;
  }
}
