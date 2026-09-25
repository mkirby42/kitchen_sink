/** Public directory flag. Missing means listed, so an older row shape still shows. */
export function isDirectoryListed(listed: boolean | null | undefined) {
  return listed !== false;
}
