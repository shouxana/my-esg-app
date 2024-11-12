/*
  Warnings:

  - The primary key for the `Education` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Education` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Education` table. All the data in the column will be lost.
  - The primary key for the `Gender` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Gender` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Gender` table. All the data in the column will be lost.
  - The primary key for the `ManagerialPosition` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `ManagerialPosition` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `ManagerialPosition` table. All the data in the column will be lost.
  - The primary key for the `MaritalStatus` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `MaritalStatus` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `MaritalStatus` table. All the data in the column will be lost.
  - The primary key for the `Position` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Position` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Position` table. All the data in the column will be lost.
  - Added the required column `education` to the `Education` table without a default value. This is not possible if the table is not empty.
  - Added the required column `education_id` to the `Education` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender` to the `Gender` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender_id` to the `Gender` table without a default value. This is not possible if the table is not empty.
  - Added the required column `managerial_position` to the `ManagerialPosition` table without a default value. This is not possible if the table is not empty.
  - Added the required column `managerial_position_id` to the `ManagerialPosition` table without a default value. This is not possible if the table is not empty.
  - Added the required column `marital_status` to the `MaritalStatus` table without a default value. This is not possible if the table is not empty.
  - Added the required column `marital_status_id` to the `MaritalStatus` table without a default value. This is not possible if the table is not empty.
  - Added the required column `position` to the `Position` table without a default value. This is not possible if the table is not empty.
  - Added the required column `position_id` to the `Position` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_education_id_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_gender_id_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_managerial_position_id_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_marital_status_id_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_position_id_fkey";

-- AlterTable
ALTER TABLE "Education" DROP CONSTRAINT "Education_pkey",
DROP COLUMN "id",
DROP COLUMN "name",
ADD COLUMN     "education" TEXT NOT NULL,
ADD COLUMN     "education_id" TEXT NOT NULL,
ADD CONSTRAINT "Education_pkey" PRIMARY KEY ("education_id");

-- AlterTable
ALTER TABLE "Gender" DROP CONSTRAINT "Gender_pkey",
DROP COLUMN "id",
DROP COLUMN "name",
ADD COLUMN     "gender" TEXT NOT NULL,
ADD COLUMN     "gender_id" TEXT NOT NULL,
ADD CONSTRAINT "Gender_pkey" PRIMARY KEY ("gender_id");

-- AlterTable
ALTER TABLE "ManagerialPosition" DROP CONSTRAINT "ManagerialPosition_pkey",
DROP COLUMN "id",
DROP COLUMN "name",
ADD COLUMN     "managerial_position" TEXT NOT NULL,
ADD COLUMN     "managerial_position_id" TEXT NOT NULL,
ADD CONSTRAINT "ManagerialPosition_pkey" PRIMARY KEY ("managerial_position_id");

-- AlterTable
ALTER TABLE "MaritalStatus" DROP CONSTRAINT "MaritalStatus_pkey",
DROP COLUMN "id",
DROP COLUMN "name",
ADD COLUMN     "marital_status" TEXT NOT NULL,
ADD COLUMN     "marital_status_id" TEXT NOT NULL,
ADD CONSTRAINT "MaritalStatus_pkey" PRIMARY KEY ("marital_status_id");

-- AlterTable
ALTER TABLE "Position" DROP CONSTRAINT "Position_pkey",
DROP COLUMN "id",
DROP COLUMN "name",
ADD COLUMN     "position" TEXT NOT NULL,
ADD COLUMN     "position_id" TEXT NOT NULL,
ADD CONSTRAINT "Position_pkey" PRIMARY KEY ("position_id");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_education_id_fkey" FOREIGN KEY ("education_id") REFERENCES "Education"("education_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_gender_id_fkey" FOREIGN KEY ("gender_id") REFERENCES "Gender"("gender_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_managerial_position_id_fkey" FOREIGN KEY ("managerial_position_id") REFERENCES "ManagerialPosition"("managerial_position_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_marital_status_id_fkey" FOREIGN KEY ("marital_status_id") REFERENCES "MaritalStatus"("marital_status_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "Position"("position_id") ON DELETE RESTRICT ON UPDATE CASCADE;
