import { postUpdatePassword } from "@/lib/auth/form-post";

export async function POST(request: Request) {
  return postUpdatePassword(request);
}
