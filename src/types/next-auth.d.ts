import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: "PATIENT" | "COACH";
  }

  interface Session {
    user: {
      id: string;
      role: "PATIENT" | "COACH";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "PATIENT" | "COACH";
  }
}
