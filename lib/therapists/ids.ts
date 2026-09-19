export const MAYA_ID = "11111111-1111-4111-8111-111111111111";
export const MAYA_SLUG = "maya";

export function resolveTherapistId(id: string) {
  if (id === MAYA_SLUG) return MAYA_ID;
  return id;
}
