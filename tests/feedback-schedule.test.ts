import { beforeEach, describe, expect, it, vi } from "vitest";

const { tasks, notify, after } = vi.hoisted(() => {
  const tasks: Array<() => Promise<void> | void> = [];
  const notify = vi.fn(async () => {});
  const after = vi.fn((task: () => Promise<void> | void) => {
    tasks.push(task);
  });
  return { tasks, notify, after };
});

vi.mock("next/server", () => ({ after }));

vi.mock("@/lib/feedback/notify", () => ({
  notifyProductFeedback: notify,
}));

import { sendJoinFeedback } from "@/lib/feedback/actions";

describe("sendJoinFeedback", () => {
  beforeEach(() => {
    tasks.length = 0;
    notify.mockReset();
    notify.mockResolvedValue(undefined);
    after.mockReset();
    after.mockImplementation((task: () => Promise<void> | void) => {
      tasks.push(task);
    });
  });

  it("returns before the email runs, then the callback sends once", async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    notify.mockImplementation(() => gate);

    await sendJoinFeedback("  Confusing step  ");

    expect(notify).not.toHaveBeenCalled();
    expect(tasks).toHaveLength(1);

    const running = Promise.resolve(tasks[0]!());
    expect(notify).toHaveBeenCalledOnce();
    expect(notify).toHaveBeenCalledWith("Confusing step");
    release();
    await running;
  });

  it("does not schedule a blank note", async () => {
    await sendJoinFeedback("   ");
    expect(tasks).toHaveLength(0);
    expect(notify).not.toHaveBeenCalled();
  });

  it("logs and still returns when after() cannot schedule", async () => {
    after.mockImplementation(() => {
      throw new Error("no request scope");
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(sendJoinFeedback("Confusing step")).resolves.toBeUndefined();

    expect(notify).not.toHaveBeenCalled();
    expect(errorSpy.mock.calls.map((call) => call[0])).toContain(
      "Feedback email was not scheduled",
    );
    errorSpy.mockRestore();
  });
});
