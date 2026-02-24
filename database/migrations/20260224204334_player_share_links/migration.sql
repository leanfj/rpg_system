-- CreateTable
CREATE TABLE "player_share_links" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerCharacterId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "revokedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "player_share_links_playerCharacterId_fkey" FOREIGN KEY ("playerCharacterId") REFERENCES "player_characters" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "player_share_links_tokenHash_key" ON "player_share_links"("tokenHash");

-- CreateIndex
CREATE INDEX "player_share_links_playerCharacterId_idx" ON "player_share_links"("playerCharacterId");

-- CreateIndex
CREATE INDEX "player_share_links_expiresAt_idx" ON "player_share_links"("expiresAt");
