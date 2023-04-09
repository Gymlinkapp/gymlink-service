/*
  Warnings:

  - The `filterGender` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `filterGoals` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `filterSkillLevel` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `filterWorkout` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "filterGender",
ADD COLUMN     "filterGender" TEXT[] DEFAULT ARRAY[]::TEXT[],
DROP COLUMN "filterGoals",
ADD COLUMN     "filterGoals" TEXT[] DEFAULT ARRAY[]::TEXT[],
DROP COLUMN "filterSkillLevel",
ADD COLUMN     "filterSkillLevel" TEXT[] DEFAULT ARRAY[]::TEXT[],
DROP COLUMN "filterWorkout",
ADD COLUMN     "filterWorkout" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- DropEnum
DROP TYPE "Gender";

-- DropEnum
DROP TYPE "Goals";

-- DropEnum
DROP TYPE "SkillLevel";

-- DropEnum
DROP TYPE "Workout";
