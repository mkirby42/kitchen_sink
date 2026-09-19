export const routes = {
  home: "/",
  find: "/find",
  join: "/join",
  matches: "/matches",
  therapist: (id: string) => `/t/${id}`,
} as const;
