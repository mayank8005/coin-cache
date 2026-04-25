-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "initials" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6B2149',
    "paletteId" TEXT NOT NULL DEFAULT 'plum',
    "role" TEXT NOT NULL DEFAULT 'member',
    "vizStyle" TEXT NOT NULL DEFAULT 'rings',
    "chipStyle" TEXT NOT NULL DEFAULT 'rings',
    "chipRep" TEXT NOT NULL DEFAULT 'mono',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "llmBaseUrl" TEXT,
    "llmApiKey" TEXT,
    "llmModel" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("chipStyle", "color", "createdAt", "currency", "displayName", "email", "id", "initials", "llmApiKey", "llmBaseUrl", "llmModel", "paletteId", "pinHash", "role", "updatedAt", "vizStyle") SELECT "chipStyle", "color", "createdAt", "currency", "displayName", "email", "id", "initials", "llmApiKey", "llmBaseUrl", "llmModel", "paletteId", "pinHash", "role", "updatedAt", "vizStyle" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
