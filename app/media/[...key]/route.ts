import { isServedMediaPath } from "@/lib/editor/links";
import { getObject } from "@/lib/storage/s3";

// Serves uploaded images from the private bucket. Keys are random UUIDs and
// never overwritten, so responses are cacheable forever.
export async function GET(_request: Request, { params }: RouteContext<"/media/[...key]">) {
  const { key } = await params;
  const path = `/media/${key.join("/")}`;
  if (!isServedMediaPath(path)) return new Response("Not found", { status: 404 });

  const object = await getObject(key.join("/"));
  if (!object) return new Response("Not found", { status: 404 });

  return new Response(object.body, {
    headers: {
      "Content-Type": object.contentType,
      ...(object.contentLength ? { "Content-Length": String(object.contentLength) } : {}),
      ...(object.etag ? { ETag: object.etag } : {}),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'",
    },
  });
}
