-- DropForeignKey
ALTER TABLE "DiscountLevel" DROP CONSTRAINT "DiscountLevel_funnelId_fkey";

-- AddForeignKey
ALTER TABLE "DiscountLevel" ADD CONSTRAINT "DiscountLevel_funnelId_fkey" FOREIGN KEY ("funnelId") REFERENCES "Funnel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
