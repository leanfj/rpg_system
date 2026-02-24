import { BrowserWindow } from 'electron'
import { createHash } from 'crypto'
import http, { type IncomingMessage, type ServerResponse } from 'http'
import { networkInterfaces } from 'os'
import { db } from './database'
import {
  addGroupInventoryItem,
  deleteGroupInventoryItem,
  getCampaignIdByShareToken,
  getGroupInventoryByCampaign,
  type GroupInventoryData,
  saveGroupInventoryEconomy,
  updateGroupInventoryItem
} from './groupInventory'

const DEFAULT_SHARE_PORT = 4865

type ShareServerInfo = {
  host: string
  port: number
  baseUrl: string
  addresses: string[]
}

type ProficiencyEntry = {
  label: string
  value: number
}

type SharedPlayerRow = {
  campaignName: string
  name: string
  playerName: string | null
  className: string
  subclass: string | null
  level: number
  ancestry: string
  alignment: string | null
  armorClass: number
  initiative: number | null
  speed: number | null
  hitPoints: number
  currentHitPoints: number | null
  tempHitPoints: number | null
  passivePerception: number | null
  proficiencyBonus: number | null
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
  savingThrows: string | null
  skills: string | null
  proficiencies: string | null
  attacks: string | null
  spells: string | null
  equipment: string | null
  features: string | null
  personalityTraits: string | null
  ideals: string | null
  bonds: string | null
  flaws: string | null
  updatedAt: Date
}

let shareServer: http.Server | null = null
let sharePort: number | null = null

const inventorySubscribers = new Map<string, Set<ServerResponse>>()

const commonCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS'
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const formatTextBlock = (value?: string | null): string => {
  if (!value) {
    return '<span class="sheet-empty">Nao informado.</span>'
  }

  return escapeHtml(value).replace(/\n/g, '<br />')
}

const parseProficiencyEntries = (raw?: string | null): ProficiencyEntry[] => {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    const entries: ProficiencyEntry[] = []

    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue

      const record = item as Record<string, unknown>
      const label = typeof record.label === 'string' ? record.label.trim() : ''
      const value = Number(record.value)

      if (!label || Number.isNaN(value)) continue

      entries.push({
        label,
        value
      })
    }

    return entries
  } catch {
    return []
  }
}

const getAbilityModifier = (score: number): number => Math.floor((score - 10) / 2)

const formatModifier = (value: number): string => (value >= 0 ? `+${value}` : String(value))

const getLanIPv4Addresses = (): string[] => {
  const nets = networkInterfaces()
  const allAddresses = new Set<string>()

  for (const netEntries of Object.values(nets)) {
    if (!netEntries) continue

    for (const net of netEntries) {
      if (net.family !== 'IPv4' || net.internal) continue
      allAddresses.add(net.address)
    }
  }

  const isPrivateAddress = (address: string): boolean => {
    if (address.startsWith('10.')) return true
    if (address.startsWith('192.168.')) return true
    if (address.startsWith('169.254.')) return true
    if (!address.startsWith('172.')) return false

    const secondOctet = Number(address.split('.')[1])
    return secondOctet >= 16 && secondOctet <= 31
  }

  const getPriority = (address: string): number => {
    if (address.startsWith('192.168.')) return 0
    if (address.startsWith('10.')) return 1
    if (address.startsWith('172.')) {
      const secondOctet = Number(address.split('.')[1])
      if (secondOctet >= 16 && secondOctet <= 31) return 2
    }
    if (address.startsWith('169.254.')) return 4
    return 3
  }

  const addresses = Array.from(allAddresses)
  const privateAddresses = addresses.filter(isPrivateAddress)
  const finalAddresses = privateAddresses.length ? privateAddresses : addresses

  return finalAddresses.sort((left, right) => getPriority(left) - getPriority(right))
}

const sendHtml = (res: ServerResponse, status: number, content: string): void => {
  res.writeHead(status, {
    ...commonCorsHeaders,
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store, max-age=0',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer'
  })
  res.end(content)
}

const sendJson = (res: ServerResponse, status: number, payload: unknown): void => {
  res.writeHead(status, {
    ...commonCorsHeaders,
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, max-age=0',
    'X-Content-Type-Options': 'nosniff'
  })
  res.end(JSON.stringify(payload))
}

const sendNoContent = (res: ServerResponse): void => {
  res.writeHead(204, {
    ...commonCorsHeaders,
    'Cache-Control': 'no-store, max-age=0'
  })
  res.end()
}

const readJsonBody = async (req: IncomingMessage): Promise<Record<string, unknown>> => {
  const chunks: Buffer[] = []

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    const totalLength = chunks.reduce((sum, current) => sum + current.length, 0)
    if (totalLength > 1024 * 1024) {
      throw new Error('Corpo da requisição excede o limite')
    }
  }

  const rawBody = Buffer.concat(chunks).toString('utf-8').trim()
  if (!rawBody) return {}

  const parsed = JSON.parse(rawBody)
  if (!parsed || typeof parsed !== 'object') return {}

  return parsed as Record<string, unknown>
}

const renderNotFound = (): string => `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Ficha indisponivel</title>
    <style>
      body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; display: grid; min-height: 100vh; place-items: center; }
      .card { background: #1e293b; border: 1px solid #334155; border-radius: 14px; padding: 28px; max-width: 420px; text-align: center; }
      h1 { font-size: 1.4rem; margin: 0 0 12px; }
      p { margin: 0; color: #94a3b8; }
    </style>
  </head>
  <body>
    <article class="card">
      <h1>Link invalido ou expirado</h1>
      <p>Peça para o mestre gerar um novo link de compartilhamento.</p>
    </article>
  </body>
</html>`

const renderInventoryScript = (shareToken: string): string => {
  const tokenLiteral = JSON.stringify(shareToken)

  return `<script>
(() => {
  const shareToken = ${tokenLiteral};
  const endpoints = {
    inventory: '/shared/inventory/' + shareToken,
    stream: '/shared/inventory/stream/' + shareToken,
    economy: '/shared/inventory/' + shareToken + '/economy',
    items: '/shared/inventory/' + shareToken + '/items'
  };

  const economyForm = document.getElementById('inventory-economy-form');
  const goldInput = document.getElementById('inventory-gold');
  const silverInput = document.getElementById('inventory-silver');
  const copperInput = document.getElementById('inventory-copper');
  const notesInput = document.getElementById('inventory-notes');
  const statusEl = document.getElementById('inventory-status');
  const itemListEl = document.getElementById('inventory-items');
  const itemForm = document.getElementById('inventory-item-form');
  const itemNameInput = document.getElementById('inventory-item-name');
  const itemQtyInput = document.getElementById('inventory-item-qty');
  const itemDescInput = document.getElementById('inventory-item-desc');

  let inventoryState = null;

  const toPositiveInt = (value, fallback) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(0, Math.trunc(parsed));
  };

  const setStatus = (message, tone) => {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.dataset.tone = tone || 'info';
  };

  const requestJson = async (url, options) => {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });

    if (!response.ok) {
      throw new Error('Erro HTTP ' + response.status);
    }

    return response.json();
  };

  const renderInventory = (inventory) => {
    inventoryState = inventory;

    goldInput.value = String(inventory.gold || 0);
    silverInput.value = String(inventory.silver || 0);
    copperInput.value = String(inventory.copper || 0);
    notesInput.value = inventory.notes || '';

    itemListEl.innerHTML = '';

    if (!inventory.items || inventory.items.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'inventory-empty';
      empty.textContent = 'Nenhum item registrado ainda.';
      itemListEl.appendChild(empty);
      return;
    }

    inventory.items.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'inventory-item';

      const main = document.createElement('div');
      main.className = 'inventory-item-main';

      const name = document.createElement('strong');
      name.textContent = item.name;
      main.appendChild(name);

      if (item.description) {
        const desc = document.createElement('span');
        desc.textContent = item.description;
        main.appendChild(desc);
      }

      const controls = document.createElement('div');
      controls.className = 'inventory-item-controls';

      const minus = document.createElement('button');
      minus.type = 'button';
      minus.textContent = '-';
      minus.title = 'Diminuir quantidade';
      minus.addEventListener('click', async () => {
        const nextQty = Math.max(1, Number(item.quantity || 1) - 1);
        await updateItem(item.id, nextQty);
      });

      const qty = document.createElement('span');
      qty.className = 'inventory-item-qty';
      qty.textContent = 'x' + item.quantity;

      const plus = document.createElement('button');
      plus.type = 'button';
      plus.textContent = '+';
      plus.title = 'Aumentar quantidade';
      plus.addEventListener('click', async () => {
        const nextQty = Math.max(1, Number(item.quantity || 1) + 1);
        await updateItem(item.id, nextQty);
      });

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'danger';
      remove.textContent = 'Remover';
      remove.addEventListener('click', async () => {
        await deleteItem(item.id);
      });

      controls.appendChild(minus);
      controls.appendChild(qty);
      controls.appendChild(plus);
      controls.appendChild(remove);

      row.appendChild(main);
      row.appendChild(controls);
      itemListEl.appendChild(row);
    });
  };

  const updateItem = async (itemId, quantity) => {
    if (!inventoryState) return;
    const current = inventoryState.items.find((item) => item.id === itemId);
    if (!current) return;

    try {
      const updated = await requestJson(endpoints.items + '/' + itemId, {
        method: 'PATCH',
        body: JSON.stringify({
          name: current.name,
          quantity,
          description: current.description || ''
        })
      });
      renderInventory(updated);
      setStatus('Inventário atualizado em tempo real.', 'success');
    } catch {
      setStatus('Não foi possível atualizar o item.', 'error');
    }
  };

  const deleteItem = async (itemId) => {
    try {
      const updated = await requestJson(endpoints.items + '/' + itemId, {
        method: 'DELETE'
      });
      renderInventory(updated);
      setStatus('Item removido.', 'success');
    } catch {
      setStatus('Não foi possível remover o item.', 'error');
    }
  };

  economyForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      const updated = await requestJson(endpoints.economy, {
        method: 'POST',
        body: JSON.stringify({
          gold: toPositiveInt(goldInput.value, 0),
          silver: toPositiveInt(silverInput.value, 0),
          copper: toPositiveInt(copperInput.value, 0),
          notes: notesInput.value || ''
        })
      });

      renderInventory(updated);
      setStatus('Economia do grupo salva.', 'success');
    } catch {
      setStatus('Erro ao salvar economia.', 'error');
    }
  });

  itemForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = (itemNameInput.value || '').trim();
    if (!name) {
      setStatus('Informe o nome do item.', 'error');
      return;
    }

    try {
      const updated = await requestJson(endpoints.items, {
        method: 'POST',
        body: JSON.stringify({
          name,
          quantity: toPositiveInt(itemQtyInput.value, 1) || 1,
          description: (itemDescInput.value || '').trim()
        })
      });

      itemNameInput.value = '';
      itemQtyInput.value = '1';
      itemDescInput.value = '';
      renderInventory(updated);
      setStatus('Item adicionado.', 'success');
    } catch {
      setStatus('Erro ao adicionar item.', 'error');
    }
  });

  const loadInitial = async () => {
    try {
      const inventory = await requestJson(endpoints.inventory, { method: 'GET' });
      renderInventory(inventory);
      setStatus('Inventário sincronizado.', 'info');
    } catch {
      setStatus('Erro ao carregar inventário.', 'error');
    }
  };

  const connectStream = () => {
    const stream = new EventSource(endpoints.stream);

    stream.addEventListener('inventory', (event) => {
      try {
        const nextInventory = JSON.parse(event.data);
        renderInventory(nextInventory);
      } catch {
        // ignora mensagens inválidas
      }
    });

    stream.onerror = () => {
      setStatus('Reconectando sincronização em tempo real...', 'info');
    };
  };

  loadInitial();
  connectStream();
})();
</script>`
}

const renderPlayerSheet = (
  payload: {
    campaignName?: string
    name: string
    playerName?: string | null
    className: string
    subclass?: string | null
    level: number
    ancestry: string
    alignment?: string | null
    armorClass: number
    initiative?: number | null
    speed?: number | null
    hitPoints: number
    currentHitPoints?: number | null
    tempHitPoints?: number | null
    passivePerception?: number | null
    proficiencyBonus?: number | null
    strength: number
    dexterity: number
    constitution: number
    intelligence: number
    wisdom: number
    charisma: number
    savingThrows?: string | null
    skills?: string | null
    proficiencies?: string | null
    attacks?: string | null
    spells?: string | null
    equipment?: string | null
    features?: string | null
    personalityTraits?: string | null
    ideals?: string | null
    bonds?: string | null
    flaws?: string | null
    updatedAt: Date
  },
  shareToken: string
): string => {
  const currentHp = payload.currentHitPoints ?? payload.hitPoints
  const tempHp = payload.tempHitPoints ?? 0
  const savingThrowEntries = parseProficiencyEntries(payload.savingThrows)
  const skillEntries = parseProficiencyEntries(payload.skills)

  const renderEntryList = (entries: ProficiencyEntry[], emptyLabel: string): string => {
    if (!entries.length) {
      return `<li class="sheet-empty">${escapeHtml(emptyLabel)}</li>`
    }

    return entries
      .map((entry) => `<li>${escapeHtml(entry.label)} <strong>${formatModifier(entry.value)}</strong></li>`)
      .join('')
  }

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Ficha de ${escapeHtml(payload.name)}</title>
    <style>
      :root {
        --bg: #0b1020;
        --card: #111a33;
        --card-soft: #1b2a4a;
        --line: #2a3f6b;
        --text: #e5ecff;
        --muted: #9eb1d8;
        --accent: #7dd3fc;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: radial-gradient(circle at top, #17264b 0%, var(--bg) 45%);
        color: var(--text);
        font-family: 'Segoe UI', 'Inter', sans-serif;
      }
      main {
        max-width: 980px;
        margin: 0 auto;
        padding: 26px 16px 32px;
        display: grid;
        gap: 14px;
      }
      .hero {
        background: rgba(14, 24, 50, 0.88);
        border: 1px solid var(--line);
        border-radius: 16px;
        padding: 18px;
      }
      .hero h1 { margin: 0; font-size: 1.8rem; }
      .hero p { margin: 8px 0 0; color: var(--muted); }
      .meta { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
      .chip {
        background: #1f3158;
        border: 1px solid #35548f;
        border-radius: 999px;
        padding: 4px 10px;
        font-size: 0.82rem;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 10px;
      }
      section {
        background: var(--card);
        border: 1px solid var(--line);
        border-radius: 14px;
        padding: 14px;
      }
      h2 {
        margin: 0 0 10px;
        font-size: 1rem;
        color: var(--accent);
        letter-spacing: 0.3px;
      }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }
      .stat {
        background: var(--card-soft);
        border-radius: 10px;
        border: 1px solid #334f88;
        padding: 8px;
        text-align: center;
      }
      .stat small { display: block; color: var(--muted); }
      .stat strong { font-size: 1.2rem; }
      ul {
        margin: 0;
        padding-left: 18px;
        display: grid;
        gap: 4px;
      }
      .sheet-empty { color: var(--muted); }
      .text-block {
        white-space: normal;
        line-height: 1.5;
        color: var(--text);
      }
      .inventory-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 10px;
      }
      .inventory-card {
        background: rgba(13, 22, 44, 0.72);
        border: 1px solid rgba(103, 232, 249, 0.24);
        border-radius: 12px;
        padding: 12px;
        display: grid;
        gap: 8px;
      }
      .inventory-status {
        font-size: 0.82rem;
        color: var(--muted);
      }
      .inventory-status[data-tone="error"] { color: #fda4af; }
      .inventory-status[data-tone="success"] { color: #86efac; }
      .inventory-economy {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }
      .inventory-economy label,
      .inventory-item-form label {
        display: grid;
        gap: 4px;
        font-size: 0.78rem;
        color: var(--muted);
      }
      .inventory-card input,
      .inventory-card textarea,
      .inventory-card button {
        width: 100%;
        border-radius: 8px;
        border: 1px solid rgba(148, 163, 184, 0.35);
        background: rgba(7, 13, 31, 0.72);
        color: var(--text);
        padding: 7px 8px;
      }
      .inventory-card button {
        cursor: pointer;
      }
      .inventory-item-form {
        display: grid;
        gap: 8px;
      }
      .inventory-items {
        display: grid;
        gap: 8px;
      }
      .inventory-empty {
        margin: 0;
        color: var(--muted);
        font-size: 0.84rem;
      }
      .inventory-item {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 8px;
        align-items: center;
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 10px;
        padding: 8px;
      }
      .inventory-item-main {
        display: grid;
        gap: 3px;
      }
      .inventory-item-main strong {
        font-size: 0.88rem;
      }
      .inventory-item-main span {
        color: var(--muted);
        font-size: 0.78rem;
      }
      .inventory-item-controls {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      .inventory-item-controls button {
        width: auto;
        min-width: 30px;
        padding: 5px 8px;
      }
      .inventory-item-controls button.danger {
        border-color: rgba(248, 113, 113, 0.5);
        color: #fca5a5;
      }
      .inventory-item-qty {
        min-width: 36px;
        text-align: center;
        color: var(--muted);
        font-size: 0.82rem;
      }
      footer {
        color: var(--muted);
        font-size: 0.78rem;
        text-align: center;
      }
      @media (max-width: 640px) {
        .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .inventory-economy { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <main>
      <header class="hero">
        <h1>${escapeHtml(payload.name)}</h1>
        <p>
          ${escapeHtml(payload.className)}${payload.subclass ? ` (${escapeHtml(payload.subclass)})` : ''}
          • Nível ${payload.level}
          • ${escapeHtml(payload.ancestry)}
        </p>
        <div class="meta">
          ${payload.playerName ? `<span class="chip">Jogador: ${escapeHtml(payload.playerName)}</span>` : ''}
          ${payload.alignment ? `<span class="chip">Alinhamento: ${escapeHtml(payload.alignment)}</span>` : ''}
          ${payload.campaignName ? `<span class="chip">Campanha: ${escapeHtml(payload.campaignName)}</span>` : ''}
          <span class="chip">Atualizado: ${new Date(payload.updatedAt).toLocaleString('pt-BR')}</span>
        </div>
      </header>

      <div class="grid">
        <section>
          <h2>Combate</h2>
          <div class="stats-grid">
            <div class="stat"><small>PV</small><strong>${currentHp + tempHp}/${payload.hitPoints}</strong></div>
            <div class="stat"><small>PV Temp</small><strong>${tempHp}</strong></div>
            <div class="stat"><small>CA</small><strong>${payload.armorClass}</strong></div>
            <div class="stat"><small>Iniciativa</small><strong>${payload.initiative ?? 0}</strong></div>
            <div class="stat"><small>Desloc.</small><strong>${payload.speed ?? 0}</strong></div>
            <div class="stat"><small>Percepção</small><strong>${payload.passivePerception ?? 10}</strong></div>
          </div>
          <p style="margin-top: 10px; color: var(--muted);">Bônus de proficiência: <strong>${formatModifier(payload.proficiencyBonus ?? 2)}</strong></p>
        </section>

        <section>
          <h2>Atributos</h2>
          <div class="stats-grid">
            <div class="stat"><small>FOR</small><strong>${payload.strength}</strong><small>${formatModifier(getAbilityModifier(payload.strength))}</small></div>
            <div class="stat"><small>DES</small><strong>${payload.dexterity}</strong><small>${formatModifier(getAbilityModifier(payload.dexterity))}</small></div>
            <div class="stat"><small>CON</small><strong>${payload.constitution}</strong><small>${formatModifier(getAbilityModifier(payload.constitution))}</small></div>
            <div class="stat"><small>INT</small><strong>${payload.intelligence}</strong><small>${formatModifier(getAbilityModifier(payload.intelligence))}</small></div>
            <div class="stat"><small>SAB</small><strong>${payload.wisdom}</strong><small>${formatModifier(getAbilityModifier(payload.wisdom))}</small></div>
            <div class="stat"><small>CAR</small><strong>${payload.charisma}</strong><small>${formatModifier(getAbilityModifier(payload.charisma))}</small></div>
          </div>
        </section>
      </div>

      <div class="grid">
        <section>
          <h2>Salvaguardas</h2>
          <ul>${renderEntryList(savingThrowEntries, 'Sem salvaguardas registradas.')}</ul>
        </section>
        <section>
          <h2>Perícias</h2>
          <ul>${renderEntryList(skillEntries, 'Sem perícias registradas.')}</ul>
        </section>
      </div>

      <div class="grid">
        <section>
          <h2>Proficiencias gerais</h2>
          <div class="text-block">${formatTextBlock(payload.proficiencies)}</div>
        </section>
        <section>
          <h2>Ataques</h2>
          <div class="text-block">${formatTextBlock(payload.attacks)}</div>
        </section>
      </div>

      <div class="grid">
        <section>
          <h2>Magias</h2>
          <div class="text-block">${formatTextBlock(payload.spells)}</div>
        </section>
        <section>
          <h2>Equipamentos</h2>
          <div class="text-block">${formatTextBlock(payload.equipment)}</div>
        </section>
      </div>

      <div class="grid">
        <section>
          <h2>Características e talentos</h2>
          <div class="text-block">${formatTextBlock(payload.features)}</div>
        </section>
        <section>
          <h2>Personalidade</h2>
          <div class="text-block">
            <strong>Traços:</strong> ${formatTextBlock(payload.personalityTraits)}<br />
            <strong>Ideais:</strong> ${formatTextBlock(payload.ideals)}<br />
            <strong>Vínculos:</strong> ${formatTextBlock(payload.bonds)}<br />
            <strong>Defeitos:</strong> ${formatTextBlock(payload.flaws)}
          </div>
        </section>
      </div>

      <section>
        <h2>Inventário compartilhado do grupo</h2>
        <p class="inventory-status" id="inventory-status" data-tone="info">Carregando inventário em tempo real...</p>

        <div class="inventory-grid">
          <div class="inventory-card">
            <h3>Economia do grupo</h3>
            <form id="inventory-economy-form">
              <div class="inventory-economy">
                <label>
                  Ouro (PO)
                  <input id="inventory-gold" type="number" min="0" value="0" />
                </label>
                <label>
                  Prata (PP)
                  <input id="inventory-silver" type="number" min="0" value="0" />
                </label>
                <label>
                  Cobre (PC)
                  <input id="inventory-copper" type="number" min="0" value="0" />
                </label>
              </div>
              <label>
                Observações
                <textarea id="inventory-notes" rows="3" placeholder="Ex.: pagamento pendente para guia da cidade"></textarea>
              </label>
              <button type="submit">Salvar economia</button>
            </form>
          </div>

          <div class="inventory-card">
            <h3>Itens coletados</h3>
            <form id="inventory-item-form" class="inventory-item-form">
              <label>
                Nome do item
                <input id="inventory-item-name" type="text" placeholder="Ex.: Poção de Cura" required />
              </label>
              <label>
                Quantidade
                <input id="inventory-item-qty" type="number" min="1" value="1" />
              </label>
              <label>
                Detalhes
                <input id="inventory-item-desc" type="text" placeholder="Opcional" />
              </label>
              <button type="submit">Adicionar item</button>
            </form>
            <div id="inventory-items" class="inventory-items"></div>
          </div>
        </div>
      </section>

      <footer>
        Compartilhamento local de ficha • Link protegido por token
      </footer>
    </main>
    ${renderInventoryScript(shareToken)}
  </body>
</html>`
}

const getPlayerFromToken = async (token: string): Promise<SharedPlayerRow | null> => {
  const tokenHash = hashShareToken(token)
  const rows = await db.$queryRaw<SharedPlayerRow[]>`
    SELECT
      c."name" AS "campaignName",
      pc."name" AS "name",
      pc."playerName" AS "playerName",
      pc."className" AS "className",
      pc."subclass" AS "subclass",
      pc."level" AS "level",
      pc."ancestry" AS "ancestry",
      pc."alignment" AS "alignment",
      pc."armorClass" AS "armorClass",
      pc."initiative" AS "initiative",
      pc."speed" AS "speed",
      pc."hitPoints" AS "hitPoints",
      pc."currentHitPoints" AS "currentHitPoints",
      pc."tempHitPoints" AS "tempHitPoints",
      pc."passivePerception" AS "passivePerception",
      pc."proficiencyBonus" AS "proficiencyBonus",
      pc."strength" AS "strength",
      pc."dexterity" AS "dexterity",
      pc."constitution" AS "constitution",
      pc."intelligence" AS "intelligence",
      pc."wisdom" AS "wisdom",
      pc."charisma" AS "charisma",
      pc."savingThrows" AS "savingThrows",
      pc."skills" AS "skills",
      pc."proficiencies" AS "proficiencies",
      pc."attacks" AS "attacks",
      pc."spells" AS "spells",
      pc."equipment" AS "equipment",
      pc."features" AS "features",
      pc."personalityTraits" AS "personalityTraits",
      pc."ideals" AS "ideals",
      pc."bonds" AS "bonds",
      pc."flaws" AS "flaws",
      pc."updatedAt" AS "updatedAt"
    FROM "player_share_links" psl
    INNER JOIN "player_characters" pc ON pc."id" = psl."playerCharacterId"
    INNER JOIN "campaigns" c ON c."id" = pc."campaignId"
    WHERE psl."tokenHash" = ${tokenHash}
      AND psl."revokedAt" IS NULL
      AND psl."expiresAt" > ${new Date()}
    LIMIT 1
  `

  return rows[0] ?? null
}

const writeInventoryEvent = (res: ServerResponse, payload: GroupInventoryData): void => {
  res.write(`event: inventory\n`)
  res.write(`data: ${JSON.stringify(payload)}\n\n`)
}

const registerInventoryStream = (campaignId: string, res: ServerResponse): void => {
  const subscribers = inventorySubscribers.get(campaignId) ?? new Set<ServerResponse>()
  subscribers.add(res)
  inventorySubscribers.set(campaignId, subscribers)

  res.on('close', () => {
    const currentSubscribers = inventorySubscribers.get(campaignId)
    if (!currentSubscribers) return

    currentSubscribers.delete(res)
    if (currentSubscribers.size === 0) {
      inventorySubscribers.delete(campaignId)
    }
  })
}

export const broadcastGroupInventoryUpdate = async (
  campaignId: string,
  payload?: GroupInventoryData
): Promise<GroupInventoryData> => {
  const inventoryPayload = payload ?? await getGroupInventoryByCampaign(campaignId)

  const subscribers = inventorySubscribers.get(campaignId)
  if (subscribers && subscribers.size > 0) {
    for (const subscriber of Array.from(subscribers)) {
      if (subscriber.writableEnded || subscriber.destroyed) {
        subscribers.delete(subscriber)
        continue
      }

      try {
        writeInventoryEvent(subscriber, inventoryPayload)
      } catch {
        subscribers.delete(subscriber)
      }
    }

    if (subscribers.size === 0) {
      inventorySubscribers.delete(campaignId)
    }
  }

  for (const window of BrowserWindow.getAllWindows()) {
    if (window.isDestroyed()) continue

    window.webContents.send('groupInventory:updated', campaignId, inventoryPayload)
  }

  return inventoryPayload
}

const resolveCampaignByToken = async (token: string): Promise<string | null> => {
  return getCampaignIdByShareToken(hashShareToken(token))
}

const handleShareRequest = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  const method = req.method ?? 'GET'
  const reqUrl = new URL(req.url ?? '/', 'http://127.0.0.1')

  if (method === 'OPTIONS') {
    sendNoContent(res)
    return
  }

  if (method === 'GET' && reqUrl.pathname === '/health') {
    sendJson(res, 200, { ok: true, port: sharePort })
    return
  }

  const inventoryStreamMatch = reqUrl.pathname.match(/^\/shared\/inventory\/stream\/([A-Za-z0-9_-]+)$/)
  if (method === 'GET' && inventoryStreamMatch) {
    const token = inventoryStreamMatch[1]
    const campaignId = await resolveCampaignByToken(token)

    if (!campaignId) {
      sendJson(res, 404, { error: 'Link inválido ou expirado' })
      return
    }

    res.writeHead(200, {
      ...commonCorsHeaders,
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    })

    res.write('retry: 2000\n\n')
    registerInventoryStream(campaignId, res)

    const inventory = await getGroupInventoryByCampaign(campaignId)
    writeInventoryEvent(res, inventory)
    return
  }

  const inventoryGetMatch = reqUrl.pathname.match(/^\/shared\/inventory\/([A-Za-z0-9_-]+)$/)
  if (method === 'GET' && inventoryGetMatch) {
    const token = inventoryGetMatch[1]
    const campaignId = await resolveCampaignByToken(token)

    if (!campaignId) {
      sendJson(res, 404, { error: 'Link inválido ou expirado' })
      return
    }

    const inventory = await getGroupInventoryByCampaign(campaignId)
    sendJson(res, 200, inventory)
    return
  }

  const inventoryEconomyMatch = reqUrl.pathname.match(/^\/shared\/inventory\/([A-Za-z0-9_-]+)\/economy$/)
  if (method === 'POST' && inventoryEconomyMatch) {
    const token = inventoryEconomyMatch[1]
    const campaignId = await resolveCampaignByToken(token)

    if (!campaignId) {
      sendJson(res, 404, { error: 'Link inválido ou expirado' })
      return
    }

    const body = await readJsonBody(req)
    const updated = await saveGroupInventoryEconomy(campaignId, body)
    await broadcastGroupInventoryUpdate(campaignId, updated)
    sendJson(res, 200, updated)
    return
  }

  const inventoryItemsMatch = reqUrl.pathname.match(/^\/shared\/inventory\/([A-Za-z0-9_-]+)\/items$/)
  if (method === 'POST' && inventoryItemsMatch) {
    const token = inventoryItemsMatch[1]
    const campaignId = await resolveCampaignByToken(token)

    if (!campaignId) {
      sendJson(res, 404, { error: 'Link inválido ou expirado' })
      return
    }

    const body = await readJsonBody(req)
    const updated = await addGroupInventoryItem(campaignId, body)
    await broadcastGroupInventoryUpdate(campaignId, updated)
    sendJson(res, 200, updated)
    return
  }

  const inventoryItemMatch = reqUrl.pathname.match(/^\/shared\/inventory\/([A-Za-z0-9_-]+)\/items\/([A-Za-z0-9-]+)$/)
  if (inventoryItemMatch && (method === 'PATCH' || method === 'DELETE')) {
    const token = inventoryItemMatch[1]
    const itemId = inventoryItemMatch[2]
    const campaignId = await resolveCampaignByToken(token)

    if (!campaignId) {
      sendJson(res, 404, { error: 'Link inválido ou expirado' })
      return
    }

    let updated: GroupInventoryData

    if (method === 'PATCH') {
      const body = await readJsonBody(req)
      updated = await updateGroupInventoryItem(campaignId, itemId, body)
    } else {
      updated = await deleteGroupInventoryItem(campaignId, itemId)
    }

    await broadcastGroupInventoryUpdate(campaignId, updated)
    sendJson(res, 200, updated)
    return
  }

  const characterMatch = reqUrl.pathname.match(/^\/shared\/character\/([A-Za-z0-9_-]+)$/)

  if (method === 'GET' && characterMatch) {
    const token = characterMatch[1]
    const player = await getPlayerFromToken(token)

    if (!player) {
      sendHtml(res, 404, renderNotFound())
      return
    }

    sendHtml(
      res,
      200,
      renderPlayerSheet(
        {
          campaignName: player.campaignName,
          name: player.name,
          playerName: player.playerName,
          className: player.className,
          subclass: player.subclass,
          level: player.level,
          ancestry: player.ancestry,
          alignment: player.alignment,
          armorClass: player.armorClass,
          initiative: player.initiative,
          speed: player.speed,
          hitPoints: player.hitPoints,
          currentHitPoints: player.currentHitPoints,
          tempHitPoints: player.tempHitPoints,
          passivePerception: player.passivePerception,
          proficiencyBonus: player.proficiencyBonus,
          strength: player.strength,
          dexterity: player.dexterity,
          constitution: player.constitution,
          intelligence: player.intelligence,
          wisdom: player.wisdom,
          charisma: player.charisma,
          savingThrows: player.savingThrows,
          skills: player.skills,
          proficiencies: player.proficiencies,
          attacks: player.attacks,
          spells: player.spells,
          equipment: player.equipment,
          features: player.features,
          personalityTraits: player.personalityTraits,
          ideals: player.ideals,
          bonds: player.bonds,
          flaws: player.flaws,
          updatedAt: new Date(player.updatedAt)
        },
        token
      )
    )
    return
  }

  sendHtml(res, 404, renderNotFound())
}

const listenOnPort = (port: number): Promise<{ server: http.Server; port: number }> =>
  new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      void handleShareRequest(req, res).catch((error: unknown) => {
        console.error('[share] erro na requisicao:', error)
        sendHtml(res, 500, renderNotFound())
      })
    })

    const onError = (error: Error) => {
      server.removeListener('listening', onListening)
      reject(error)
    }

    const onListening = () => {
      server.removeListener('error', onError)
      const address = server.address()

      if (!address || typeof address === 'string') {
        server.close(() => reject(new Error('[share] porta invalida')))
        return
      }

      resolve({ server, port: address.port })
    }

    server.once('error', onError)
    server.once('listening', onListening)
    server.listen(port, '0.0.0.0')
  })

export const hashShareToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex')

export const startShareServer = async (): Promise<void> => {
  if (shareServer) return

  try {
    const started = await listenOnPort(DEFAULT_SHARE_PORT)
    shareServer = started.server
    sharePort = started.port
  } catch (error) {
    const err = error as NodeJS.ErrnoException

    if (err.code !== 'EADDRINUSE') {
      throw error
    }

    const fallback = await listenOnPort(0)
    shareServer = fallback.server
    sharePort = fallback.port
  }

  shareServer.on('error', (error) => {
    console.error('[share] erro no servidor:', error)
  })

  const info = getShareServerInfo()
  if (info) {
    console.log(`[share] servidor ativo em ${info.baseUrl}`)
  }
}

export const stopShareServer = async (): Promise<void> => {
  if (!shareServer) return

  for (const subscribers of inventorySubscribers.values()) {
    for (const subscriber of subscribers) {
      try {
        subscriber.end()
      } catch {
        // ignora erros de finalização
      }
    }
  }
  inventorySubscribers.clear()

  const server = shareServer
  shareServer = null
  sharePort = null

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })
}

export const getShareServerInfo = (): ShareServerInfo | null => {
  if (!shareServer || !sharePort) return null

  const addresses = getLanIPv4Addresses()
  const host = addresses[0] ?? '127.0.0.1'

  return {
    host,
    port: sharePort,
    baseUrl: `http://${host}:${sharePort}`,
    addresses: addresses.length ? addresses : ['127.0.0.1']
  }
}
