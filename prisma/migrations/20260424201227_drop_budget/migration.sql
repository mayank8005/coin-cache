/*
  Warnings:

  - You are about to drop the column `monthlyBudgetMinor` on the `Category` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "mono" TEXT NOT NULL,
    "iconId" TEXT NOT NULL,
    "colorHex" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Category" ("archived", "colorHex", "createdAt", "iconId", "id", "kind", "label", "mono", "updatedAt", "userId") SELECT "archived", "colorHex", "createdAt", "iconId", "id", "kind", "label", "mono", "updatedAt", "userId" FROM "Category";
DROP TABLE "Category";
ALTER TABLE "new_Category" RENAME TO "Category";
CREATE INDEX "Category_userId_idx" ON "Category"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
