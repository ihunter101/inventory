/*
  Warnings:

  - The values [ClientUser] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('admin', 'inventoryClerk', 'labStaff', 'orderAgent', 'viewer', 'clientAdmin', 'clientUser', 'staffLead', 'adminLead');
ALTER TABLE "public"."Users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "Users" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "Users" ALTER COLUMN "role" SET DEFAULT 'viewer';
COMMIT;
