import type { MetadataRoute } from "next";
import { deploymentOrigin, robotsPolicy } from "@/lib/site";

export default async function robots(): Promise<MetadataRoute.Robots> {
  return robotsPolicy(await deploymentOrigin());
}
