export function needsSupervisor(credential: string | null | undefined) {
  if (!credential) return false;
  return /associate|trainee/i.test(credential);
}
