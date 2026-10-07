"use server";

import { after } from "next/server";
import { notifyProductFeedback } from "@/lib/feedback/notify";

/** Schedule the ops email after this server action responds. */
export async function sendJoinFeedback(body: string) {
  const note = body.trim();
  if (!note) return;
  try {
    after(() => notifyProductFeedback(note));
  } catch (error) {
    console.error("Feedback email was not scheduled", error);
  }
}
