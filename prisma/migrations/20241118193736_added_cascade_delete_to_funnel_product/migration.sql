-- DropForeignKey
ALTER TABLE "FunnelProduct" DROP CONSTRAINT "FunnelProduct_funnelId_fkey";

-- AddForeignKey
ALTER TABLE "FunnelProduct" ADD CONSTRAINT "FunnelProduct_funnelId_fkey" FOREIGN KEY ("funnelId") REFERENCES "Funnel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
