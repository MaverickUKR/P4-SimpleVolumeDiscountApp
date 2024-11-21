// source/app/api/actions/funnel_table.action.ts
import { json } from "@remix-run/node";
import prisma from "../../db.server";
import { getAdminContext } from "app/shopify.server";

export async function funnelAction(request: Request) {
  if (request.method !== "POST") {
    return json({ error: "Invalid request method" }, { status: 405 });
  }
  const formData = await request.formData();
  const funnelId = parseInt(formData.get('funnelId') as string, 10);
  console.log(request);
  console.log("typeof formData:", typeof request.formData);

  if (!funnelId) {
    return json({ error: 'Invalid Funnel ID' }, { status: 400 });
  }

  try {
    const adminContext = await getAdminContext(request);
    const admin = adminContext.admin;

    const funnel = await prisma.funnel.findUnique({
      where: { id: funnelId },
      include: { products: true },
    });

    if (!funnel) {
      return json({ error: 'Funnel not found' }, { status: 404 });
    }

    for (const product of funnel.products) {
      const query = `
        mutation {
          metafieldDelete(input: {
            id: "${product.shopifyId}",
            namespace: "product_data",
            key: "volume_discount"
          }) {
            deletedId
            userErrors {
              field
              message
            }
          }
        }
      `;

     await admin.graphql(query);
    }

    await prisma.funnel.delete({
      where: { id: funnelId },
    });

    return json({ success: true });
  } catch (error) {
    console.error('Error deleting funnel:', error);
    return json({ error: 'Failed to delete funnel' }, { status: 500 });
  }
}
