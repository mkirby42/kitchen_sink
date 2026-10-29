import { postSignUp } from "@/lib/auth/form-post";

export async function POST(request: Request) {
  return postSignUp(request);
}
