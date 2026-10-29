import { postSignOut } from "@/lib/auth/form-post";

export async function POST(request: Request) {
  return postSignOut(request);
}