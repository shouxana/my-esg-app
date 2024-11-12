/*
  Warnings:

  - The primary key for the `Education` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `education` on the `Education` table. All the data in the column will be lost.
  - You are about to drop the column `education_id` on the `Education` table. All the data in the column will be lost.
  - The primary key for the `Employee` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `employee_id` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `maternity_paternity_leave_date` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `maternity_paternity_leave_end_date` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `maternity_paternity_leave_id` on the `Employee` table. All the data in the column will be lost.
  - The primary key for the `Gender` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `gender` on the `Gender` table. All the data in the column will be lost.
  - You are about to drop the column `gender_id` on the `Gender` table. All the data in the column will be lost.
  - The primary key for the `ManagerialPosition` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `managerial_position` on the `ManagerialPosition` table. All the data in the column will be lost.
  - You are about to drop the column `managerial_position_id` on the `ManagerialPosition` table. All the data in the column will be lost.
  - The primary key for the `MaritalStatus` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `marital_status` on the `MaritalStatus` table. All the data in the column will be lost.
  - You are about to drop the column `marital_status_id` on the `MaritalStatus` table. All the data in the column will be lost.
  - The primary key for the `Position` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `position` on the `Position` table. All the data in the column will be lost.
  - You are about to drop the column `position_id` on the `Position` table. All the data in the column will be lost.
  - You are about to drop the `EmployeeChangeLog` table. If the table is not empty, all the data it contains will be lost.
  - The required column `id` was added to the `Education` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `name` to the `Education` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `Employee` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `updated_at` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `Gender` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `name` to the `Gender` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `ManagerialPosition` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `name` to the `ManagerialPosition` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `MaritalStatus` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `name` to the `MaritalStatus` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `Position` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `name` to the `Position` table without a default value. This is not possible if the table is not empty.

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

-- DropForeignKey
ALTER TABLE "EmployeeChangeLog" DROP CONSTRAINT "EmployeeChangeLog_employee_id_fkey";

-- AlterTable
ALTER TABLE "Education" DROP CONSTRAINT "Education_pkey",
DROP COLUMN "education",
DROP COLUMN "education_id",
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD CONSTRAINT "Education_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_pkey",
DROP COLUMN "employee_id",
DROP COLUMN "maternity_paternity_leave_date",
DROP COLUMN "maternity_paternity_leave_end_date",
DROP COLUMN "maternity_paternity_leave_id",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "Employee_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Gender" DROP CONSTRAINT "Gender_pkey",
DROP COLUMN "gender",
DROP COLUMN "gender_id",
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD CONSTRAINT "Gender_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ManagerialPosition" DROP CONSTRAINT "ManagerialPosition_pkey",
DROP COLUMN "managerial_position",
DROP COLUMN "managerial_position_id",
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD CONSTRAINT "ManagerialPosition_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "MaritalStatus" DROP CONSTRAINT "MaritalStatus_pkey",
DROP COLUMN "marital_status",
DROP COLUMN "marital_status_id",
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD CONSTRAINT "MaritalStatus_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Position" DROP CONSTRAINT "Position_pkey",
DROP COLUMN "position",
DROP COLUMN "position_id",
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD CONSTRAINT "Position_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "EmployeeChangeLog";

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "Position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_education_id_fkey" FOREIGN KEY ("education_id") REFERENCES "Education"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_marital_status_id_fkey" FOREIGN KEY ("marital_status_id") REFERENCES "MaritalStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_gender_id_fkey" FOREIGN KEY ("gender_id") REFERENCES "Gender"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_managerial_position_id_fkey" FOREIGN KEY ("managerial_position_id") REFERENCES "ManagerialPosition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
