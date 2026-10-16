import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import {
  sectionTitleClass,
  segmentOptionClass,
  segmentTrackClass,
  textLinkClass,
} from "@/components/ui/styles";
import {
  formatCount,
  type AnalyticsDashboard as AnalyticsDashboardData,
} from "@/lib/admin/analytics";
import { routes } from "@/lib/routes";

function Stat({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <Card className="px-4 py-4">
      <p className="text-sm text-mute">{label}</p>
      <p className="mt-1 font-sans text-3xl font-bold tracking-tight text-black">
        {formatCount(value)}
      </p>
      <p className="mt-1 text-xs text-mute">{note}</p>
    </Card>
  );
}

export function AnalyticsDashboard({ data }: { data: AnalyticsDashboardData }) {
  const maxViews = data.trend.reduce(
    (max, point) => Math.max(max, point.pageViews),
    0,
  );
  const quiet = data.pageViews === 0;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <Eyebrow>Ops</Eyebrow>
      <h1 className={`mt-1 text-ink ${sectionTitleClass}`}>Analytics</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-mute">
        Page views, Find card clicks, profile views, and Book a Session or
        Free Consult clicks. Signed-out visitors count. Signed-in therapists
        and clients count without their account attached. Your own browsing
        is left out. No names, emails, or IP addresses are stored.
      </p>

      <nav className="mt-5" aria-label="Date range">
        <div className={segmentTrackClass({ size: "sm" })}>
          <Link
            href={`${routes.adminAnalytics}?days=7`}
            className={segmentOptionClass(data.days === 7, "sm")}
            aria-current={data.days === 7 ? "page" : undefined}
          >
            Last 7 days
          </Link>
          <Link
            href={`${routes.adminAnalytics}?days=30`}
            className={segmentOptionClass(data.days === 30, "sm")}
            aria-current={data.days === 30 ? "page" : undefined}
          >
            Last 30 days
          </Link>
        </div>
      </nav>

      {quiet ? (
        <p className="mt-4 text-sm text-mute">
          Nothing recorded in this window yet.
        </p>
      ) : null}

      <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <li>
          <Stat label="Page views" value={data.pageViews} note="A page opened" />
        </li>
        <li>
          <Stat label="Visits" value={data.visits} note="One browser session" />
        </li>
        <li>
          <Stat
            label="Unique visitors"
            value={data.uniqueVisitors}
            note="Same browser, including return visits"
          />
        </li>
      </ul>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-ink">Page views by day</h2>
        <p className="mt-1 text-xs text-mute">Dates are UTC.</p>
        <Card className="mt-3 px-4 py-4">
          {data.trend.length === 0 ? (
            <p className="text-sm text-mute">No days in this window.</p>
          ) : (
            <ol className="space-y-2.5">
              {data.trend.map((point) => {
                const width =
                  maxViews === 0
                    ? 0
                    : Math.round((point.pageViews / maxViews) * 100);
                return (
                  <li
                    key={point.day}
                    className="grid grid-cols-[4.25rem_minmax(0,1fr)_auto] items-center gap-3"
                  >
                    <span className="text-sm text-mute">{point.label}</span>
                    <span className="h-2 overflow-hidden rounded-full bg-line">
                      <span
                        className="block h-2 rounded-full bg-ink"
                        style={{ width: `${width}%` }}
                      />
                    </span>
                    <span className="text-right text-sm tabular-nums text-body">
                      {formatCount(point.pageViews)}
                      <span className="ml-2 text-xs text-mute">
                        {formatCount(point.visitors)} visitors
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-ink">Top pages</h2>
        <Card className="mt-3 px-4 py-2">
          {data.topPages.length === 0 ? (
            <p className="py-2 text-sm text-mute">No page views in this window.</p>
          ) : (
            <ol>
              {data.topPages.map((page) => (
                <li
                  key={page.path}
                  className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 last:border-b-0"
                >
                  <span className="min-w-0">
                    <span className="block text-sm text-body">{page.label}</span>
                    <span className="block truncate text-xs text-mute">{page.path}</span>
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-body">
                    {formatCount(page.views)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-ink">Therapists</h2>
        <p className="mt-1 text-xs text-mute">
          Find card clicks, profile views, and the booking buttons.
        </p>
        <Card className="mt-3 px-4 py-2">
          {data.therapists.length === 0 ? (
            <p className="py-2 text-sm text-mute">
              No card clicks, profile views, or booking clicks in this window.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead>
                  <tr className="text-xs text-mute">
                    <th className="py-2 pr-3 font-medium">Therapist</th>
                    <th className="px-2 py-2 text-right font-medium">Find card clicks</th>
                    <th className="px-2 py-2 text-right font-medium">Profile views</th>
                    <th className="px-2 py-2 text-right font-medium">Book a Session</th>
                    <th className="py-2 pl-2 text-right font-medium">Free Consult</th>
                  </tr>
                </thead>
                <tbody>
                  {data.therapists.map((therapist) => (
                    <tr key={therapist.id} className="border-t border-line">
                      <td className="py-2.5 pr-3">
                        <Link
                          href={routes.therapist(therapist.id)}
                          className={textLinkClass}
                        >
                          {therapist.name}
                        </Link>
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums">
                        {formatCount(therapist.cardClicks)}
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums">
                        {formatCount(therapist.profileViews)}
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums">
                        {formatCount(therapist.bookClicks)}
                      </td>
                      <td className="py-2.5 pl-2 text-right tabular-nums">
                        {formatCount(therapist.consultClicks)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>
    </main>
  );
}
