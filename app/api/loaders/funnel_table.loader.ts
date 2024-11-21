// source/app/api/loaders/funnel_table.loader.ts
import { json } from "@remix-run/node";
import prisma from "../../db.server";

export async function funnelLoader() {
  const offers = await prisma.funnel.findMany({
    include: {
      products: true,
    },
  });

  const formattedOffers = offers.map((offer) => ({
    id: offer.id.toString(),
    name: offer.name,
    creationDate: new Date(offer.createdAt).toLocaleDateString(),
    products: offer.products.length,
    status: offer.autoLabels ? "Active" : "Inactive",
  }));

  return json({ offers: formattedOffers });
}
