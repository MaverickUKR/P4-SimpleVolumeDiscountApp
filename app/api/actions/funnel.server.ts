// app/api/actions/funnel.server.ts
import prisma from "../../db.server";
import { getAdminContext } from "../../shopify.server";
import { concatenateVolumeAndDiscount } from "../../utils/concatVolumeAndDiscount";
import { json, redirect } from "@remix-run/node";

type DiscountLevel = {
  id: number;
  volume: number;
  discount: number;
  description: string;
  label: string;
};

type Product = {
  id: string;
  name: string;
  imageUrl: string;
};

export async function handleFunnelCreation(request: Request) {
  const adminContext = await getAdminContext(request);
  const shop = adminContext.session.shop;
  const admin = adminContext.admin;

  const formData = await request.formData();
  const name = formData.get("name");
  const autoLabels = JSON.parse(formData.get("autoLabels") as string);
  const selectedProducts = JSON.parse(formData.get("selectedProducts") as string);
  const discountLevels = JSON.parse(formData.get("discountLevels") as string);

  if (!name || !selectedProducts || !discountLevels) {
    return json({ error: "Missing required fields" }, { status: 400 });
  }

  const { metafieldValue } = concatenateVolumeAndDiscount(discountLevels);

  let existingShop = await prisma.shop.findUnique({ where: { shop } });

  if (!existingShop) {
    existingShop = await prisma.shop.create({
      data: { shop },
    });
  }

  const conflictProducts: Product[] = [];

  try {
    // Создаем Funnel
    const newFunnel = await prisma.funnel.create({
      data: {
        name: name as string,
        autoLabels: autoLabels as boolean,
        discountLevels: {
          create: discountLevels.map((level: DiscountLevel) => ({
            volume: level.volume,
            discount: level.discount,
            description: level.description,
            label: level.label,
          })),
        },
      },
    });

    for (const product of selectedProducts) {
      const query = `
        query {
          product(id: "${product.id}") {
            metafield(namespace: "product_data", key: "volume_discount") {
              value
            }
          }
        }
      `;
      const response: any = await admin.graphql(query);
      const metafield = response?.data?.product?.metafield?.value;

      if (metafield) {
        conflictProducts.push(product);
        continue;
      }

      await prisma.product.upsert({
        where: { shopifyId: product.id },
        update: { funnelId: newFunnel.id },
        create: {
          shopifyId: product.id,
          title: product.name,
          images: [product.imageUrl],
          shopId: existingShop.id,
          funnelId: newFunnel.id,
        },
      });

      const mutation = `
        mutation {
          metafieldsSet(metafields: [
            {
              namespace: "product_data",
              key: "volume_discount",
              type: "string",
              value: "${metafieldValue}",
              ownerId: "${product.id}"
            }
          ]) {
            userErrors {
              field
              message
            }
          }
        }
      `;
      await admin.graphql(mutation);
    }

    if (conflictProducts.length > 0) {
      return json({ error: "Some products already have volume_discount metafields", conflictProducts });
    }

    return redirect("/app/funnel_table");
  } catch (error) {
    console.error("Error creating funnel:", error);
    return json({ error: "Failed to create funnel" }, { status: 500 });
  }
}


// import { json, redirect } from "@remix-run/node";
// import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
// import prisma from "~/db.server";

// type DiscountLevel = {
//   volume: number;
//   discountType: string;
//   discount: number;
//   description: string;
//   label: string;
// };

// type Product = {
//   id: string;
//   name: string;
//   imageUrl: string;
// };

// export type ActionData = {
//   error?: string;
//   success?: boolean;
// };

// export async function action({ request }: { request: Request }) {
//   const formData = await request.formData();

//   const name = formData.get("name");
//   const autoLabels = JSON.parse(formData.get("autoLabels") as string);
//   const selectedProducts = JSON.parse(formData.get("selectedProducts") as string);
//   const discountLevels = JSON.parse(formData.get("discountLevels") as string);

//   if (!name || !selectedProducts || !discountLevels) {
//     return json<ActionData>({ error: "Missing required fields" }, { status: 400 });
//   }

//   try {
//     const createdFunnel = await prisma.funnel.create({
//       data: {
//         name: name as string,
//         autoLabels,
//         products: {
//           connect: selectedProducts.map((product: { id: string }) => ({ id: product.id })),
//         },
//         discountLevels: {
//           create: discountLevels.map((level: DiscountLevel) => ({
//             volume: level.volume,
//             discountType: level.discountType,
//             discount: level.discount,
//             description: level.description,
//             label: level.label,
//           })),
//         },
//       },
//     });

//     return json<ActionData>({ success: true });
//   } catch (error) {
//     console.error("Error creating funnel:", error);
//     return json<ActionData>({ error: "Failed to create funnel" }, { status: 500 });
//   }
// }


// import { redirect, json } from "@remix-run/node";
// import prisma from "../../db.server";
// import type { ActionFunction } from "@remix-run/node";
// import type { DiscountLevel, Product } from "~/types";

// export const action: ActionFunction = async ({ request }) => {
//   const formData = await request.formData();

//   // Получаем значения из формы
//   const name = formData.get("name") as string;
//   const autoLabels = formData.get("autoLabels") === "true";
//   const selectedProducts = JSON.parse(formData.get("selectedProducts") as string) as Product[];
//   const discountLevels = JSON.parse(formData.get("discountLevels") as string) as DiscountLevel[];

//   try {
//     // Создаем новую воронку (Funnel)
//     const funnel = await prisma.funnel.create({
//       data: {
//         name,
//         autoLabels,
//         products: {
//           connect: selectedProducts.map((product) => ({ id: product.id })),
//         },
//         discountLevels: {
//           create: discountLevels.map((level) => ({
//             volume: parseInt(level.volume, 10),
//             discountType: level.discountType,
//             discount: parseFloat(level.discount),
//             description: level.description,
//             label: level.label,
//           })),
//         },
//       },
//     });

//     return redirect(`/funnels/${funnel.id}`);
//   } catch (error) {
//     console.error("Error creating funnel:", error);
//     return json({ error: "Failed to create funnel" }, { status: 500 });
//   }
// };
