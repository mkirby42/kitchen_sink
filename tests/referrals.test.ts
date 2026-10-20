import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ReferralQueue } from "@/components/admin/ReferralQueue";
import { InterestedList } from "@/components/referrals/InterestedList";
import { MyReferrals } from "@/components/referrals/MyReferrals";
import { ReferralBoard } from "@/components/referrals/ReferralBoard";
import { ReferralForm } from "@/components/referrals/ReferralForm";
import { ShareList } from "@/components/referrals/ShareList";
import {
  buildClientReferralMailto,
  buildRefreshEmail,
  profileIsPublic,
  therapistFitLine,
} from "@/lib/referrals/email";
import { filterBoardPosts, postMatchesViewer } from "@/lib/referrals/match";
import { EMAIL_SUBJECT, referralDraftError } from "@/lib/referrals/options";
import { closesLabel, postedAgo, referralPhase } from "@/lib/referrals/time";
import type { BoardPost, MinePost, QueuePost } from "@/lib/referrals/rows";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push() {}, refresh() {}, replace() {} }),
  usePathname: () => "/referrals",
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ rpc: async () => ({ data: null, error: null }) }),
}));

const NOW = Date.parse("2026-10-19T15:00:00.000Z");
const VIEWER = {
  specialtyLabels: ["ADHD", "Teens"],
  insuranceLabels: ["BCBS", "Cash Pay Only"],
  virtual: true,
  inPerson: false,
  slidingScale: true,
};

const POST: BoardPost = {
  id: "11111111-1111-4111-8111-111111111111",
  ageRange: "Adult, 30s",
  focusAreas: ["ADHD", "Anxiety"],
  payments: ["BCBS", "Private pay", "Sliding scale"],
  formats: ["telehealth"],
  area: null,
  timings: ["mornings"],
  interestCount: 4,
  createdAt: "2026-10-19T13:00:00.000Z",
  closesAt: "2026-10-25T15:00:00.000Z",
  viewerInterested: false,
  viewerIsPoster: false,
};

describe("referral copy and matching", () => {
  it("rejects free text and accepts a general post", () => {
    expect(
      referralDraftError({
        ageRange: "Adult, 30s",
        focusAreas: ["Jane at Acme"],
        payments: ["BCBS"],
        formats: ["telehealth"],
        area: "",
        timings: ["mornings"],
        attested: true,
      }),
    ).toBe("Choose focus areas from the list.");
    expect(
      referralDraftError({
        ageRange: "Adult, 30s",
        focusAreas: ["ADHD"],
        payments: ["BCBS"],
        formats: ["telehealth"],
        area: "South Austin",
        timings: ["mornings"],
        attested: true,
      }),
    ).toBe("An area is only for in-person requests.");
    expect(
      referralDraftError({
        ageRange: "Adult, 30s",
        focusAreas: ["ADHD"],
        payments: ["Private pay"],
        formats: ["in_person"],
        area: "South Austin",
        timings: ["evenings"],
        attested: false,
      }),
    ).toBe("Confirm the post has no identifying details.");
    expect(
      referralDraftError({
        ageRange: "Adult, 30s",
        focusAreas: ["ADHD"],
        payments: ["Private pay"],
        formats: ["in_person"],
        area: "South Austin",
        timings: ["evenings"],
        attested: true,
      }),
    ).toBeNull();
  });

  it("matches focus or payment, and highlights format without using it as the filter", () => {
    expect(postMatchesViewer(POST, VIEWER)).toBe(true);
    expect(
      postMatchesViewer(
        { ...POST, focusAreas: ["Grief & Loss"], payments: ["Aetna"] },
        VIEWER,
      ),
    ).toBe(false);
    expect(
      filterBoardPosts([POST], VIEWER, { kind: "matches" }),
    ).toHaveLength(1);
    expect(
      filterBoardPosts(
        [{ ...POST, focusAreas: ["Grief & Loss"], payments: ["Aetna"] }],
        VIEWER,
        { kind: "matches" },
      ),
    ).toHaveLength(0);
    expect(filterBoardPosts([POST], VIEWER, { kind: "payment", payment: "BCBS" })).toHaveLength(
      1,
    );
  });

  it("speaks in hours and a one-week close, not 14 days", () => {
    expect(postedAgo(POST.createdAt, NOW)).toBe("Posted 2h ago");
    expect(closesLabel(POST.closesAt, NOW)).toBe("Closes in 6d");
    expect(closesLabel("2026-10-19T14:00:00.000Z", NOW)).toBe("Closed");
    const mine: MinePost = {
      ...POST,
      status: "approved",
      approvedAt: POST.createdAt,
      closedAt: null,
      refreshToken: "22222222-2222-4222-8222-222222222222",
      posterType: "therapist",
    };
    expect(referralPhase(mine, NOW)).toBe("Live");
    expect(referralPhase({ ...mine, closesAt: "2026-10-18T15:00:00.000Z" }, NOW)).toBe(
      "Expired",
    );
    expect(referralPhase({ ...mine, status: "closed" }, NOW)).toBe("Closed");
    expect(referralPhase({ ...mine, status: "rejected" }, NOW)).toBe("Rejected");
  });

  it("builds a mailto from the therapist's own mail app with no client address", () => {
    const message = buildClientReferralMailto({
      origin: "https://kitchen-sink-tau.vercel.app",
      post: POST,
      therapists: [
        {
          id: "33333333-3333-4333-8333-333333333333",
          name: "Jules Tran",
          credential: "LCSW",
          specialtyLabels: ["ADHD"],
          insuranceLabels: ["BCBS"],
          virtual: true,
          inPerson: true,
          slidingScale: false,
          listed: true,
          published: true,
          openToNewClients: true,
        },
      ],
    });
    expect(message.subject).toBe(EMAIL_SUBJECT);
    expect(message.href.startsWith("mailto:?subject=")).toBe(true);
    expect(message.href).not.toContain("mailto:someone");
    expect(message.body).toContain("Jules Tran, LCSW");
    expect(message.body).toContain("/t/33333333-3333-4333-8333-333333333333");
    expect(message.body).not.toMatch(/@/);
    expect(therapistFitLine(POST, {
      id: "33333333-3333-4333-8333-333333333333",
      name: "Jules Tran",
      credential: "LCSW",
      specialtyLabels: ["ADHD"],
      insuranceLabels: ["BCBS"],
      virtual: true,
      inPerson: false,
      slidingScale: true,
      listed: true,
      published: true,
      openToNewClients: true,
    })).toContain("Telehealth");
    expect(profileIsPublic({ listed: false, published: true, openToNewClients: true })).toBe(
      false,
    );
  });

  it("asks the poster to refresh for another week", () => {
    const email = buildRefreshEmail({
      ageRange: "Adult, 30s",
      refreshUrl: "https://example.com/referrals/mine?refresh=abc",
      mineUrl: "https://example.com/referrals/mine",
    });
    expect(email.subject).toBe("Your referral request closed");
    expect(email.text).toContain("another week");
    expect(email.text).toContain("refresh=abc");
    expect(email.text).not.toContain("14");
  });
});

describe("referral screens", () => {
  it("renders the post form, the board, and the email handoff", () => {
    const form = renderToStaticMarkup(createElement(ReferralForm));
    expect(form).toContain("no identifying details");
    expect(form).toContain("my client knows");
    expect(form).toContain("Closes automatically in 7 days");
    expect(form).not.toContain("14 days");
    expect(form).not.toContain("Open to everyone");
    expect(form).toContain("Who are you looking for?");

    const board = renderToStaticMarkup(
      createElement(ReferralBoard, {
        posts: [POST, { ...POST, id: "44444444-4444-4444-8444-444444444444", viewerIsPoster: true }],
        viewer: VIEWER,
        filter: { kind: "all" },
        loadError: null,
        now: NOW,
      }),
    );
    expect(board).toMatch(/I(?:'|&#x27;)m interested/);
    expect(board).toMatch(/Who(?:'|&#x27;)s interested/);
    expect(board).toContain("Posted 2h ago");
    expect(board).toContain("4 therapists interested");
    expect(board).toContain("+ Refer");
    expect(board).toContain("How it works");
    expect(board).toContain("01 — Post a referral");
    expect(board).toContain("02 — We approve it");
    expect(board).toContain("03 — Therapists tap interested");
    expect(board).toContain("04 — You follow up off the board");
    expect(board).toContain("05 — Refresh after the week");
    expect(board).toContain("bg-gold/35");
    expect(board).toContain("bg-lavender");
    expect(board).toContain("rounded-box bg-paper");
    expect(board).toContain("Kitchen Sink stores no client name, email, or phone.");
    expect(board).toContain("aria-expanded=\"true\"");
    expect(board).toContain("Hide");
    expect(board).not.toContain("Open to everyone");
    expect(board).not.toContain("Clients can post");

    const interested = renderToStaticMarkup(
      createElement(InterestedList, {
        postId: POST.id,
        post: POST,
        origin: "https://kitchen-sink-tau.vercel.app",
        canClose: true,
        therapists: [
          {
            id: "33333333-3333-4333-8333-333333333333",
            name: "Jules Tran",
            credential: "LCSW",
            specialtyLabels: ["ADHD"],
            insuranceLabels: ["BCBS"],
            virtual: true,
            inPerson: false,
            slidingScale: true,
            listed: true,
            published: true,
            openToNewClients: true,
          },
        ],
      }),
    );
    expect(interested).toContain("1 therapist is interested");
    expect(interested).toContain("Therapists who");
    expect(interested).toContain("mailto:?subject=Therapists%20who%27d");
    expect(interested).toContain("Email these 1 to my client");
    expect(interested).toContain("Copy share link instead");
    expect(interested).toContain("mailto:?subject=");
    expect(interested).not.toContain("client@");

    const mine = renderToStaticMarkup(
      createElement(MyReferrals, {
        posts: [
          {
            ...POST,
            status: "pending",
            approvedAt: null,
            closesAt: null,
            closedAt: null,
            refreshToken: "22222222-2222-4222-8222-222222222222",
            posterType: "therapist",
          },
        ],
        notice: "Posted. It stays off the board until Kitchen Sink approves it.",
        loadError: null,
      }),
    );
    expect(mine).toContain("Pending");
    expect(mine).toContain("Waiting for Kitchen Sink");

    const queuePost: QueuePost = {
      id: POST.id,
      posterId: "55555555-5555-4555-8555-555555555555",
      posterName: "Ada Lopez",
      posterType: "therapist",
      ageRange: POST.ageRange,
      focusAreas: POST.focusAreas,
      payments: POST.payments,
      formats: POST.formats,
      area: null,
      timings: POST.timings,
      status: "pending",
      interestCount: 0,
      createdAt: POST.createdAt,
      closesAt: null,
      closedAt: null,
    };
    const queue = renderToStaticMarkup(
      createElement(ReferralQueue, { posts: [queuePost] }),
    );
    expect(queue).toContain("Approve");
    expect(queue).toContain("Reject");
    expect(queue).toContain("Ada Lopez");

    const share = renderToStaticMarkup(
      createElement(ShareList, {
        therapists: [
          {
            id: "33333333-3333-4333-8333-333333333333",
            name: "Jules Tran",
            credential: "LCSW",
            specialtyLabels: ["ADHD"],
            insuranceLabels: [],
            virtual: true,
            inPerson: false,
            slidingScale: false,
            listed: true,
            published: true,
            openToNewClients: true,
          },
        ],
      }),
    );
    expect(share).toContain("Therapists for you");
    expect(share).toContain("View profile");
    expect(share).not.toContain("Adult, 30s");
  });
});
