/*
  Warnings:

  - You are about to drop the `FunnelProduct` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `funnelId` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "FunnelProduct" DROP CONSTRAINT "FunnelProduct_funnelId_fkey";

-- DropForeignKey
ALTER TABLE "FunnelProduct" DROP CONSTRAINT "FunnelProduct_productId_fkey";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "funnelId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "FunnelProduct";

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_funnelId_fkey" FOREIGN KEY ("funnelId") REFERENCES "Funnel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
