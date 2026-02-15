-- CreateTable: session_notes
CREATE TABLE "session_notes" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "campaignId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "sessionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "recap" TEXT,
  "summary" TEXT,
  "locations" TEXT,
  "npcs" TEXT,
  "combats" TEXT,
  "moments" TEXT,
  "decisions" TEXT,
  "rewards" TEXT,
  "hooks" TEXT,
  "gmNotes" TEXT,
  "endTime" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "session_notes_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "session_notes_campaignId_idx" ON "session_notes"("campaignId");
