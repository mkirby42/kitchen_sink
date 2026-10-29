import { getResetCallback } from "@/lib/auth/form-post";

export async function GET(request: Request) {
  return getResetCallback(request);
}
