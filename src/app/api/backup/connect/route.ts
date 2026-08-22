import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getGoogleAuthUrl } from "@/lib/google-drive";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "COACH") {
    return new Response("No autorizado", { status: 401 });
  }

  redirect(getGoogleAuthUrl());
}
