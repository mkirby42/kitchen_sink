import { FEEDBACK_INBOX } from "@/lib/feedback/email";

export type ProfileStartAdminEmail = {
  subject: string;
  text: string;
  to: string;
  replyTo: string;
  idempotencyKey: string;
};

export type ProfileStartReadyEmail = {
  subject: string;
  text: string;
  to: string;
  replyTo: string;
  idempotencyKey: string;
};

function oneLine(value: string) {
  return value.replace(/[\r\n\t]+/g, " ").trim();
}

export function buildProfileStartAdminEmail(input: {
  id: string;
  name: string;
  email: string;
  links: string[];
  createdAt: string;
  queueUrl: string;
}): ProfileStartAdminEmail {
  const name = oneLine(input.name).slice(0, 80);
  const links = input.links.map((link) => `- ${oneLine(link)}`).join("\n");
  return {
    subject: name ? `Profile start: ${name}` : "Profile start",
    to: FEEDBACK_INBOX,
    replyTo: input.email.trim(),
    idempotencyKey: `profile-start-admin:${input.id}`,
    text: [
      `${name || "A therapist"} asked Kitchen Sink to start a draft profile.`,
      "",
      `Email: ${input.email.trim()}`,
      "Links (not fetched):",
      links || "- (none)",
      "",
      `Submitted: ${input.createdAt}`,
      `Queue: ${input.queueUrl}`,
    ].join("\n"),
  };
}

export function buildProfileStartReadyEmail(input: {
  id: string;
  name: string;
  email: string;
  actionLink: string;
  signInUrl: string;
  nonce: string;
}): ProfileStartReadyEmail {
  const name = oneLine(input.name);
  const hello = name ? `Hi ${name},` : "Hi,";
  return {
    subject: "Your Kitchen Sink draft is ready",
    to: input.email.trim(),
    replyTo: FEEDBACK_INBOX,
    idempotencyKey: `profile-start-ready:${input.id}:${input.nonce}`,
    text: [
      hello,
      "",
      "Your draft profile is ready for you to review. Nothing goes live until you approve it.",
      "",
      "Set your password and finish your profile:",
      input.actionLink,
      "",
      "If you already have a password, sign in:",
      input.signInUrl,
      "",
      "Then review the draft and publish it when it sounds like you.",
    ].join("\n"),
  };
}
