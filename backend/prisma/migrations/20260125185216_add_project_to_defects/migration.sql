/*
  Warnings:

  - Added the required column `testProjectId` to the `defects` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "defects" ADD COLUMN     "testProjectId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "defects" ADD CONSTRAINT "defects_testProjectId_fkey" FOREIGN KEY ("testProjectId") REFERENCES "test_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
