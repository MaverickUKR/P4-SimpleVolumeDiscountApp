/*
  Warnings:

  - Added the required column `shopId` to the `Funnel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Funnel" ADD COLUMN     "shopId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Funnel" ADD CONSTRAINT "Funnel_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
