import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc, from, state, sendFeedbackEmail } = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(),
  state: {
    user: { id: "user-1", email: "ada.login@example.com" } as {
      id: string;
      email: string;
    } | null,
  },
  sendFeedbackEmail: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: async () => ({ data: { user: state.user } }),
    },
    rpc,
    from,
  })),
}));

vi.mock("@/lib/feedback/email", async () => {
  const actual = await vi.importActual<typeof import("@/lib/feedback/email")>(
    "@/lib/feedback/email",
  );
  return {
    ...actual,
    sendFeedbackEmail,
    feedbackFromAddress: () => "Kitchen Sink <feedback@example.com>",
  };
});

vi.mock("@/lib/site", () => ({
  deploymentOrigin: async () => "https://kitchen-sink-tau.vercel.app",
}));

import { createClient } from "@/lib/supabase/server";
import { notifyProductFeedback } from "@/lib/feedback/notify";

const claim = [
  {
    feedback_id: "feedback-1",
    feedback_body: "Confusing step",
    feedback_created_at: "2026-09-30T18:22:00.000Z",
  },
];

function profiles() {
  return {
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({
          data: { name: "Ada Lovelace", email: "ada@example.com" },
        }),
      }),
    }),
  };
}

function feedbackRows(
  rows: Array<{ body: string; notified_at: string | null; created_at: string }>,
) {
  return {
    select: () => ({
      order: () => ({
        limit: async () => ({ data: rows, error: null }),
      }),
    }),
  };
}

describe("notifyProductFeedback", () => {
  beforeEach(() => {
    state.user = { id: "user-1", email: "ada.login@example.com" };
    rpc.mockReset();
    from.mockReset();
    sendFeedbackEmail.mockReset();
    vi.mocked(createClient).mockClear();
    from.mockImplementation((table: string) =>
      table === "profiles" ? profiles() : feedbackRows([]),
    );
    rpc.mockImplementation(async (fn: string) => {
      if (fn === "claim_own_feedback_for_email") {
        return { data: claim, error: null };
      }
      return { data: null, error: null };
    });
    sendFeedbackEmail.mockResolvedValue(undefined);
  });

  it("claims the row and sends once with the feedback id as the idempotency key", async () => {
    await notifyProductFeedback("  Confusing step  ");

    expect(rpc).toHaveBeenCalledWith("claim_own_feedback_for_email", {
      p_body: "Confusing step",
    });
    expect(sendFeedbackEmail).toHaveBeenCalledOnce();
    const [message, options] = sendFeedbackEmail.mock.calls[0]!;
    expect(message.idempotencyKey).toBe("feedback-1");
    expect(message.to).toBe("chrislo5240@gmail.com");
    expect(message.text).toContain("Confusing step");
    expect(message.text).toContain("Profile id: user-1");
    expect(options).toMatchObject({ maxAttempts: 3 });
    expect(rpc).not.toHaveBeenCalledWith(
      "release_own_feedback_email_claim",
      expect.anything(),
    );
  });

  it("clears the claim and logs when Resend fails, without throwing", async () => {
    sendFeedbackEmail.mockRejectedValue(
      new Error("Resend rejected the feedback email (503)"),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(notifyProductFeedback("Confusing step")).resolves.toBeUndefined();

    expect(rpc).toHaveBeenCalledWith("release_own_feedback_email_claim", {
      p_id: "feedback-1",
    });
    expect(errorSpy.mock.calls.map((call) => call[0])).toContain(
      "Feedback email send failed",
    );
    errorSpy.mockRestore();
  });

  it("logs a failed release and still does not throw", async () => {
    sendFeedbackEmail.mockRejectedValue(new Error("network"));
    rpc.mockImplementation(async (fn: string) => {
      if (fn === "claim_own_feedback_for_email") {
        return { data: claim, error: null };
      }
      return { data: null, error: { message: "release failed" } };
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(notifyProductFeedback("Confusing step")).resolves.toBeUndefined();

    expect(errorSpy.mock.calls.map((call) => String(call[0]))).toEqual(
      expect.arrayContaining([
        "Feedback email send failed",
        "release_own_feedback_email_claim",
      ]),
    );
    errorSpy.mockRestore();
  });

  it("does not send when the same note was already emailed", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    from.mockImplementation((table: string) =>
      table === "profiles"
        ? profiles()
        : feedbackRows([
            {
              body: "Confusing step",
              notified_at: "2026-09-30T18:23:00.000Z",
              created_at: new Date().toISOString(),
            },
          ]),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await notifyProductFeedback("Confusing step");

    expect(sendFeedbackEmail).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("leaves an unclaimed row alone and logs when nothing is fresh", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await notifyProductFeedback("Confusing step");

    expect(sendFeedbackEmail).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalledWith(
      "release_own_feedback_email_claim",
      expect.anything(),
    );
    expect(errorSpy.mock.calls.map((call) => call[0])).toContain(
      "No fresh feedback row to email",
    );
    errorSpy.mockRestore();
  });

  it("does not call Resend when the claim fails", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "42501" } });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await notifyProductFeedback("Confusing step");

    expect(sendFeedbackEmail).not.toHaveBeenCalled();
    expect(errorSpy.mock.calls.map((call) => call[0])).toContain(
      "claim_own_feedback_for_email",
    );
    errorSpy.mockRestore();
  });

  it("skips an empty note and a missing session", async () => {
    await notifyProductFeedback("   ");
    expect(createClient).not.toHaveBeenCalled();

    state.user = null;
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await notifyProductFeedback("Confusing step");
    expect(rpc).not.toHaveBeenCalled();
    expect(sendFeedbackEmail).not.toHaveBeenCalled();
    expect(errorSpy.mock.calls.map((call) => call[0])).toContain(
      "Feedback email skipped; no signed-in user",
    );
    errorSpy.mockRestore();
  });
});
