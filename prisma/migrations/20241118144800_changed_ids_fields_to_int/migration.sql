/*
  Warnings:

  - The primary key for the `DiscountLevel` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `DiscountLevel` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Funnel` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Funnel` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `FunnelProduct` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `FunnelProduct` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Product` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Product` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `funnelId` on the `DiscountLevel` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `funnelId` on the `FunnelProduct` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `productId` on the `FunnelProduct` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "DiscountLevel" DROP CONSTRAINT "DiscountLevel_funnelId_fkey";

-- DropForeignKey
ALTER TABLE "FunnelProduct" DROP CONSTRAINT "FunnelProduct_funnelId_fkey";

-- DropForeignKey
ALTER TABLE "FunnelProduct" DROP CONSTRAINT "FunnelProduct_productId_fkey";

-- AlterTable
ALTER TABLE "DiscountLevel" DROP CONSTRAINT "DiscountLevel_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "funnelId",
ADD COLUMN     "funnelId" INTEGER NOT NULL,
ADD CONSTRAINT "DiscountLevel_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Funnel" DROP CONSTRAINT "Funnel_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Funnel_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "FunnelProduct" DROP CONSTRAINT "FunnelProduct_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "funnelId",
ADD COLUMN     "funnelId" INTEGER NOT NULL,
DROP COLUMN "productId",
ADD COLUMN     "productId" INTEGER NOT NULL,
ADD CONSTRAINT "FunnelProduct_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Product" DROP CONSTRAINT "Product_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Product_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "FunnelProduct_funnelId_productId_key" ON "FunnelProduct"("funnelId", "productId");

-- AddForeignKey
ALTER TABLE "FunnelProduct" ADD CONSTRAINT "FunnelProduct_funnelId_fkey" FOREIGN KEY ("funnelId") REFERENCES "Funnel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunnelProduct" ADD CONSTRAINT "FunnelProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountLevel" ADD CONSTRAINT "DiscountLevel_funnelId_fkey" FOREIGN KEY ("funnelId") REFERENCES "Funnel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
