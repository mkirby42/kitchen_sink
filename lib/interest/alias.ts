/** Must match public.interest_alias in SQL. */
export function interestAlias(patientId: string) {
  return `Patient · ${patientId.replace(/-/g, "").slice(-4).toUpperCase()}`;
}
