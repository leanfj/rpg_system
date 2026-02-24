import { randomUUID } from 'crypto'
import { db } from './database'

export type GroupInventoryItem = {
  id: string
  name: string
  quantity: number
  description: string
  createdAt: string
  updatedAt: string
}

export type GroupInventoryData = {
  campaignId: string
  gold: number
  silver: number
  copper: number
  notes: string
  items: GroupInventoryItem[]
  updatedAt: string
}

type InventoryRow = {
  id: string
  campaignId: string
  gold: number
  silver: number
  copper: number
  notes: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

type InventoryItemRow = {
  id: string
  inventoryId: string
  name: string
  quantity: number
  description: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

const toIsoString = (value: Date | string): string => {
  const date = value instanceof Date ? value : new Date(value)
  return date.toISOString()
}

const sanitizeInteger = (value: unknown): number => {
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return 0
  return Math.max(0, Math.trunc(numberValue))
}

const sanitizeText = (value: unknown, fallback = ''): string => {
  if (typeof value !== 'string') return fallback
  return value.trim()
}

const normalizeInventoryPayload = (
  inventory: InventoryRow,
  items: InventoryItemRow[]
): GroupInventoryData => ({
  campaignId: inventory.campaignId,
  gold: sanitizeInteger(inventory.gold),
  silver: sanitizeInteger(inventory.silver),
  copper: sanitizeInteger(inventory.copper),
  notes: inventory.notes ?? '',
  items: items.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: sanitizeInteger(item.quantity),
    description: item.description ?? '',
    createdAt: toIsoString(item.createdAt),
    updatedAt: toIsoString(item.updatedAt)
  })),
  updatedAt: toIsoString(inventory.updatedAt)
})

const getInventoryRowByCampaign = async (campaignId: string): Promise<InventoryRow | null> => {
  const rows = await db.$queryRaw<InventoryRow[]>`
    SELECT
      gi."id" AS "id",
      gi."campaignId" AS "campaignId",
      gi."gold" AS "gold",
      gi."silver" AS "silver",
      gi."copper" AS "copper",
      gi."notes" AS "notes",
      gi."createdAt" AS "createdAt",
      gi."updatedAt" AS "updatedAt"
    FROM "group_inventories" gi
    WHERE gi."campaignId" = ${campaignId}
    LIMIT 1
  `

  return rows[0] ?? null
}

const createInventoryRow = async (campaignId: string): Promise<InventoryRow> => {
  const now = new Date()
  await db.$executeRaw`
    INSERT INTO "group_inventories" (
      "id",
      "campaignId",
      "gold",
      "silver",
      "copper",
      "notes",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${randomUUID()},
      ${campaignId},
      0,
      0,
      0,
      ${null},
      ${now},
      ${now}
    )
  `

  const created = await getInventoryRowByCampaign(campaignId)
  if (!created) {
    throw new Error('Falha ao criar inventário compartilhado')
  }

  return created
}

const getOrCreateInventoryRow = async (campaignId: string): Promise<InventoryRow> => {
  const existing = await getInventoryRowByCampaign(campaignId)
  if (existing) return existing
  return createInventoryRow(campaignId)
}

const getInventoryItems = async (inventoryId: string): Promise<InventoryItemRow[]> => {
  return await db.$queryRaw<InventoryItemRow[]>`
    SELECT
      gii."id" AS "id",
      gii."inventoryId" AS "inventoryId",
      gii."name" AS "name",
      gii."quantity" AS "quantity",
      gii."description" AS "description",
      gii."createdAt" AS "createdAt",
      gii."updatedAt" AS "updatedAt"
    FROM "group_inventory_items" gii
    WHERE gii."inventoryId" = ${inventoryId}
    ORDER BY gii."createdAt" DESC
  `
}

const getInventoryItemById = async (
  inventoryId: string,
  itemId: string
): Promise<InventoryItemRow | null> => {
  const rows = await db.$queryRaw<InventoryItemRow[]>`
    SELECT
      gii."id" AS "id",
      gii."inventoryId" AS "inventoryId",
      gii."name" AS "name",
      gii."quantity" AS "quantity",
      gii."description" AS "description",
      gii."createdAt" AS "createdAt",
      gii."updatedAt" AS "updatedAt"
    FROM "group_inventory_items" gii
    WHERE gii."inventoryId" = ${inventoryId}
      AND gii."id" = ${itemId}
    LIMIT 1
  `

  return rows[0] ?? null
}

export const getGroupInventoryByCampaign = async (campaignId: string): Promise<GroupInventoryData> => {
  const inventory = await getOrCreateInventoryRow(campaignId)
  const items = await getInventoryItems(inventory.id)
  return normalizeInventoryPayload(inventory, items)
}

export const saveGroupInventoryEconomy = async (
  campaignId: string,
  data: { gold?: unknown; silver?: unknown; copper?: unknown; notes?: unknown }
): Promise<GroupInventoryData> => {
  const inventory = await getOrCreateInventoryRow(campaignId)
  const now = new Date()

  await db.$executeRaw`
    UPDATE "group_inventories"
    SET
      "gold" = ${sanitizeInteger(data.gold)},
      "silver" = ${sanitizeInteger(data.silver)},
      "copper" = ${sanitizeInteger(data.copper)},
      "notes" = ${sanitizeText(data.notes)},
      "updatedAt" = ${now}
    WHERE "id" = ${inventory.id}
  `

  return getGroupInventoryByCampaign(campaignId)
}

export const addGroupInventoryItem = async (
  campaignId: string,
  data: { name?: unknown; quantity?: unknown; description?: unknown }
): Promise<GroupInventoryData> => {
  const inventory = await getOrCreateInventoryRow(campaignId)
  const now = new Date()
  const name = sanitizeText(data.name)

  if (!name) {
    throw new Error('Nome do item é obrigatório')
  }

  await db.$executeRaw`
    INSERT INTO "group_inventory_items" (
      "id",
      "inventoryId",
      "name",
      "quantity",
      "description",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${randomUUID()},
      ${inventory.id},
      ${name},
      ${Math.max(1, sanitizeInteger(data.quantity) || 1)},
      ${sanitizeText(data.description)},
      ${now},
      ${now}
    )
  `

  await db.$executeRaw`
    UPDATE "group_inventories"
    SET "updatedAt" = ${now}
    WHERE "id" = ${inventory.id}
  `

  return getGroupInventoryByCampaign(campaignId)
}

export const updateGroupInventoryItem = async (
  campaignId: string,
  itemId: string,
  data: { name?: unknown; quantity?: unknown; description?: unknown }
): Promise<GroupInventoryData> => {
  const inventory = await getOrCreateInventoryRow(campaignId)
  const now = new Date()
  const currentItem = await getInventoryItemById(inventory.id, itemId)

  if (!currentItem) {
    throw new Error('Item não encontrado')
  }

  const name = sanitizeText(data.name, currentItem.name)
  const quantity = Math.max(1, sanitizeInteger(data.quantity) || sanitizeInteger(currentItem.quantity) || 1)
  const description = sanitizeText(data.description, currentItem.description ?? '')

  await db.$executeRaw`
    UPDATE "group_inventory_items"
    SET
      "name" = ${name},
      "quantity" = ${quantity},
      "description" = ${description},
      "updatedAt" = ${now}
    WHERE "id" = ${itemId}
      AND "inventoryId" = ${inventory.id}
  `

  await db.$executeRaw`
    UPDATE "group_inventories"
    SET "updatedAt" = ${now}
    WHERE "id" = ${inventory.id}
  `

  return getGroupInventoryByCampaign(campaignId)
}

export const deleteGroupInventoryItem = async (
  campaignId: string,
  itemId: string
): Promise<GroupInventoryData> => {
  const inventory = await getOrCreateInventoryRow(campaignId)
  const now = new Date()

  await db.$executeRaw`
    DELETE FROM "group_inventory_items"
    WHERE "id" = ${itemId}
      AND "inventoryId" = ${inventory.id}
  `

  await db.$executeRaw`
    UPDATE "group_inventories"
    SET "updatedAt" = ${now}
    WHERE "id" = ${inventory.id}
  `

  return getGroupInventoryByCampaign(campaignId)
}

export const getCampaignIdByShareToken = async (tokenHash: string): Promise<string | null> => {
  const rows = await db.$queryRaw<Array<{ campaignId: string }>>`
    SELECT pc."campaignId" AS "campaignId"
    FROM "player_share_links" psl
    INNER JOIN "player_characters" pc ON pc."id" = psl."playerCharacterId"
    WHERE psl."tokenHash" = ${tokenHash}
      AND psl."revokedAt" IS NULL
      AND psl."expiresAt" > ${new Date()}
    LIMIT 1
  `

  return rows[0]?.campaignId ?? null
}
