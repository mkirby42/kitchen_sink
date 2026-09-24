import type { MetadataRoute } from "next";
import {
  deploymentOrigin,
  indexableTherapistIds,
  sitemapEntries,
} from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await deploymentOrigin();
  const ids = await indexableTherapistIds();
  return sitemapEntries(origin, ids);
}
