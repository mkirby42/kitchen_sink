const ACRONYMS: Record<string, string> = {
  act: "ACT",
  adhd: "ADHD",
  bcbs: "BCBS",
  bipoc: "BIPOC",
  cbt: "CBT",
  dbt: "DBT",
  emdr: "EMDR",
  ifs: "IFS",
  lcsw: "LCSW",
  lgbtq: "LGBTQ",
  lmft: "LMFT",
  lpc: "LPC",
  md: "MD",
  phd: "PhD",
  psyd: "PsyD",
  ptsd: "PTSD",
  sfbt: "SFBT",
};

/** First word capitalized, the rest lower, acronyms left intact. */
export function sentenceCasePhrase(value: string) {
  let seenWord = false;
  return value.replace(/[A-Za-z][A-Za-z'+]*/g, (word) => {
    const acronym = ACRONYMS[word.toLowerCase()];
    if (acronym) {
      seenWord = true;
      return acronym;
    }
    const next = seenWord
      ? word.toLowerCase()
      : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    seenWord = true;
    return next;
  });
}

/** Sentence-case each " · " separated credential or meta segment. */
export function sentenceCaseSegments(value: string) {
  return value
    .split(" · ")
    .map((part) => sentenceCasePhrase(part))
    .join(" · ");
}
