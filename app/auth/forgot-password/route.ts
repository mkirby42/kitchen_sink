import { postForgotPassword } from "@/lib/auth/form-post";

export async function POST(request: Request) {
  return postForgotPassword(request);
}
