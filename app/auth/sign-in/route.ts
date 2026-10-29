import { postSignIn } from "@/lib/auth/form-post";

export async function POST(request: Request) {
  return postSignIn(request);
}
