/*
  Warnings:

  - You are about to drop the column `discountType` on the `DiscountLevel` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Product` table. All the data in the column will be lost.
  - Added the required column `title` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DiscountLevel" DROP COLUMN "discountType";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "name",
ADD COLUMN     "images" TEXT[],
ADD COLUMN     "title" TEXT NOT NULL;
