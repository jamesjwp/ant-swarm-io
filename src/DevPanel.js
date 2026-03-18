import { BEE_TYPES } from './data/BeeTypes.js';

function getGS() {
  return window.__game?.scene?.getScene('GameScene');
}

function xpMaxForLevel(level) {
  let xpMax = 10;
  for (let i = 1; i < level; i++) xpMax = Math.ceil((xpMax + 100) * 1.1);
  return xpMax;
}

const INPUT = 'background:#222;color:#fff;border:1px solid #555;border-radius:3px;padding:2px 4px;margin-right:4px;width:80px;';
const BTN   = 'background:#444;color:#fff;border:1px solid #666;border-radius:3px;padding:2px 8px;cursor:pointer;margin-right:3px;';

function row(label, innerHTML) {
  return `<div style="margin-bottom:10px"><div style="color:#aaa;font-size:11px;margin-bottom:3px">${label}</div>${innerHTML}</div>`;
}

export function createDevPanel() {
  let visible = false;
  let refreshInterval = null;

  const panel = document.createElement('div');
  panel.style.cssText = `
    position:fixed;top:10px;right:10px;z-index:9999;
    background:rgba(0,0,0,0.88);color:#fff;padding:14px 16px;
    font-family:monospace;font-size:13px;border-radius:8px;
    border:1px solid #555;min-width:240px;display:none;
  `;

  panel.innerHTML = `
    <div style="font-weight:bold;margin-bottom:12px;color:#ffdd44;border-bottom:1px solid #444;padding-bottom:6px">
      ⚙ Dev Panel <span style="font-size:11px;color:#888;font-weight:normal">[ backtick to toggle ]</span>
    </div>

    ${row('Honey 🍯', `<input id="dv-storage" type="number" min="0" style="${INPUT}"><button id="dv-storage-set" style="${BTN}">Set</button><button id="dv-storage-fill" style="${BTN}">Fill</button>`)}
    ${row('Cash 💰', `<input id="dv-cash" type="number" min="0" style="${INPUT}"><button id="dv-cash-set" style="${BTN}">Set</button><button id="dv-cash-1k" style="${BTN}">+1000</button>`)}
    ${row('XP', `<input id="dv-xp" type="number" min="0" style="${INPUT}"><button id="dv-xp-set" style="${BTN}">Set</button><button id="dv-xp-fill" style="${BTN}">Fill</button>`)}
    ${row('Level', `<input id="dv-level" type="number" min="1" style="${INPUT}"><button id="dv-level-set" style="${BTN}">Set</button>`)}
    ${row('Add Bees', `
      <select id="dv-bee-type" style="${INPUT}width:auto;">
        ${Object.values(BEE_TYPES).map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
      </select>
      <input id="dv-bee-count" type="number" min="1" value="1" style="${INPUT}width:40px;">
      <button id="dv-bee-add" style="${BTN}">Add</button>
    `)}
    ${row('Next Bee Cost', `<input id="dv-bee-cost" type="number" min="0" style="${INPUT}"><button id="dv-bee-cost-set" style="${BTN}">Set</button>`)}

    <div id="dv-status" style="margin-top:6px;color:#88ddff;font-size:12px;min-height:16px"></div>

    <div style="margin-top:10px;border-top:1px solid #444;padding-top:8px;font-size:11px;color:#666">
      <div id="dv-state"></div>
    </div>
  `;

  document.body.appendChild(panel);

  const $ = id => panel.querySelector('#' + id);
  const status = msg => {
    $('dv-status').textContent = msg;
    clearTimeout(status._t);
    status._t = setTimeout(() => $('dv-status').textContent = '', 2000);
  };

  $('dv-storage-set').onclick  = () => { const gs = getGS(); if (!gs) return; gs.storage = Math.min(+$('dv-storage').value || 0, gs.storageMax); status(`Storage → ${gs.storage}`); };
  $('dv-storage-fill').onclick = () => { const gs = getGS(); if (!gs) return; gs.storage = gs.storageMax; status(`Storage filled (${gs.storageMax})`); };
  $('dv-cash-set').onclick     = () => { const gs = getGS(); if (!gs) return; gs.cash = +$('dv-cash').value || 0; status(`Cash → ${gs.cash}`); };
  $('dv-cash-1k').onclick      = () => { const gs = getGS(); if (!gs) return; gs.cash += 1000; status(`Cash → ${gs.cash}`); };
  $('dv-xp-set').onclick       = () => { const gs = getGS(); if (!gs) return; gs.xp = +$('dv-xp').value || 0; status(`XP → ${gs.xp}`); };
  $('dv-xp-fill').onclick      = () => { const gs = getGS(); if (!gs) return; gs.xp = gs.xpMax - 1; status(`XP → ${gs.xp} (one away from level up)`); };

  $('dv-level-set').onclick = () => {
    const gs = getGS(); if (!gs) return;
    const level = Math.max(1, +$('dv-level').value || 1);
    gs.level  = level;
    gs.xpMax  = xpMaxForLevel(level);
    gs.xp     = 0;
    status(`Level → ${level}  (xpMax=${gs.xpMax})`);
  };

  $('dv-bee-add').onclick = () => {
    const gs = getGS(); if (!gs) return;
    const type  = BEE_TYPES[$('dv-bee-type').value] || BEE_TYPES.worker;
    const count = Math.max(1, +$('dv-bee-count').value || 1);
    for (let i = 0; i < count; i++) gs.equipBee(gs._addToInventory(type));
    status(`Added ${count}× ${type.name}`);
  };

  $('dv-bee-cost-set').onclick = () => {
    const gs = getGS(); if (!gs) return;
    gs.nextAntCost = Math.max(0, +$('dv-bee-cost').value || 0);
    status(`Bee cost → ${gs.nextAntCost}`);
  };

  const refreshState = () => {
    const gs = getGS(); if (!gs) return;
    $('dv-state').textContent =
      `storage:${gs.storage}/${gs.storageMax}  cash:${gs.cash}  xp:${gs.xp}/${gs.xpMax}  lv:${gs.level}  bees:${gs.ants.length}`;
  };

  const syncInputs = () => {
    const gs = getGS(); if (!gs) return;
    $('dv-storage').value  = gs.storage;
    $('dv-cash').value     = gs.cash;
    $('dv-xp').value       = gs.xp;
    $('dv-level').value    = gs.level;
    $('dv-bee-cost').value = gs.nextAntCost;
  };

  document.addEventListener('keydown', e => {
    if (e.key !== '`') return;
    visible = !visible;
    panel.style.display = visible ? 'block' : 'none';
    if (visible) {
      syncInputs();
      refreshInterval = setInterval(refreshState, 500);
    } else {
      clearInterval(refreshInterval);
    }
  });
}
