/*
  Warnings:

  - Added the required column `discountType` to the `DiscountLevel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DiscountLevel" ADD COLUMN     "discountType" TEXT NOT NULL;
