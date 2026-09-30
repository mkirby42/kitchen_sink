export const FEEDBACK_INBOX = "chrislo5240@gmail.com";

export const DEFAULT_FEEDBACK_FROM = "Kitchen Sink <onboarding@resend.dev>";

const RESEND_EMAILS_URL = "https://api.resend.com/emails";
const MAX_BODY = 20_000;
const RETRY_STATUSES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

export type FeedbackEmailInput = {
  body: string;
  createdAt: string;
  page: string;
  profileId: string;
  feedbackId: string;
  name: string | null;
  profileEmail: string | null;
  loginEmail: string | null;
};

export type FeedbackEmail = {
  subject: string;
  text: string;
  to: string;
  replyTo: string | null;
  idempotencyKey: string;
};

export function feedbackFromAddress() {
  const configured = process.env.RESEND_FROM?.trim();
  return configured || DEFAULT_FEEDBACK_FROM;
}

export function buildFeedbackEmail(input: FeedbackEmailInput): FeedbackEmail {
  const name = oneLine(input.name ?? "");
  let body = input.body.trim();
  if (body.length > MAX_BODY) {
    body = `${body.slice(0, MAX_BODY)}\n\n[truncated; the full note is stored on the feedback row]`;
  }

  const created = formatTimestamp(input.createdAt);
  const text = [
    "Feedback for us",
    "",
    body,
    "",
    "---",
    `Submitted: ${created}`,
    `Page: ${input.page}`,
    `Name: ${name || "(none)"}`,
    `Profile email: ${input.profileEmail?.trim() || "(none)"}`,
    `Login email: ${input.loginEmail?.trim() || "(none)"}`,
    `Profile id: ${input.profileId}`,
    `Feedback id: ${input.feedbackId}`,
  ].join("\n");

  return {
    subject: name
      ? `Kitchen Sink feedback from ${name.slice(0, 80)}`
      : "Kitchen Sink feedback",
    text,
    to: FEEDBACK_INBOX,
    replyTo: replyAddress(input.profileEmail, input.loginEmail),
    idempotencyKey: input.feedbackId,
  };
}

export async function sendFeedbackEmail(
  message: FeedbackEmail,
  options: {
    from: string;
    fetchImpl?: typeof fetch;
    sleep?: (ms: number) => Promise<void>;
    maxAttempts?: number;
    apiKey?: string;
  },
) {
  const apiKey = (options.apiKey ?? process.env.RESEND_API_KEY)?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep =
    options.sleep ??
    ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
  const maxAttempts = options.maxAttempts ?? 3;
  const payload: Record<string, unknown> = {
    from: options.from,
    to: [message.to],
    subject: message.subject,
    text: message.text,
  };
  if (message.replyTo) payload.reply_to = message.replyTo;

  let lastMessage = "Feedback email request failed";
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let retry = false;
    try {
      const response = await fetchImpl(RESEND_EMAILS_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": message.idempotencyKey,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      });
      if (response.ok) return;
      retry = RETRY_STATUSES.has(response.status);
      lastMessage = `Resend rejected the feedback email (${response.status})`;
      throw new Error(lastMessage);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Feedback email request failed";
      const rejected = message.startsWith("Resend rejected");
      if (rejected && !retry) throw new Error(message);
      lastMessage = rejected ? message : "Feedback email request failed";
      if (attempt === maxAttempts) throw new Error(lastMessage);
    }
    await sleep(200 * 2 ** (attempt - 1));
  }

  throw new Error(lastMessage);
}

function replyAddress(
  profileEmail: string | null,
  loginEmail: string | null,
) {
  const profile = profileEmail?.trim() ?? "";
  if (looksLikeEmail(profile)) return profile;
  const login = loginEmail?.trim() ?? "";
  if (looksLikeEmail(login)) return login;
  return null;
}

function looksLikeEmail(value: string | null | undefined) {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function oneLine(value: string) {
  return value.replace(/[\r\n\t]+/g, " ").trim();
}

function formatTimestamp(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString();
}
