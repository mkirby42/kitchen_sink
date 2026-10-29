import { buildFindHref } from "@/components/search/query";
import { primaryPillClass, selectClass } from "@/components/ui/styles";
import { sentenceCasePhrase } from "@/lib/copy/sentence-case";
import type { SearchFilters } from "@/lib/search/rpc";
import {
  FIND_TOPICS,
  FIND_TOPIC_OTHER_OPTION,
} from "@/lib/tags/plain-language";
import {
  FIND_INSURANCE_OPTIONS,
  licenseStateEntries,
} from "@/lib/tags/presets";

const legendClass = "font-sans text-[15px] font-medium text-ink";

/**
 * GET form for a browser that never runs the pill scripts.
 * Same address parameters the Find page already reads.
 * Rendered inside `<noscript>` so the scripted pills stay the only controls when JS runs.
 */
export function FindNoJsForm({
  filters,
  layout,
}: {
  filters: SearchFilters;
  layout: "grid" | "one";
}) {
  return (
    <form
      action="/find"
      method="get"
      data-find-no-js=""
      className="mt-6 space-y-5 rounded-card bg-paper p-4 shadow-card"
    >
      <fieldset>
        <legend className={legendClass}>Where you live</legend>
        <select
          name="state"
          defaultValue={filters.state ?? ""}
          className={`${selectClass} mt-2 w-full max-w-xs`}
        >
          <option value="">Any state</option>
          {licenseStateEntries().map((item) => (
            <option key={item.code} value={item.code}>
              {item.name}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset>
        <legend className={legendClass}>Insurance</legend>
        <div className="mt-2 flex flex-col gap-2">
          {FIND_INSURANCE_OPTIONS.map((label) => (
            <label key={label} className="flex items-center gap-2 font-sans text-[15px] text-ink">
              <input
                type="checkbox"
                name="tags"
                value={label}
                defaultChecked={filters.tags.includes(label)}
              />
              {sentenceCasePhrase(label)}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={legendClass}>What&apos;s going on</legend>
        <div className="mt-2 flex flex-col gap-2">
          {FIND_TOPICS.map((topic) => (
            <label key={topic.specialty} className="font-sans text-[15px] text-ink">
              <span className="flex items-start gap-2">
                <input
                  type="checkbox"
                  name="tags"
                  value={topic.specialty}
                  defaultChecked={filters.tags.includes(topic.specialty)}
                  className="mt-1"
                />
                <span>
                  {topic.plain}
                  <span className="mt-0.5 block text-[12px] text-meta">{topic.clinical}</span>
                </span>
              </span>
            </label>
          ))}
          <label className="font-sans text-[15px] text-ink">
            <span className="flex items-start gap-2">
              <input
                type="checkbox"
                name="tags"
                value={FIND_TOPIC_OTHER_OPTION.tag}
                defaultChecked={filters.tags.includes(FIND_TOPIC_OTHER_OPTION.tag)}
                className="mt-1"
              />
              <span>
                {FIND_TOPIC_OTHER_OPTION.plain}
                <span className="mt-0.5 block text-[12px] text-meta">
                  {FIND_TOPIC_OTHER_OPTION.clinical}
                </span>
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className={legendClass}>In person or online</legend>
        <div className="mt-2 flex flex-col gap-2">
          <label className="flex items-center gap-2 font-sans text-[15px] text-ink">
            <input
              type="checkbox"
              name="in_person"
              value="1"
              defaultChecked={filters.inPerson}
            />
            In person
          </label>
          <label className="flex items-center gap-2 font-sans text-[15px] text-ink">
            <input
              type="checkbox"
              name="virtual"
              value="1"
              defaultChecked={filters.virtual}
            />
            Online
          </label>
        </div>
      </fieldset>

      {layout === "one" ? <input type="hidden" name="layout" value="one" /> : null}

      <button type="submit" className={`${primaryPillClass} px-5 py-2.5`}>
        Show therapists
      </button>
    </form>
  );
}

/** Phone List / One at a time. Desktop already uses links in the results bar. */
export function FindNoJsBrowse({
  filters,
  layout,
}: {
  filters: SearchFilters;
  layout: "grid" | "one";
}) {
  const listHref = buildFindHref(filters, { layout: "grid" });
  const oneHref = buildFindHref(filters, { layout: "one" });
  const linkClass = "font-sans text-[15px] font-medium text-heading underline";

  return (
    <p className="mt-4 flex flex-wrap gap-4">
      <a href={listHref} aria-current={layout === "grid" ? "page" : undefined} className={linkClass}>
        List
      </a>
      <a href={oneHref} aria-current={layout === "one" ? "page" : undefined} className={linkClass}>
        One at a time
      </a>
    </p>
  );
}
