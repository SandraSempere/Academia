import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { exchangeCodeForTokens } from "@/lib/google-drive";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "COACH") {
    return new Response("No autorizado", { status: 401 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error || !code) {
    redirect("/coach/backup?error=1");
  }

  const tokens = await exchangeCodeForTokens(code);
  if (!tokens.refresh_token) {
    // Google solo manda refresh_token la primera vez que se autoriza (o si
    // se fuerza con prompt=consent, que ya pedimos) — si por lo que sea no
    // llega, no podemos mantener la conexión y hay que avisar.
    redirect("/coach/backup?error=norefresh");
  }

  await prisma.backupConfig.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", refreshToken: tokens.refresh_token },
    update: { refreshToken: tokens.refresh_token },
  });

  redirect("/coach/backup?connected=1");
}
