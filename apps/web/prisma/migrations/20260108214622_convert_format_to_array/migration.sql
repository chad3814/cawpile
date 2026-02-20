/*
  Warnings:

  - Changed the column `format` on the `UserBook` table from a scalar field to a list field. If there are non-null values in that column, this step will fail.

*/

-- Step 1: Add a temporary column to hold array values
ALTER TABLE "public"."UserBook" ADD COLUMN "format_array" "public"."BookFormat"[];

-- Step 2: Migrate existing data - convert single format to array
UPDATE "public"."UserBook" SET "format_array" = ARRAY["format"]::"public"."BookFormat"[] WHERE "format" IS NOT NULL;

-- Step 3: Handle NULL values (set to PAPERBACK as default)
UPDATE "public"."UserBook" SET "format_array" = ARRAY['PAPERBACK']::"public"."BookFormat"[] WHERE "format" IS NULL;

-- Step 4: Drop the old format column
ALTER TABLE "public"."UserBook" DROP COLUMN "format";

-- Step 5: Rename the temporary column to format
ALTER TABLE "public"."UserBook" RENAME COLUMN "format_array" TO "format";

-- Step 6: Set NOT NULL constraint (all records should have at least one format now)
ALTER TABLE "public"."UserBook" ALTER COLUMN "format" SET NOT NULL;

/*
  Rollback procedure (if needed):
  1. Add temporary scalar column: ALTER TABLE "public"."UserBook" ADD COLUMN "format_scalar" "public"."BookFormat";
  2. Take first element: UPDATE "public"."UserBook" SET "format_scalar" = "format"[1];
  3. Drop array column: ALTER TABLE "public"."UserBook" DROP COLUMN "format";
  4. Rename back: ALTER TABLE "public"."UserBook" RENAME COLUMN "format_scalar" TO "format";
  5. Set NOT NULL: ALTER TABLE "public"."UserBook" ALTER COLUMN "format" SET NOT NULL;
*/
