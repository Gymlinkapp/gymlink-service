-- CreateEnum
CREATE TYPE "Workout" AS ENUM ('CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'BICEPS', 'TRICEPS');

-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "Goals" AS ENUM ('WEIGHT_LOSS', 'WEIGHT_GAIN', 'MUSCLE_GAIN', 'MUSCLE_LOSS');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "filtersId" TEXT;

-- CreateTable
CREATE TABLE "Filters" (
    "id" TEXT NOT NULL,
    "goingToday" BOOLEAN NOT NULL DEFAULT false,
    "workout" "Workout"[] DEFAULT ARRAY[]::"Workout"[],
    "skillLevel" "SkillLevel"[] DEFAULT ARRAY[]::"SkillLevel"[],
    "gender" "Gender"[] DEFAULT ARRAY[]::"Gender"[],
    "goals" "Goals"[] DEFAULT ARRAY[]::"Goals"[],

    CONSTRAINT "Filters_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_filtersId_fkey" FOREIGN KEY ("filtersId") REFERENCES "Filters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
