-- CreateEnum
CREATE TYPE "public"."DashboardLayout" AS ENUM ('GRID', 'TABLE');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "dashboardLayout" "public"."DashboardLayout" NOT NULL DEFAULT 'GRID';
