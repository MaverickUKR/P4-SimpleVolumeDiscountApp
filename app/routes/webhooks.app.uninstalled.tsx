import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  // // Найти магазин с продуктами
  // const shopRecord = await db.shop.findUnique({
  //   where: { shop },
  //   include: {
  //     products: true,
  //   },
  // });

  // if (shopRecord) {
  //   try {

  //     if (admin) {

  //       // Удаляем метафилды продуктов
  //       for (const product of shopRecord.products) {
  //         try {
  //           const metafieldQuery = `
  //             query {
  //               product(id: "${product.shopifyId}") {
  //                 metafields(first: 100) {
  //                   edges {
  //                     node {
  //                       id
  //                       key
  //                       namespace
  //                     }
  //                   }
  //                 }
  //               }
  //             }
  //           `;

  //           const metafieldResponse: any = await admin.graphql(metafieldQuery);
  //           const allMetafields =
  //             metafieldResponse?.data?.product?.metafields?.edges || [];

  //           const metafieldsToDelete = allMetafields
  //             .filter(
  //               (metafield: any) =>
  //                 metafield.node.namespace === "discount_data"
  //             )
  //             .map((metafield: any) => ({
  //               key: metafield.node.key,
  //               namespace: metafield.node.namespace,
  //               ownerId: product.shopifyId,
  //             }));

  //           if (metafieldsToDelete.length > 0) {
  //             const deleteQuery = `
  //               mutation metafieldsDelete($metafields: [MetafieldIdentifierInput!]!) {
  //                 metafieldsDelete(metafields: $metafields) {
  //                   deletedMetafields {
  //                     key
  //                     namespace
  //                     ownerId
  //                   }
  //                   userErrors {
  //                     field
  //                     message
  //                   }
  //                 }
  //               }
  //             `;

  //             const deleteResponse: any = await admin.graphql(deleteQuery, {
  //               variables: { metafields: metafieldsToDelete },
  //             });

  //             if (deleteResponse?.data?.metafieldsDelete?.userErrors?.length) {
  //               console.error(
  //                 `Errors while deleting metafields for product ${product.shopifyId}:`,
  //                 deleteResponse.data.metafieldsDelete.userErrors
  //               );
  //             } else {
  //               console.log(
  //                 `Metafields deleted successfully for product ${product.shopifyId}`
  //               );
  //             }
  //           } else {
  //             console.warn(
  //               `No metafields found for product ${product.shopifyId} in namespace "discount_data".`
  //             );
  //           }
  //         } catch (metafieldError) {
  //           console.error(
  //             `Error deleting metafields for product ${product.shopifyId}:`,
  //             metafieldError
  //           );
  //         }
  //       }
  //     } else {
  //       console.warn(`Admin context is not available for shop ${shop}. Skipping metafield deletion.`);
  //     }

      // Удаляем магазин (каскадное удаление)
      await db.shop.delete({ where: { shop } });
      if (session) {
        await db.session.delete({
          where: { id: session.id },
        });
      }
  //     }
  //     console.log(`All data for shop ${shop} has been deleted.`);
  //   } catch (error) {
  //     console.error(`Error deleting shop data or metafields for ${shop}:`, error);
  //
  return new Response();
};



// import type { ActionFunctionArgs } from "@remix-run/node";
// import { authenticate } from "../shopify.server";
// import db from "../db.server";

// export const action = async ({ request }: ActionFunctionArgs) => {
//   const { shop, session, topic } = await authenticate.webhook(request);

//   console.log(`Received ${topic} webhook for ${shop}`);

//   // Webhook requests can trigger multiple times and after an app has already been uninstalled.
//   // If this webhook already ran, the session may have been deleted previously.
//   if (session) {
//     await db.session.deleteMany({ where: { shop } });
//   }

//   return new Response();
// };
