import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { RoleName } from "@/types/next-auth";

const ROLE_RANK: Record<RoleName, number> = {
  CUSTOMER: 1,
  GUIDE: 2,
  STAFF: 3,
  MANAGER: 4,
  ADMIN: 5,
  SUPER_ADMIN: 6,
};

export type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  roles: RoleName[];
};

export function hasRole(user: SessionUser, ...roles: RoleName[]): boolean {
  return user.roles.some((r) => roles.includes(r));
}

export function atLeast(user: SessionUser, min: RoleName): boolean {
  const rank = ROLE_RANK[min];
  return user.roles.some((r) => ROLE_RANK[r] >= rank);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  return session?.user ?? null;
}

/** Server-component guard: redirect to login when unauthenticated. */
export async function requireUser(callbackUrl?: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    const suffix = callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : "";
    redirect(`/auth/login${suffix}`);
  }
  return user;
}

/** Server-component guard: minimum-role gate for /admin. */
export async function requireRole(min: RoleName): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login?callbackUrl=/admin");
  if (!atLeast(user, min)) redirect("/account");
  return user;
}

/** Route-handler guard: returns the user or null (respond with 401). */
export async function apiUser(): Promise<SessionUser | null> {
  return getSessionUser();
}
