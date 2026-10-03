import { DefaultSession } from "next-auth";

type AppRole = "PATIENT" | "COACH" | "SETTER" | "CLOSER";

declare module "next-auth" {
  interface User {
    role: AppRole;
    sessionVersion: number;
  }

  interface Session {
    user: {
      id: string;
      role: AppRole;
      sessionVersion: number;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: AppRole;
    sessionVersion: number;
  }
}
