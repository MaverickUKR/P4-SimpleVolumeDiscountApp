// app/routes/app/delete-funnel.ts
import { json } from "@remix-run/node";
import prisma from "../db.server";

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const funnelId = parseInt(formData.get("funnelId") as string, 10);

  if (!funnelId) {
    return json({ error: "Invalid Funnel ID" }, { status: 400 });
  }

  try {
    await prisma.funnel.delete({
      where: { id: funnelId },
    });

    return json({ success: true });
  } catch (error) {
    console.error("Error deleting funnel:", error);
    return json({ error: "Failed to delete funnel" }, { status: 500 });
  }
}
