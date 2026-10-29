/** Drop native no-JS media so assertions can still see the scripted player. */
export function withoutNoJsMedia(html: string) {
  return html.replace(
    /<(?:video|audio)\b[^>]*\bdata-no-js=""[^>]*>[\s\S]*?<\/(?:video|audio)>/g,
    "",
  );
}
