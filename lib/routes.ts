export const routes = {
  home: "/",
  find: "/find",
  join: "/join",
  therapist: (id: string) => `/t/${id}`,
} as const;
