/*
  Warnings:

  - You are about to drop the column `filtersId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Filters` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_filtersId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "filtersId",
ADD COLUMN     "filterGender" "Gender"[] DEFAULT ARRAY[]::"Gender"[],
ADD COLUMN     "filterGoals" "Goals"[] DEFAULT ARRAY[]::"Goals"[],
ADD COLUMN     "filterGoingToday" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "filterSkillLevel" "SkillLevel"[] DEFAULT ARRAY[]::"SkillLevel"[],
ADD COLUMN     "filterWorkout" "Workout"[] DEFAULT ARRAY[]::"Workout"[];

-- DropTable
DROP TABLE "Filters";
