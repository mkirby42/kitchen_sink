import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULT_FEEDBACK_FROM,
  FEEDBACK_INBOX,
  buildFeedbackEmail,
  feedbackFromAddress,
  sendFeedbackEmail,
  type FeedbackEmail,
} from "@/lib/feedback/email";
import { finishJoin } from "@/lib/join/finish";

const message: FeedbackEmail = {
  subject: "Kitchen Sink feedback from Ada",
  text: "hello",
  to: FEEDBACK_INBOX,
  replyTo: "ada@example.com",
  idempotencyKey: "feedback-1",
};

function jsonResponse(status: number) {
  return new Response(status === 200 ? '{"id":"email_1"}' : "nope", { status });
}

describe("buildFeedbackEmail", () => {
  it("includes the note, time, page, and submitter", () => {
    const email = buildFeedbackEmail({
      body: "The photo step was confusing.",
      createdAt: "2026-09-30T18:22:00.000Z",
      page: "https://kitchen-sink-tau.vercel.app/join",
      profileId: "profile-1",
      feedbackId: "feedback-1",
      name: "Ada Lovelace",
      profileEmail: "ada@example.com",
      loginEmail: "ada.login@example.com",
    });

    expect(email.to).toBe("chrislo5240@gmail.com");
    expect(email.subject).toBe("Kitchen Sink feedback from Ada Lovelace");
    expect(email.replyTo).toBe("ada@example.com");
    expect(email.idempotencyKey).toBe("feedback-1");
    expect(email.text).toContain("The photo step was confusing.");
    expect(email.text).toContain("Submitted: 2026-09-30T18:22:00.000Z");
    expect(email.text).toContain("Page: https://kitchen-sink-tau.vercel.app/join");
    expect(email.text).toContain("Name: Ada Lovelace");
    expect(email.text).toContain("Profile email: ada@example.com");
    expect(email.text).toContain("Login email: ada.login@example.com");
    expect(email.text).toContain("Profile id: profile-1");
    expect(email.text).toContain("Feedback id: feedback-1");
  });

  it("falls back to the login email and a generic subject", () => {
    const email = buildFeedbackEmail({
      body: "Bug",
      createdAt: "not-a-date",
      page: "https://example.com/join",
      profileId: "profile-1",
      feedbackId: "feedback-1",
      name: "  \n",
      profileEmail: "not-an-email",
      loginEmail: "ada.login@example.com",
    });

    expect(email.subject).toBe("Kitchen Sink feedback");
    expect(email.replyTo).toBe("ada.login@example.com");
    expect(email.text).toContain("Submitted: not-a-date");
    expect(email.text).toContain("Name: (none)");
  });
});

describe("sendFeedbackEmail", () => {
  const previousKey = process.env.RESEND_API_KEY;
  const previousFrom = process.env.RESEND_FROM;

  afterEach(() => {
    if (previousKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousKey;
    if (previousFrom === undefined) delete process.env.RESEND_FROM;
    else process.env.RESEND_FROM = previousFrom;
  });

  it("posts to Resend with the server key and does not retry a 4xx", async () => {
    delete process.env.RESEND_FROM;
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    await expect(
      sendFeedbackEmail(message, {
        from: feedbackFromAddress(),
        apiKey: "re_test",
        maxAttempts: 3,
        sleep: async () => {},
        fetchImpl: (async (url, init) => {
          calls.push({ url: String(url), init });
          return jsonResponse(422);
        }) as typeof fetch,
      }),
    ).rejects.toThrow("Resend rejected the feedback email (422)");

    expect(feedbackFromAddress()).toBe(DEFAULT_FEEDBACK_FROM);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://api.resend.com/emails");
    const headers = new Headers(calls[0]?.init?.headers);
    expect(headers.get("Authorization")).toBe("Bearer re_test");
    expect(headers.get("Idempotency-Key")).toBe("feedback-1");
    const body = JSON.parse(String(calls[0]?.init?.body));
    expect(body.to).toEqual(["chrislo5240@gmail.com"]);
    expect(body.reply_to).toBe("ada@example.com");
    expect(body.from).toBe(DEFAULT_FEEDBACK_FROM);
    expect(body.text).toBe("hello");
  });

  it("retries a 503 and then succeeds", async () => {
    let attempts = 0;
    await sendFeedbackEmail(message, {
      from: "Kitchen Sink <feedback@example.com>",
      apiKey: "re_test",
      sleep: async () => {},
      fetchImpl: (async () => {
        attempts += 1;
        return jsonResponse(attempts === 1 ? 503 : 200);
      }) as typeof fetch,
    });
    expect(attempts).toBe(2);
  });

  it("refuses to send when the key is missing", async () => {
    delete process.env.RESEND_API_KEY;
    await expect(
      sendFeedbackEmail(message, {
        from: DEFAULT_FEEDBACK_FROM,
        fetchImpl: (async () => jsonResponse(200)) as typeof fetch,
      }),
    ).rejects.toThrow("RESEND_API_KEY is not set");
  });
});

describe("finishJoin", () => {
  it("saves, then emails a non-empty note", async () => {
    const calls: string[] = [];
    const result = await finishJoin({
      alreadySaved: false,
      feedback: "Confusing step",
      save: async () => {
        calls.push("save");
        return null;
      },
      notify: async (feedback) => {
        calls.push(`notify:${feedback}`);
        return { ok: true };
      },
    });
    expect(result).toEqual({ ok: true, saved: true });
    expect(calls).toEqual(["save", "notify:Confusing step"]);
  });

  it("keeps the profile saved when the email fails and retries the email only", async () => {
    let saves = 0;
    const failed = await finishJoin({
      alreadySaved: false,
      feedback: "Confusing step",
      save: async () => {
        saves += 1;
        return null;
      },
      notify: async () => ({ ok: false, error: "mail down" }),
    });
    expect(failed).toEqual({ ok: false, saved: true, error: "mail down" });

    const retried = await finishJoin({
      alreadySaved: true,
      feedback: "Confusing step",
      save: async () => {
        saves += 1;
        return "should not save again";
      },
      notify: async () => ({ ok: true }),
    });
    expect(retried).toEqual({ ok: true, saved: true });
    expect(saves).toBe(1);
  });

  it("skips email when the note is empty", async () => {
    let notified = false;
    const result = await finishJoin({
      alreadySaved: false,
      feedback: null,
      save: async () => null,
      notify: async () => {
        notified = true;
        return { ok: true };
      },
    });
    expect(result.ok).toBe(true);
    expect(notified).toBe(false);
  });
});
