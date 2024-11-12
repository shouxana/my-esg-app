-- CreateTable
CREATE TABLE "Employee" (
    "employee_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "employee_mail" TEXT NOT NULL,
    "birth_date" TIMESTAMP(3) NOT NULL,
    "employment_date" TIMESTAMP(3) NOT NULL,
    "termination_date" TIMESTAMP(3),
    "position_id" TEXT NOT NULL,
    "education_id" TEXT NOT NULL,
    "marital_status_id" TEXT NOT NULL,
    "gender_id" TEXT NOT NULL,
    "managerial_position_id" TEXT NOT NULL,
    "maternity_paternity_leave_id" TEXT,
    "maternity_paternity_leave_date" TIMESTAMP(3),
    "maternity_paternity_leave_end_date" TIMESTAMP(3),

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("employee_id")
);

-- CreateTable
CREATE TABLE "Position" (
    "position_id" TEXT NOT NULL,
    "position" TEXT NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("position_id")
);

-- CreateTable
CREATE TABLE "Education" (
    "education_id" TEXT NOT NULL,
    "education" TEXT NOT NULL,

    CONSTRAINT "Education_pkey" PRIMARY KEY ("education_id")
);

-- CreateTable
CREATE TABLE "MaritalStatus" (
    "marital_status_id" TEXT NOT NULL,
    "marital_status" TEXT NOT NULL,

    CONSTRAINT "MaritalStatus_pkey" PRIMARY KEY ("marital_status_id")
);

-- CreateTable
CREATE TABLE "Gender" (
    "gender_id" TEXT NOT NULL,
    "gender" TEXT NOT NULL,

    CONSTRAINT "Gender_pkey" PRIMARY KEY ("gender_id")
);

-- CreateTable
CREATE TABLE "ManagerialPosition" (
    "managerial_position_id" TEXT NOT NULL,
    "managerial_position" TEXT NOT NULL,

    CONSTRAINT "ManagerialPosition_pkey" PRIMARY KEY ("managerial_position_id")
);

-- CreateTable
CREATE TABLE "EmployeeChangeLog" (
    "id" SERIAL NOT NULL,
    "employee_id" TEXT NOT NULL,
    "changed_by" TEXT NOT NULL,
    "change_date" TIMESTAMP(3) NOT NULL,
    "changed_column" TEXT NOT NULL,
    "original_value" TEXT NOT NULL,
    "new_value" TEXT NOT NULL,

    CONSTRAINT "EmployeeChangeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employee_mail_key" ON "Employee"("employee_mail");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "Position"("position_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_education_id_fkey" FOREIGN KEY ("education_id") REFERENCES "Education"("education_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_marital_status_id_fkey" FOREIGN KEY ("marital_status_id") REFERENCES "MaritalStatus"("marital_status_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_gender_id_fkey" FOREIGN KEY ("gender_id") REFERENCES "Gender"("gender_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_managerial_position_id_fkey" FOREIGN KEY ("managerial_position_id") REFERENCES "ManagerialPosition"("managerial_position_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeChangeLog" ADD CONSTRAINT "EmployeeChangeLog_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;
