import { redirect, json } from "@remix-run/node";
import prisma from "../../db.server";
import type { ActionFunction } from "@remix-run/node";
import type { DiscountLevel, Product } from "~/types";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();

  // Получаем значения из формы
  const name = formData.get("name") as string;
  const autoLabels = formData.get("autoLabels") === "true";
  const selectedProducts = JSON.parse(formData.get("selectedProducts") as string) as Product[];
  const discountLevels = JSON.parse(formData.get("discountLevels") as string) as DiscountLevel[];

  try {
    // Создаем новую воронку (Funnel)
    const funnel = await prisma.funnel.create({
      data: {
        name,
        autoLabels,
        products: {
          connect: selectedProducts.map((product) => ({ id: product.id })),
        },
        discountLevels: {
          create: discountLevels.map((level) => ({
            volume: parseInt(level.volume, 10),
            discountType: level.discountType,
            discount: parseFloat(level.discount),
            description: level.description,
            label: level.label,
          })),
        },
      },
    });

    return redirect(`/funnels/${funnel.id}`);
  } catch (error) {
    console.error("Error creating funnel:", error);
    return json({ error: "Failed to create funnel" }, { status: 500 });
  }
};
