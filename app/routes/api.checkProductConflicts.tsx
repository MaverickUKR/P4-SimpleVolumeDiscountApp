import { json } from "@remix-run/node";
import prisma from "../db.server";

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const productIds = JSON.parse(formData.get("productIds") as string) as string[];

  if (!productIds || productIds.length === 0) {
    return json({ error: "No product IDs provided" }, { status: 400 });
  }

  const conflicts = await Promise.all(
    productIds.map(async (id) => {
      const funnel = await prisma.funnel.findFirst({
        where: {
          products: {
            some: {
              product: {
                shopifyId: id,
              },
            },
          },
        },
      });
      return funnel ? { id, funnelName: funnel.name } : null;
    })
  );

  return json({
    conflicts: conflicts.filter(Boolean), // Возвращаем только конфликтующие продукты
  });
}
