-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'unknown',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "locations_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "story_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "impact" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "story_events_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "session_notes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "importance" TEXT NOT NULL DEFAULT 'normal',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "session_notes_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "session_note_npcs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionNoteId" TEXT NOT NULL,
    "npcId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "session_note_npcs_sessionNoteId_fkey" FOREIGN KEY ("sessionNoteId") REFERENCES "session_notes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "session_note_npcs_npcId_fkey" FOREIGN KEY ("npcId") REFERENCES "npcs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "session_note_players" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionNoteId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "session_note_players_sessionNoteId_fkey" FOREIGN KEY ("sessionNoteId") REFERENCES "session_notes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "session_note_players_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "player_characters" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "session_note_quests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionNoteId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "session_note_quests_sessionNoteId_fkey" FOREIGN KEY ("sessionNoteId") REFERENCES "session_notes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "session_note_quests_questId_fkey" FOREIGN KEY ("questId") REFERENCES "quests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "session_note_locations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionNoteId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "session_note_locations_sessionNoteId_fkey" FOREIGN KEY ("sessionNoteId") REFERENCES "session_notes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "session_note_locations_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "session_note_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionNoteId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "session_note_events_sessionNoteId_fkey" FOREIGN KEY ("sessionNoteId") REFERENCES "session_notes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "session_note_events_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "story_events" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "title" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planned',
    CONSTRAINT "sessions_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_sessions" ("campaignId", "endedAt", "id", "notes", "startedAt", "title") SELECT "campaignId", "endedAt", "id", "notes", "startedAt", "title" FROM "sessions";
DROP TABLE "sessions";
ALTER TABLE "new_sessions" RENAME TO "sessions";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "locations_campaignId_idx" ON "locations"("campaignId");

-- CreateIndex
CREATE INDEX "story_events_campaignId_idx" ON "story_events"("campaignId");

-- CreateIndex
CREATE INDEX "session_notes_sessionId_idx" ON "session_notes"("sessionId");

-- CreateIndex
CREATE INDEX "session_notes_phase_idx" ON "session_notes"("phase");

-- CreateIndex
CREATE INDEX "session_note_npcs_sessionNoteId_idx" ON "session_note_npcs"("sessionNoteId");

-- CreateIndex
CREATE INDEX "session_note_npcs_npcId_idx" ON "session_note_npcs"("npcId");

-- CreateIndex
CREATE UNIQUE INDEX "session_note_npcs_sessionNoteId_npcId_key" ON "session_note_npcs"("sessionNoteId", "npcId");

-- CreateIndex
CREATE INDEX "session_note_players_sessionNoteId_idx" ON "session_note_players"("sessionNoteId");

-- CreateIndex
CREATE INDEX "session_note_players_playerId_idx" ON "session_note_players"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "session_note_players_sessionNoteId_playerId_key" ON "session_note_players"("sessionNoteId", "playerId");

-- CreateIndex
CREATE INDEX "session_note_quests_sessionNoteId_idx" ON "session_note_quests"("sessionNoteId");

-- CreateIndex
CREATE INDEX "session_note_quests_questId_idx" ON "session_note_quests"("questId");

-- CreateIndex
CREATE UNIQUE INDEX "session_note_quests_sessionNoteId_questId_key" ON "session_note_quests"("sessionNoteId", "questId");

-- CreateIndex
CREATE INDEX "session_note_locations_sessionNoteId_idx" ON "session_note_locations"("sessionNoteId");

-- CreateIndex
CREATE INDEX "session_note_locations_locationId_idx" ON "session_note_locations"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "session_note_locations_sessionNoteId_locationId_key" ON "session_note_locations"("sessionNoteId", "locationId");

-- CreateIndex
CREATE INDEX "session_note_events_sessionNoteId_idx" ON "session_note_events"("sessionNoteId");

-- CreateIndex
CREATE INDEX "session_note_events_eventId_idx" ON "session_note_events"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "session_note_events_sessionNoteId_eventId_key" ON "session_note_events"("sessionNoteId", "eventId");
