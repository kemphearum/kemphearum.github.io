import BlogPost, { loader as serverLoader, meta } from "../../src/pages/BlogPost";

export default BlogPost;
export const loader = serverLoader;
export { meta };

export async function clientLoader({ serverLoader }) {
  try {
    return await serverLoader();
  } catch (err) {
    // Fallback gracefully to client-side Firestore fetching if .data is missing or fails
    console.warn("Server loader unavailable, falling back to client-side Firebase.", err);
    return null;
  }
}
