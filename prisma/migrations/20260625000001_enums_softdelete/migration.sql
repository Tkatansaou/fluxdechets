-- Migration: enums pour UserRole, UserStatus, MemberRole + soft delete Paiement

-- CreateEnum (IF NOT EXISTS au cas où une tentative précédente les a créés)
DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'SUPERADMIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'CHAUFFEUR', 'RECOUVREMENT', 'MAIRIE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- User.role : nouvelle colonne enum, copie via CASE, suppression ancienne, renommage
ALTER TABLE "User" ADD COLUMN "role_enum" "UserRole" NOT NULL DEFAULT 'USER'::"UserRole";
UPDATE "User" SET "role_enum" = CASE
  WHEN "role" = 'ADMIN'      THEN 'ADMIN'::"UserRole"
  WHEN "role" = 'SUPERADMIN' THEN 'SUPERADMIN'::"UserRole"
  ELSE                             'USER'::"UserRole"
END;
ALTER TABLE "User" DROP COLUMN "role";
ALTER TABLE "User" RENAME COLUMN "role_enum" TO "role";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER'::"UserRole";

-- User.status : même approche
ALTER TABLE "User" ADD COLUMN "status_enum" "UserStatus" NOT NULL DEFAULT 'ACTIVE'::"UserStatus";
UPDATE "User" SET "status_enum" = CASE
  WHEN "status" = 'SUSPENDED' THEN 'SUSPENDED'::"UserStatus"
  ELSE                              'ACTIVE'::"UserStatus"
END;
ALTER TABLE "User" DROP COLUMN "status";
ALTER TABLE "User" RENAME COLUMN "status_enum" TO "status";
ALTER TABLE "User" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'::"UserStatus";

-- OrganizationMember.role : même approche
ALTER TABLE "OrganizationMember" ADD COLUMN "role_enum" "MemberRole" NOT NULL DEFAULT 'MEMBER'::"MemberRole";
UPDATE "OrganizationMember" SET "role_enum" = CASE
  WHEN "role" = 'OWNER'        THEN 'OWNER'::"MemberRole"
  WHEN "role" = 'ADMIN'        THEN 'ADMIN'::"MemberRole"
  WHEN "role" = 'CHAUFFEUR'    THEN 'CHAUFFEUR'::"MemberRole"
  WHEN "role" = 'RECOUVREMENT' THEN 'RECOUVREMENT'::"MemberRole"
  WHEN "role" = 'MAIRIE'       THEN 'MAIRIE'::"MemberRole"
  ELSE                               'MEMBER'::"MemberRole"
END;
ALTER TABLE "OrganizationMember" DROP COLUMN "role";
ALTER TABLE "OrganizationMember" RENAME COLUMN "role_enum" TO "role";
ALTER TABLE "OrganizationMember" ALTER COLUMN "role" SET DEFAULT 'MEMBER'::"MemberRole";

-- Paiement : soft delete
ALTER TABLE "Paiement" ADD COLUMN     "deletedAt" TIMESTAMP(3);
CREATE INDEX "Paiement_deletedAt_idx" ON "Paiement"("deletedAt");
