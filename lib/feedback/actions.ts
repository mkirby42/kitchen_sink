"use server";

import { notifyProductFeedback } from "@/lib/feedback/notify";

export async function sendJoinFeedback(body: string) {
  return notifyProductFeedback(body);
}
