/*
  Warnings:

  - You are about to drop the column `disliked` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `liked` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `FriendRequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_friends` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "FriendRequest" DROP CONSTRAINT "FriendRequest_fromUserId_fkey";

-- DropForeignKey
ALTER TABLE "FriendRequest" DROP CONSTRAINT "FriendRequest_toUserId_fkey";

-- DropForeignKey
ALTER TABLE "_friends" DROP CONSTRAINT "_friends_A_fkey";

-- DropForeignKey
ALTER TABLE "_friends" DROP CONSTRAINT "_friends_B_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "disliked",
DROP COLUMN "liked";

-- DropTable
DROP TABLE "FriendRequest";

-- DropTable
DROP TABLE "_friends";
