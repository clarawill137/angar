// ✦ Ангар — интерфейс: свой <dialog> поверх таверны и хаба Life. Залы: Оружейная · Гараж · Лаба · Костюмы · Магазин.
// Все кнопки — data-g, поля — data-gf (сущность:поле). Листы (вещь, машина, костюм, проект, кубики) — в .ang-modal.

import * as C from './core.js';
import * as D from './data.js';

const esc = C.esc;
const ui = {
    hall: 'arm', sub: { arm: 'people', lab: 'proj', gar: 'all', suit: 'all' }, who: '', modal: null, busy: new Set(),
    shop: { src: '', cat: 'all', ask: '' }, wall: 'guns', scroll: {}, zone: '', story: null, kit: null,
};

// ───────────── значки (свои, линейные) ─────────────

const P = {
    x: '<path d="M6 6l12 12M18 6 6 18"/>', plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>', check: '<path d="m5 12 5 5 9-10"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', pencil: '<path d="M4 20l4-1 11-11-3-3L5 16l-1 4Z"/>',
    wand: '<path d="M4 20 15 9M14 4v3M19 9h-3M17.5 5.5l-2 2M18 13l1 1M11 3l1 1"/>', camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4Z"/><circle cx="12" cy="13" r="3.5"/>',
    sparkles: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z"/><path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7Z"/>',
    dice: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><circle cx="8.5" cy="8.5" r="1.1"/><circle cx="15.5" cy="15.5" r="1.1"/><circle cx="12" cy="12" r="1.1"/><circle cx="15.5" cy="8.5" r="1.1"/><circle cx="8.5" cy="15.5" r="1.1"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>', send: '<path d="M4 12 20 4l-6 16-3-7Z"/>',
    pistol: '<path d="M3 8h15l2-2h1v4h-4l-1.5 2H11l-1.2 6H6l1.1-6H3Z"/><path d="M11 12v2"/>',
    rifle: '<path d="M2 11h12l2-2h6v3h-4l-2 2h-3l-1 4H9l1-4H2Z"/><path d="M5 11V9"/>', smg: '<path d="M3 9h13l2-2h2v4h-3l-1 2h-2v5h-3v-5H8l-1 3H4l1-3H3Z"/>',
    sniper: '<path d="M1 12h15l3-1h4v2h-4l-2 1h-3l-1 4h-2l1-4H1Z"/><rect x="7" y="8" width="6" height="2" rx="1"/>', shotgun: '<path d="M2 10h14l3 2h3v2h-4l-3-1h-3l-1 4H9l1-4H2Z"/>',
    heavy: '<path d="M2 9h12l3-3h4v8h-4l-2 2H9l-1 3H5l1-3H2Z"/>', knife: '<path d="M3 20 13 10l2 2L5 22Z"/><path d="m13 10 6-7 2 2-6 7"/>',
    melee: '<path d="M5 19 15 9M13 5l6 6M17 3l4 4"/>', grenade: '<circle cx="12" cy="14" r="6"/><path d="M10 8V6h4v2M14 6l3-3"/>', bomb: '<circle cx="11" cy="14" r="7"/><path d="m15 8 3-3M18 5l2 1M19 3l1-1"/>',
    zap: '<path d="M13 2 4 14h7l-1 8 9-12h-7Z"/>', chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
    vest: '<path d="M8 3 4 6v14h6V9l2-2 2 2v11h6V6l-4-3-2 3h-4Z"/>', passport: '<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M9 16h6"/>',
    mask: '<path d="M3 9c3-2 15-2 18 0 0 6-3 8-6 8-2 0-2-2-3-2s-1 2-3 2c-3 0-6-2-6-8Z"/><circle cx="8.5" cy="11" r="1.5"/><circle cx="15.5" cy="11" r="1.5"/>',
    ammo: '<path d="M6 21V9c0-3 1.2-5 2-6 .8 1 2 3 2 6v12Z"/><path d="M14 21V9c0-3 1.2-5 2-6 .8 1 2 3 2 6v12Z"/><path d="M6 17h4M14 17h4"/>',
    bag: '<path d="M5 8h14l-1 13H6Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>', box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4Z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
    car: '<path d="M3 15l2-6h14l2 6v4H3Z"/><path d="M3 15h18"/><circle cx="7.5" cy="17" r="1.3"/><circle cx="16.5" cy="17" r="1.3"/><path d="M7 9l1.5-3h7L17 9"/>',
    bike: '<circle cx="6" cy="16" r="4"/><circle cx="18" cy="16" r="4"/><path d="M6 16l4-7h4l4 7M10 9 8 6H5M14 9l2-3h3"/>',
    truck: '<path d="M2 6h12v10H2ZM14 10h4l3 3v3h-7Z"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    boat: '<path d="M3 15h18l-3 5H6Z"/><path d="M12 3v12M12 4l6 9h-6"/>', jet: '<path d="M12 2c1 2 1.5 4 1.5 7l7 5v2l-7-2v4l2 2v1l-3.5-1-3.5 1v-1l2-2v-4l-7 2v-2l7-5c0-3 .5-5 1.5-7Z"/>',
    ship: '<path d="M12 2c3 3 5 7 5 12l3 3v3l-4-2-1 3H9l-1-3-4 2v-3l3-3c0-5 2-9 5-12Z"/><circle cx="12" cy="10" r="2"/>',
    store: '<path d="M3 9 5 4h14l2 5M4 9v11h16V9M9 20v-6h6v6"/><path d="M3 9h18"/>', skull: '<path d="M5 11a7 7 0 1 1 14 0v4h-2v3H7v-3H5Z"/><circle cx="9" cy="11" r="1.6"/><circle cx="15" cy="11" r="1.6"/><path d="M10 18v2M14 18v2"/>',
    vault: '<rect x="3" y="4" width="18" height="15" rx="2"/><circle cx="12" cy="11.5" r="4"/><path d="M12 7.5v2M12 13.5v2M8 11.5h2M14 11.5h2M6 19v2M18 19v2"/>',
    gem: '<path d="M6 3h12l3 6-9 12L3 9Z"/><path d="M3 9h18M9 3l3 6 3-6M12 9v12"/>', wrench: '<path d="M14 6a4 4 0 0 0 5 5l-9 9-3-3 9-9a4 4 0 0 0-2-2Z"/>',
    flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M7.5 15h9"/>', gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
    tree: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M6 8.5v2a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-2M12 13.5v2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/>',
    table: '<path d="M3 8h18M5 8v12M19 8v12M3 8l2-4h14l2 4"/>', pin: '<path d="M12 21s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>', fuel: '<path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12M14 9h2l2 2v6a1.5 1.5 0 0 0 3 0V8l-3-3"/><path d="M7 7h4"/>',
    shield: '<path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6Z"/>', scroll: '<path d="M7 3h11a2 2 0 0 1 2 2v2h-4M7 3a2 2 0 0 0-2 2v12a2 2 0 0 1-2 2h11a2 2 0 0 0 2-2V5a2 2 0 0 1 2-2"/><path d="M8 9h6M8 13h6"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    hand: '<path d="M8 13V5a1.5 1.5 0 0 1 3 0v6M11 11V4a1.5 1.5 0 0 1 3 0v7M14 11V6a1.5 1.5 0 0 1 3 0v8c0 4-3 7-7 7-3 0-5-2-6-4l-2-4a1.5 1.5 0 0 1 2.5-1.5L8 13"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>', alert: '<path d="M12 3 2 20h20Z"/><path d="M12 10v4M12 17v.5"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M14.5 9.2c-.6-.8-1.5-1.2-2.5-1.2-1.5 0-2.7.8-2.7 2s1.1 1.7 2.7 2c1.6.3 2.7.8 2.7 2s-1.2 2-2.7 2c-1.1 0-2-.5-2.6-1.3M12 6.5V8M12 16v1.5"/>',
    grave: '<path d="M6 21V9a6 6 0 0 1 12 0v12Z"/><path d="M12 9v6M9.5 11.5h5M4 21h16"/>', layers: '<path d="m12 3 9 5-9 5-9-5Z"/><path d="m3 13 9 5 9-5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6 19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>', notes: '<path d="M6 3h9l4 4v14H6Z"/><path d="M15 3v4h4M9 12h7M9 16h5"/>',
    upload: '<path d="M12 15V4M7 9l5-5 5 5M4 20h16"/>', swap: '<path d="M4 8h13l-3-3M20 16H7l3 3"/>', home: '<path d="M3 11 12 4l9 7M5 10v10h14V10"/>',
};
export function ic(n, cls = '') { return `<svg class="ang-i${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || P.box}</svg>`; }
const kic = (kind) => ic(D.kindOf(kind)[2]);
const vic = (kind) => ic(D.vkindOf(kind)[2]);
const LOGO = '<svg class="ang-logo" viewBox="0 0 40 40" aria-hidden="true"><path d="M4 34V16L20 6l16 10v18" fill="none"/><path d="M10 34V20h20v14" fill="none"/><path d="M10 25h20M10 30h20"/><path class="ang-logo-l" d="M20 6v4"/></svg>';

// ───────────── мелкие куски ─────────────

const sec = (t, right = '') => `<div class="ang-sec"><span>${t}</span>${right ? `<em>${right}</em>` : ''}</div>`;
const btn = (g, label, extra = '', cls = '') => `<button class="ang-btn ${cls}" data-g="${g}" ${extra}>${label}</button>`;
const chip = (t, cls = '') => `<span class="ang-chip ${cls}">${esc(t)}</span>`;
const empty = (t, more = '') => `<div class="ang-empty">${t}${more}</div>`;
const spin = '<span class="ang-spin"></span>';
const busy = (k) => ui.busy.has(k);
const bar = (v, cls = '') => `<div class="ang-bar ${cls}"><i style="width:${C.clamp(v)}%"></i></div>`;
const pips = (n, max = 5) => `<span class="ang-pips">${Array.from({ length: max }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`;
const attr = (o) => Object.entries(o).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ');
const plural = (n, a, b, c) => { const x = Math.abs(n) % 100, y = x % 10; return x > 10 && x < 20 ? c : y > 1 && y < 5 ? b : y === 1 ? a : c; };
function ava(name, cls = '') {
    const src = C.avatarUrl(name);
    const l = esc(String(C.short(name) || '?').trim().charAt(0).toUpperCase());
    return `<span class="ang-ava ${cls}">${src ? `<img src="${esc(src)}" alt="" loading="lazy" onerror="this.remove()">` : ''}<i>${l}</i></span>`;
}
function thumb(src, icon, cls = '') { return `<span class="ang-thumb ${cls}">${src ? `<img src="${esc(src)}" alt="" loading="lazy">` : icon}</span>`; }
function field(label, inner, hint = '') { return `<label class="ang-field"><span>${esc(label)}${hint ? ` <small>${esc(hint)}</small>` : ''}</span>${inner}</label>`; }
const inp = (ent, id, key, val, ph = '', type = 'text') => `<input type="${type}" data-gf="${ent}:${key}" data-id="${esc(id)}" value="${esc(val ?? '')}" placeholder="${esc(ph)}">`;
const area = (ent, id, key, val, ph = '', rows = 3) => `<textarea rows="${rows}" data-gf="${ent}:${key}" data-id="${esc(id)}" placeholder="${esc(ph)}">${esc(val ?? '')}</textarea>`;
function sel(ent, id, key, val, list) { return `<select data-gf="${ent}:${key}" data-id="${esc(id)}">${list.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(val ?? '') ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`; }
const segs = (g, cur, list, extra = '') => `<div class="ang-seg">${list.map(([v, l]) => `<button class="${String(v) === String(cur) ? 'on' : ''}" data-g="${g}" data-v="${esc(v)}" ${extra}>${esc(l)}</button>`).join('')}</div>`;
const statRow = (label, v, max = 5) => `<div class="ang-stat"><span>${esc(label)}</span>${pips(v || 0, max)}</div>`;
const STAT_LABEL = { dmg: 'урон', acc: 'точность', range: 'дальность', conceal: 'скрытность', noise: 'шум', reliab: 'надёжность' };
const peopleList = () => { const l = C.people(); for (const n of ui.extraPeople || []) if (!l.some(x => C.same(x, n))) l.push(n); return l; };

// ───────────── силуэты ─────────────

function bodySvg(who) {
    const W = C.world();
    const items = C.M().items.filter(it => { const s = W.items.get(it.id); return s && C.same(s.holder, who) && !s.where && !['lost', 'broken'].includes(s.state); });
    const at = {};
    for (const it of items) { const s = W.items.get(it.id); const sl = s.hands ? (at.hand_r ? 'hand_l' : 'hand_r') : s.slot; if (sl) (at[sl] ||= []).push(it); }
    const marks = D.SLOTS.filter(s => !s.worn).map(s => {
        const list = at[s.id] || [];
        const empt = list.some(it => C.empty(it));
        return `<g class="ang-slot${list.length ? ' on' : ''}${empt ? ' dry' : ''}" data-g="slot" data-v="${s.id}" data-who="${esc(who)}"><circle cx="${s.x}" cy="${s.y}" r="${list.length ? 4.2 : 2.6}"/>${list.length > 1 ? `<text x="${s.x}" y="${s.y + 1.4}">${list.length}</text>` : ''}</g>`;
    }).join('');
    const worn = items.filter(it => it.kind === 'armor' || it.kind === 'disguise' || it.slot === 'body');
    return `<svg class="ang-mann${worn.some(it => it.kind === 'armor') ? ' vest' : ''}" viewBox="0 0 100 104" aria-label="разгрузка">
        <circle class="b" cx="50" cy="11" r="7"/>
        <path class="b" d="M50 18v3M38 23q12-4 24 0l2 27q-14 4-28 0Z"/>
        <path class="b ln" d="M38 24 29 38 21 52M62 24l9 14 8 14M43 52l-1 20 1 20M57 52l1 20-1 20M43 92l-5 4M57 92l5 4"/>
        ${worn.some(it => it.kind === 'armor') ? '<path class="vestp" d="M40 25q10-3 20 0l1.5 22q-11.5 3-23 0Z"/>' : ''}
        ${marks}
    </svg>`;
}

const zcls = (v) => (v >= 70 ? 'z2' : v >= 25 ? 'z1' : v > 0 ? 'z0 hit' : 'z0');
function vehSvg(v, s, big = false) {
    const z = (id) => `class="ang-zone ${zcls(s?.dmg?.[id] || 0)}${ui.zone === id ? ' sel' : ''}" ${big ? `data-g="zone" data-v="${id}" data-id="${esc(v.id)}"` : ''}`;
    const k = v.kind;
    let body = '';
    if (k === 'car' || k === 'truck' || k === 'other') body = `<svg class="ang-veh" viewBox="0 0 60 110">
        <rect ${z('tires')} x="2" y="17" width="6" height="15" rx="2"/><rect ${z('tires')} x="52" y="17" width="6" height="15" rx="2"/><rect ${z('tires')} x="2" y="78" width="6" height="15" rx="2"/><rect ${z('tires')} x="52" y="78" width="6" height="15" rx="2"/>
        <path ${z('front')} d="M10 22q0-16 20-16t20 16v3H10Z"/><rect ${z('engine')} x="20" y="9" width="20" height="10" rx="2"/>
        <rect ${z('left')} x="8" y="26" width="6" height="61" rx="2"/><rect ${z('right')} x="46" y="26" width="6" height="61" rx="2"/>
        <path ${z('glass')} d="M16 29h28l-3 10H19ZM19 74h22l3 9H16Z"/><rect ${z('roof')} x="17" y="41" width="26" height="31" rx="4"/>
        <path ${z('rear')} d="M10 88h40v3q0 13-20 13T10 91Z"/></svg>`;
    else if (k === 'bike') body = `<svg class="ang-veh wide" viewBox="0 0 120 70">
        <circle ${z('rear')} cx="25" cy="50" r="15"/><circle ${z('front')} cx="95" cy="50" r="15"/>
        <path ${z('frame')} d="M25 50 45 30h28l22 20M45 30l10 20h18M73 30l6-12h8"/>
        <rect ${z('engine')} x="48" y="40" width="22" height="13" rx="3"/><ellipse ${z('tank')} cx="62" cy="27" rx="13" ry="6"/></svg>`;
    else if (k === 'jet') body = `<svg class="ang-veh" viewBox="0 0 100 110">
        <path ${z('wings')} d="M50 40 6 70v8l44-12 44 12v-8Z"/><path ${z('nose')} d="M50 4q7 8 7 22H43q0-14 7-22Z"/>
        <rect ${z('hull')} x="42" y="26" width="16" height="62" rx="6"/><circle ${z('systems')} cx="50" cy="34" r="4.5"/>
        <rect ${z('engines')} x="36" y="88" width="10" height="14" rx="3"/><rect ${z('engines')} x="54" y="88" width="10" height="14" rx="3"/></svg>`;
    else if (k === 'ship') body = `<svg class="ang-veh" viewBox="0 0 100 110">
        <ellipse ${z('shields')} cx="50" cy="55" rx="44" ry="52" stroke-dasharray="3 3"/>
        <path ${z('hull')} d="M50 6q20 18 22 52l8 18v10H20V76l8-18q2-34 22-52Z"/>
        <circle ${z('warp')} cx="50" cy="60" r="16"/><rect ${z('life')} x="44" y="42" width="12" height="10" rx="2"/><circle ${z('systems')} cx="50" cy="26" r="6"/>
        <rect ${z('engines')} x="26" y="88" width="14" height="14" rx="3"/><rect ${z('engines')} x="60" y="88" width="14" height="14" rx="3"/></svg>`;
    else if (k === 'boat') body = `<svg class="ang-veh" viewBox="0 0 60 110">
        <path ${z('hull')} d="M30 4q22 22 22 62v38H8V66Q8 26 30 4Z"/><rect ${z('deck')} x="16" y="44" width="28" height="40" rx="4"/><rect ${z('engine')} x="22" y="92" width="16" height="12" rx="2"/></svg>`;
    return body;
}

function dieHtml(n, rolling, cls = '') {
    return `<div class="ang-die${rolling ? ' rolling' : ''} ${cls}"><svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 4 92 28v44L50 96 8 72V28Z"/><path d="M50 4 30 40h40Z M8 28l22 12M92 28 70 40M30 40 8 72M70 40l22 32M30 40l20 34 20-34M50 74v22M8 72l42 2 42-2"/></svg><b>${n ?? 'd20'}</b></div>`;
}

// ───────────── окно ─────────────

function host() {
    let dlg = document.getElementById('ang-dialog');
    if (dlg) return dlg;
    dlg = document.createElement('dialog');
    dlg.id = 'ang-dialog';
    dlg.innerHTML = '<div id="ang-app" class="ang"><header class="ang-top"></header><nav class="ang-halls"></nav><main class="ang-body"></main><div class="ang-modal"></div></div>';
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); if (ui.modal) closeModal(); else close(); });
    document.body.append(dlg);
    return dlg;
}
export const isOpen = () => !!document.getElementById('ang-dialog')?.open;
export function open(hall = null, id = null) {
    if (!C.hasChat()) { C.toast('info', 'Сначала открой чат'); return; }
    try { C.seed(); C.migrateArtur(); C.heroImport(); } catch (e) { console.warn('[Ангар] старт чата', e); }
    C.loadZ().then(() => { if (isOpen()) render(); });
    C.bank().then(() => { if (isOpen() && ui.hall === 'shop') render(); });
    if (hall === 'spar') { ui.hall = 'arm'; ui.sub.arm = 'spar'; } else if (hall && ['arm', 'gar', 'lab', 'suit', 'shop'].includes(hall)) ui.hall = hall;
    if (!ui.who || !C.people().some(n => C.same(n, ui.who))) ui.who = C.userName();
    ui.modal = null;
    const dlg = host();
    render(true);
    if (!dlg.open) { if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', ''); }
    const el = dlg.querySelector('#ang-app');
    el.classList.remove('on');
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('on')));
    if (id) setTimeout(() => openSheetFor(hall, id), 60);
}
export function close() {
    const dlg = document.getElementById('ang-dialog');
    if (!dlg) return;
    dlg.querySelector('#ang-app')?.classList.remove('on');
    setTimeout(() => { if (dlg.open) dlg.close(); }, 200);
}
let rt = 0;
export function renderSoon() { clearTimeout(rt); rt = setTimeout(() => { if (isOpen()) { render(); if (ui.modal) paintModal(); } }, 140); }

const HALLS = [['arm', 'Оружейная', 'pistol'], ['gar', 'Гараж', 'car'], ['lab', 'Лаба', 'flask'], ['suit', 'Костюмы', 'shield'], ['shop', 'Магазин', 'store']];
export function render(fresh = false) {
    const app = document.getElementById('ang-app');
    if (!app) return;
    const e = C.era();
    app.className = `ang skin-${e.skin}${app.classList.contains('on') ? ' on' : ''}${C.cfg().fx ? '' : ' nofx'}`;
    app.querySelector('.ang-top').innerHTML = `<div class="ang-brand">${LOGO}<div><b>АНГАР</b><small>${esc(e.title)}${C.storyDay() ? ` · ${esc(C.clock().date || C.storyDay())}` : ''}</small></div></div>
        <button class="ang-x" data-g="close" aria-label="Закрыть">${ic('x')}</button>`;
    app.querySelector('.ang-halls').innerHTML = HALLS.map(([id, t, i]) => `<button class="${ui.hall === id ? 'on' : ''}" data-g="hall" data-v="${id}">${ic(i)}<span>${t}</span></button>`).join('');
    const body = app.querySelector('.ang-body');
    const key = `${ui.hall}:${ui.sub[ui.hall] || ''}`;
    const top = fresh ? (ui.scroll[key] || 0) : body.scrollTop;
    let html = '';
    try { html = { arm: armHtml, gar: garHtml, lab: labHtml, suit: suitHtml, shop: shopHtml }[ui.hall](); } catch (err) { console.error('[Ангар] экран', err); html = empty(`Экран упал: ${esc(err?.message || err)}`); }
    body.innerHTML = html;
    body.scrollTop = top;
}
function go(hall, sub = null) {
    const body = document.querySelector('#ang-app .ang-body');
    if (body) ui.scroll[`${ui.hall}:${ui.sub[ui.hall] || ''}`] = body.scrollTop;
    if (hall) ui.hall = hall;
    if (sub != null) ui.sub[ui.hall] = sub;
    render(true);
}

// ───────────── Оружейная ─────────────

const ARM_SUBS = [['people', 'Люди', 'user'], ['wall', 'Стена', 'layers'], ['table', 'Стол', 'table'], ['stash', 'Тайники', 'vault'], ['legend', 'Легенды', 'passport'], ['ammo', 'Патроны', 'ammo'], ['range', 'Тир', 'target'], ['spar', 'Зал', 'hand']];
function subsNav(list, cur) { return `<div class="ang-subs">${list.map(([id, t, i]) => `<button class="${cur === id ? 'on' : ''}" data-g="sub" data-v="${id}">${ic(i)}<span>${t}</span></button>`).join('')}</div>`; }
function suggestRow(kinds) {
    const list = C.suggestions().filter(e => kinds.includes(e.kind === 'lab' ? 'lab' : ['car', 'bike', 'truck', 'boat', 'jet', 'ship'].includes(e.kind) ? 'veh' : 'item'));
    if (!list.length) return '';
    return `<div class="ang-sugg">${ic('eye')}<div><b>Появилось в постах — в Ангаре этого нет</b>${list.slice(0, 4).map(e => `<div class="ang-sugg-r"><span>${esc(e.name)}${e.who ? ` <small>${esc(C.short(e.who))}</small>` : ''}</span>${btn('suggAdd', ic('plus'), attr({ name: e.name, kind: e.kind, who: e.who || '' }), 'ico sm')}${btn('suggHide', ic('x'), attr({ name: e.name }), 'ico sm ghost')}</div>`).join('')}</div></div>`;
}

function armHtml() {
    const sub = ui.sub.arm || 'people';
    const top = `<div class="ang-actions">${btn('kit', `${ic('sparkles')} Набор от ИИ`, '', 'primary')}${btn('hall', `${ic('store')} Магазин`, 'data-v="shop"')}${btn('story', busy('story:arm') ? spin : ic('scroll'), 'data-v="arm" title="Из истории"', 'ico')}${btn('newItem', ic('plus'), 'title="Добавить вещь"', 'ico')}</div>`;
    const body = { people: armPeople, wall: armWall, table: armTable, stash: armStash, legend: armLegend, ammo: armAmmo, range: armRange, spar: armSpar }[sub]();
    return `${top}${subsNav(ARM_SUBS, sub)}${suggestRow(['item'])}${body}`;
}
function itemCard(it, opts = {}) {
    const s = C.dyn(it.id);
    if (!s) return '';
    const gun = D.isGun(it.kind) && it.cap;
    const sl = D.slotById(s.slot);
    const where = s.hands ? 'в руках' : s.where ? s.where : sl ? sl.short : '';
    const state = s.state === 'jammed' ? chip('клин', 'bad') : s.state === 'dropped' ? chip('брошен', 'warn') : s.state === 'lost' ? chip('потерян', 'bad') : s.state === 'broken' ? chip('сломан', 'bad') : '';
    return `<button class="ang-card it${C.empty(it, s) ? ' dry' : ''}${s.hands ? ' hand' : ''}" data-g="item" data-id="${esc(it.id)}">
        ${thumb(it.img, kic(it.kind))}
        <div class="ang-card-m"><div class="ang-card-h"><b>${esc(it.name)}</b>${state}</div>
        <small>${esc([it.model && it.model !== it.name ? it.model : '', it.caliber, opts.owner ? C.short(s.holder || it.owner) : '', where].filter(Boolean).join(' · '))}</small>
        ${gun ? `<div class="ang-ammo">${ammoDots(it, s)}<em>${esc(C.ammoLine(it, s))}</em></div>` : it.gadget?.max ? `<div class="ang-ammo">${bar(s.charges / it.gadget.max * 100, 'zap')}<em>${esc(C.ammoLine(it, s))}</em></div>` : C.ammoLine(it, s) ? `<div class="ang-ammo"><em>${esc(C.ammoLine(it, s))}</em></div>` : ''}
        </div></button>`;
}
function ammoDots(it, s) {
    const cap = Math.max(1, it.cap);
    if (cap > 40) return bar(s.inMag / cap * 100, s.inMag ? '' : 'bad');
    return `<span class="ang-rounds">${Array.from({ length: cap }, (_, i) => `<i class="${i < s.inMag ? 'on' : ''}"></i>`).join('')}</span>`;
}
function whoChips(cur, g = 'who', list = peopleList()) {
    return `<div class="ang-people">${list.map(n => `<button class="${C.same(n, cur) ? 'on' : ''}" data-g="${g}" data-v="${esc(n)}">${ava(n)}<span>${esc(C.short(n))}</span></button>`).join('')}<button data-g="addPerson" title="Другой человек">${ic('plus')}</button></div>`;
}
function armPeople() {
    const who = ui.who || C.userName();
    const W = C.world();
    const mine = C.M().items.filter(it => C.same(W.items.get(it.id)?.holder || it.owner, who) || C.same(it.owner, who));
    const on = mine.filter(it => { const s = W.items.get(it.id); return C.same(s.holder, who) && !s.where && !['lost', 'broken'].includes(s.state) && it.kind !== 'ammo'; });
    const off = mine.filter(it => !on.includes(it) && it.kind !== 'ammo');
    const ammo = C.ammoOf(who);
    const vest = on.find(it => it.kind === 'armor');
    const leg = on.find(it => it.kind === 'legend');
    return `${whoChips(who)}
    <div class="ang-loadout">
        <div class="ang-mann-w">${bodySvg(who)}</div>
        <div class="ang-load-side">
            <div class="ang-name">${ava(who, 'lg')}<div><b>${esc(C.short(who))}</b><small>${on.length ? `${on.length} ${plural(on.length, 'вещь', 'вещи', 'вещей')} с собой` : 'с собой ничего'}</small></div></div>
            ${vest ? `<div class="ang-kv">${ic('vest')}<span>${esc(vest.name)}: ${esc(D.ARMOR_STOPS[vest.armor?.level || 3])}</span></div>` : ''}
            ${leg ? `<div class="ang-kv">${ic('passport')}<span>по документам — ${esc(leg.legend?.alias || leg.name)}${leg.legend?.burned ? ' · сгорела' : ''}</span></div>` : ''}
            ${ammo.length ? `<div class="ang-kv">${ic('ammo')}<span>${ammo.map(a => `${esc(a.caliber || a.name)} ×${C.dyn(a.id)?.qty ?? 0}`).join(' · ')}</span></div>` : ''}
            <div class="ang-hint">Тап по точке на силуэте — что там. Пустые точки — свободные кобуры и ножны.</div>
        </div>
    </div>
    ${sec('С собой', String(on.length))}
    <div class="ang-list">${on.map(it => itemCard(it)).join('') || empty('Ничего. Добавь вещь, купи в магазине или собери набор от ИИ.')}</div>
    ${off.length ? `${sec('Дома и в тайниках', String(off.length))}<div class="ang-list">${off.map(it => itemCard(it)).join('')}</div>` : ''}`;
}
function armWall() {
    const g = D.WALL.find(w => w[0] === ui.wall) || D.WALL[0];
    const list = C.M().items.filter(it => g[2].includes(it.kind));
    return `<div class="ang-chips">${D.WALL.map(w => `<button class="ang-chip${w[0] === g[0] ? ' on' : ''}" data-g="wall" data-v="${w[0]}">${esc(w[1])} <small>${C.M().items.filter(it => w[2].includes(it.kind)).length}</small></button>`).join('')}</div>
    <div class="ang-wall">${list.map(it => itemCard(it, { owner: true })).join('') || empty('На этой стене пусто.')}</div>`;
}
function armTable() {
    const t = C.M().table;
    const who = t.who.length ? t.who : [ui.who || C.userName()];
    const W = C.world();
    const pool = C.M().items.filter(it => it.kind !== 'ammo' && who.some(n => C.same(it.owner, n) || C.same(W.items.get(it.id)?.holder, n)) && !['lost', 'broken'].includes(W.items.get(it.id)?.state));
    return `<div class="ang-hint">Кто идёт на дело — выбери, разложи на столе, что берёте, и «Собраться»: вещи окажутся при них, а сборы уйдут в следующий пост.</div>
    <div class="ang-people">${peopleList().map(n => `<button class="${who.some(x => C.same(x, n)) ? 'on' : ''}" data-g="tableWho" data-v="${esc(n)}">${ava(n)}<span>${esc(C.short(n))}</span></button>`).join('')}</div>
    <div class="ang-table">${pool.map(it => { const s = W.items.get(it.id); const on = t.pick.includes(it.id); return `<button class="ang-tile${on ? ' on' : ''}" data-g="tablePick" data-id="${esc(it.id)}">${thumb(it.img, kic(it.kind))}<b>${esc(it.name)}</b><small>${esc(C.short(it.owner))}${C.ammoLine(it, s) ? ` · ${esc(C.ammoLine(it, s))}` : ''}</small>${on ? `<i class="ang-tick">${ic('check')}</i>` : ''}</button>`; }).join('') || empty('На столе пусто: у них нет вещей в Ангаре.')}</div>
    ${field('Что ещё и зачем', `<input data-gf="table:note" data-id="t" value="${esc(t.note)}" placeholder="паспорта на Прагу, наличные, глушители — тихо зайти и выйти">`)}
    <div class="ang-actions">${btn('tablePack', `${ic('send')} Собраться (${t.pick.length})`, '', 'primary wide')}${btn('tableClear', ic('refresh'), 'title="Убрать со стола"', 'ico ghost')}</div>`;
}
function armStash() {
    const m = C.M();
    const W = C.world();
    const places = new Map();
    for (const st of m.stashes) places.set(C.norm(st.name), { st, name: st.name, list: [] });
    for (const it of m.items) {
        const w = W.items.get(it.id)?.where;
        if (!w) continue;
        const k = C.norm(w);
        if (!places.has(k)) places.set(k, { st: null, name: w, list: [] });
        places.get(k).list.push(it);
    }
    const veh = m.vehicles.filter(v => (v.stash || []).length);
    return `<div class="ang-actions">${btn('newStash', `${ic('plus')} Тайник`, '', 'primary')}</div>
    <div class="ang-list">${[...places.values()].map(p => `<div class="ang-box">
        <div class="ang-box-h">${ic(p.st?.secret ? 'lock' : 'vault')}<b>${esc(p.name)}</b>${p.st?.place ? `<small>${esc(p.st.place)}</small>` : ''}<em>${p.list.length}</em>
        ${btn('stashPut', ic('plus'), attr({ v: p.name }) + ' title="Положить сюда"', 'ico sm')}${p.st ? btn('stashEdit', ic('pencil'), attr({ id: p.st.id }), 'ico sm ghost') : ''}</div>
        ${p.st?.note ? `<p class="ang-note">${esc(p.st.note)}</p>` : ''}
        <div class="ang-list tight">${p.list.map(it => itemCard(it, { owner: true })).join('') || '<div class="ang-mute">пусто</div>'}</div></div>`).join('') || empty('Тайников нет. Всё, что лежит не при себе, — здесь, по местам.')}
    ${veh.map(v => `<div class="ang-box"><div class="ang-box-h">${vic(v.kind)}<b>${esc(v.name)}</b><small>тайник в машине</small></div><div class="ang-list tight">${v.stash.map(C.itemById).filter(Boolean).map(it => itemCard(it, { owner: true })).join('')}</div></div>`).join('')}</div>`;
}
function armLegend() {
    const list = C.M().items.filter(it => it.kind === 'legend' || it.kind === 'disguise');
    return `<div class="ang-actions">${btn('newItem', `${ic('passport')} Легенда`, 'data-kind="legend"', 'primary')}${btn('newItem', `${ic('mask')} Маскировка`, 'data-kind="disguise"')}</div>
    <div class="ang-list">${list.map(it => {
        const L = it.legend, G = it.disguise;
        return `<button class="ang-card lg${L?.burned ? ' burned' : ''}" data-g="item" data-id="${esc(it.id)}">${thumb(it.img, kic(it.kind))}<div class="ang-card-m">
            <div class="ang-card-h"><b>${esc(L?.alias || it.name)}</b>${L?.burned ? chip('сгорела', 'bad') : L ? chip('чистая', 'ok') : ''}</div>
            <small>${esc([C.short(it.owner), L?.nation, L?.cover, G?.parts].filter(Boolean).join(' · '))}</small>${L?.docs ? `<small>${esc(L.docs)}</small>` : ''}</div></button>`;
    }).join('') || empty('Легенд нет: паспорта, прикрытия, маскировка — сюда.')}</div>`;
}
function armAmmo() {
    const m = C.M();
    const W = C.world();
    const by = new Map();
    for (const it of m.items.filter(x => x.kind === 'ammo')) { const w = W.items.get(it.id)?.holder || it.owner || '—'; if (!by.has(w)) by.set(w, []); by.get(w).push(it); }
    const guns = m.items.filter(it => D.isGun(it.kind) && it.cap);
    return `<div class="ang-actions">${btn('newItem', `${ic('ammo')} Патроны`, 'data-kind="ammo"', 'primary')}${btn('shopCat', `${ic('store')} Купить`, 'data-v="ammo"')}${btn('refillAll', `${ic('refresh')} Всё зарядить`, '', 'ghost')}</div>
    ${[...by.entries()].map(([w, list]) => `${sec(esc(C.short(w)))}<div class="ang-list">${list.map(a => { const s = W.items.get(a.id); return `<div class="ang-row ammo">${ic('ammo')}<b>${esc(a.caliber || a.name)}</b><small>${esc(D.ammoName(a.ammo))}${a.where ? ` · ${esc(a.where)}` : ''}</small><span class="ang-num">${s?.qty ?? 0}</span>${btn('qty', '−10', attr({ id: a.id, v: -10 }), 'sm ghost')}${btn('qty', '+10', attr({ id: a.id, v: 10 }), 'sm ghost')}${btn('item', ic('pencil'), attr({ id: a.id }), 'ico sm ghost')}</div>`; }).join('')}</div>`).join('') || empty('Россыпи и пачек нет. Магазины к стволам — в карточке ствола.')}
    ${guns.length ? `${sec('Магазины к стволам')}<div class="ang-list">${guns.map(it => { const s = W.items.get(it.id); return `<div class="ang-row ammo">${kic(it.kind)}<b>${esc(it.name)}</b><small>${esc(C.short(s.holder || it.owner))}</small><span class="ang-num">${s.inMag}/${it.cap}${s.mags.length ? ` +${s.mags.length}` : ''}</span>${btn('reload', ic('refresh'), attr({ id: it.id }) + ' title="Перезарядить"', 'ico sm')}${btn('mags', '+маг', attr({ id: it.id, v: 1 }), 'sm ghost')}</div>`; }).join('')}</div>` : ''}`;
}
function armRange() {
    const R = ui.range ||= { who: [ui.who || C.userName()], gun: {}, res: null };
    const guns = (w) => C.M().items.filter(it => D.isGun(it.kind) && it.cap && (C.same(it.owner, w) || C.same(C.dyn(it.id)?.holder, w)));
    const hist = C.M().range.slice(0, 6);
    return `<div class="ang-hint">Десять выстрелов на каждого: кубик, навык и точность ствола. Патроны тратятся по-настоящему.</div>
    <div class="ang-people">${peopleList().map(n => `<button class="${R.who.some(x => C.same(x, n)) ? 'on' : ''}" data-g="rangeWho" data-v="${esc(n)}">${ava(n)}<span>${esc(C.short(n))}</span></button>`).join('')}</div>
    ${R.who.map(w => { const g = guns(w); const cur = R.gun[w] || g[0]?.id || ''; return field(`${C.short(w)} стреляет из`, g.length ? `<select data-gf="range:gun" data-id="${esc(w)}">${g.map(it => `<option value="${esc(it.id)}" ${it.id === cur ? 'selected' : ''}>${esc(it.name)} (${C.dyn(it.id)?.inMag}/${it.cap})</option>`).join('')}</select>` : '<div class="ang-mute">нет стволов — выдай в Оружейной</div>'); }).join('')}
    <div class="ang-actions">${btn('rangeShoot', `${ic('target')} На огневой рубеж`, '', 'primary wide')}</div>
    ${R.res ? `<div class="ang-range">${R.res.map(r => `<div class="ang-range-r">${targetSvg(r.shots)}<div><b>${esc(C.short(r.who))}</b><small>${esc(r.item)}</small><span class="ang-big">${r.total}<small>/100</small></span><small>${r.shots.join(' · ')}</small></div></div>`).join('')}
        <div class="ang-actions">${btn('rangeScene', `${ic('send')} В сцену`, '', 'primary')}${btn('rangeSave', 'Записать', '', 'ghost')}</div></div>` : ''}
    ${hist.length ? `${sec('Прошлые стрельбы')}<div class="ang-list">${hist.map(h => `<div class="ang-row">${ic('target')}<span>${esc(h.at || '')}</span><small>${h.res.map(r => `${esc(C.short(r.who))} ${r.total}`).join(' · ')}</small></div>`).join('')}</div>` : ''}`;
}
function armSpar() {
    const S = ui.spar ||= (() => { const ppl = peopleList(); const me = C.userName(); const him = ppl.find(n => /баки|bucky|барнс/i.test(n)) || ppl.find(n => !C.same(n, me)) || me; return { a: him, b: me, drill: 'box', lvl: 'norm', res: null }; })();
    const r = S.res;
    const pick = (slot) => `<div class="ang-people">${peopleList().map(n => `<button class="${C.same(S[slot], n) ? 'on' : ''}" data-g="sparWho" data-slot="${slot}" data-v="${esc(n)}">${ava(n)}<span>${esc(C.short(n))}</span></button>`).join('')}</div>`;
    const prog = (who) => { const t = C.trainOf(who); return `<div class="ang-spar-prog"><b>${esc(C.short(who))}</b>${C.SPAR_DRILLS.map(([id, nm]) => { const n = t[id] || 0; return `<div><span>${esc(nm)}</span>${bar(Math.min(100, n * 5))}<small>${n}</small></div>`; }).join('')}</div>`; };
    const hist = C.arr(C.M().spar).slice(0, 6);
    return `<div class="ang-hint">Тренировочный зал на третьем этаже дома. Кубик d20 + поправки (досье, суперсолдат, тренировки, беременность; потолок ±6). Тренировки копятся, и на 5, 10, 20 навык сам уходит в досье квартирмейстера.</div>
    ${sec('Тренер')}${pick('a')}${sec('Против')}${pick('b')}
    ${sec('Что отрабатывают')}<div class="ang-chips">${C.SPAR_DRILLS.map(([id, nm]) => `<button class="ang-chip${S.drill === id ? ' on' : ''}" data-g="sparDrill" data-v="${id}">${esc(nm)}</button>`).join('')}</div>
    ${segs('sparLvl', S.lvl, C.SPAR_LVL)}
    <div class="ang-actions">${btn('sparGo', `${ic('hand')} Раунд`, '', 'primary wide')}</div>
    ${r ? `<div class="ang-spar-res">
        <div class="ang-spar-dice"><div>${dieHtml(r.ra, false, r.win && C.same(r.win, r.a) ? 'out-win' : '')}<b>${esc(C.short(r.a))}</b><small>${r.ma >= 0 ? '+' : ''}${r.ma}${r.wa.length ? ` · ${esc(r.wa.join(', '))}` : ''}</small></div><span>×</span><div>${dieHtml(r.rb, false, r.win && C.same(r.win, r.b) ? 'out-win' : '')}<b>${esc(C.short(r.b))}</b><small>${r.mb >= 0 ? '+' : ''}${r.mb}${r.wb.length ? ` · ${esc(r.wb.join(', '))}` : ''}</small></div></div>
        <p class="ang-desc"><b>${r.win ? `Сильнее ${esc(C.short(r.win))} (${r.sa}:${r.sb})` : `Ничья (${r.sa}:${r.sb})`}</b> — ${esc(r.flav)}${r.bruise ? ` ${esc(C.short(r.bruise))} — синяк.` : ''}</p>
        ${r.note ? `<div class="ang-hint">${esc(r.note)}</div>` : ''}${r.grew.length ? `<div class="ang-note">В досье: ${esc(r.grew.join('; '))}</div>` : ''}
        <div class="ang-actions">${btn('sparScene', `${ic('send')} В сцену`, '', 'primary')}${btn('sparGo', `${ic('refresh')} Ещё раунд`, '', 'ghost')}</div></div>` : ''}
    ${sec('Наработано')}${[S.a, S.b].filter((n, i, l) => l.findIndex(x => C.same(x, n)) === i).map(prog).join('')}
    ${hist.length ? `${sec('Прошлые раунды')}<div class="ang-list">${hist.map(h => `<div class="ang-row">${ic('hand')}<span>${esc(h.at || '')}</span><small>${esc(C.short(h.a))} × ${esc(C.short(h.b))} · ${esc(C.SPAR_DRILLS.find(d => d[0] === h.drill)?.[1] || '')} · ${h.win ? esc(C.short(h.win)) : 'ничья'}</small></div>`).join('')}</div>` : ''}`;
}
function targetSvg(shots) {
    let seed = shots.reduce((a, b, i) => a + b * (i + 3), 7);
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const dots = shots.map(v => { const r = (10 - v) * 4.2 + rnd() * 3; const a = rnd() * Math.PI * 2; return `<circle class="hit" cx="${(50 + Math.cos(a) * r).toFixed(1)}" cy="${(50 + Math.sin(a) * r).toFixed(1)}" r="2"/>`; }).join('');
    return `<svg class="ang-target" viewBox="0 0 100 100">${[46, 38, 30, 22, 14, 6].map((r, i) => `<circle class="ring r${i}" cx="50" cy="50" r="${r}"/>`).join('')}${dots}</svg>`;
}

// ───────────── Гараж ─────────────

function garHtml() {
    const m = C.M();
    const list = m.vehicles;
    const card = (v) => {
        const s = C.vdyn(v.id);
        if (!s) return '';
        const dm = C.vehDmg(v, s);
        return `<button class="ang-vcard ${esc(s.state)}" data-g="veh" data-id="${esc(v.id)}">
            <div class="ang-vimg">${v.img ? `<img src="${esc(v.img)}" alt="" loading="lazy">` : vehSvg(v, s)}</div>
            <div class="ang-vm"><b>${esc(v.name)}</b><small>${esc([v.model, C.short(v.owner), s.where].filter(Boolean).join(' · '))}</small>
            <div class="ang-vbars"><span>${ic('fuel')}${bar(s.fuel, s.fuel < 15 ? 'bad' : s.fuel < 35 ? 'warn' : '')}<em>${s.fuel}%</em></span><span>${ic('wrench')}${bar(dm, dm >= 50 ? 'bad' : dm >= 20 ? 'warn' : 'ok')}<em>${dm ? `${dm}%` : 'цел'}</em></span></div>
            ${s.state !== 'ok' ? chip(D.VSTATE[s.state] || s.state, s.state === 'wreck' || s.state === 'lost' ? 'bad' : 'warn') : ''}${s.burn >= 50 ? chip('засвечена', 'bad') : ''}</div></button>`;
    };
    return `<div class="ang-actions">${btn('newVeh', `${ic('plus')} Техника`, '', 'primary')}${btn('shopCat', `${ic('store')} Купить`, 'data-v="vehicle"')}${btn('story', busy('story:gar') ? spin : `${ic('scroll')} Из истории`, 'data-v="gar"', 'ghost')}</div>
    ${suggestRow(['veh'])}
    <div class="ang-garage">${list.map(card).join('') || empty('Гараж пуст. Добавь машину, купи или подтяни из истории.')}</div>`;
}

// ───────────── Лаба ─────────────

const LAB_SUBS = [['proj', 'Проекты', 'flask'], ['tree', 'Дерево', 'tree'], ['chron', 'Хроника', 'clock'], ['mats', 'Материалы', 'gem'], ['poly', 'Полигон', 'target'], ['ideas', 'Инсайты', 'sparkles'], ['grave', 'Кладбище', 'grave']];
function labHtml() {
    const sub = ui.sub.lab || 'proj';
    const e = C.era();
    const pg = C.pregnant();
    const top = `<div class="ang-labhead"><b>${esc(D.LAB_NAME[e.id] || 'Лаборатория')}</b>${pg ? `<small>${ic('alert')} беременность: ${esc(pg.text)} — опасное медленнее, Амара против</small>` : ''}</div>
    <div class="ang-actions">${btn('insight', `${ic('dice')} Кубик инсайтов`, '', 'primary')}${btn('newProj', ic('plus'), 'title="Новый проект"', 'ico')}${btn('story', busy('story:lab') ? spin : `${ic('scroll')} Изобретения из истории`, 'data-v="lab"', 'ghost')}</div>`;
    const body = { proj: labProj, tree: labTree, chron: labChron, mats: labMats, poly: labPoly, ideas: labIdeas, grave: labGrave }[sub]();
    return `${top}${subsNav(LAB_SUBS, sub)}${suggestRow(['lab'])}${body}`;
}
function stageDots(p, g = '') {
    const st = C.projStage(p);
    return `<div class="ang-steps">${D.STAGES.map((s, i) => `<${g ? `button data-g="${g}" data-id="${esc(p.id)}" data-v="${i}"` : 'span'} class="${i < st ? 'done' : i === st ? 'cur' : ''}"><b></b><span>${esc(s)}</span></${g ? 'button' : 'span'}>`).join('')}</div>`;
}
function projCard(p) {
    const st = C.projStage(p), pct = C.projPct(p);
    const bl = C.blockedBy(p);
    return `<button class="ang-pcard${p.dead ? ' dead' : ''}${p.fresh ? ' fresh' : ''}" data-g="proj" data-id="${esc(p.id)}">
        ${p.img ? `<span class="ang-bp"><img src="${esc(p.img)}" alt="" loading="lazy"></span>` : `<span class="ang-bp ph">${ic('flask')}</span>`}
        <div class="ang-card-m"><div class="ang-card-h"><b>${esc(p.name)}</b>${chip(D.fieldName(p.field))}${p.lock ? ic('lock') : ''}</div>
        ${stageDots(p)}${st < D.STAGES.length - 1 && !p.dead ? bar(pct) : ''}
        <small>${esc([p.team?.length ? p.team.join(', ') : '', bl.length ? `ждёт: ${bl.map(q => q.name).join(', ')}` : '', p.y ? `${Math.floor(p.y)}` : ''].filter(Boolean).join(' · '))}</small></div></button>`;
}
function labProj() {
    const list = C.projectsNow().filter(p => !p.dead);
    const act = list.filter(p => C.projStage(p) < D.STAGES.length - 1);
    const done = list.filter(p => C.projStage(p) >= D.STAGES.length - 1);
    return `${act.length ? `<div class="ang-list">${act.map(projCard).join('')}</div>` : empty('В работе ничего. Брось кубик инсайтов — или заведи проект.')}
    ${done.length ? `${sec('Готово', String(done.length))}<div class="ang-list">${done.map(projCard).join('')}</div>` : ''}`;
}
function labTree() {
    const list = C.projectsNow().filter(p => !p.dead);
    const roots = list.filter(p => !p.needs.some(n => list.some(q => q.id === n)));
    const seen = new Set();
    const node = (p, depth) => {
        if (seen.has(p.id) || depth > 6) return '';
        seen.add(p.id);
        const kids = C.unlocks(p).filter(q => list.includes(q));
        const st = C.projStage(p);
        return `<div class="ang-node" style="--d:${depth}"><button data-g="proj" data-id="${esc(p.id)}" class="${st >= 4 ? 'done' : C.blockedBy(p).length ? 'blocked' : ''}">${ic(st >= 4 ? 'check' : C.blockedBy(p).length ? 'lock' : 'flask')}<b>${esc(p.name)}</b><small>${esc(D.STAGES[st])}</small></button>${kids.map(k => node(k, depth + 1)).join('')}</div>`;
    };
    return `<div class="ang-hint">«Нужно сначала» задаётся в проекте. Что не готово — держит следующее под замком и снижает кубик.</div>
    <div class="ang-tree">${roots.map(p => node(p, 0)).join('') || empty('Проектов нет.')}</div>`;
}
function labChron() {
    const list = [...C.M().projects].filter(p => !(Number(p.ty) > C.hedyYear() + 0.001)).sort((a, b) => (Number(a.ty) || 0) - (Number(b.ty) || 0));
    let lastY = null;
    return `<div class="ang-hint">Всё, что Хеди придумала, — по годам её жизни. В 1940-е она попала из 2020-го, поэтому прибор 1945-го стоит после Скачка.</div>
    <div class="ang-chron">${list.map(p => { const y = Math.floor(Number(p.ty) || 0); const head = y !== lastY ? `<div class="ang-year">${y || '—'}</div>` : ''; lastY = y; return `${head}<button class="ang-ev${p.dead ? ' dead' : ''}" data-g="proj" data-id="${esc(p.id)}"><i></i><div><b>${esc(p.name)}</b><small>${esc([p.y && Math.floor(p.y) !== y ? `календарный ${Math.floor(p.y)}` : '', D.fieldName(p.field), p.dead ? `☠ ${C.cut(p.deadWhy, 60)}` : D.STAGES[C.projStage(p)]].filter(Boolean).join(' · '))}</small></div></button>`; }).join('') || empty('Пусто.')}</div>`;
}
function labMats() {
    const list = C.M().materials;
    return `<div class="ang-actions">${btn('newMat', `${ic('plus')} Материал`, '', 'primary')}${btn('shopCat', `${ic('store')} Достать`, 'data-v="gadget"')}</div>
    <div class="ang-list">${list.map(x => `<div class="ang-row mat">${ic('gem')}<div><b>${esc(x.name)}</b><small>${esc([x.from, x.note, '★'.repeat(x.rare || 1)].filter(Boolean).join(' · '))}</small></div><span class="ang-num">${x.qty}${x.unit ? ` ${esc(x.unit)}` : ''}</span>${btn('matQty', '−', attr({ id: x.id, v: -1 }), 'sm ghost')}${btn('matQty', '+', attr({ id: x.id, v: 1 }), 'sm ghost')}${btn('matEdit', ic('pencil'), attr({ id: x.id }), 'ico sm ghost')}</div>`).join('') || empty('Материалов нет: вибраниум, остатки энергии Камней, редкая электроника — сюда. Проект может их требовать.')}</div>`;
}
function labPoly() {
    const list = C.M().items.filter(it => it.gadget);
    return `<div class="ang-hint">Испытать гаджет: кубик против надёжности. Прототип может отказать — или громко.</div>
    <div class="ang-list">${list.map(it => `<div class="ang-row">${kic(it.kind)}<div><b>${esc(it.name)}</b><small>${esc(C.short(it.owner))} · надёжность ${'●'.repeat(it.gadget.reliab)}${'○'.repeat(5 - it.gadget.reliab)}${it.gadget.proto ? ' · прототип' : ''}</small></div>${btn('proto', `${ic('dice')} Испытать`, attr({ id: it.id }), 'sm')}</div>`).join('') || empty('Гаджетов нет. Готовый проект → «Выпустить» — и он здесь.')}</div>`;
}
function labIdeas() {
    const list = C.M().insights;
    return `<div class="ang-list">${list.map(x => `<div class="ang-box"><div class="ang-box-h">${ic('sparkles')}<b>${esc(D.INSIGHT.find(g => g.id === x.kind)?.name || 'Инсайт')} · d20 ${x.roll}</b><small>${esc([x.for, x.at].filter(Boolean).join(' · '))}</small></div>
        ${x.ideas.map(y => `<div class="ang-idea${y.used ? ' used' : ''}"><b>${esc(y.title)}</b><p>${esc(y.text)}</p>${y.used ? '<small>в проектах</small>' : btn('ideaProj', `${ic('plus')} В проекты`, attr({ set: x.id, id: y.id }), 'sm ghost')}</div>`).join('')}</div>`).join('') || empty('Бросков ещё не было.')}</div>`;
}
function labGrave() {
    const list = C.projectsNow().filter(p => p.dead);
    return `<div class="ang-list">${list.map(p => `<button class="ang-pcard dead" data-g="proj" data-id="${esc(p.id)}"><span class="ang-bp ph">${ic('grave')}</span><div class="ang-card-m"><div class="ang-card-h"><b>${esc(p.name)}</b></div><small>${esc(p.deadWhy || 'брошен')}</small></div></button>`).join('') || empty('Кладбище пустое. Пока.')}</div>`;
}

// ───────────── Костюмы ─────────────

function suitHtml() {
    const m = C.M();
    const by = new Map();
    for (const s of m.suits) { const w = C.canon(s.who) || '—'; if (!by.has(w)) by.set(w, []); by.get(w).push(s); }
    const card = (s) => { const d = C.sdyn(s.id); const dmg = d ? Math.round(D.SZONES.reduce((a, [z]) => a + (d.dmg[z] || 0), 0) / D.SZONES.length) : 0; return `<button class="ang-scard${d?.worn ? ' worn' : ''}" data-g="suit" data-id="${esc(s.id)}">
        <span class="ang-simg${s.img ? '' : ' ph'}">${s.img ? `<img src="${esc(s.img)}" alt="" loading="lazy">` : ic('shield')}</span>
        <b>${esc(s.name)}</b><small>${esc([D.SKINDS.find(k => k[0] === s.kind)?.[1], d?.where].filter(Boolean).join(' · '))}</small>
        <div class="ang-srow">${d?.worn ? chip('надет', 'ok') : ''}${d?.st && d.st !== 'intact' ? chip(D.SUIT_ST[d.st], d.st === 'lost' ? 'bad' : 'warn') : ''}${s.main ? chip('основной') : ''}${dmg ? chip(`урон ${dmg}%`, 'warn') : ''}</div></button>`; };
    return `<div class="ang-actions">${btn('newSuit', `${ic('plus')} Костюм`, '', 'primary')}${btn('story', busy('story:suit') ? spin : `${ic('scroll')} Из истории`, 'data-v="suit"', 'ghost')}${btn('heroPull', ic('refresh'), 'title="Подтянуть из Life → Герои"', 'ico ghost')}</div>
    <div class="ang-hint">Основной костюм уходит в Life → Герои: кадры Оператора видят, как он выглядит, и берут картинку рефом.</div>
    ${[...by.entries()].map(([w, list]) => `${sec(`${ava(w, 'xs')} ${esc(C.short(w))}`, String(list.length))}<div class="ang-suits">${list.map(card).join('')}</div>`).join('') || empty('Костюмов нет.')}`;
}

// ───────────── Магазин ─────────────

function shopHtml() {
    const e = C.era();
    const shops = D.SHOPS[e.id] || D.SHOPS.none;
    const shop = shops.find(s => s.id === ui.shop.src) || shops[0];
    ui.shop.src = shop.id;
    const cat = ui.shop.cat || 'all';
    const fw = ui.shop.for || '';
    const list = C.shopList(shop, cat, fw);
    const bal = C.balance();
    const k = `shop:${shop.id}:${cat}:${fw}`;
    const dos = fw ? C.dossierOf(fw) : null;
    return `<div class="ang-shops">${shops.map(s => `<button class="${s.id === shop.id ? 'on' : ''}" data-g="shopSrc" data-v="${s.id}">${ic(s.ico)}<b>${esc(s.name)}</b><small>${esc(D.PAY_WORD[s.pay])}</small></button>`).join('')}</div>
    <div class="ang-shopdesc">${esc(shop.desc)}${shop.pay === 'money' ? `<span class="ang-bal">${ic('coin')} ${bal ? esc(bal.text) : 'банк Телефона не найден — без списания'}</span>` : ''}</div>
    <div class="ang-chips">${D.SHOP_CATS.map(c => `<button class="ang-chip${c[0] === cat ? ' on' : ''}" data-g="shopCat" data-v="${c[0]}">${esc(c[1])}</button>`).join('')}</div>
    <div class="ang-forwho"><small>Под кого</small><div class="ang-people sm"><button class="${fw ? '' : 'on'}" data-g="shopFor" data-v="">${ic('store')}<span>всем</span></button>${peopleList().map(n => `<button class="${C.same(n, fw) ? 'on' : ''}" data-g="shopFor" data-v="${esc(n)}">${ava(n)}<span>${esc(C.short(n))}</span></button>`).join('')}</div>
        ${fw ? `<div class="ang-hint">${dos ? `Продавец подбирает под досье ${esc(C.short(fw))}: ${esc(C.cut([dos.role, dos.style].filter(Boolean).join(' — '), 140))}` : `Досье ${esc(C.short(fw))} ещё нет — продавец смотрит карточку. Досье собирает квартирмейстер (Оружейная → Набор от ИИ).`}</div>` : ''}</div>
    <div class="ang-ask"><input data-gf="shop:ask" data-id="s" value="${esc(ui.shop.ask)}" placeholder="под заказ: «тихий пистолет под вечернее платье»">${btn('shopGen', busy(k) ? spin : ic('sparkles'), 'title="Спросить продавца"', 'ico primary')}</div>
    ${list.length ? `<div class="ang-goods">${list.map((x, i) => goodCard(x, i)).join('')}</div>
        <div class="ang-actions">${btn('shopMore', busy(`${k}:more`) ? `${spin} Подвозят…` : `${ic('plus')} Ещё товара`, '', 'ghost wide')}</div>`
        : `<div class="ang-empty big">${ic('store', 'xl')}<p>Витрина пустая.</p>${btn('shopGen', busy(k) ? `${spin} Продавец думает…` : `${ic('sparkles')} Показать ассортимент`, '', 'primary')}</div>`}`;
}
function goodCard(x, i) {
    const veh = !!x._veh;
    const kind = veh ? D.vkindOf(x.kind)[2] : D.kindOf(x.kind)[2];
    return `<button class="ang-good" data-g="good" data-v="${i}">
        <span class="ang-good-i">${ic(kind)}</span>
        <div><b>${esc(x.name)}</b><small>${esc([x.model, x.caliber, veh ? D.vkindOf(x.kind)[1] : D.kindName(x.kind)].filter(Boolean).join(' · '))}</small>
        ${x.fit ? `<p class="ang-why">${esc(C.cut(x.fit, 120))}</p>` : ''}<p>${esc(C.cut(x.desc, 130))}</p></div>
        <em>${C.priceNum(x.price) ? esc(C.money(C.priceNum(x.price))) : esc(String(x.price || '—'))}</em></button>`;
}

// ───────────── листы ─────────────

function paintModal() {
    const box = document.querySelector('#ang-app .ang-modal');
    if (!box) return;
    if (!ui.modal) { box.classList.remove('on'); box.innerHTML = ''; return; }
    const top = box.querySelector('.ang-sheet')?.scrollTop || 0;
    let html = '';
    try {
        html = {
            item: itemSheet, veh: vehSheet, suit: suitSheet, proj: projSheet, good: goodSheet, kit: kitSheet, story: storySheet,
            insight: insightSheet, exp: expSheet, proto: protoSheet, pick: pickSheet, form: formSheet, zoom: zoomSheet,
        }[ui.modal.kind]?.() || '';
    } catch (err) { console.error('[Ангар] лист', err); html = `<div class="ang-sheet">${empty(`Лист упал: ${esc(err?.message || err)}`)}${btn('closeModal', 'Закрыть')}</div>`; }
    box.innerHTML = `<div class="ang-shade" data-g="closeModal"></div>${html}`;
    box.classList.add('on');
    const sh = box.querySelector('.ang-sheet');
    if (sh && ui.modal.keep) sh.scrollTop = top;
    ui.modal.keep = true;
}
function modal(kind, extra = {}) { ui.modal = { kind, ...extra }; paintModal(); }
function closeModal() { ui.modal = null; ui.zone = ''; paintModal(); render(); }
const sheetHead = (title, right = '') => `<div class="ang-sheet-h"><b>${title}</b>${right}<button class="ang-x" data-g="closeModal">${ic('x')}</button></div>`;
const imgBox = (src, drawG, id, label, icon) => `<div class="ang-imgbox">${src ? `<img src="${esc(src)}" alt="" data-g="zoom" data-v="${esc(src)}">` : `<div class="ang-ph">${ic(icon, 'xl')}</div>`}
    <div class="ang-imgbtns">${btn(drawG, busy(`${drawG}:${id}`) ? spin : `${ic('wand')} ${esc(label)}`, attr({ id }), 'sm')}<label class="ang-btn sm ghost">${ic('upload')}<input type="file" accept="image/*" data-gup="${drawG}" data-id="${esc(id)}" hidden></label></div></div>`;
function openSheetFor(hall, id) {
    if (C.itemById(id)) modal('item', { id });
    else if (C.vehById(id)) modal('veh', { id });
    else if (C.suitById(id)) modal('suit', { id });
    else if (C.projById(id)) modal('proj', { id });
}

function itemSheet() {
    const it = C.itemById(ui.modal.id);
    if (!it) return `<div class="ang-sheet">${sheetHead('Вещь')}${empty('Не найдена.')}</div>`;
    const s = C.dyn(it.id);
    const gun = D.isGun(it.kind);
    const id = it.id;
    const slots = (D.SLOT_FIT[it.kind] || D.SLOTS.map(x => x.id)).map(sid => D.slotById(sid)).filter(Boolean);
    const stash = [...new Set([...C.M().stashes.map(x => x.name), 'дома', ...C.M().items.map(x => C.dyn(x.id)?.where).filter(Boolean)])];
    return `<div class="ang-sheet">${sheetHead(`${kic(it.kind)} ${esc(it.name)}`, btn('describe', busy(`desc:${id}`) ? spin : ic('sparkles'), attr({ id }) + ' title="Заполнить характеристику"', 'ico ghost'))}
    ${imgBox(it.img, 'drawItem', id, 'Фото', D.kindOf(it.kind)[2])}
    ${gun && it.cap ? `<div class="ang-gunpanel${C.empty(it, s) ? ' dry' : ''}">
        <div class="ang-mag"><span class="ang-big">${s.inMag}<small>/${it.cap}</small></span><small>${esc(D.FEEDS[it.feed] || 'магазин')}${s.state === 'jammed' ? ' · КЛИН' : ''}</small></div>
        ${ammoDots(it, s)}
        <div class="ang-row wrap">${btn('shot', '−1', attr({ id, v: -1 }), 'sm')}${btn('shot', '−3', attr({ id, v: -3 }), 'sm')}${btn('reload', `${ic('refresh')} Перезарядить`, attr({ id }), 'sm primary')}${btn('fillMags', 'Полный б/к', attr({ id }), 'sm ghost')}${s.state === 'jammed' ? btn('unjam', 'Передёрнуть', attr({ id }), 'sm') : ''}</div>
        <div class="ang-mags">${s.mags.map((n, i) => `<span class="ang-magc${n < it.cap ? ' part' : ''}">${n}<button data-g="magDel" data-id="${esc(id)}" data-v="${i}">${ic('x')}</button></span>`).join('')}${btn('mags', `${ic('plus')} магазин`, attr({ id, v: 1 }), 'sm ghost')}</div>
        <div class="ang-cond">${ic('wrench')}<span>${esc(D.condWord(s.cond))}</span>${bar(s.cond, s.cond < 35 ? 'bad' : s.cond < 60 ? 'warn' : 'ok')}${btn('clean', 'Почистить', attr({ id }), 'sm ghost')}</div>
    </div>` : ''}
    ${it.gadget?.max ? `<div class="ang-gunpanel"><div class="ang-mag"><span class="ang-big">${s.charges}<small>/${it.gadget.max}</small></span><small>зарядов${it.gadget.recharge ? ` · ${esc(it.gadget.recharge)}` : ''}</small></div>
        <div class="ang-row">${btn('charge', '−1', attr({ id, v: -1 }), 'sm')}${btn('charge', 'Зарядить', attr({ id, v: 99 }), 'sm primary')}${btn('proto', `${ic('dice')} Испытать`, attr({ id }), 'sm ghost')}</div></div>` : ''}
    ${['throw', 'explosive', 'ammo', 'gear', 'other'].includes(it.kind) ? `<div class="ang-row">${ic('box')}<span>Количество</span><span class="ang-num">${s.qty}</span>${btn('qty', '−1', attr({ id, v: -1 }), 'sm ghost')}${btn('qty', '+1', attr({ id, v: 1 }), 'sm ghost')}</div>` : ''}
    <div class="ang-grid2">
        ${field('Название', inp('it', id, 'name', it.name))}${field('Модель', inp('it', id, 'model', it.model, 'Glock 19, Ka-Bar…'))}
        ${field('Вид', sel('it', id, 'kind', it.kind, D.KINDS.map(k => [k[0], k[1]])))}${field('Чья', sel('it', id, 'owner', it.owner, [['', '—'], ...peopleList().map(n => [n, C.short(n)])]))}
        ${gun || it.kind === 'ammo' ? field('Калибр', inp('it', id, 'caliber', it.caliber, '9×19 мм')) : ''}${gun ? field('Ёмкость', inp('it', id, 'cap', it.cap, '15', 'number')) : ''}
        ${gun ? field('Питание', sel('it', id, 'feed', it.feed, Object.entries(D.FEEDS))) : ''}${gun || it.kind === 'ammo' ? field('Патроны', sel('it', id, 'ammo', it.ammo, D.AMMO_TYPES)) : ''}
    </div>
    ${sec('Где сейчас')}
    <div class="ang-row wrap">${s.hands ? chip('в руках', 'ok') : ''}${s.where ? chip(s.where, 'warn') : ''}${s.holder ? chip(`у ${C.short(s.holder)}`) : chip('ни у кого')}</div>
    <div class="ang-row wrap">${btn('hands', s.hands ? `${ic('hand')} Убрать` : `${ic('hand')} В руки`, attr({ id }), 'sm')}${btn('give', `${ic('swap')} Отдать`, attr({ id }), 'sm ghost')}${btn('toStash', `${ic('vault')} Убрать в…`, attr({ id }), 'sm ghost')}${s.where ? btn('takeOut', `${ic('bag')} Взять с собой`, attr({ id }), 'sm ghost') : ''}</div>
    ${field('Куда на теле', `<select data-gf="it:slot" data-id="${esc(id)}"><option value="">—</option>${slots.map(x => `<option value="${x.id}" ${s.slot === x.id ? 'selected' : ''}>${esc(x.label)} · ${esc(D.DRAW_WORD[x.draw])}</option>`).join('')}</select>`)}
    ${field('Лежит', `<input list="ang-places" data-gf="it:where" data-id="${esc(id)}" value="${esc(s.where)}" placeholder="при себе"><datalist id="ang-places">${stash.map(x => `<option value="${esc(x)}">`).join('')}</datalist>`)}
    ${it.kind === 'armor' ? `${sec('Броня')}<div class="ang-grid2">${field('Класс', sel('it', id, 'armor.level', it.armor?.level || 3, [1, 2, 3, 4, 5].map(n => [n, `${n} — ${D.ARMOR_STOPS[n]}`])))}${field('Закрывает', inp('it', id, 'armor.covers', it.armor?.covers, 'корпус'))}</div>` : ''}
    ${it.gadget ? `${sec('Гаджет')}${field('Что делает', area('it', id, 'gadget.does', it.gadget.does, 'ровно что, без «и всё остальное»', 2))}<div class="ang-grid2">${field('Зарядов', inp('it', id, 'gadget.max', it.gadget.max, '3', 'number'))}${field('Перезарядка', inp('it', id, 'gadget.recharge', it.gadget.recharge, 'час от розетки'))}${field('Надёжность', sel('it', id, 'gadget.reliab', it.gadget.reliab, [1, 2, 3, 4, 5].map(n => [n, '●'.repeat(n)])))}${field('Прототип', sel('it', id, 'gadget.proto', it.gadget.proto ? '1' : '', [['', 'нет'], ['1', 'да']]))}</div>${field('Предел', inp('it', id, 'gadget.limit', it.gadget.limit, 'чего не может'))}${field('Побочка', inp('it', id, 'gadget.side', it.gadget.side, 'чем платит'))}` : ''}
    ${it.legend ? `${sec('Легенда')}<div class="ang-grid2">${field('Имя по документам', inp('it', id, 'legend.alias', it.legend.alias, 'Анна Ковальчик'))}${field('Гражданство', inp('it', id, 'legend.nation', it.legend.nation, 'Польша'))}</div>${field('Документы', inp('it', id, 'legend.docs', it.legend.docs, 'паспорт, права, пресс-карта'))}${field('Прикрытие', inp('it', id, 'legend.cover', it.legend.cover, 'журналистка, едет на конференцию'))}<div class="ang-row">${btn('burn', it.legend.burned ? `${ic('refresh')} Отмыть легенду` : `${ic('alert')} Сгорела`, attr({ id }), it.legend.burned ? 'sm' : 'sm danger')}</div>` : ''}
    ${it.disguise ? `${sec('Маскировка')}${field('Из чего', inp('it', id, 'disguise.parts', it.disguise.parts, 'парик, линзы, грим'))}${field('Как выглядит', inp('it', id, 'disguise.look', it.disguise.look, 'рыжая, очки, родинка'))}` : ''}
    ${Object.keys(it.stats || {}).length ? `${sec('Характеристика')}<div class="ang-stats">${Object.entries(STAT_LABEL).filter(([k]) => it.stats[k]).map(([k, l]) => statRow(l, it.stats[k])).join('')}${['weight', 'eff', 'rate'].filter(k => it.stats[k]).map(k => `<div class="ang-stat"><span>${{ weight: 'вес', eff: 'прицельно', rate: 'режим' }[k]}</span><b>${esc(it.stats[k])}</b></div>`).join('')}</div>` : ''}
    ${field('Моды', inp('it', id, 'mods', it.mods.join(', '), 'глушитель, коллиматор'))}
    ${field('Описание', area('it', id, 'desc', it.desc, 'что это, каково в руке', 3))}
    ${it.why ? field('Почему ему', area('it', id, 'why', it.why, 'навык, привычка, характер', 2)) : ''}
    ${field('История вещи', area('it', id, 'story', it.story, 'откуда, чья была, что с ней было', 2))}
    <div class="ang-row end">${it.price ? chip(`цена ${it.price}`) : ''}${it.from ? chip(it.from) : ''}${btn('delItem', `${ic('trash')} Удалить`, attr({ id }), 'sm ghost danger')}</div></div>`;
}

function vehSheet() {
    const v = C.vehById(ui.modal.id);
    if (!v) return `<div class="ang-sheet">${sheetHead('Техника')}${empty('Не найдена.')}</div>`;
    const s = C.vdyn(v.id);
    const id = v.id;
    const zones = D.zonesOf(v.kind);
    const zsel = zones.find(z => z[0] === ui.zone);
    const cost = C.repairCost(v, s);
    return `<div class="ang-sheet">${sheetHead(`${vic(v.kind)} ${esc(v.name)}`)}
    ${imgBox(v.img, 'drawVeh', id, 'Фото', D.vkindOf(v.kind)[2])}
    <div class="ang-vpanel">
        <div class="ang-vdiag">${vehSvg(v, s, true)}</div>
        <div class="ang-vside">
            <div class="ang-fuel">${ic('fuel')}<b>${s.fuel}%</b><small>${esc(D.FUEL[v.fuelType] || '')} · ≈${C.kmLeft(v, s)} км</small>${bar(s.fuel, s.fuel < 15 ? 'bad' : s.fuel < 35 ? 'warn' : '')}</div>
            <div class="ang-row">${btn('fuel', '−10', attr({ id, v: -10 }), 'sm ghost')}${btn('fuel', 'Заправить', attr({ id, v: 100 }), 'sm')}</div>
            <div class="ang-hint">${zsel ? `<b>${esc(zsel[1])}</b>: урон ${s.dmg[zsel[0]] || 0}%` : 'Тап по зоне на схеме — урон этой зоны.'}</div>
            ${zsel ? `<div class="ang-row">${btn('zdmg', '−25', attr({ id, v: -25 }), 'sm ghost')}${btn('zdmg', '+25', attr({ id, v: 25 }), 'sm')}${btn('zdmg', '0', attr({ id, v: -100 }), 'sm ghost')}</div>` : ''}
            <div class="ang-row wrap">${btn('repair', `${ic('wrench')} Механик${cost ? ` · ${esc(C.money(cost))}` : ''}`, attr({ id }), 'sm')}${btn('repairLab', `${ic('flask')} В лабе`, attr({ id }), 'sm ghost')}</div>
            ${btn('skid', `${ic('dice')} Занос`, attr({ id }), 'sm ghost')}
        </div>
    </div>
    <div class="ang-row wrap">${chip(D.VSTATE[s.state] || s.state, s.state === 'ok' ? 'ok' : 'warn')}${s.driver ? chip(`за рулём ${C.short(s.driver)}`) : ''}${s.burn ? chip(`засветка ${s.burn}%`, s.burn >= 50 ? 'bad' : '') : ''}</div>
    <div class="ang-grid2">
        ${field('Название', inp('v', id, 'name', v.name))}${field('Модель', inp('v', id, 'model', v.model, 'Dodge Charger 1969'))}
        ${field('Вид', sel('v', id, 'kind', v.kind, D.VKINDS.map(k => [k[0], k[1]])))}${field('Чья', sel('v', id, 'owner', v.owner, [['', '—'], ...peopleList().map(n => [n, C.short(n)]), ['А.И.М.', 'А.И.М.']]))}
        ${field('Цвет', inp('v', id, 'color', v.color, 'чёрный'))}${field('Топливо', sel('v', id, 'fuelType', v.fuelType, Object.entries(D.FUEL)))}
        ${field('Номер', inp('v', id, 'plate', v.plate, 'свой'))}${field('Левый номер', inp('v', id, 'fake', v.fake, 'на смену'))}
        ${field('Где стоит', `<input data-gf="vd:where" data-id="${esc(id)}" value="${esc(s.where)}" placeholder="гараж">`)}${field('Состояние', `<select data-gf="vd:state" data-id="${esc(id)}">${Object.entries(D.VSTATE).map(([k, t]) => `<option value="${k}" ${s.state === k ? 'selected' : ''}>${t}</option>`).join('')}</select>`)}
    </div>
    <div class="ang-row wrap">${btn('plates', `${ic('swap')} Сменить номера`, attr({ id }), 'sm ghost')}${btn('burnV', '−засветка', attr({ id, v: -25 }), 'sm ghost')}${btn('burnV', '+засветка', attr({ id, v: 25 }), 'sm ghost')}</div>
    ${sec('Характеристика')}<div class="ang-stats">${statRow('скорость', v.stats.speed)}${statRow('управляемость', v.stats.handling)}${statRow('броня', v.stats.armor)}<div class="ang-stat"><span>мест</span><b>${v.stats.seats}</b></div><div class="ang-stat"><span>запас хода</span><b>${v.stats.range} км</b></div></div>
    <div class="ang-grid2">${['speed', 'handling', 'armor'].map(k => field({ speed: 'Скорость', handling: 'Управляемость', armor: 'Броня' }[k], sel('v', id, `stats.${k}`, v.stats[k], [1, 2, 3, 4, 5].map(n => [n, '●'.repeat(n)])))).join('')}${field('Запас хода, км', inp('v', id, 'stats.range', v.stats.range, '600', 'number'))}</div>
    ${sec('Тюнинг', String(v.mods.length))}<div class="ang-row wrap">${v.mods.map((x, i) => `<span class="ang-chip">${esc(x.name)}${x.from ? ` <small>${esc(x.from)}</small>` : ''}<button data-g="vmodDel" data-id="${esc(id)}" data-v="${i}">${ic('x')}</button></span>`).join('')}${btn('vmodAdd', `${ic('plus')} мод`, attr({ id }), 'sm ghost')}${btn('insightFor', `${ic('dice')} Инсайт`, attr({ id }), 'sm ghost')}</div>
    ${sec('Тайник в машине', String((v.stash || []).length))}<div class="ang-list tight">${(v.stash || []).map(C.itemById).filter(Boolean).map(it => `<div class="ang-row">${kic(it.kind)}<span>${esc(it.name)}</span>${btn('vstashOut', ic('x'), attr({ id, v: it.id }), 'ico sm ghost')}</div>`).join('')}${btn('vstashIn', `${ic('plus')} Спрятать сюда`, attr({ id }), 'sm ghost')}</div>
    ${field('Описание', area('v', id, 'desc', v.desc, 'как едет, чем хороша', 3))}
    ${v.why ? field('Почему ему', area('v', id, 'why', v.why, 'навык, привычка, характер', 2)) : ''}
    ${field('История', area('v', id, 'story', v.story, 'откуда, что с ней было', 2))}
    <div class="ang-row end">${btn('delVeh', `${ic('trash')} Удалить`, attr({ id }), 'sm ghost danger')}</div></div>`;
}

function suitSheet() {
    const s = C.suitById(ui.modal.id);
    if (!s) return `<div class="ang-sheet">${sheetHead('Костюм')}${empty('Не найден.')}</div>`;
    const d = C.sdyn(s.id);
    const id = s.id;
    return `<div class="ang-sheet">${sheetHead(`${ic('shield')} ${esc(s.name)}`)}
    ${imgBox(s.img, 'drawSuit', id, 'Нарисовать', 'shield')}
    <div class="ang-row wrap">${btn('worn', d.worn ? `${ic('check')} Надет` : 'Надеть', attr({ id }), d.worn ? 'sm primary' : 'sm')}${btn('mainSuit', s.main ? `${ic('check')} Основной` : 'Сделать основным', attr({ id }), s.main ? 'sm primary' : 'sm ghost')}</div>
    ${segs('sst', d.st, Object.entries(D.SUIT_ST), attr({ id }))}
    ${sec('Урон по зонам')}<div class="ang-szones">${D.SZONES.map(([z, t]) => `<div class="ang-sz"><span>${esc(t)}</span>${bar(d.dmg[z] || 0, (d.dmg[z] || 0) >= 70 ? 'bad' : (d.dmg[z] || 0) >= 25 ? 'warn' : 'ok')}${btn('sdmg', '−', attr({ id, z, v: -25 }), 'sm ghost')}${btn('sdmg', '+', attr({ id, z, v: 25 }), 'sm ghost')}</div>`).join('')}</div>
    <div class="ang-grid2">${field('Название', inp('s', id, 'name', s.name))}${field('Чей', sel('s', id, 'who', s.who, [['', '—'], ...peopleList().map(n => [n, C.short(n)])]))}${field('Вид', sel('s', id, 'kind', s.kind, D.SKINDS))}${field('Броня', sel('s', id, 'armor', s.armor, [1, 2, 3, 4, 5].map(n => [n, '●'.repeat(n)])))}</div>
    ${field('Где лежит', `<input data-gf="sd:where" data-id="${esc(id)}" value="${esc(d.where)}" placeholder="на теле / в шкафу / в лабе">`)}
    ${field('Как выглядит (для кадров)', area('s', id, 'look', s.look, 'силуэт, цвета, материалы, маска', 3))}
    ${sec('Системы', String(s.systems.length))}<div class="ang-list tight">${s.systems.map(y => `<div class="ang-sz"><span>${esc(y.name)}</span>${bar(y.pct, y.pct < 40 ? 'bad' : y.pct < 70 ? 'warn' : 'ok')}${btn('sys', '−', attr({ id, sys: y.id, v: -20 }), 'sm ghost')}${btn('sys', '+', attr({ id, sys: y.id, v: 20 }), 'sm ghost')}${btn('sysDel', ic('x'), attr({ id, sys: y.id }), 'ico sm ghost')}</div>`).join('')}${btn('sysAdd', `${ic('plus')} система`, attr({ id }), 'sm ghost')}</div>
    ${sec('Апгрейды', String(s.upgrades.length))}<div class="ang-row wrap">${s.upgrades.map((x, i) => `<span class="ang-chip">${esc(x.name)}${x.from ? ` <small>${esc(x.from)}</small>` : ''}<button data-g="supDel" data-id="${esc(id)}" data-v="${i}">${ic('x')}</button></span>`).join('')}${btn('supAdd', `${ic('plus')} апгрейд`, attr({ id }), 'sm ghost')}${btn('insightFor', `${ic('dice')} Инсайт`, attr({ id }), 'sm ghost')}</div>
    ${field('Заметки', area('s', id, 'note', s.note, 'история, что умеет, что ломается', 3))}
    ${s.why ? field('Почему ему', area('s', id, 'why', s.why, 'навык, привычка, характер', 2)) : ''}
    <div class="ang-row end">${s.src === 'life' ? chip('из Life → Герои') : ''}${btn('delSuit', `${ic('trash')} Удалить`, attr({ id }), 'sm ghost danger')}</div></div>`;
}

function projSheet() {
    const p = C.projById(ui.modal.id);
    if (!p) return `<div class="ang-sheet">${sheetHead('Проект')}${empty('Не найден.')}</div>`;
    const id = p.id;
    const st = C.projStage(p), pct = C.projPct(p);
    const W = C.world();
    const plog = (W.labLog[id] || []).map(x => ({ t: x.t, at: `пост #${x.i}`, kind: 'work' }));
    const log = [...plog.reverse(), ...p.log].slice(0, 40);
    const pend = C.M().shots.find(x => x.kind === 'lab' && x.key === id);
    const bl = C.blockedBy(p), un = C.unlocks(p);
    return `<div class="ang-sheet">${sheetHead(`${ic('flask')} ${esc(p.name)}`)}
    ${imgBox(p.img, 'drawProj', id, C.era().id === 'ssr' ? 'Чертёж на кальке' : 'Голо-чертёж', 'flask')}
    ${p.dead ? `<div class="ang-dead">${ic('grave')}<div><b>На кладбище</b><p>${esc(p.deadWhy)}</p></div>${btn('revive', 'Оживить', attr({ id }), 'sm')}</div>` : ''}
    ${p.lock ? `<div class="ang-kv">${ic('lock')}<span>Секрет: про это знает только она.</span></div>` : ''}
    ${stageDots(p, 'stage')}
    ${st < D.STAGES.length - 1 && !p.dead ? `<div class="ang-prog">${btn('pct', '−10', attr({ id, v: -10 }), 'sm ghost')}${bar(pct, 'big')}<b>${pct}%</b>${btn('pct', '+10', attr({ id, v: 10 }), 'sm ghost')}</div>` : ''}
    ${pend ? `<div class="ang-shot">${ic('send')}<span>Ждёт сцены: ${esc(C.cut(pend.text.replace(/^\[|\]$/g, ''), 130))}</span><button data-g="disarm" data-v="${pend.at}">${ic('x')}</button></div>` : ''}
    ${!p.dead ? `<div class="ang-actions">${st < D.STAGES.length - 1 ? btn('exp', `${ic('dice')} Опыт`, attr({ id }), 'primary') : btn('release', `${ic('send')} Выпустить`, attr({ id }), 'primary')}${btn('insightFor', `${ic('sparkles')} Инсайт`, attr({ id }), 'ghost')}${btn('logAdd', ic('notes'), attr({ id }) + ' title="Запись в журнал"', 'ico ghost')}</div>` : ''}
    <div class="ang-grid2">${field('Название', inp('p', id, 'name', p.name))}${field('Область', sel('p', id, 'field', p.field, D.FIELDS))}${field('Выйдет', sel('p', id, 'out', p.out, D.OUT_TYPES))}${field('Год её жизни', inp('p', id, 'ty', Number(p.ty) ? Math.floor(p.ty) : '', '2024', 'number'))}</div>
    ${field('Команда', inp('p', id, 'team', p.team.join(', '), 'Айрис, Тони'))}
    ${field('Что это', area('p', id, 'note', p.note, 'идея, затык, история', 3))}
    ${field('Что делает готовое', area('p', id, 'spec', p.spec, 'для гаджета: ровно что делает и предел', 2))}
    ${field('Ограничения', inp('p', id, 'bans', p.bans, 'Амара запретила, пока беременна'))}
    ${sec('Нужно сначала', String(p.needs.length))}<div class="ang-row wrap">${p.needs.map(C.projById).filter(Boolean).map(q => `<span class="ang-chip ${C.projStage(q) >= 4 ? 'ok' : 'warn'}">${esc(q.name)}<button data-g="needDel" data-id="${esc(id)}" data-v="${esc(q.id)}">${ic('x')}</button></span>`).join('')}${btn('needAdd', `${ic('plus')} проект`, attr({ id }), 'sm ghost')}</div>
    ${un.length ? `<div class="ang-kv">${ic('tree')}<span>Откроет: ${un.map(q => esc(q.name)).join(', ')}</span></div>` : ''}
    ${bl.length ? `<div class="ang-kv warn">${ic('lock')}<span>Ждёт: ${bl.map(q => esc(q.name)).join(', ')}</span></div>` : ''}
    ${sec('Материалы', String(p.mats.length))}<div class="ang-row wrap">${p.mats.map(x => ({ x, m: C.matById(x.id) })).filter(y => y.m).map(({ x, m }) => `<span class="ang-chip ${Number(m.qty) >= x.n ? 'ok' : 'bad'}">${esc(m.name)} ×${x.n} <small>есть ${m.qty}</small><button data-g="pmatDel" data-id="${esc(id)}" data-v="${esc(m.id)}">${ic('x')}</button></span>`).join('')}${btn('pmatAdd', `${ic('plus')} материал`, attr({ id }), 'sm ghost')}</div>
    ${p.released.length ? `<div class="ang-kv ok">${ic('check')}<span>Выпущено: ${p.released.map(x => esc((C.itemById(x) || C.vehById(x) || C.suitById(x))?.name || '—')).join(', ')}</span></div>` : ''}
    ${sec('Журнал', String(log.length))}<div class="ang-log">${log.map(l => `<div class="ang-lg ${esc(l.kind)}"><span>${esc(l.at || '')}</span><p>${esc(l.t)}</p></div>`).join('') || '<div class="ang-mute">пусто</div>'}</div>
    <div class="ang-row end">${!p.dead ? btn('bury', `${ic('grave')} На кладбище`, attr({ id }), 'sm ghost') : ''}${btn('delProj', `${ic('trash')} Удалить`, attr({ id }), 'sm ghost danger')}</div></div>`;
}

/** Life 0.71: с какого счёта платить — у каждого свои деньги. */
function payerChips(who) {
    const l = C.payers(who);
    if (!l.length) return '';
    const cur = ui.modal.acc || C.defaultPayer(who);
    return `${sec('Платит')}<div class="ang-row wrap">${l.slice(0, 9).map(a => `<button class="ang-chip${a.id === cur ? ' on' : ''}" data-g="goodPay" data-v="${esc(a.id)}">${esc(a.label)} <small>${esc(a.text)}</small></button>`).join('')}</div>`;
}
function goodSheet() {
    const shop = (D.SHOPS[C.era().id] || D.SHOPS.none).find(s => s.id === ui.shop.src);
    const x = shop ? C.shopList(shop, ui.shop.cat || 'all', ui.shop.for || '')[ui.modal.i] : null;
    if (!x) return `<div class="ang-sheet">${sheetHead('Товар')}${empty('Уже не на витрине.')}</div>`;
    const veh = !!x._veh;
    const st = x.stats || {};
    const price = C.priceNum(x.price);
    const who = ui.modal.who || ui.shop.for || ui.who || C.userName();
    return `<div class="ang-sheet">${sheetHead(`${ic(veh ? D.vkindOf(x.kind)[2] : D.kindOf(x.kind)[2])} ${esc(x.name)}`)}
    <div class="ang-goodhead"><small>${esc([x.model, x.caliber, veh ? D.vkindOf(x.kind)[1] : D.kindName(x.kind)].filter(Boolean).join(' · '))}</small><span class="ang-price">${price ? esc(C.money(price)) : esc(String(x.price || '—'))}</span></div>
    ${x.fit ? `<p class="ang-why big">${ic('user')} ${x._for ? `${esc(C.short(x._for))}: ` : ''}${esc(x.fit)}</p>` : ''}
    <p class="ang-desc">${esc(x.desc || '')}</p>
    <div class="ang-stats">${veh ? `${statRow('скорость', st.speed)}${statRow('управляемость', st.handling)}${statRow('броня', st.armor)}${st.seats ? `<div class="ang-stat"><span>мест</span><b>${esc(st.seats)}</b></div>` : ''}${st.range ? `<div class="ang-stat"><span>запас хода</span><b>${esc(st.range)} км</b></div>` : ''}`
        : `${Object.entries(STAT_LABEL).filter(([k]) => st[k]).map(([k, l]) => statRow(l, Number(st[k]))).join('')}${x.cap ? `<div class="ang-stat"><span>ёмкость</span><b>${esc(x.cap)} · ${esc(D.FEEDS[x.feed] || 'магазин')}</b></div>` : ''}${['weight', 'eff', 'rate'].filter(k => st[k]).map(k => `<div class="ang-stat"><span>${{ weight: 'вес', eff: 'прицельно', rate: 'режим' }[k]}</span><b>${esc(st[k])}</b></div>`).join('')}${x.qty && x.kind === 'ammo' ? `<div class="ang-stat"><span>в упаковке</span><b>${esc(x.qty)}</b></div>` : ''}`}</div>
    ${x.gadget?.does ? `<div class="ang-kv">${ic('chip')}<span>${esc(x.gadget.does)}${x.gadget.limit ? ` — предел: ${esc(x.gadget.limit)}` : ''}</span></div>` : ''}
    ${(x.mods || []).length ? `<div class="ang-row wrap">${x.mods.map(m => chip(typeof m === 'string' ? m : m.name)).join('')}</div>` : ''}
    ${sec('Для кого')}${whoChips(who, 'goodWho')}
    ${shop.pay === 'money' && price > 0 ? payerChips(who) : ''}
    <div class="ang-actions">${btn('buy', `${ic('coin')} ${shop.pay === 'money' ? 'Купить' : shop.pay === 'req' ? 'Заявка' : 'Попросить'} для ${esc(C.short(who))}`, '', 'primary wide')}</div></div>`;
}

const kitPickAll = (r) => new Set(r ? [...C.arr(r.items).map((_, i) => `i${i}`), ...C.arr(r.vehicles).map((_, i) => `v${i}`), ...C.arr(r.suits).map((_, i) => `s${i}`)] : []);
function kitFor(who) { const last = C.lastKit(who); return { who, scen: last?.scen || 'now', ask: last?.ask || '', res: last, pick: kitPickAll(last) }; }
function dossierCard(who, d) {
    const head = `<div class="ang-dos-h">${ic('user')}<b>Досье · ${esc(C.short(who))}</b><small>${esc(C.era().name)}${d?.edited ? ' · поправлено' : ''}</small>${d ? btn('kitDos', ic('pencil'), 'title="Поправить досье"', 'ico ghost sm') : ''}</div>`;
    if (!d) return `<div class="ang-dossier empty">${head}<p>Соберётся с первым набором: стиль боя, навыки, тело, характер — и дальше держит все его наборы в одной логике. Поправить можно руками.</p></div>`;
    const chips = (l, cls = '') => `<div class="ang-row wrap">${l.map(x => chip(x, cls)).join('')}</div>`;
    return `<div class="ang-dossier">${head}
        ${d.role ? `<div class="ang-dos-role">${esc(d.role)}</div>` : ''}
        ${d.style ? `<div class="ang-dos-f"><small>Стиль боя</small><p>${esc(d.style)}</p></div>` : ''}
        ${d.skills.length ? `<div class="ang-dos-f"><small>Навыки</small>${chips(d.skills)}</div>` : ''}
        ${d.weak.length ? `<div class="ang-dos-f"><small>Слабые места</small>${chips(d.weak, 'warn')}</div>` : ''}
        ${d.temper ? `<div class="ang-dos-f"><small>Характер в снаряжении</small><p>${esc(d.temper)}</p></div>` : ''}
        ${d.rules.length ? `<div class="ang-dos-f"><small>Его правила</small><ul>${d.rules.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}</div>`;
}
function kitSheet() {
    const k = ui.kit ||= kitFor(ui.who || C.userName());
    const r = k.res;
    const S = D.kitScen(k.scen);
    const d = C.dossierOf(k.who);
    const going = busy('kit');
    const row = (key, x, icon, sub) => { const on = k.pick.has(key); return `<button class="ang-pickrow kit${on ? ' on' : ''}" data-g="kitPick" data-v="${key}"><i class="ang-cb">${on ? ic('check') : ''}</i>${ic(icon)}<div><b>${esc(x.name)}</b><small>${esc(sub)}</small>${x.why ? `<p class="ang-why">${esc(x.why)}</p>` : ''}${x.desc || x.look ? `<p>${esc(C.cut(x.desc || x.look, 140))}</p>` : ''}</div><em class="ang-src ${x.src === 'story' ? 'story' : 'logic'}">${esc(C.srcWord(x.src))}</em></button>`; };
    let res = '';
    if (r) {
        const RS = D.kitScen(r.scen);
        const items = C.arr(r.items).map((x, i) => ({ x, i }));
        const onBody = items.filter(({ x }) => x.slot), off = items.filter(({ x }) => !x.slot);
        const itemRow = ({ x, i }) => row(`i${i}`, x, D.kindOf(x.kind)[2], [x.model, x.caliber, x.slot ? D.slotById(x.slot)?.short : (x.where || 'дома')].filter(Boolean).join(' · '));
        const logic = [...C.arr(r.items), ...C.arr(r.vehicles), ...C.arr(r.suits)].filter(x => x.src !== 'story').length;
        const all = C.arr(r.items).length + C.arr(r.vehicles).length + C.arr(r.suits).length;
        res = `${sec(`Набор · ${esc(RS.name)}`, `логика ${logic} из ${all}`)}
        ${r.why ? `<p class="ang-note">${esc(r.why)}</p>` : ''}
        ${onBody.length ? `${sec(RS.carry ? 'При себе' : 'На теле, когда выйдет', String(onBody.length))}<div class="ang-list">${onBody.map(itemRow).join('')}</div>` : ''}
        ${off.length ? `${sec('Дома, в машине, в тайниках', String(off.length))}<div class="ang-list">${off.map(itemRow).join('')}</div>` : ''}
        ${C.arr(r.vehicles).length ? `${sec('Техника')}<div class="ang-list">${C.arr(r.vehicles).map((x, i) => row(`v${i}`, x, D.vkindOf(x.kind)[2], [x.model, x.where].filter(Boolean).join(' · '))).join('')}</div>` : ''}
        ${C.arr(r.suits).length ? `${sec('Костюмы')}<div class="ang-list">${C.arr(r.suits).map((x, i) => row(`s${i}`, x, 'shield', D.SKINDS.find(q => q[0] === x.kind)?.[1] || x.kind)).join('')}</div>` : ''}
        ${RS.carry ? '' : '<div class="ang-hint">Вещи лягут в Оружейную, а то, что носят на теле, — на стол: «Собраться», когда выходите.</div>'}
        <div class="ang-actions">${btn('kitAdd', `${ic(RS.carry ? 'plus' : 'table')} ${RS.carry ? 'Добавить выбранное' : 'На стол, к выходу'} (${k.pick.size})`, '', 'primary wide')}${btn('kitAlt', going ? spin : ic('dice'), 'title="Другой вариант"', 'ico ghost')}</div>`;
    }
    return `<div class="ang-sheet">${sheetHead(`${ic('sparkles')} Квартирмейстер`)}
    <div class="ang-hint">Собирает не то, что уже мелькало, а то, что он взял бы сам: сначала досье — стиль боя, навыки, тело, характер, — потом набор под сценарий. У каждой вещи — почему именно ему; что из истории — помечено.</div>
    ${whoChips(k.who, 'kitWho')}
    <div class="ang-chips">${D.KIT_SCEN.map(x => `<button class="ang-chip${x.id === S.id ? ' on' : ''}" data-g="kitScen" data-v="${x.id}">${ic(x.ico)} ${esc(x.name)}</button>`).join('')}</div>
    ${field('Уточнить (необязательно)', `<input data-gf="kit:ask" data-id="k" value="${esc(k.ask || '')}" placeholder="${S.id === 'cover' ? 'журналистка на конференции в Праге, рамка в отеле' : S.id === 'job' ? 'ночью на склад в Остраве, тихо' : 'куда и зачем'}">`)}
    ${dossierCard(k.who, d)}
    <div class="ang-actions">${btn('kitGo', going ? `${spin} Квартирмейстер думает…` : `${ic('sparkles')} Собрать: ${esc(S.name.toLowerCase())}`, '', 'primary wide')}${d ? btn('kitFresh', ic('refresh'), 'title="Собрать досье заново"', 'ico ghost') : ''}</div>
    ${res}</div>`;
}

function storySheet() {
    const S = ui.story;
    const label = { arm: 'Оружие и снаряжение', gar: 'Техника', lab: 'Изобретения', suit: 'Костюмы' }[S.kind];
    const list = S.list || [];
    return `<div class="ang-sheet">${sheetHead(`${ic('scroll')} Из истории: ${esc(label)}`)}
    <div class="ang-hint">Умная модель читает свод истории, лор по теме и последние посты — и выписывает, что уже было. Отметь, что занести.</div>
    ${!S.list ? `<div class="ang-actions">${btn('storyGo', busy(`story:${S.kind}`) ? `${spin} Читаю историю…` : `${ic('sparkles')} Прочитать`, '', 'primary wide')}</div>` : ''}
    ${S.list ? `<div class="ang-list">${list.map((x, i) => `<button class="ang-pickrow${S.pick.has(i) ? ' on' : ''}" data-g="storyPick" data-v="${i}"><i class="ang-cb">${S.pick.has(i) ? ic('check') : ''}</i><div><b>${esc(x.name || x.alias || '—')}</b><small>${esc([x.owner || x.who, x.model, x.where, x.ty ? `${Math.floor(x.ty)}` : '', x.dead ? 'на кладбище' : ''].filter(Boolean).join(' · '))}</small>${x.desc || x.note || x.look ? `<p>${esc(C.cut(x.desc || x.note || x.look, 160))}</p>` : ''}</div></button>`).join('') || empty('Ничего нового не нашлось.')}</div>
        <div class="ang-actions">${btn('storyAdd', `${ic('plus')} Занести (${S.pick.size})`, '', 'primary wide')}${btn('storyGo', ic('refresh'), '', 'ico ghost')}</div>` : ''}</div>`;
}

function insightSheet() {
    const I = ui.modal;
    const g = I.roll ? D.insightOf(I.roll) : null;
    const target = I.pid ? C.projById(I.pid) : I.xid ? (C.itemById(I.xid) || C.vehById(I.xid) || C.suitById(I.xid)) : null;
    return `<div class="ang-sheet">${sheetHead(`${ic('dice')} Кубик инсайтов${target ? ` · ${esc(target.name)}` : ''}`)}
    <div class="ang-hint">d20 решает жанр: 1–2 безумная · 3–7 бытовая · 8–14 рабочая · 15–19 связка · 20 прорыв. Дальше — короткий брейншторм умной модели.</div>
    ${dieHtml(I.rolling ? I.flash : I.roll, I.rolling, g ? `g-${g.id}` : '')}
    ${g ? `<div class="ang-genre g-${g.id}"><b>${g.ico} ${esc(g.name)}</b><small>${esc(g.ask)}</small></div>` : ''}
    ${field('О чём думает (необязательно)', `<input data-gf="ins:ask" data-id="i" value="${esc(I.ask || '')}" placeholder="что-то для малыша / против Дума / для руки Баки">`)}
    <div class="ang-actions">${btn('insRoll', I.busy ? `${spin} Думаю…` : `${ic('dice')} ${I.roll ? 'Ещё бросок' : 'Бросить'}`, '', 'primary wide')}</div>
    ${(I.ideas || []).length ? `<div class="ang-list">${I.ideas.map(y => `<div class="ang-idea${y.used ? ' used' : ''}"><b>${esc(y.title)}</b><p>${esc(y.text)}</p>${y.used ? '<small>в проектах</small>' : `<div class="ang-row">${btn('ideaProj', `${ic('plus')} В проекты`, attr({ set: I.set, id: y.id }), 'sm')}${target && C.projById(target.id) ? btn('ideaNote', `${ic('notes')} В журнал`, attr({ set: I.set, id: y.id }), 'sm ghost') : ''}</div>`}</div>`).join('')}</div>` : ''}</div>`;
}

function expSheet() {
    const d = ui.modal;
    const p = C.projById(d.pid);
    if (!p) return '';
    const raw = d.mods.filter(x => x.on).reduce((a, x) => a + x.v, 0) + d.own;
    const sum = Math.max(-C.MOD_CAP, Math.min(C.MOD_CAP, raw));
    const r = d.result;
    return `<div class="ang-sheet">${sheetHead(`${ic('dice')} Опыт · ${esc(p.name)}`)}
    <div class="ang-mods">${d.mods.map((x, i) => `<button class="ang-mod${x.on ? ' on' : ''}" data-g="mod" data-v="${i}"><span>${esc(x.label)}</span><b>${x.v > 0 ? '+' : ''}${x.v}</b></button>`).join('')}</div>
    <div class="ang-row center">${btn('modOwn', '−1', 'data-v="-1"', 'sm ghost')}<span class="ang-mute">своя поправка: ${d.own > 0 ? '+' : ''}${d.own}</span>${btn('modOwn', '+1', 'data-v="1"', 'sm ghost')}</div>
    ${dieHtml(d.rolling ? d.flash : r ? r.roll : null, d.rolling, r ? `out-${r.out}` : '')}
    <div class="ang-mute center">${r ? `${r.roll} ${r.modSum >= 0 ? '+' : '−'} ${Math.abs(r.modSum)} = ${r.sum}` : `поправки ${sum >= 0 ? '+' : ''}${sum}${raw !== sum ? ` (из ${raw}, потолок ±${C.MOD_CAP})` : ''}`}</div>
    ${r ? `<div class="ang-out out-${r.out}"><b>${esc(r.name)}</b><p>${esc(r.flavor)}</p><span>${r.delta > 0 ? '+' : ''}${r.delta}% к стадии</span></div>
    <div class="ang-actions">${btn('expScene', `${ic('send')} В сцену`, '', 'primary')}${btn('expQuiet', 'За кадром', '', 'ghost')}${btn('expRoll', ic('refresh'), '', 'ico ghost')}</div>
    <div class="ang-hint">«В сцену» — модель покажет это в следующем ответе. «За кадром» — только прогресс и журнал.</div>` : `<div class="ang-actions">${btn('expRoll', `${ic('dice')} Бросить`, '', 'primary wide')}</div>`}</div>`;
}

function protoSheet() {
    const d = ui.modal;
    const it = C.itemById(d.id);
    if (!it) return '';
    const r = d.result;
    return `<div class="ang-sheet">${sheetHead(`${ic('target')} Полигон · ${esc(it.name)}`)}
    <div class="ang-hint">Надёжность ${'●'.repeat(it.gadget?.reliab || 3)}${'○'.repeat(5 - (it.gadget?.reliab || 3))}: отказ, если выпало ≤ ${D.PROTO_FAIL[it.gadget?.reliab || 3]}.${it.gadget?.proto ? ' Прототип: может и бахнуть.' : ''}</div>
    ${dieHtml(d.rolling ? d.flash : r ? r.roll : null, d.rolling, r ? `out-${r.out}` : '')}
    ${r ? `<div class="ang-out out-${r.out}"><b>${{ ok: 'Сработал', weak: 'Вполсилы', fail: 'Отказ', boom: 'Бабах' }[r.out]}</b><p>${esc(r.text)}</p></div>
    <div class="ang-actions">${btn('protoScene', `${ic('send')} В сцену`, '', 'primary')}${btn('protoRoll', ic('refresh'), '', 'ico ghost')}${r.out === 'ok' && it.gadget?.proto ? btn('protoOk', `${ic('check')} Довести: надёжнее`, '', 'ghost') : ''}</div>` : `<div class="ang-actions">${btn('protoRoll', `${ic('dice')} Испытать`, '', 'primary wide')}</div>`}</div>`;
}

function pickSheet() {
    const d = ui.modal;
    return `<div class="ang-sheet">${sheetHead(esc(d.title))}${d.hint ? `<div class="ang-hint">${esc(d.hint)}</div>` : ''}
    <div class="ang-list">${d.list.map((x, i) => `<button class="ang-pickrow" data-g="pickOne" data-v="${i}">${x.ico ? ic(x.ico) : ''}<div><b>${esc(x.t)}</b>${x.s ? `<small>${esc(x.s)}</small>` : ''}</div></button>`).join('') || empty(d.none || 'Нечего выбрать.')}</div>
    ${d.free ? `<div class="ang-ask"><input id="ang-pick-free" placeholder="${esc(d.free)}">${btn('pickFree', ic('check'), '', 'ico primary')}</div>` : ''}</div>`;
}
function pick(title, list, onPick, opts = {}) { modal('pick', { title, list, onPick, ...opts }); }

function formSheet() {
    const f = ui.modal;
    return `<div class="ang-sheet">${sheetHead(esc(f.title))}
    ${f.fields.map(x => field(x.label, x.type === 'area' ? `<textarea rows="${x.rows || 3}" data-ff="${x.k}" placeholder="${esc(x.ph || '')}">${esc(x.v ?? '')}</textarea>`
        : x.type === 'select' ? `<select data-ff="${x.k}">${x.list.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(x.v ?? '') ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`
        : `<input data-ff="${x.k}" type="${x.type || 'text'}" value="${esc(x.v ?? '')}" placeholder="${esc(x.ph || '')}">`, x.hint || '')).join('')}
    <div class="ang-actions">${btn('formSave', `${ic('check')} ${esc(f.ok || 'Сохранить')}`, '', 'primary wide')}${f.ai ? btn('formAi', busy('formAi') ? spin : `${ic('sparkles')} ${esc(f.ai)}`, '', 'ghost') : ''}</div></div>`;
}
function form(title, fields, onSave, opts = {}) { modal('form', { title, fields, onSave, ...opts }); setTimeout(() => document.querySelector('#ang-app .ang-sheet input, #ang-app .ang-sheet textarea')?.focus(), 80); }
function formVals() { const o = {}; document.querySelectorAll('#ang-app .ang-sheet [data-ff]').forEach(el => { o[el.dataset.ff] = el.value; }); return o; }

const zoomSheet = () => `<div class="ang-sheet zoom">${sheetHead('')}<img src="${esc(ui.modal.src)}" alt=""></div>`;

// ───────────── кубики: анимация ─────────────

function rollAnim(state, done) {
    if (state.rolling) return;
    state.rolling = true;
    let n = 0;
    const fx = C.cfg().fx;
    const tick = () => {
        state.flash = C.d20();
        paintModal();
        if (++n < (fx ? 12 : 1)) setTimeout(tick, 40 + n * 9);
        else { state.rolling = false; done(); paintModal(); }
    };
    tick();
}

// ───────────── действия ─────────────

async function withBusy(key, fn) {
    if (ui.busy.has(key)) return;
    ui.busy.add(key);
    render(); if (ui.modal) paintModal();
    try { await fn(); } catch (e) { console.warn('[Ангар]', key, e); C.toast('error', esc(String(e?.message || e))); } finally { ui.busy.delete(key); render(); if (ui.modal) paintModal(); }
}
function kitRun(o = {}) {
    const k = ui.kit;
    if (!k) return;
    const want = { who: k.who, scen: k.scen };
    withBusy('kit', async () => {
        const alt = o.alt && k.res ? [...C.arr(k.res.items), ...C.arr(k.res.vehicles), ...C.arr(k.res.suits)].map(x => x.name) : null;
        const r = await C.kitGen(want.who, { scen: want.scen, ask: k.ask, fresh: !!o.fresh, alt });
        const cur = ui.kit;
        if (cur && C.same(cur.who, want.who) && cur.scen === want.scen) { cur.res = r; cur.pick = kitPickAll(r); }
        else C.toast('info', `Набор для ${esc(C.short(want.who))} готов — открой его снова`);
    });
}
const upd = () => { try { C.A?.updatePrompt?.(); } catch { /* */ } };
const after = () => { C.touch(); upd(); render(); if (ui.modal) paintModal(); };
/** После правки поля: данные сразу, перерисовка — чуть позже (иначе тап по кнопке после ввода теряется на айфоне). */
const afterSoft = () => { C.touch(); upd(); renderSoon(); };

function newItemForm(kind = '') {
    const who = ui.who || C.userName();
    form('Новая вещь', [
        { k: 'name', label: 'Что это', ph: 'Глок 19 с глушителем / нож Ka-Bar / браслет-щит' },
        { k: 'kind', label: 'Вид', type: 'select', v: kind || 'pistol', list: D.KINDS.map(k => [k[0], k[1]]) },
        { k: 'owner', label: 'Чья', type: 'select', v: who, list: peopleList().map(n => [n, C.short(n)]) },
        { k: 'where', label: 'Где', ph: 'пусто — при себе; «дома», «сейф в спальне»…' },
    ], async (v) => {
        if (!v.name.trim()) return false;
        const it = C.addItem({ name: v.name.trim(), kind: v.kind, owner: v.owner, where: v.where.trim(), cap: D.isGun(v.kind) ? ({ pistol: 15, revolver: 6, smg: 30, rifle: 30, sniper: 5, shotgun: 6, heavy: 100 }[v.kind] || 10) : 0 });
        modal('item', { id: it.id });
        withBusy(`desc:${it.id}`, async () => { await C.describe(it); });
        return 'keep';
    }, { ok: 'Добавить', hint: '' });
}

const HANDLERS = {
    close: () => close(),
    closeModal: () => closeModal(),
    hall: (el) => { closeModal(); go(el.dataset.v); },
    sub: (el) => go(null, el.dataset.v),
    who: (el) => { ui.who = el.dataset.v; render(); },
    addPerson: () => form('Другой человек', [{ k: 'n', label: 'Имя', ph: 'Элена Каррера' }], (v) => { const n = v.n.trim(); if (!n) return false; ui.who = C.canon(n); ui.extraPeople = [...(ui.extraPeople || []), ui.who]; return true; }),
    wall: (el) => { ui.wall = el.dataset.v; render(); },
    item: (el) => modal('item', { id: el.dataset.id }),
    veh: (el) => { ui.zone = ''; modal('veh', { id: el.dataset.id }); },
    suit: (el) => modal('suit', { id: el.dataset.id }),
    proj: (el) => modal('proj', { id: el.dataset.id }),
    zoom: (el) => modal('zoom', { src: el.dataset.v }),
    newItem: (el) => newItemForm(el.dataset.kind || ''),
    slot: (el) => {
        const who = el.dataset.who, sid = el.dataset.v;
        const sl = D.slotById(sid);
        const W = C.world();
        const here = C.M().items.filter(it => { const s = W.items.get(it.id); return s && C.same(s.holder, who) && !s.where && (s.slot === sid || (sl.hand && s.hands)); });
        const fit = C.M().items.filter(it => (C.same(it.owner, who) || C.same(W.items.get(it.id)?.holder, who)) && !here.includes(it) && (D.SLOT_FIT[it.kind] || D.SLOTS.map(x => x.id)).includes(sid) && it.kind !== 'ammo');
        pick(`${C.short(who)} · ${sl.label}`, [...here.map(it => ({ ico: D.kindOf(it.kind)[2], t: `Открыть: ${it.name}`, s: C.ammoLine(it), id: it.id, open: true })), ...fit.map(it => ({ ico: D.kindOf(it.kind)[2], t: `Сюда: ${it.name}`, s: [C.ammoLine(it), W.items.get(it.id)?.where].filter(Boolean).join(' · '), id: it.id }))],
            (x) => { if (x.open) { modal('item', { id: x.id }); return; } const hand = sl.hand; C.setDyn(x.id, { slot: hand ? (C.dyn(x.id).slot || '') : sid, hands: !!hand, where: '', holder: who }); after(); closeModal(); },
            { hint: here.length ? '' : 'Свободно. Что повесить сюда?', none: 'У человека нет подходящих вещей — добавь в Оружейной.' });
    },
    // магазины и патроны
    shot: (el) => { const s = C.dyn(el.dataset.id); C.setDyn(el.dataset.id, { inMag: Math.max(0, s.inMag + Number(el.dataset.v)), hands: true }); after(); },
    reload: (el) => { const t = C.reloadNow(el.dataset.id); if (t) C.toast(/нечем/.test(t) ? 'warning' : 'success', esc(t)); after(); },
    fillMags: (el) => { C.fillMags(el.dataset.id); after(); },
    refillAll: () => { for (const it of C.M().items) if (D.isGun(it.kind) && it.cap) C.fillMags(it.id); after(); C.toast('success', 'Все стволы заряжены, магазины полные'); },
    mags: (el) => { const it = C.itemById(el.dataset.id); const s = C.dyn(it.id); C.setDyn(it.id, { mags: [...s.mags, it.cap] }); after(); },
    magDel: (el) => { const s = C.dyn(el.dataset.id); const mags = [...s.mags]; mags.splice(Number(el.dataset.v), 1); C.setDyn(el.dataset.id, { mags }); after(); },
    unjam: (el) => { C.setDyn(el.dataset.id, { state: 'ok', inMag: Math.max(0, C.dyn(el.dataset.id).inMag - 1) }); after(); },
    clean: (el) => { C.setDyn(el.dataset.id, { cond: 100, state: C.dyn(el.dataset.id).state === 'jammed' ? 'ok' : C.dyn(el.dataset.id).state }); after(); },
    charge: (el) => { const it = C.itemById(el.dataset.id); const s = C.dyn(it.id); C.setDyn(it.id, { charges: Math.max(0, Math.min(it.gadget.max, s.charges + Number(el.dataset.v))) }); after(); },
    qty: (el) => { const s = C.dyn(el.dataset.id); C.setDyn(el.dataset.id, { qty: Math.max(0, s.qty + Number(el.dataset.v)) }); after(); },
    hands: (el) => { const s = C.dyn(el.dataset.id); C.setDyn(el.dataset.id, { hands: !s.hands, where: '' }); after(); },
    give: (el) => { const id = el.dataset.id; pick('Отдать кому', peopleList().map(n => ({ ico: 'user', t: C.short(n), n })), (x) => { C.setDyn(id, { holder: x.n, where: '', hands: false }); after(); modal('item', { id }); }); },
    toStash: (el) => { const id = el.dataset.id; const places = [...new Set(['дома', ...C.M().stashes.map(x => x.name)])]; pick('Убрать в…', places.map(p => ({ ico: 'vault', t: p, p })), (x) => { C.setDyn(id, { where: x.p, hands: false }); after(); modal('item', { id }); }, { free: 'другое место' }); },
    takeOut: (el) => { const it = C.itemById(el.dataset.id); C.setDyn(it.id, { where: '', holder: C.dyn(it.id).holder || it.owner || ui.who }); after(); },
    burn: (el) => { const it = C.itemById(el.dataset.id); it.legend.burned = !it.legend.burned; after(); },
    delItem: (el) => { if (!confirm('Удалить вещь?')) return; C.delItem(el.dataset.id); closeModal(); },
    describe: (el) => { const it = C.itemById(el.dataset.id); withBusy(`desc:${it.id}`, async () => { await C.describe(it); C.toast('success', 'Характеристика заполнена'); }); },
    drawItem: (el) => { const it = C.itemById(el.dataset.id); withBusy(`drawItem:${it.id}`, () => C.draw('item', it)); },
    // стол
    tableWho: (el) => { const t = C.M().table; const n = el.dataset.v; t.who = t.who.some(x => C.same(x, n)) ? t.who.filter(x => !C.same(x, n)) : [...t.who, n]; after(); },
    tablePick: (el) => { const t = C.M().table; const id = el.dataset.id; t.pick = t.pick.includes(id) ? t.pick.filter(x => x !== id) : [...t.pick, id]; after(); },
    tableClear: () => { C.M().table.pick = []; after(); },
    tablePack: () => {
        const t = C.M().table;
        if (!t.pick.length) { C.toast('info', 'На столе ничего не отмечено'); return; }
        const by = {};
        for (const id of t.pick) {
            const it = C.itemById(id); if (!it) continue;
            const who = C.canon(it.owner) || C.userName();
            const s = C.dyn(id);
            const fit = (D.SLOT_FIT[it.kind] || []).filter(x => !D.slotById(x)?.hand);
            C.setDyn(id, { holder: who, where: '', hands: false, slot: s.slot || fit[0] || (['armor', 'disguise'].includes(it.kind) ? 'body' : 'bag') });
            (by[who] ||= []).push(`${it.name}${C.ammoLine(it) ? ` (${C.ammoLine(it)})` : ''}`);
        }
        C.arm('pack', `[Сборы перед выходом (Ангар): ${Object.entries(by).map(([w, l]) => `${C.short(w)} берёт ${l.join(', ')}`).join('; ')}.${t.note ? ` ${t.note}.` : ''} Если к месту — покажи сборы коротко: кто что проверяет, прячет, рассовывает по кобурам.]`, { key: 'pack' });
        t.pick = [];
        after();
        C.toast('success', 'Собрались — сборы уйдут в следующий пост');
    },
    // тайники
    newStash: () => form('Тайник', [{ k: 'name', label: 'Название', ph: 'сейф в спальне / под половицей / ячейка на вокзале' }, { k: 'place', label: 'Где', ph: 'квартира над лавкой Марко' }, { k: 'note', label: 'Заметка', ph: 'кто знает', type: 'area', rows: 2 }, { k: 'secret', label: 'Секретный', type: 'select', v: '1', list: [['1', 'да'], ['', 'нет']] }],
        (v) => { if (!v.name.trim()) return false; C.M().stashes.push({ id: C.uid(), name: v.name.trim(), place: v.place.trim(), note: v.note.trim(), secret: !!v.secret }); after(); return true; }),
    stashEdit: (el) => { const st = C.stashById(el.dataset.id); form('Тайник', [{ k: 'name', label: 'Название', v: st.name }, { k: 'place', label: 'Где', v: st.place }, { k: 'note', label: 'Заметка', v: st.note, type: 'area', rows: 2 }], (v) => { const old = st.name; st.name = v.name.trim() || st.name; st.place = v.place.trim(); st.note = v.note.trim(); if (old !== st.name) for (const it of C.M().items) if (C.norm(C.dyn(it.id)?.where) === C.norm(old)) C.setDyn(it.id, { where: st.name }); after(); return true; }); },
    stashPut: (el) => { const place = el.dataset.v; const list = C.M().items.filter(it => C.norm(C.dyn(it.id)?.where) !== C.norm(place)); pick(`Положить: ${place}`, list.map(it => ({ ico: D.kindOf(it.kind)[2], t: it.name, s: C.short(it.owner), id: it.id })), (x) => { C.setDyn(x.id, { where: place, hands: false }); after(); closeModal(); }); },
    // тир
    rangeWho: (el) => { const R = ui.range; const n = el.dataset.v; R.who = R.who.some(x => C.same(x, n)) ? R.who.filter(x => !C.same(x, n)) : [...R.who, n]; R.res = null; render(); },
    rangeShoot: () => {
        const R = ui.range;
        const res = [];
        for (const w of R.who) {
            const g = C.M().items.filter(it => D.isGun(it.kind) && it.cap && (C.same(it.owner, w) || C.same(C.dyn(it.id)?.holder, w)));
            const it = C.itemById(R.gun[w]) || g[0];
            if (!it) continue;
            const r = C.rangeShoot(w, it);
            const s = C.dyn(it.id);
            const spent = Math.min(10, s.inMag + s.mags.reduce((a, b) => a + b, 0));
            r.shots = r.shots.slice(0, Math.max(0, spent)); r.total = r.shots.reduce((a, b) => a + b, 0);
            let left = 10, mags = [...s.mags], inMag = s.inMag;
            while (left > 0 && (inMag > 0 || mags.length)) { if (!inMag) { mags.sort((a, b) => b - a); inMag = mags.shift(); } const k = Math.min(left, inMag); inMag -= k; left -= k; }
            C.setDyn(it.id, { inMag, mags });
            res.push(r);
        }
        if (!res.length) { C.toast('info', 'Не из чего стрелять'); return; }
        R.res = res;
        after();
    },
    sparWho: (el) => { ui.spar[el.dataset.slot] = el.dataset.v; render(); },
    sparDrill: (el) => { ui.spar.drill = el.dataset.v; render(); },
    sparLvl: (el) => { ui.spar.lvl = el.dataset.v; render(); },
    sparGo: () => { const S = ui.spar; if (C.same(S.a, S.b)) { C.toast('info', 'С самим собой — это бой с тенью; выбери второго'); return; } S.res = C.sparRound(S.a, S.b, S.drill, S.lvl); render(); },
    sparScene: () => { if (!ui.spar?.res) return; C.sparScene(ui.spar.res); C.toast('success', 'Спарринг уйдёт в следующий пост'); },
    rangeScene: () => { const R = ui.range; C.arm('range', `[Тир (Ангар): ${R.res.map(r => `${C.short(r.who)} — ${r.total} из 100 (${r.item})`).join('; ')}. Счёт решён; если к месту — подколки, спор, кто платит.]`, { key: 'range' }); HANDLERS.rangeSave(); C.toast('success', 'Тир уйдёт в следующий пост'); },
    rangeSave: () => { const R = ui.range; if (!R?.res) return; C.M().range.unshift({ at: C.clock().date || C.storyDay(), res: R.res.map(r => ({ who: r.who, item: r.item, total: r.total })) }); C.M().range = C.M().range.slice(0, 30); R.res = null; after(); },
    // предложения
    suggAdd: (el) => {
        const { name, kind, who } = el.dataset;
        if (kind === 'lab') { const p = C.addProject({ name, ty: C.hedyYear() }, { src: 'chron' }); after(); modal('proj', { id: p.id }); return; }
        if (['car', 'bike', 'truck', 'boat', 'jet', 'ship'].includes(kind)) { const v = C.addVeh({ name, kind, owner: who }, { src: 'chron' }); after(); modal('veh', { id: v.id }); return; }
        const it = C.addItem({ name, kind: D.KINDS.some(k => k[0] === kind) ? kind : 'other', owner: who || ui.who }, { src: 'chron' });
        after(); modal('item', { id: it.id });
        withBusy(`desc:${it.id}`, () => C.describe(it));
    },
    suggHide: (el) => { C.hideSuggestion(el.dataset.name); render(); },
    // квартирмейстер: досье и набор по логике
    kit: () => { ui.kit = kitFor(ui.who || C.userName()); modal('kit'); },
    kitWho: (el) => { ui.kit = kitFor(el.dataset.v); paintModal(); },
    kitScen: (el) => { const k = ui.kit; if (k.scen === el.dataset.v) return; k.scen = el.dataset.v; k.res = null; k.pick = new Set(); paintModal(); },
    kitGo: () => kitRun(),
    kitAlt: () => kitRun({ alt: true }),
    kitFresh: () => { if (!confirm(`Собрать досье ${C.short(ui.kit.who)} заново? ${C.dossierOf(ui.kit.who)?.edited ? 'Поправленное руками пропадёт.' : ''}`)) return; kitRun({ fresh: true }); },
    kitDos: () => {
        const who = ui.kit.who;
        const d = C.dossierOf(who) || {};
        form(`Досье · ${C.short(who)}`, [
            { k: 'role', label: 'Роль', v: d.role || '', ph: 'снайпер и ликвидатор / инженер, не боец' },
            { k: 'style', label: 'Стиль боя', type: 'area', rows: 3, v: d.style || '', ph: 'как дерётся: издалека, вблизи, избегает драки, бьёт первой…' },
            { k: 'skills', label: 'Навыки', hint: 'через запятую', v: (d.skills || []).join(', '), ph: 'снайперская стрельба, ножевой бой, вождение' },
            { k: 'weak', label: 'Слабые места', hint: 'через точку с запятой', v: (d.weak || []).join('; '), ph: 'рука звенит на рамке; не стреляет в спину' },
            { k: 'temper', label: 'Характер в снаряжении', type: 'area', rows: 3, v: d.temper || '', ph: 'параноик: нож в ботинке, ствол в каждой комнате' },
            { k: 'rules', label: 'Его правила', hint: 'через точку с запятой', type: 'area', rows: 2, v: (d.rules || []).join('; '), ph: 'дома ствол под рукой; при ней — без штурмового' },
        ], (v) => {
            C.setDossier(who, { role: v.role, style: v.style, temper: v.temper, skills: v.skills.split(/[,;\n]/), weak: v.weak.split(/[;\n]/), rules: v.rules.split(/[;\n]/) }, true);
            modal('kit');
            return true;
        }, { ok: 'Сохранить досье' });
    },
    kitPick: (el) => { const k = ui.kit; const v = el.dataset.v; if (k.pick.has(v)) k.pick.delete(v); else k.pick.add(v); paintModal(); },
    kitAdd: () => {
        const k = ui.kit; const r = k.res; if (!r) return;
        const S = D.kitScen(r.scen);
        const t = C.M().table;
        let n = 0;
        const laid = [];
        C.arr(r.items).forEach((x, i) => {
            if (!k.pick.has(`i${i}`)) return;
            const it = C.normItem({ ...x, owner: k.who }, { src: 'ai', owner: k.who });
            const worn = it.slot || ['armor', 'legend'].includes(it.kind);
            if (!S.carry || !worn) { it.where = x.where || 'дома'; it.base.where = it.where; }
            C.addItem(it); n++;
            if (!S.carry && worn) laid.push(it.id);
        });
        C.arr(r.vehicles).forEach((x, i) => { if (!k.pick.has(`v${i}`)) return; C.addVeh({ ...x, owner: k.who }, { src: 'ai' }); n++; });
        C.arr(r.suits).forEach((x, i) => { if (!k.pick.has(`s${i}`)) return; C.addSuit({ ...x, who: k.who }, { src: 'ai' }); n++; });
        if (laid.length) {
            t.pick = [...new Set([...t.pick, ...laid])];
            if (!t.who.some(x => C.same(x, k.who))) t.who = [...t.who, k.who];
            if (k.ask && !t.note) t.note = k.ask;
        }
        C.logFeed(`Квартирмейстер · ${S.name.toLowerCase()} для ${C.short(k.who)}: ${n}`, 'ai');
        ui.who = k.who;
        closeModal();
        if (laid.length) go('arm', 'table');
        after();
        C.toast('success', laid.length ? `Добавлено: ${n} · на столе: ${laid.length}` : `Добавлено: ${n}`);
    },
    // из истории
    story: (el) => { ui.story = { kind: el.dataset.v, list: null, pick: new Set() }; modal('story'); },
    storyGo: () => { const S = ui.story; withBusy(`story:${S.kind}`, async () => {
        const j = await C.fromStory(S.kind);
        S.list = C.arr(j.items || j.vehicles || j.projects || j.suits).filter(x => x && (x.name || x.alias));
        S.pick = new Set(S.list.map((_, i) => i));
    }); },
    storyPick: (el) => { const S = ui.story; const i = Number(el.dataset.v); if (S.pick.has(i)) S.pick.delete(i); else S.pick.add(i); paintModal(); },
    storyAdd: () => {
        const S = ui.story;
        let n = 0;
        S.list.forEach((x, i) => {
            if (!S.pick.has(i)) return;
            if (S.kind === 'arm') C.addItem(x, { src: 'story', owner: x.owner });
            else if (S.kind === 'gar') C.addVeh(x, { src: 'story', owner: x.owner });
            else if (S.kind === 'suit') C.addSuit(x, { src: 'story', who: x.who });
            else if (S.kind === 'lab') { const p = C.normProject(x, { src: 'story' }); p.base.at = -1; C.M().projects.push(p); }
            n++;
        });
        C.logFeed(`Из истории (${S.kind}): ${n}`, 'ai');
        closeModal(); after();
        C.toast('success', `Занесено: ${n}`);
    },
    // гараж
    newVeh: () => form('Новая техника', [{ k: 'name', label: 'Название', ph: 'чёрный «Додж» Баки' }, { k: 'kind', label: 'Вид', type: 'select', v: 'car', list: D.VKINDS.map(k => [k[0], k[1]]) }, { k: 'model', label: 'Модель', ph: 'Dodge Charger 1969' }, { k: 'owner', label: 'Чья', type: 'select', v: ui.who || C.userName(), list: [...peopleList().map(n => [n, C.short(n)]), ['А.И.М.', 'А.И.М.']] }, { k: 'where', label: 'Где стоит', ph: 'гараж под домом' }],
        (v) => { if (!v.name.trim()) return false; const x = C.addVeh({ name: v.name.trim(), kind: v.kind, model: v.model.trim(), owner: v.owner, where: v.where.trim() }); after(); modal('veh', { id: x.id }); return 'keep'; }),
    zone: (el) => { ui.zone = ui.zone === el.dataset.v ? '' : el.dataset.v; paintModal(); },
    zdmg: (el) => { const s = C.vdyn(el.dataset.id); if (!ui.zone) return; const dmg = { ...s.dmg, [ui.zone]: C.clamp((s.dmg[ui.zone] || 0) + Number(el.dataset.v)) }; const worst = Math.max(0, ...Object.values(dmg)); C.setVdyn(el.dataset.id, { dmg, state: worst >= 85 ? 'wreck' : worst >= 25 ? (s.state === 'ok' ? 'damaged' : s.state) : (s.state === 'damaged' || s.state === 'wreck' ? 'ok' : s.state) }); after(); },
    fuel: (el) => { const s = C.vdyn(el.dataset.id); const v = Number(el.dataset.v); C.setVdyn(el.dataset.id, { fuel: v >= 100 ? 100 : C.clamp(s.fuel + v) }); after(); },
    repair: async (el) => {
        const v = C.vehById(el.dataset.id); const cost = C.repairCost(v);
        if (cost && !confirm(`Механик возьмёт ${C.money(cost)}. Чиним?`)) return;
        if (cost) { const r = await C.pay(cost, `Ремонт: ${v.name}`, 'транспорт', '', v.owner || ''); if (!r.ok && r.why && !/не найден/.test(r.why)) { C.toast('warning', esc(r.why)); return; } }
        C.setVdyn(v.id, { dmg: {}, state: 'ok' }); C.logFeed(`Ремонт: ${v.name}`, 'gar'); after(); C.toast('success', 'Как новая');
    },
    repairLab: (el) => { const v = C.vehById(el.dataset.id); const p = C.addProject({ name: `Ремонт: ${v.name}`, field: 'tech', out: 'other', note: `Починить в лабе: ${D.zonesOf(v.kind).filter(([z]) => (C.vdyn(v.id).dmg[z] || 0) > 0).map(([, t]) => t).join(', ') || 'проверка'}` }); C.setVdyn(v.id, { state: 'repair' }); after(); modal('proj', { id: p.id }); },
    skid: (el) => { const v = C.vehById(el.dataset.id); const r = C.skidRoll(v); C.toast(r.ok ? 'success' : 'warning', `d20 ${r.roll} → ${r.sum}: ${r.crash ? 'занос и удар' : r.ok ? 'удержала' : 'занесло, потеряли пару секунд'}`); if (!r.ok) C.arm('skid', `[Погоня (Ангар · кубик): ${v.name} ${r.crash ? 'срывается в занос и бьётся — без жертв, но эта машина из погони выбыла' : 'заносит на вираже: теряют пару секунд и дистанцию'}. Исход решён.]`, { key: v.id }); },
    plates: (el) => { const v = C.vehById(el.dataset.id); if (!v.fake) { C.toast('info', 'Сначала впиши левый номер'); return; } [v.plate, v.fake] = [v.fake, v.plate]; C.setVdyn(v.id, { burn: 0 }); after(); C.toast('success', 'Номера сменены, засветка сброшена'); },
    burnV: (el) => { const s = C.vdyn(el.dataset.id); C.setVdyn(el.dataset.id, { burn: C.clamp(s.burn + Number(el.dataset.v)) }); after(); },
    vmodAdd: (el) => { const v = C.vehById(el.dataset.id); form('Тюнинг', [{ k: 'name', label: 'Что', ph: 'бронестекло, Арт в бортовом, дымовая завеса' }], (x) => { if (!x.name.trim()) return false; v.mods.push({ name: x.name.trim(), from: '' }); after(); modal('veh', { id: v.id }); return 'keep'; }); },
    vmodDel: (el) => { const v = C.vehById(el.dataset.id); v.mods.splice(Number(el.dataset.v), 1); after(); },
    vstashIn: (el) => { const v = C.vehById(el.dataset.id); const list = C.M().items.filter(it => !(v.stash || []).includes(it.id)); pick('Спрятать в машину', list.map(it => ({ ico: D.kindOf(it.kind)[2], t: it.name, s: C.short(it.owner), id: it.id })), (x) => { v.stash = [...(v.stash || []), x.id]; C.setDyn(x.id, { where: `тайник: ${v.name}`, hands: false }); after(); modal('veh', { id: v.id }); }); },
    vstashOut: (el) => { const v = C.vehById(el.dataset.id); v.stash = (v.stash || []).filter(x => x !== el.dataset.v); C.setDyn(el.dataset.v, { where: '' }); after(); },
    drawVeh: (el) => { const v = C.vehById(el.dataset.id); withBusy(`drawVeh:${v.id}`, () => C.draw('veh', v)); },
    delVeh: (el) => { if (!confirm('Удалить технику?')) return; C.delVeh(el.dataset.id); closeModal(); },
    // костюмы
    newSuit: () => form('Новый костюм', [{ k: 'name', label: 'Название', ph: 'Солярис, мк III' }, { k: 'who', label: 'Чей', type: 'select', v: ui.who || C.userName(), list: peopleList().map(n => [n, C.short(n)]) }, { k: 'kind', label: 'Вид', type: 'select', v: 'hero', list: D.SKINDS }, { k: 'look', label: 'Как выглядит', type: 'area', rows: 3, ph: 'для кадров: силуэт, цвета, материалы' }],
        (v) => { if (!v.name.trim()) return false; const s = C.addSuit({ name: v.name.trim(), who: v.who, kind: v.kind, look: v.look.trim() }); after(); modal('suit', { id: s.id }); return 'keep'; }),
    worn: (el) => { const d = C.sdyn(el.dataset.id); C.setSdyn(el.dataset.id, { worn: !d.worn, where: !d.worn ? 'на нём' : d.where === 'на нём' ? '' : d.where }); after(); },
    mainSuit: (el) => { const s = C.suitById(el.dataset.id); for (const x of C.M().suits) if (C.same(x.who, s.who)) x.main = x.id === s.id ? !s.main : false; if (s.main && C.heroSync(s)) C.toast('success', 'Ушёл в Life → Герои: кадры увидят костюм'); after(); },
    sst: (el) => { C.setSdyn(el.dataset.id, { st: el.dataset.v }); after(); },
    sdmg: (el) => { const d = C.sdyn(el.dataset.id); const z = el.dataset.z; C.setSdyn(el.dataset.id, { dmg: { ...d.dmg, [z]: C.clamp((d.dmg[z] || 0) + Number(el.dataset.v)) } }); after(); },
    sys: (el) => { const s = C.suitById(el.dataset.id); const y = s.systems.find(q => q.id === el.dataset.sys); if (y) y.pct = C.clamp(y.pct + Number(el.dataset.v)); after(); },
    sysDel: (el) => { const s = C.suitById(el.dataset.id); s.systems = s.systems.filter(q => q.id !== el.dataset.sys); after(); },
    sysAdd: (el) => { const s = C.suitById(el.dataset.id); form('Система костюма', [{ k: 'name', label: 'Что', ph: 'репульсоры, щит, связь с Артом, стелс' }], (v) => { if (!v.name.trim()) return false; s.systems.push({ id: C.uid(), name: v.name.trim(), pct: 100 }); after(); modal('suit', { id: s.id }); return 'keep'; }); },
    supAdd: (el) => { const s = C.suitById(el.dataset.id); form('Апгрейд', [{ k: 'name', label: 'Что', ph: 'вибраниевая подкладка' }], (v) => { if (!v.name.trim()) return false; s.upgrades.push({ name: v.name.trim(), from: '' }); after(); modal('suit', { id: s.id }); return 'keep'; }); },
    supDel: (el) => { const s = C.suitById(el.dataset.id); s.upgrades.splice(Number(el.dataset.v), 1); after(); },
    drawSuit: (el) => { const s = C.suitById(el.dataset.id); withBusy(`drawSuit:${s.id}`, async () => { await C.draw('suit', s); if (s.main) C.heroSync(s); }); },
    delSuit: (el) => { if (!confirm('Удалить костюм?')) return; C.delSuit(el.dataset.id); closeModal(); },
    heroPull: () => { const n = C.heroImport(); C.toast('info', n ? `Подтянуто из Героев: ${n}` : 'В Life → Героях новых костюмов нет'); after(); },
    // лаба
    newProj: () => form('Новый проект', [{ k: 'name', label: 'Что изобретаем', ph: 'стабилизатор энергии Камней' }, { k: 'field', label: 'Область', type: 'select', v: 'tech', list: D.FIELDS }, { k: 'out', label: 'Что выйдет', type: 'select', v: 'gadget', list: D.OUT_TYPES }, { k: 'note', label: 'Идея', type: 'area', rows: 3 }],
        (v) => { if (!v.name.trim()) return false; const p = C.addProject({ name: v.name.trim(), field: v.field, out: v.out, note: v.note.trim(), ty: C.hedyYear() }); after(); modal('proj', { id: p.id }); return 'keep'; }),
    stage: (el) => { const p = C.projById(el.dataset.id); C.setStage(p, Number(el.dataset.v)); after(); },
    pct: (el) => { const p = C.projById(el.dataset.id); C.bumpProject(p, Number(el.dataset.v)); after(); },
    exp: (el) => { const p = C.projById(el.dataset.id); if (C.blockedBy(p).length) C.toast('warning', `Сначала: ${C.blockedBy(p).map(q => q.name).join(', ')} — кубик будет хуже`); modal('exp', { pid: p.id, mods: C.modsFor(p), own: 0, result: null }); },
    mod: (el) => { const d = ui.modal; d.mods[Number(el.dataset.v)].on = !d.mods[Number(el.dataset.v)].on; d.result = null; paintModal(); },
    modOwn: (el) => { const d = ui.modal; d.own = Math.max(-6, Math.min(6, d.own + Number(el.dataset.v))); d.result = null; paintModal(); },
    expRoll: () => { const d = ui.modal; const p = C.projById(d.pid); const mods = [...d.mods]; if (d.own) mods.push({ key: 'own', label: 'своя поправка', v: d.own, on: true }); const res = C.rollExp(p, mods); d.result = null; rollAnim(d, () => { d.result = res; }); },
    expScene: () => { const d = ui.modal; C.applyExp(d.result, true); const id = d.pid; C.toast('success', 'Исход уйдёт в следующий пост'); after(); modal('proj', { id }); },
    expQuiet: () => { const d = ui.modal; C.applyExp(d.result, false); const id = d.pid; after(); modal('proj', { id }); },
    release: (el) => {
        const p = C.projById(el.dataset.id);
        if (p.out === 'mod') {
            const list = [...C.M().items.map(x => ({ ico: D.kindOf(x.kind)[2], t: x.name, s: C.short(x.owner), id: x.id })), ...C.M().vehicles.map(x => ({ ico: D.vkindOf(x.kind)[2], t: x.name, s: 'техника', id: x.id })), ...C.M().suits.map(x => ({ ico: 'shield', t: x.name, s: C.short(x.who), id: x.id }))];
            pick(`Мод «${p.name}» — на что`, list, (x) => { C.release(p, x.id); after(); modal('proj', { id: p.id }); C.toast('success', 'Мод поставлен'); });
            return;
        }
        const made = C.release(p);
        if (made) { after(); C.toast('success', `«${made.name}» — в ${C.vehById(made.id) ? 'гараже' : C.suitById(made.id) ? 'костюмах' : 'оружейной'}`); }
    },
    bury: (el) => { const p = C.projById(el.dataset.id); form('На кладбище', [{ k: 'why', label: 'Что случилось', type: 'area', rows: 2, ph: 'взорвался / тупик / Амара запретила' }], (v) => { C.bury(p, v.why); after(); modal('proj', { id: p.id }); return 'keep'; }); },
    revive: (el) => { const p = C.revive(C.projById(el.dataset.id)); after(); modal('proj', { id: p.id }); },
    delProj: (el) => { if (!confirm('Удалить проект?')) return; C.delProject(el.dataset.id); closeModal(); },
    drawProj: (el) => { const p = C.projById(el.dataset.id); withBusy(`drawProj:${p.id}`, () => C.draw('proj', p)); },
    logAdd: (el) => { const p = C.projById(el.dataset.id); form('Запись в журнал', [{ k: 't', label: 'Что', type: 'area', rows: 3 }], (v) => { if (!v.t.trim()) return false; C.projLog(p, v.t.trim()); after(); modal('proj', { id: p.id }); return 'keep'; }); },
    needAdd: (el) => { const p = C.projById(el.dataset.id); const list = C.projectsNow().filter(q => q.id !== p.id && !p.needs.includes(q.id) && !q.needs.includes(p.id)); pick('Нужно сначала', list.map(q => ({ ico: 'flask', t: q.name, s: D.STAGES[C.projStage(q)], id: q.id })), (x) => { p.needs.push(x.id); after(); modal('proj', { id: p.id }); }); },
    needDel: (el) => { const p = C.projById(el.dataset.id); p.needs = p.needs.filter(x => x !== el.dataset.v); after(); },
    pmatAdd: (el) => { const p = C.projById(el.dataset.id); const list = C.M().materials.filter(m => !p.mats.some(x => x.id === m.id)); pick('Какой материал', list.map(m => ({ ico: 'gem', t: m.name, s: `есть ${m.qty}`, id: m.id })), (x) => { p.mats.push({ id: x.id, n: 1 }); after(); modal('proj', { id: p.id }); }, { none: 'Материалов нет — заведи во вкладке «Материалы».' }); },
    pmatDel: (el) => { const p = C.projById(el.dataset.id); p.mats = p.mats.filter(x => x.id !== el.dataset.v); after(); },
    newMat: () => form('Материал', [{ k: 'name', label: 'Что', ph: 'вибраниум' }, { k: 'qty', label: 'Сколько', type: 'number', v: 1 }, { k: 'unit', label: 'Единица', ph: 'г, шт, ампулы' }, { k: 'from', label: 'Откуда', ph: 'Шури, Раф, Stark Industries' }, { k: 'rare', label: 'Редкость', type: 'select', v: 2, list: [1, 2, 3, 4, 5].map(n => [n, '★'.repeat(n)]) }],
        (v) => { if (!v.name.trim()) return false; C.M().materials.push({ id: C.uid(), name: v.name.trim(), qty: Number(v.qty) || 0, unit: v.unit.trim(), from: v.from.trim(), rare: Number(v.rare) || 1, note: '' }); after(); return true; }),
    matQty: (el) => { const m = C.matById(el.dataset.id); m.qty = Math.max(0, (Number(m.qty) || 0) + Number(el.dataset.v)); after(); },
    matEdit: (el) => { const m = C.matById(el.dataset.id); form('Материал', [{ k: 'name', label: 'Что', v: m.name }, { k: 'qty', label: 'Сколько', type: 'number', v: m.qty }, { k: 'unit', label: 'Единица', v: m.unit }, { k: 'from', label: 'Откуда', v: m.from }, { k: 'note', label: 'Заметка', v: m.note }], (v) => { if (v.name === '') { C.M().materials = C.M().materials.filter(x => x.id !== m.id); after(); return true; } Object.assign(m, { name: v.name.trim(), qty: Number(v.qty) || 0, unit: v.unit.trim(), from: v.from.trim(), note: v.note.trim() }); after(); return true; }, { ok: 'Сохранить (пустое имя — удалить)' }); },
    proto: (el) => modal('proto', { id: el.dataset.id, result: null }),
    protoRoll: () => { const d = ui.modal; const it = C.itemById(d.id); const res = C.protoTest(it); d.result = null; rollAnim(d, () => { d.result = res; }); },
    protoScene: () => { const d = ui.modal; const it = C.itemById(d.id); const r = d.result; C.arm('proto', `[Полигон (Ангар · кубик): «${it.name}» на испытании ${r.text}. Покажи это в сцене. Исход решён.]`, { key: it.id }); C.logFeed(`Полигон: ${it.name} — ${r.text}`, 'lab'); C.toast('success', 'Испытание уйдёт в следующий пост'); closeModal(); },
    protoOk: () => { const it = C.itemById(ui.modal.id); it.gadget.reliab = Math.min(5, it.gadget.reliab + 1); if (it.gadget.reliab >= 4) it.gadget.proto = false; after(); C.toast('success', `Надёжность ${'●'.repeat(it.gadget.reliab)}`); },
    // инсайты
    insight: () => modal('insight', { roll: null, ideas: [], set: '' }),
    insightFor: (el) => { const id = el.dataset.id; modal('insight', { roll: null, ideas: [], set: '', pid: C.projById(id) ? id : '', xid: C.projById(id) ? '' : id }); },
    insRoll: () => {
        const I = ui.modal;
        if (I.busy || I.rolling) return;
        const roll = C.d20();
        rollAnim(I, () => { I.roll = roll; });
        setTimeout(async () => {
            I.busy = true; paintModal();
            try {
                const r = await C.insights(roll, { p: I.pid ? C.projById(I.pid) : null, x: I.xid ? (C.itemById(I.xid) || C.vehById(I.xid) || C.suitById(I.xid)) : null, ask: I.ask || '' });
                I.ideas = r.ideas; I.set = C.M().insights[0]?.id || '';
            } catch (e) { C.toast('error', esc(String(e?.message || e))); } finally { I.busy = false; if (ui.modal === I) paintModal(); }
        }, C.cfg().fx ? 700 : 10);
    },
    ideaProj: (el) => {
        const set = C.M().insights.find(x => x.id === el.dataset.set);
        const y = set?.ideas.find(q => q.id === el.dataset.id) || ui.modal?.ideas?.find(q => q.id === el.dataset.id);
        if (!y) return;
        const p = C.addProject({ name: y.title || C.cut(y.text, 50), note: y.text, field: y.field, out: y.out, ty: C.hedyYear() }, { src: 'insight' });
        const from = ui.modal?.pid && C.projById(ui.modal.pid);
        if (from) p.needs.push(from.id);
        y.used = true;
        after();
        C.toast('success', `В проектах: ${p.name}`);
    },
    ideaNote: (el) => { const I = ui.modal; const y = I.ideas.find(q => q.id === el.dataset.id); const p = C.projById(I.pid); if (y && p) { C.projLog(p, `Инсайт: ${y.title} — ${y.text}`); y.used = true; after(); } },
    disarm: (el) => { C.disarm(el.dataset.v); after(); },
    // магазин
    shopSrc: (el) => { ui.shop.src = el.dataset.v; render(); },
    shopCat: (el) => { ui.shop.cat = el.dataset.v; if (ui.hall !== 'shop') { closeModal(); go('shop'); } else render(); },
    shopGen: () => { const e = C.era(); const shop = (D.SHOPS[e.id] || D.SHOPS.none).find(s => s.id === ui.shop.src); const cat = ui.shop.cat || 'all'; const fw = ui.shop.for || ''; withBusy(`shop:${shop.id}:${cat}:${fw}`, () => C.shopGen(shop, cat, ui.shop.ask, false, fw)); },
    shopMore: () => { const e = C.era(); const shop = (D.SHOPS[e.id] || D.SHOPS.none).find(s => s.id === ui.shop.src); const cat = ui.shop.cat || 'all'; const fw = ui.shop.for || ''; withBusy(`shop:${shop.id}:${cat}:${fw}:more`, () => C.shopGen(shop, cat, ui.shop.ask, true, fw)); },
    shopFor: (el) => { ui.shop.for = el.dataset.v || ''; render(); },
    good: (el) => modal('good', { i: Number(el.dataset.v), who: ui.shop.for || ui.who || C.userName() }),
    goodWho: (el) => { ui.modal.who = el.dataset.v; ui.modal.acc = ''; paintModal(); },
    goodPay: (el) => { ui.modal.acc = el.dataset.v; paintModal(); },
    buy: () => {
        const e = C.era(); const shop = (D.SHOPS[e.id] || D.SHOPS.none).find(s => s.id === ui.shop.src);
        const list = C.shopList(shop, ui.shop.cat || 'all', ui.shop.for || '');
        const x = list[ui.modal.i];
        if (!x) { closeModal(); return; }
        const who = ui.modal.who || ui.who || C.userName();
        withBusy('buy', async () => {
            const r = await C.buy(shop, x, who, ui.modal.acc || C.defaultPayer(who));
            const i = list.indexOf(x); if (i >= 0) list.splice(i, 1);
            C.touch();
            closeModal();
            C.toast('success', `${esc(r.it.name)} → ${esc(C.short(who))}${r.paid ? ` · ${esc(r.paid)}` : ''}`);
            upd();
        });
    },
    // формы и выбор
    formSave: async () => { const f = ui.modal; const r = await f.onSave(formVals()); if (r === false) { C.toast('info', 'Заполни главное'); return; } if (r !== 'keep' && ui.modal === f) closeModal(); else render(); },
    pickOne: (el) => { const d = ui.modal; const x = d.list[Number(el.dataset.v)]; d.onPick(x); },
    pickFree: () => { const d = ui.modal; const v = document.getElementById('ang-pick-free')?.value?.trim(); if (v) d.onPick({ t: v, p: v, n: v, free: true }); },
    open: (el) => open(el.dataset.hall || 'arm', el.dataset.id || null),
};

export function onClick(e) {
    const el = e.target.closest?.('[data-g]');
    if (!el) return;
    const g = el.dataset.g;
    const h = HANDLERS[g];
    if (!h) return;
    e.preventDefault();
    e.stopPropagation();
    try { const r = h(el, e); if (r?.catch) r.catch(err => { console.warn('[Ангар]', g, err); C.toast('error', esc(String(err?.message || err))); }); } catch (err) { console.warn('[Ангар]', g, err); C.toast('error', esc(String(err?.message || err))); }
}

function setPath(obj, path, val) {
    const keys = path.split('.');
    let o = obj;
    for (let i = 0; i < keys.length - 1; i++) { if (!o[keys[i]] || typeof o[keys[i]] !== 'object') o[keys[i]] = {}; o = o[keys[i]]; }
    o[keys[keys.length - 1]] = val;
}
export function onChange(e) {
    const el = e.target;
    if (el?.dataset?.gup) { upload(el); return; }
    const f = el?.dataset?.gf;
    if (!f) return;
    const [ent, key] = f.split(':');
    const id = el.dataset.id;
    const v = el.value;
    const numKey = ['cap', 'ty', 'stats.range', 'gadget.max', 'stats.speed', 'stats.handling', 'stats.armor', 'armor', 'armor.level', 'gadget.reliab'];
    const val = numKey.includes(key) ? (Number(v) || 0) : key === 'gadget.proto' ? !!v : v;
    if (ent === 'it') {
        const it = C.itemById(id); if (!it) return;
        if (key === 'slot') { C.setDyn(id, { slot: v, hands: false, where: '' }); afterSoft(); return; }
        if (key === 'where') { C.setDyn(id, { where: v.trim(), hands: false }); afterSoft(); return; }
        if (key === 'owner') { it.owner = C.canon(v); C.setDyn(id, { holder: it.owner }); afterSoft(); return; }
        if (key === 'mods') { it.mods = v.split(',').map(x => x.trim()).filter(Boolean); afterSoft(); return; }
        if (key === 'cap') { it.cap = Math.max(0, Math.min(250, val)); C.setDyn(id, { inMag: Math.min(C.dyn(id).inMag, it.cap) || it.cap }); afterSoft(); return; }
        if (key === 'kind') { it.kind = v; it.feed = D.FEED_BY_KIND[v] || (D.isGun(v) ? 'mag' : 'none'); if ((v === 'gadget' || v === 'nonlethal') && !it.gadget) it.gadget = { does: '', max: 3, recharge: '', side: '', limit: '', reliab: 4, proto: false }; if (v === 'armor' && !it.armor) it.armor = { level: 3, covers: 'корпус' }; if (v === 'legend' && !it.legend) it.legend = { alias: '', nation: '', docs: '', cover: '', burned: false, note: '' }; if (v === 'disguise' && !it.disguise) it.disguise = { parts: '', look: '' }; afterSoft(); return; }
        if (key === 'gadget.max') { setPath(it, key, val); C.setDyn(id, { charges: Math.min(C.dyn(id).charges, val) || val }); afterSoft(); return; }
        setPath(it, key, val);
        afterSoft(); return;
    }
    if (ent === 'v') { const v2 = C.vehById(id); if (!v2) return; if (key === 'owner') v2.owner = C.canon(v); else setPath(v2, key, val); afterSoft(); return; }
    if (ent === 'vd') { C.setVdyn(id, { [key]: v.trim() }); afterSoft(); return; }
    if (ent === 's') { const s = C.suitById(id); if (!s) return; if (key === 'who') s.who = C.canon(v); else setPath(s, key, val); if (s.main && ['look'].includes(key)) C.heroSync(s); afterSoft(); return; }
    if (ent === 'sd') { C.setSdyn(id, { [key]: v.trim() }); afterSoft(); return; }
    if (ent === 'p') { const p = C.projById(id); if (!p) return; if (key === 'team') p.team = v.split(',').map(x => x.trim()).filter(Boolean); else setPath(p, key, val); afterSoft(); return; }
    if (ent === 'table') { C.M().table.note = v; C.save(); return; }
    if (ent === 'range') { ui.range.gun[id] = v; return; }
    if (ent === 'shop') { ui.shop.ask = v; return; }
    if (ent === 'ins') { if (ui.modal) ui.modal.ask = v; return; }
    if (ent === 'kit') { if (ui.kit) ui.kit.ask = v; return; }
}
export function onInput(e) {
    const el = e.target;
    const f = el?.dataset?.gf;
    if (f === 'shop:ask') ui.shop.ask = el.value;
    if (f === 'ins:ask' && ui.modal) ui.modal.ask = el.value;
    if (f === 'table:note') C.M().table.note = el.value;
    if (f === 'kit:ask' && ui.kit) ui.kit.ask = el.value;
}
async function upload(el) {
    const file = el.files?.[0];
    if (!file) return;
    const kind = { drawItem: 'item', drawVeh: 'veh', drawSuit: 'suit', drawProj: 'proj' }[el.dataset.gup];
    const id = el.dataset.id;
    const x = C.itemById(id) || C.vehById(id) || C.suitById(id) || C.projById(id);
    if (!x) return;
    await withBusy(`${el.dataset.gup}:${id}`, async () => {
        if (!C.A?.uploadImage || !C.A?.fileToJpeg) throw new Error('Загрузка картинок — через Life, а его нет');
        x.img = await C.A.uploadImage(await C.A.fileToJpeg(file, 1400), `angar_${kind}`);
        if (kind === 'suit' && x.main) C.heroSync(x);
        C.touch();
    });
}

// ───────────── для Life: строка в Сцене, страница человека, трекер ─────────────

export function sceneHtml() {
    if (!C.cfg().on || !C.hasChat()) return '';
    const list = C.armedSummary();
    if (!list.length) return '';
    return `<div class="ang-scene">${list.map(p => `<button class="ang-scene-p" data-g="open" data-hall="arm">${ava(p.who, 'xs')}<b>${esc(C.short(p.who))}</b>${p.list.map(x => `<span class="${x.empty ? 'dry' : ''}${x.jam ? ' jam' : ''}${x.hands ? ' hand' : ''}">${esc(x.it.name)}${x.line ? ` ${esc(x.line)}` : ''}</span>`).join('')}</button>`).join('')}</div>`;
}
export function personRow(who) {
    if (!C.cfg().on || !C.hasChat()) return '';
    const on = C.carried(who);
    const v = C.M().vehicles.filter(x => C.same(x.owner, who));
    const s = C.M().suits.filter(x => C.same(x.who, who));
    if (!on.length && !v.length && !s.length) return '';
    return `<button class="ang-prow" data-g="open" data-hall="arm">${ic('pistol')}<span><b>Ангар</b> · ${on.length ? `${on.slice(0, 3).map(it => esc(it.name)).join(', ')}${on.length > 3 ? '…' : ''}` : 'с собой ничего'}${v.length ? ` · ${v.length} ${plural(v.length, 'машина', 'машины', 'машин')}` : ''}${s.length ? ` · ${s.length} ${plural(s.length, 'костюм', 'костюма', 'костюмов')}` : ''}</span></button>`;
}
export function trackerState() {
    const list = C.armedSummary();
    if (!list.length) return '';
    const dry = list.flatMap(p => p.list).filter(x => x.empty).length;
    const guns = list.flatMap(p => p.list).filter(x => x.line && /\//.test(x.line));
    return dry ? `пусто: ${dry}` : guns.length ? guns.slice(0, 2).map(x => x.line.split(' ·')[0]).join(' · ') : `${list.length} вооруж.`;
}
export function trackerHtml() {
    const list = C.armedSummary();
    if (!list.length) return '';
    return `<div class="ang-trk">${list.map(p => `<div class="ang-trk-p"><b>${esc(C.short(p.who))}</b>${p.list.map(x => `<button data-g="open" data-hall="arm" data-id="${esc(x.it.id)}" class="${x.empty ? 'dry' : ''}${x.jam ? ' jam' : ''}">${esc(x.it.name)}${x.line ? ` · ${esc(x.line)}` : ''}${x.hands ? ' · в руках' : ''}</button>`).join('')}</div>`).join('')}<button class="ang-btn sm" data-g="open" data-hall="arm">Открыть Ангар</button></div>`;
}
