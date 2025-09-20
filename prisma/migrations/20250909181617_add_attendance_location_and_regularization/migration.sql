-- CreateEnum
CREATE TYPE "public"."AttendanceRegularizationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "public"."attendance" ADD COLUMN     "checkInLocation" JSONB,
ADD COLUMN     "checkOutLocation" JSONB,
ADD COLUMN     "isRegularized" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "regularizedAt" TIMESTAMP(3),
ADD COLUMN     "regularizedBy" TEXT;

-- CreateTable
CREATE TABLE "public"."attendance_regularization_requests" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "public"."AttendanceRegularizationStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewComments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_regularization_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attendance_regularization_requests_employeeId_date_key" ON "public"."attendance_regularization_requests"("employeeId", "date");

-- AddForeignKey
ALTER TABLE "public"."attendance" ADD CONSTRAINT "attendance_regularizedBy_fkey" FOREIGN KEY ("regularizedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance_regularization_requests" ADD CONSTRAINT "attendance_regularization_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance_regularization_requests" ADD CONSTRAINT "attendance_regularization_requests_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
