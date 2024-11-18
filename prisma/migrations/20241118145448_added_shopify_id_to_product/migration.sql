/*
  Warnings:

  - A unique constraint covering the columns `[shopifyId]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `shopifyId` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "shopifyId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Product_shopifyId_key" ON "Product"("shopifyId");
