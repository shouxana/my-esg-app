-- CreateTable
CREATE TABLE "EmployeeUpdateLog" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "full_name" TEXT NOT NULL,
    "changed_field" TEXT NOT NULL,
    "old_value" TEXT NOT NULL,
    "new_value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeUpdateLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EmployeeUpdateLog" ADD CONSTRAINT "EmployeeUpdateLog_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;
