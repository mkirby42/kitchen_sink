import { deploymentOrigin, llmsTxt } from "@/lib/site";

export async function GET() {
  const body = llmsTxt(await deploymentOrigin());
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
