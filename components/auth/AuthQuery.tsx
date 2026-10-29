"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AuthFlash } from "@/lib/auth/auth-query";

const empty: AuthFlash = { error: "", email: "", sent: "" };

const AuthQueryContext = createContext<AuthFlash>(empty);

export function AuthQueryProvider({
  value,
  children,
}: {
  value: AuthFlash;
  children: ReactNode;
}) {
  return (
    <AuthQueryContext.Provider value={value}>{children}</AuthQueryContext.Provider>
  );
}

export function useAuthQuery(): AuthFlash {
  return useContext(AuthQueryContext);
}
