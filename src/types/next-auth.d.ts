import type { DefaultSession } from "next-auth";

export type RoleName =
  | "CUSTOMER"
  | "GUIDE"
  | "STAFF"
  | "MANAGER"
  | "ADMIN"
  | "SUPER_ADMIN";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roles: RoleName[];
    } & DefaultSession["user"];
  }

  interface User {
    roles?: RoleName[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    roles?: RoleName[];
  }
}
