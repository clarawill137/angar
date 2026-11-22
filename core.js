// ✦ Ангар — ядро: состояние чата, эпоха, железо (стволы, гаджеты, броня, легенды), гараж, костюмы, лаба,
// счёт патронов по постам, кубики, заметка модели, поле Летописца, магазин и сборки от умной модели.
//
// Счёт по постам. Всё, что меняет история (выстрелы, перезарядка, бензин, урон, работа в лабе), Летописец пишет
// записью ПОСТА — под ключом «вариант : хеш текста» (как память Летописца в Life). Текущее состояние каждой вещи —
// её «база» (что выставили руками, с номером поста) плюс записи всех постов после неё, которые сейчас в чате.
// Свайпнула, удалила, перегенерила пост — его запись выпала сама: патроны не считаются дважды.

import * as D from './data.js';

export let A = null;
export function setApi(a) { A = a; }

const ctx = () => SillyTavern.getContext();
export const MODULE = 'angar';
export const VERSION = '0.3.0';

// ───────────── мелочи ─────────────

export const uid = () => Math.random().toString(36).slice(2, 8);
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
export const norm = (v) => String(v ?? '').toLowerCase().replace(/ё/g, 'е').replace(/[«»"“”„'`]/g, '').replace(/\s+/g, ' ').trim();
export const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, Math.round(Number(v) || 0)));
export const cut = (t, n) => { t = String(t ?? ''); return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t; };
export const str = (v) => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '');
export const arr = (v) => (Array.isArray(v) ? v : v == null || v === '' ? [] : [v]);
export const num = (v, d = 0) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
export const rnd = (list) => list[Math.floor(Math.random() * list.length)];
export const d20 = () => 1 + Math.floor(Math.random() * 20);
const clone = (o) => JSON.parse(JSON.stringify(o ?? null));
const pad = (n) => String(n).padStart(2, '0');

export function plain(mes) {
    return String(mes || '')
        .replace(/<(horae\w*|details|think|thinking|summary|style|script)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
        .replace(/<[^>]+>/g, ' ').replace(/```[\s\S]*?```/g, ' ').replace(/[*_~`#|]/g, '').replace(/[ \t]+/g, ' ').trim();
}

/** Пока Ангар открыт, тосты таверны прячутся под ним (верхний слой) — показываю свои внутри окна. */
export function toast(kind, msg, title = '✦ Ангар', opts = {}) {
    const app = document.getElementById('ang-dialog')?.open && document.getElementById('ang-app');
    if (app) {
        const el = document.createElement('div');
        el.className = `ang-toast ${kind}`;
        el.innerHTML = String(msg);
        app.append(el);
        requestAnimationFrame(() => el.classList.add('on'));
        setTimeout(() => { el.classList.remove('on'); setTimeout(() => el.remove(), 300); }, opts.timeOut || 3400);
        return;
    }
    try { window.toastr?.[kind]?.(msg, title, { timeOut: 4500, ...opts }); } catch { /* */ }
}

// ───────────── настройки (общие) и данные чата ─────────────

const DEF = {
    on: true,
    chron: true,          // поле в Летописце (выстрелы, бензин, урон, лаба)
    prompt: 'auto',       // auto — боекомплект модели, когда есть что сказать; always; off
    dice: true,           // кубики сами: клин, отказ прототипа, занос
    model: 'deep',        // deep — умная модель Life; chron — модель Летописца
    shopN: 10,            // сколько товара за раз
    fx: true,
    eraMode: 'auto',
    syncHero: true,       // основной костюм → Life → Герои (кадры видят костюм)
    artur: true,          // лаба Арта открывается тут
};

export function cfg() {
    const ext = ctx().extensionSettings;
    if (!ext[MODULE] || typeof ext[MODULE] !== 'object') ext[MODULE] = {};
    const s = ext[MODULE];
    for (const [k, v] of Object.entries(DEF)) if (s[k] === undefined) s[k] = clone(v);
    return s;
}
export const saveCfg = () => { try { ctx().saveSettingsDebounced(); } catch { /* */ } };

function blank() {
    return {
        v: 1, ver: 0, seeded: 0,
        items: [], vehicles: [], suits: [], projects: [], materials: [], stashes: [],
        posts: {}, shots: [], rolls: {}, shop: {}, table: { who: [], pick: [], note: '' },
        range: [], insights: [], log: [], hide: [],
        dossier: {}, kits: {}, spar: [], train: {},
    };
}
export function M() {
    const md = ctx().chatMetadata;
    if (!md) return blank();
    if (!md.angar || typeof md.angar !== 'object') md.angar = blank();
    const m = md.angar;
    const b = blank();
    for (const [k, v] of Object.entries(b)) {
        if (m[k] === undefined) m[k] = v;
        else if (Array.isArray(v) && !Array.isArray(m[k])) m[k] = v;
        else if (v && typeof v === 'object' && !Array.isArray(v) && (typeof m[k] !== 'object' || Array.isArray(m[k]) || !m[k])) m[k] = v;
    }
    return m;
}
export const hasChat = () => { try { return A?.hasChat ? A.hasChat() : !!ctx().chatMetadata; } catch { return false; } };
export function save() { try { ctx().saveMetadataDebounced?.(); } catch { /* */ } }
export function touch() { const m = M(); m.ver = (Number(m.ver) || 0) + 1; memo = null; save(); }

export function logFeed(t, kind = 'sys') {
    const m = M();
    const k = clock();
    m.log.unshift({ id: uid(), t: cut(t, 240), kind, at: [k.date, k.time].filter(Boolean).join(' · '), mes: lastIndex() });
    m.log = m.log.slice(0, 80);
}

// ───────────── время истории и эпоха ─────────────

export function clock() {
    let st = {};
    try { st = A?.worldState?.() || {}; } catch { /* */ }
    const date = String(st.timestamp?.story_date || '');
    const time = String(st.timestamp?.story_time || '');
    let d = null;
    try { d = A?.parseDate?.(date) || null; } catch { /* */ }
    if (d && isNaN(d)) d = null;
    const tm = time.match(/(\d{1,2})[:.](\d{2})/);
    const day = d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : '';
    return {
        d, day, year: d ? d.getFullYear() : null, hour: tm ? +tm[1] : null, date, time,
        loc: String(st.scene?.location || ''), cast: arr(st.scene?.characters_present).map(String).filter(Boolean),
    };
}
function timeline() { try { return window.SacredTimeline?.context?.() || null; } catch { return null; } }
export function timelineDay() {
    const cx = timeline();
    if (!cx?.explicit) return null;
    const d = String(cx.date || cx.era?.from || '');
    if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
    if (/^\d{4}-\d{2}$/.test(d)) return `${d}-15`;
    if (/^\d{4}$/.test(d)) return `${d}-06-15`;
    return null;
}
export const storyDay = () => timelineDay() || clock().day || '';
export function storyYear() {
    const d = storyDay();
    if (d) return Number(d.slice(0, 4)) + (Number(d.slice(5, 7)) - 1) / 12;
    return 2024.9;
}
export function era() {
    const c = cfg();
    if (c.eraMode && c.eraMode !== 'auto') return D.ERAS.find(e => e.id === c.eraMode) || D.ERAS[D.ERAS.length - 1];
    const day = storyDay();
    if (!day) return D.ERAS[D.ERAS.length - 1];
    let cur = D.ERAS[0];
    for (const e of D.ERAS) if (e.start <= day) cur = e;
    return day < D.ERAS[0].start ? D.eraById('none') : cur;
}
/** Год в жизни самой Хеди: в 1940-е она попала из 2020-го (путешествие во времени). */
export function hedyYear() {
    const y = storyYear();
    if (era().id === 'ssr' || (y >= 1939 && y < 1947)) return 2020.4 + Math.max(0, Math.min(2.5, y - 1943)) * 0.2;
    return y;
}

// ───────────── люди ─────────────

export const canon = (n) => { try { return A?.canonName?.(n) || String(n || '').trim(); } catch { return String(n || '').trim(); } };
export const same = (a, b) => { if (!a || !b) return false; try { return A?.sameName ? A.sameName(a, b) : norm(a) === norm(b); } catch { return norm(a) === norm(b); } };
export const short = (n) => { try { return A?.shortName?.(canon(n)) || canon(n); } catch { return canon(n); } };
export const userName = () => canon(ctx().name1 || 'Хеди');
/** Главные: персона и участники группы. */
export function cast() {
    const out = [];
    const add = (n) => { n = canon(n); if (n && !out.some(x => same(x, n))) out.push(n); };
    add(ctx().name1);
    try { (A?.groupMembers?.() || []).forEach(add); } catch { /* */ }
    return out;
}
/** Кто сейчас в сцене (Horae), плюс персона. */
export function inScene() {
    const out = [];
    const add = (n) => { n = canon(n); if (n && !out.some(x => same(x, n))) out.push(n); };
    add(ctx().name1);
    for (const n of clock().cast) add(n);
    return out;
}
/** Все, у кого в Ангаре что-то есть, — тоже люди для выбора владельца. */
export function people() {
    const out = [...cast()];
    const add = (n) => { n = canon(n); if (n && !out.some(x => same(x, n))) out.push(n); };
    const m = M();
    for (const x of m.items) add(x.owner);
    for (const x of m.suits) add(x.who);
    return out.filter(n => n && !/^[А-ЯA-Z](\.[А-ЯA-Z])+\.?$/.test(n));
}
export const avatarUrl = (n) => { try { return A?.avatarUrl?.(n, true) || ''; } catch { return ''; } };

// ───────────── записи постов ─────────────

const keyMemo = new WeakMap();
function hash(s) {
    try { if (A?.hash) return A.hash(s); } catch { /* */ }
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
}
export function keyOf(m) {
    if (!m || typeof m !== 'object') return '';
    const mes = m.mes || '', sw = m.swipe_id ?? 0;
    const c = keyMemo.get(m);
    if (c && c.mes === mes && c.sw === sw) return c.key;
    const key = `${sw}:${hash(mes)}`;
    keyMemo.set(m, { mes, sw, key });
    return key;
}
export const chat = () => ctx().chat || [];
export const lastIndex = () => chat().length - 1;
export function eventsAt(i) {
    const m = chat()[i];
    if (!m || m.extra?.type === 'comment') return null;
    return M().posts[keyOf(m)]?.ev || null;
}

// ───────────── вещи: базовые значения ─────────────

const GUN_DYN = (it) => ({ inMag: num(it.cap, 0), mags: [], cond: 100, charges: num(it.gadget?.max, 0), qty: num(it.qty, 1), slot: it.slot || '', holder: canon(it.owner || ''), where: it.where || '', state: 'ok', hands: false });
const VEH_DYN = () => ({ fuel: 100, dmg: {}, burn: 0, state: 'ok', where: '', driver: '' });
const SUIT_DYN = (s) => ({ st: 'intact', dmg: {}, where: s.where || '', worn: false });
const PROJ_DYN = () => ({ stage: 0, pct: 0 });

function baseOf(e, kind) {
    const def = kind === 'item' ? GUN_DYN(e) : kind === 'veh' ? VEH_DYN(e) : kind === 'suit' ? SUIT_DYN(e) : PROJ_DYN(e);
    const b = e.base && typeof e.base === 'object' ? e.base : {};
    const s = { ...def, ...clone(b) };
    if (!Array.isArray(s.mags)) s.mags = [];
    if (s.dmg && typeof s.dmg !== 'object') s.dmg = {};
    delete s.at;
    return s;
}

// ───────────── состояние «сейчас» = база + записи постов ─────────────

let memo = null;
export function bump() { memo = null; }
function sig() {
    const c = chat();
    const l = c[c.length - 1];
    return `${c.length}|${l?.mes?.length || 0}|${l?.swipe_id ?? 0}|${M().ver}|${Object.keys(M().posts).length}`;
}

function poolFor(items, it, holder) {
    const cal = norm(it.caliber);
    if (!cal) return null;
    for (const [id, s] of items) {
        const x = itemById(id);
        if (!x || x.kind !== 'ammo' || norm(x.caliber) !== cal) continue;
        if (same(s.holder || x.owner, holder)) return s;
    }
    return null;
}

function applyEv(ev, i, W) {
    const { items, veh, suits, proj } = W;
    const at = (map, id) => { const s = map.get(id); return s && i > s._at ? s : null; };
    switch (ev.t) {
        case 'fire': {
            const s = at(items, ev.id); if (!s) return;
            const it = itemById(ev.id);
            const n = Math.max(0, Math.min(200, num(ev.n, 1)));
            if (it && D.isGun(it.kind)) {
                const before = s.inMag;
                s.inMag = Math.max(0, s.inMag - n);
                s.fired = (s.fired || 0) + Math.min(n, before);
                if (n > before) s.dry = true;
                s.cond = Math.max(0, s.cond - n * 0.35);
            } else if (it && ['throw', 'explosive'].includes(it.kind)) s.qty = Math.max(0, s.qty - Math.max(1, n));
            else if (it && ['nonlethal', 'gadget'].includes(it.kind)) s.charges = Math.max(0, s.charges - Math.max(1, n));
            s.hands = !!(it && D.isGun(it.kind));
            s.last = i;
            return;
        }
        case 'reload': {
            const s = at(items, ev.id); if (!s) return;
            const it = itemById(ev.id); if (!it) return;
            const cap = num(it.cap, 0);
            if (s.state === 'jammed') s.state = 'ok';
            if (!cap) return;
            if (['mag', 'clip', 'belt'].includes(it.feed || 'mag') && s.mags.length) {
                s.mags.sort((a, b) => b - a);
                const take = s.mags.shift();
                if (s.inMag > 0) s.mags.push(s.inMag);
                s.inMag = Math.min(cap, take);
            } else {
                const pool = poolFor(items, it, s.holder || it.owner);
                if (pool && pool.qty > 0) { const k = Math.min(cap - s.inMag, pool.qty); pool.qty -= k; s.inMag += k; }
                else if (!['mag', 'clip', 'belt'].includes(it.feed || 'mag')) s.noAmmo = true;
                else s.noMag = true;
            }
            s.dry = false; s.last = i;
            return;
        }
        case 'draw': { const s = at(items, ev.id); if (s) { s.hands = true; if (s.state === 'dropped') s.state = 'ok'; s.last = i; } return; }
        case 'holster': { const s = at(items, ev.id); if (s) { s.hands = false; s.last = i; } return; }
        case 'give': { const s = at(items, ev.id); if (s && ev.to) { s.holder = canon(ev.to); s.where = ''; s.hands = false; s.state = 'ok'; s.last = i; } return; }
        case 'take': { const s = at(items, ev.id); if (s) { s.holder = canon(ev.who || s.holder); s.where = ''; s.state = 'ok'; s.last = i; } return; }
        case 'drop': { const s = at(items, ev.id); if (s) { s.holder = ''; s.where = str(ev.where) || 'осталось на месте'; s.state = 'dropped'; s.hands = false; s.last = i; } return; }
        case 'dirty': { const s = at(items, ev.id); if (s) { s.cond = Math.max(0, s.cond - 30); s.last = i; } return; }
        case 'clean': { const s = at(items, ev.id); if (s) { s.cond = 100; if (s.state === 'jammed') s.state = 'ok'; s.last = i; } return; }
        case 'jam': { const s = at(items, ev.id); if (s) { s.state = 'jammed'; s.last = i; } return; }
        case 'break': { const s = at(items, ev.id); if (s) { s.state = 'broken'; s.hands = false; s.last = i; } return; }
        case 'use': {
            const s = at(items, ev.id); if (!s) return;
            const it = itemById(ev.id);
            const n = Math.max(1, Math.min(50, num(ev.n, 1)));
            if (it && (it.gadget || ['gadget', 'nonlethal'].includes(it.kind)) && num(it.gadget?.max, 0) > 0) s.charges = Math.max(0, s.charges - n);
            else s.qty = Math.max(0, s.qty - n);
            s.used = (s.used || 0) + n; s.last = i;
            return;
        }
        case 'veh': {
            const s = at(veh, ev.id); if (!s) return;
            if (ev.fuel) s.fuel = clamp(s.fuel + num(ev.fuel));
            for (const [z, v] of Object.entries(ev.dmg || {})) s.dmg[z] = clamp((s.dmg[z] || 0) + num(v));
            if (ev.burn) s.burn = clamp(s.burn + num(ev.burn));
            if (ev.where) s.where = str(ev.where);
            if (ev.driver) s.driver = canon(ev.driver);
            if (ev.state && D.VSTATE[ev.state]) s.state = ev.state;
            else if (Object.values(s.dmg).some(v => v >= 85)) s.state = 'wreck';
            else if (Object.values(s.dmg).some(v => v >= 25) && s.state === 'ok') s.state = 'damaged';
            s.last = i;
            return;
        }
        case 'suit': {
            const s = at(suits, ev.id); if (!s) return;
            for (const [z, v] of Object.entries(ev.dmg || {})) s.dmg[z] = clamp((s.dmg[z] || 0) + num(v));
            if (ev.st && D.SUIT_ST[ev.st]) s.st = ev.st;
            else if (Object.values(s.dmg).some(v => v >= 30) && s.st === 'intact') s.st = 'damaged';
            if (typeof ev.worn === 'boolean') s.worn = ev.worn;
            if (ev.where) s.where = str(ev.where);
            s.last = i;
            return;
        }
        case 'lab': {
            const s = at(proj, ev.id); if (!s) return;
            if (s.stage >= D.STAGES.length - 1) { (W.labLog[ev.id] ||= []).push({ i, t: str(ev.note) || 'работа в лаборатории' }); return; }
            s.pct += 5;
            while (s.pct >= 100 && s.stage < D.STAGES.length - 1) { s.pct -= 100; s.stage++; }
            if (s.stage >= D.STAGES.length - 1) s.pct = 100;
            (W.labLog[ev.id] ||= []).push({ i, t: str(ev.note) || 'работа в лаборатории' });
            return;
        }
        case 'seen': W.seen.push({ ...ev, i }); return;
        case 'newlab': W.newlab.push({ ...ev, i }); return;
        default:
    }
}

/** Всё «сейчас»: Map id → состояние (база + посты после неё). Память на пару секунд, сброс — bump(). */
export function world() {
    const c = chat();
    const s = sig();
    if (memo && memo.chat === c && memo.sig === s && Date.now() - memo.at < 2500) return memo;
    const m = M();
    const items = new Map(), veh = new Map(), suits = new Map(), proj = new Map();
    for (const x of m.items) items.set(x.id, { ...baseOf(x, 'item'), _at: num(x.base?.at, -1) });
    for (const x of m.vehicles) veh.set(x.id, { ...baseOf(x, 'veh'), _at: num(x.base?.at, -1) });
    for (const x of m.suits) suits.set(x.id, { ...baseOf(x, 'suit'), _at: num(x.base?.at, -1) });
    for (const x of m.projects) proj.set(x.id, { ...baseOf(x, 'proj'), _at: num(x.base?.at, -1) });
    const W = { items, veh, suits, proj, seen: [], newlab: [], labLog: {} };
    for (let i = 0; i < c.length; i++) {
        const evs = eventsAt(i);
        if (!evs) continue;
        for (const ev of evs) { try { applyEv(ev, i, W); } catch (e) { console.warn('[Ангар] запись поста', i, e); } }
    }
    memo = { chat: c, sig: s, at: Date.now(), ...W };
    return memo;
}
export const dyn = (id) => world().items.get(id) || null;
export const vdyn = (id) => world().veh.get(id) || null;
export const sdyn = (id) => world().suits.get(id) || null;
export const pdyn = (id) => world().proj.get(id) || null;

/** Руками: новое «сейчас» вещи — от текущего состояния, с этого поста. */
function rebase(e, cur, patch) {
    const keep = { ...cur, ...patch };
    for (const k of ['_at', 'last', 'fired', 'used', 'dry', 'noAmmo', 'noMag']) delete keep[k];
    e.base = { ...clone(keep), at: lastIndex() };
    touch();
}
export function setDyn(id, patch) { const it = itemById(id); const cur = dyn(id); if (it && cur) rebase(it, cur, patch); }
export function setVdyn(id, patch) { const v = vehById(id); const cur = vdyn(id); if (v && cur) rebase(v, cur, patch); }
export function setSdyn(id, patch) { const s = suitById(id); const cur = sdyn(id); if (s && cur) rebase(s, cur, patch); }
export function setPdyn(id, patch) { const p = projById(id); const cur = pdyn(id); if (p && cur) rebase(p, cur, patch); }

// ───────────── вещи ─────────────

export const itemById = (id) => M().items.find(x => x.id === id) || null;
export const vehById = (id) => M().vehicles.find(x => x.id === id) || null;
export const suitById = (id) => M().suits.find(x => x.id === id) || null;
export const projById = (id) => M().projects.find(x => x.id === id) || null;
export const matById = (id) => M().materials.find(x => x.id === id) || null;
export const stashById = (id) => M().stashes.find(x => x.id === id) || null;

const STAT_KEYS = ['dmg', 'acc', 'range', 'conceal', 'noise', 'reliab'];
function cleanStats(s) {
    const o = {};
    if (!s || typeof s !== 'object') return o;
    for (const k of STAT_KEYS) if (s[k] != null && s[k] !== '') o[k] = Math.max(1, Math.min(5, Math.round(num(s[k], 3))));
    for (const k of ['weight', 'eff', 'rate']) if (s[k] != null && str(s[k])) o[k] = cut(str(s[k]), 40);
    return o;
}

/** Любой ответ модели или формы → чистая вещь оружейной. */
export function normItem(x, defaults = {}) {
    const kind = D.KINDS.some(k => k[0] === str(x?.kind)) ? str(x.kind) : (defaults.kind || 'other');
    const it = {
        id: uid(), kind, name: cut(str(x?.name) || D.kindName(kind), 80), model: cut(str(x?.model), 80), desc: cut(str(x?.desc), 900),
        img: str(x?.img), owner: canon(str(x?.owner) || defaults.owner || ''), src: defaults.src || str(x?.src) || 'me', created: storyDay() || '',
        price: x?.price != null ? cut(str(x.price), 40) : '', from: cut(str(x?.from) || defaults.from || '', 60),
        caliber: cut(str(x?.caliber), 40), cap: Math.max(0, Math.min(250, Math.round(num(x?.cap, 0)))),
        feed: D.FEEDS[str(x?.feed)] ? str(x.feed) : (D.FEED_BY_KIND[kind] || (D.isGun(kind) ? 'mag' : 'none')),
        ammo: D.AMMO_TYPES.some(a => a[0] === str(x?.ammo)) ? str(x.ammo) : 'fmj',
        mods: arr(x?.mods).map(m => cut(str(m), 50)).filter(Boolean).slice(0, 8),
        stats: cleanStats(x?.stats), story: cut(str(x?.story), 400), why: cut(str(x?.why), 240), lock: !!x?.lock,
        slot: D.slotById(str(x?.slot)) ? str(x.slot) : '', where: cut(str(x?.where), 80),
        qty: Math.max(0, Math.round(num(x?.qty, ['ammo', 'throw', 'explosive'].includes(kind) ? (kind === 'ammo' ? 50 : 2) : 1))),
    };
    if (kind === 'gadget' || kind === 'nonlethal' || x?.gadget) {
        const g = x?.gadget || {};
        it.gadget = {
            does: cut(str(g.does) || str(x?.does), 300), max: Math.max(0, Math.min(99, Math.round(num(g.max ?? g.charges, kind === 'gadget' ? 3 : 0)))),
            recharge: cut(str(g.recharge), 80), side: cut(str(g.side), 200), limit: cut(str(g.limit), 200),
            reliab: Math.max(1, Math.min(5, Math.round(num(g.reliab, x?.proto ? 2 : 4)))), proto: !!(g.proto ?? x?.proto),
        };
    }
    if (kind === 'armor' || x?.armor) { const a = x?.armor || {}; it.armor = { level: Math.max(1, Math.min(5, Math.round(num(a.level ?? x?.level, 3)))), covers: cut(str(a.covers) || 'корпус', 80) }; }
    if (kind === 'legend' || x?.legend) { const l = x?.legend || {}; it.legend = { alias: cut(str(l.alias) || str(x?.alias), 80), nation: cut(str(l.nation) || str(x?.nation), 40), docs: cut(str(l.docs) || str(x?.docs), 120), cover: cut(str(l.cover) || str(x?.cover), 160), burned: !!l.burned, note: cut(str(l.note), 200) }; }
    if (kind === 'disguise' || x?.disguise) { const g = x?.disguise || {}; it.disguise = { parts: cut(str(g.parts) || str(x?.parts), 200), look: cut(str(g.look) || str(x?.look), 200) }; }
    const mags = Math.max(0, Math.min(12, Math.round(num(x?.mags, D.isGun(it.kind) && it.feed === 'mag' ? 2 : 0))));
    it.base = { at: lastIndex(), inMag: it.cap, mags: Array.from({ length: mags }, () => it.cap), cond: 100, charges: it.gadget?.max || 0, qty: it.qty, slot: it.slot, holder: it.owner, where: it.where, state: 'ok', hands: false };
    return it;
}
export function addItem(x, defaults = {}) {
    const it = x?.id && x?.base ? x : normItem(x, defaults);
    M().items.unshift(it);
    touch();
    return it;
}
export function delItem(id) {
    const m = M();
    m.items = m.items.filter(x => x.id !== id);
    m.table.pick = m.table.pick.filter(x => x !== id);
    for (const v of m.vehicles) v.stash = arr(v.stash).filter(x => x !== id);
    touch();
}
/** Что у человека с собой (держит, на нём, в его сумке) — не в тайниках. */
export function carried(who) {
    const W = world();
    return M().items.filter(it => { const s = W.items.get(it.id); return s && same(s.holder, who) && !s.where && !['lost', 'broken'].includes(s.state) && it.kind !== 'ammo'; });
}
export function ammoOf(who) {
    const W = world();
    return M().items.filter(it => it.kind === 'ammo' && same(W.items.get(it.id)?.holder || it.owner, who));
}
export function itemsWhere(where) {
    const W = world();
    return M().items.filter(it => norm(W.items.get(it.id)?.where) === norm(where));
}
/** Строка патронов: «3/15 · +2 маг.» */
export function ammoLine(it, s = dyn(it.id)) {
    if (!s) return '';
    if (D.isGun(it.kind) && it.cap) return `${s.inMag}/${it.cap}${s.mags.length ? ` · +${s.mags.length} маг.` : ''}`;
    if (it.gadget?.max) return `${s.charges}/${it.gadget.max} зар.`;
    if (['throw', 'explosive', 'ammo'].includes(it.kind)) return `×${s.qty}`;
    return '';
}
export const empty = (it, s = dyn(it.id)) => !!s && D.isGun(it.kind) && it.cap > 0 && s.inMag <= 0;

// ───────────── ручные действия с вещью ─────────────

export function reloadNow(id) {
    const it = itemById(id); const s = dyn(id);
    if (!it || !s || !it.cap) return '';
    const W = world();
    const next = { mags: [...s.mags], inMag: s.inMag, state: s.state === 'jammed' ? 'ok' : s.state };
    if (['mag', 'clip', 'belt'].includes(it.feed) && next.mags.length) {
        next.mags.sort((a, b) => b - a);
        const take = next.mags.shift();
        if (next.inMag > 0) next.mags.push(next.inMag);
        next.inMag = take;
    } else {
        const pool = M().items.find(x => x.kind === 'ammo' && norm(x.caliber) === norm(it.caliber) && same(W.items.get(x.id)?.holder || x.owner, s.holder || it.owner));
        const ps = pool && W.items.get(pool.id);
        if (!ps || ps.qty <= 0) return 'нечем: нет магазинов и патронов этого калибра';
        const k = Math.min(it.cap - next.inMag, ps.qty);
        setDyn(pool.id, { qty: ps.qty - k });
        next.inMag += k;
    }
    setDyn(id, next);
    return `${it.name}: ${next.inMag}/${it.cap}`;
}
export function fillMags(id, n = null) {
    const it = itemById(id); const s = dyn(id);
    if (!it || !s || !it.cap) return;
    const count = n == null ? Math.max(s.mags.length, 2) : Math.max(0, Math.min(12, n));
    setDyn(id, { inMag: it.cap, mags: Array.from({ length: count }, () => it.cap), state: 'ok' });
}

// ───────────── гараж ─────────────

export function normVeh(x, defaults = {}) {
    const kind = D.VKINDS.some(k => k[0] === str(x?.kind)) ? str(x.kind) : 'car';
    const st = x?.stats || {};
    const v = {
        id: uid(), kind, name: cut(str(x?.name) || D.vkindOf(kind)[1], 80), model: cut(str(x?.model), 80), color: cut(str(x?.color), 40),
        plate: cut(str(x?.plate), 20), fake: cut(str(x?.fake), 20), desc: cut(str(x?.desc), 700), img: str(x?.img),
        owner: canon(str(x?.owner) || defaults.owner || ''), src: defaults.src || 'me', created: storyDay() || '', price: x?.price != null ? cut(str(x.price), 40) : '',
        fuelType: D.FUEL[str(x?.fuelType)] ? str(x.fuelType) : (kind === 'ship' ? 'warp' : kind === 'jet' ? 'jet' : kind === 'boat' ? 'diesel' : 'gas'),
        stats: { speed: Math.max(1, Math.min(5, Math.round(num(st.speed, 3)))), handling: Math.max(1, Math.min(5, Math.round(num(st.handling, 3)))), armor: Math.max(1, Math.min(5, Math.round(num(st.armor, 1)))), seats: Math.max(1, Math.min(60, Math.round(num(st.seats, kind === 'bike' ? 2 : 5)))), range: Math.max(0, Math.round(num(st.range, kind === 'bike' ? 300 : 600))) },
        mods: arr(x?.mods).map(m => (typeof m === 'string' ? { name: cut(m, 60), from: '' } : { name: cut(str(m?.name), 60), from: cut(str(m?.from), 30) })).filter(m => m.name).slice(0, 12),
        stash: [], story: cut(str(x?.story), 400), why: cut(str(x?.why), 240),
    };
    v.base = { at: lastIndex(), fuel: clamp(x?.fuel ?? 100), dmg: {}, burn: 0, state: 'ok', where: cut(str(x?.where), 80), driver: '' };
    return v;
}
export function addVeh(x, defaults = {}) { const v = x?.id && x?.base ? x : normVeh(x, defaults); M().vehicles.unshift(v); touch(); return v; }
export function delVeh(id) { const m = M(); m.vehicles = m.vehicles.filter(x => x.id !== id); touch(); }
export function vehDmg(v, s = vdyn(v.id)) {
    if (!s) return 0;
    const z = D.zonesOf(v.kind).map(([k]) => s.dmg[k] || 0);
    return z.length ? Math.round(z.reduce((a, b) => a + b, 0) / z.length) : 0;
}
export const kmLeft = (v, s = vdyn(v.id)) => (s ? Math.round(num(v.stats?.range, 600) * s.fuel / 100) : 0);
/** Ремонт у механика: грубая цена по урону. */
export const repairCost = (v, s = vdyn(v.id)) => Math.round(Object.values(s?.dmg || {}).reduce((a, b) => a + b, 0) * (v.kind === 'jet' || v.kind === 'ship' ? 900 : v.kind === 'bike' ? 18 : 35) / 10) * 10;

// ───────────── костюмы ─────────────

export function normSuit(x, defaults = {}) {
    const kind = D.SKINDS.some(k => k[0] === str(x?.kind)) ? str(x.kind) : 'hero';
    const s = {
        id: uid(), who: canon(str(x?.who) || defaults.who || ''), name: cut(str(x?.name) || 'Костюм', 80), kind, look: cut(str(x?.look), 600),
        img: str(x?.img), note: cut(str(x?.note), 600), src: defaults.src || 'me', created: storyDay() || '',
        armor: Math.max(1, Math.min(5, Math.round(num(x?.armor, kind === 'hero' ? 4 : 2)))),
        systems: arr(x?.systems).map(y => (typeof y === 'string' ? { id: uid(), name: cut(y, 60), pct: 100 } : { id: uid(), name: cut(str(y?.name), 60), pct: clamp(y?.pct ?? 100) })).filter(y => y.name).slice(0, 10),
        upgrades: arr(x?.upgrades).map(y => (typeof y === 'string' ? { name: cut(y, 80), from: '' } : { name: cut(str(y?.name), 80), from: cut(str(y?.from), 30) })).filter(y => y.name).slice(0, 12),
        main: !!x?.main, key: str(x?.key), why: cut(str(x?.why), 240),
    };
    s.base = { at: lastIndex(), st: 'intact', dmg: {}, where: cut(str(x?.where), 80), worn: false };
    return s;
}
export function addSuit(x, defaults = {}) { const s = x?.id && x?.base ? x : normSuit(x, defaults); M().suits.unshift(s); touch(); return s; }
export function delSuit(id) {
    const m = M();
    const s = suitById(id);
    if (s?.life) m.hide = [...new Set([...m.hide, `suit:${norm(s.who)}`])];
    m.suits = m.suits.filter(x => x.id !== id);
    touch();
}

/** Основной костюм → Life → Герои: кадры Оператора видят, как он выглядит, и берут картинку рефом. */
export function heroSync(s) {
    if (!cfg().syncHero || !s) return false;
    try {
        const ls = A?.settings?.();
        if (!ls) return false;
        if (!ls.hero || typeof ls.hero !== 'object') ls.hero = {};
        if (!ls.hero.list || typeof ls.hero.list !== 'object') ls.hero.list = {};
        let k = Object.keys(ls.hero.list).find(n => same(n, s.who));
        if (!k) { k = canon(s.who); ls.hero.list[k] = { alias: '', eras: [] }; }
        const h = ls.hero.list[k];
        if (s.look) { h.suitLook = cut(s.look, 400); h.suitHand = true; }
        if (s.img) h.suitImg = s.img;
        A.saveSettings?.();
        return true;
    } catch (e) { console.warn('[Ангар] костюм → Герои', e); return false; }
}
/** Костюмы, которые уже описаны в Life → Герои: подтянуть сюда (раз, без дублей). */
export function heroImport() {
    let n = 0;
    try {
        const list = A?.settings?.()?.hero?.list || {};
        const y = storyYear();
        const yr = (v) => Number(String(v || '').slice(0, 4)) || null;
        for (const [name, h] of Object.entries(list)) {
            if (!h || (!str(h.suitLook) && !str(h.suitImg)) || M().hide.includes(`suit:${norm(name)}`)) continue;
            const eras = arr(h.eras).filter(r => r && (r.from || r.to));
            const now = eras.length ? eras.some(r => (!yr(r.from) || yr(r.from) <= y) && (!yr(r.to) || yr(r.to) + 1 > y)) : y >= 2008;
            if (!now) continue;   // в 1944-м костюма Сэма ещё нет
            if (M().suits.some(s => same(s.who, name) && (s.life || norm(s.look) === norm(h.suitLook)))) continue;
            const s = normSuit({ who: name, name: str(h.alias) || 'Геройский костюм', look: str(h.suitLook), img: str(h.suitImg), kind: 'hero', main: true }, { src: 'life' });
            s.life = true;
            M().suits.push(s);
            n++;
        }
        if (n) touch();
    } catch (e) { console.warn('[Ангар] костюмы из Героев', e); }
    return n;
}

// ───────────── Зёрнышко: срок (если стоит) ─────────────

let Z = null;
export async function loadZ() {
    if (Z !== null) return Z;
    try { Z = await import('../zernyshko/engine.js'); } catch { Z = false; }
    return Z;
}
/** Беременна ли Хеди сейчас: { week, text } или null. */
export function pregnant() {
    if (!Z) return null;
    try {
        const k = Z.kids().find(x => x.stage === 'preg');
        if (!k) return null;
        const tm = Z.term(k);
        if (!tm || tm.before) return null;
        return { week: tm.ow, text: `${tm.ow} нед ${tm.od} дн` };
    } catch { return null; }
}

// ───────────── лаба ─────────────

export function normProject(x, defaults = {}) {
    const p = {
        id: uid(), name: cut(str(x?.name) || 'Новый проект', 90), field: D.FIELDS.some(f => f[0] === str(x?.field)) ? str(x.field) : 'other',
        out: D.OUT_TYPES.some(o => o[0] === str(x?.out)) ? str(x.out) : 'gadget', note: cut(str(x?.note), 900), img: str(x?.img),
        team: arr(x?.team).map(t => cut(str(t), 40)).filter(Boolean).slice(0, 8), needs: arr(x?.needs).map(str).filter(Boolean),
        mats: arr(x?.mats).filter(y => y && str(y.id)).map(y => ({ id: str(y.id), n: Math.max(1, Math.round(num(y.n, 1))) })),
        bans: cut(str(x?.bans), 200), lock: !!x?.lock, src: defaults.src || str(x?.src) || 'me', created: storyDay() || '',
        ty: num(x?.ty, hedyYear()), y: x?.y != null ? num(x.y) : null, key: str(x?.key), dead: !!x?.dead, deadWhy: cut(str(x?.deadWhy), 400),
        spec: cut(str(x?.spec), 500), released: [], log: [], artur: str(x?.artur),
    };
    const stage = Math.max(0, Math.min(D.STAGES.length - 1, Math.round(num(x?.stage, 0))));
    p.base = { at: lastIndex(), stage, pct: stage >= D.STAGES.length - 1 ? 100 : clamp(x?.pct ?? 0) };
    return p;
}
export function addProject(x, defaults = {}) { const p = x?.id && x?.base ? x : normProject(x, defaults); M().projects.unshift(p); projLog(p, `Проект заведён: ${p.name}`, 'sys'); touch(); return p; }
export function delProject(id) { const m = M(); m.projects = m.projects.filter(x => x.id !== id); for (const p of m.projects) p.needs = p.needs.filter(n => n !== id); touch(); }
export function projLog(p, t, kind = 'note', extra = {}) {
    const k = clock();
    p.log.unshift({ t: cut(t, 240), kind, at: [k.date, k.time].filter(Boolean).join(' · '), mes: lastIndex(), ...extra });
    p.log = p.log.slice(0, 50);
}
/** Проекты, о которых Хеди уже знает в этой точке своей жизни (путешествие во времени — по её годам). */
export function projectsNow() {
    const ty = hedyYear() + 0.001;
    return M().projects.filter(p => !(num(p.ty, 0) > ty));
}
export const projStage = (p) => pdyn(p.id)?.stage ?? 0;
export const projPct = (p) => pdyn(p.id)?.pct ?? 0;
export function bumpProject(p, delta, why = '') {
    const s = pdyn(p.id); if (!s) return;
    let pct = s.pct + delta, stage = s.stage, moved = 0;
    while (pct >= 100 && stage < D.STAGES.length - 1) { pct -= 100; stage++; moved++; }
    while (pct < 0 && stage > 0 && delta < -15) { pct += 100; stage--; moved--; }
    pct = stage >= D.STAGES.length - 1 ? 100 : clamp(pct);
    setPdyn(p.id, { stage, pct });
    if (moved > 0) { projLog(p, `Стадия: ${D.STAGES[stage]}${why ? ` — ${why}` : ''}`, 'stage'); logFeed(`«${p.name}» → ${D.STAGES[stage]}`, 'lab'); }
    if (moved < 0) projLog(p, `Откат на стадию «${D.STAGES[stage]}»`, 'stage');
}
export function setStage(p, stage) { setPdyn(p.id, { stage, pct: stage >= D.STAGES.length - 1 ? 100 : 0 }); projLog(p, `Стадия: ${D.STAGES[stage]}`, 'stage'); }
/** Что мешает начать: незаконченные «нужно сначала». */
export function blockedBy(p) { return p.needs.map(projById).filter(q => q && projStage(q) < D.STAGES.length - 1); }
export function unlocks(p) { return M().projects.filter(q => q.needs.includes(p.id)); }

/** Поправки к кубику опыта (как у Арта; потолок ±6). */
export const MOD_CAP = 6;
export function modsFor(p) {
    const e = era();
    const k = clock();
    const team = (p.team || []).map(norm);
    const out = [];
    const add = (key, label, v, on = true) => out.push({ key, label, v, on });
    const gear = D.LAB_GEAR[e.id] ?? 0;
    if (gear) add('gear', gear > 0 ? 'оборудование базы' : 'лаба на коленке', gear);
    const sm = D.STAGE_MOD[projStage(p)] ?? 0;
    if (sm) add('stage', `стадия «${D.STAGES[projStage(p)]}»`, sm);
    if (k.hour != null && k.hour >= 1 && k.hour < 6) add('night', 'глубокая ночь, недосып', -2);
    if (blockedBy(p).length) add('needs', 'не готово то, на чём строится', -2);
    const mats = p.mats.map(x => ({ x, m: matById(x.id) })).filter(y => y.m);
    if (mats.some(y => num(y.m.qty) < y.x.n)) add('mats', 'не хватает материалов', -3);
    try { const st = A?.senses?.stones?.(); if (st && num(st.lvl) >= 2) add('stones', 'Камни неспокойны', -2); } catch { /* */ }
    if (pregnant()) add('preg', D.RISKY.includes(p.field) ? 'беременность: Амара против, всё медленно' : 'осторожность (беременность)', D.RISKY.includes(p.field) ? -2 : -1);
    if (team.some(n => n.includes('айрис'))) add('iris', 'Айрис помогает', 2);
    if (team.some(n => n.includes('тони') || n.includes('старк'))) add('tony', 'Тони рядом (и спорит)', 2);
    if (team.some(n => n.includes('шури'))) add('shuri', 'Шури на связи', 2);
    if (team.some(n => n.includes('оберин'))) add('oberin', 'Оберин лезет (+3, но рискованно)', 3);
    add('focus', 'полная сосредоточенность', 2, false);
    add('rush', 'спешка', -2, false);
    return out;
}
export function rollExp(p, mods) {
    const e = era();
    const roll = d20();
    const on = mods.filter(x => x.on);
    const modSum = Math.max(-MOD_CAP, Math.min(MOD_CAP, on.reduce((a, x) => a + x.v, 0)));
    const sum = roll + modSum;
    const risky = D.RISKY.includes(p.field) || on.some(x => x.key === 'oberin');
    let out = D.OUTCOMES.find(o => sum >= o.min) || D.OUTCOMES[D.OUTCOMES.length - 1];
    if (roll === 20) out = D.OUTCOMES[0];
    if (roll === 1) out = risky ? D.OUTCOMES[D.OUTCOMES.length - 1] : D.OUTCOMES.find(o => o.id === 'fail');
    if (out.id === 'boom' && !risky) out = D.OUTCOMES.find(o => o.id === 'fail');
    if (on.some(x => x.key === 'oberin') && roll <= 4 && out.id !== 'boom') out = D.OUTCOMES[D.OUTCOMES.length - 1];
    const fl = (e.id === 'ssr' && D.FLAVOR_40S[out.id]) || D.FLAVOR[out.id] || [''];
    return { pid: p.id, roll, mods: on.map(x => ({ label: x.label, v: x.v })), modSum, sum, out: out.id, name: out.name, delta: out.delta, flavor: rnd(fl) };
}
export function applyExp(r, scene) {
    const p = projById(r.pid);
    if (!p) return;
    bumpProject(p, r.delta);
    projLog(p, `Опыт: ${r.name.toLowerCase()} — ${r.flavor} (d20 ${r.roll} → ${r.sum})`, r.out, { roll: r.roll, sum: r.sum });
    for (const x of p.mats) { const m = matById(x.id); if (m && num(m.qty) > 0 && ['win', 'break', 'part', 'boom'].includes(r.out)) m.qty = Math.max(0, num(m.qty) - (r.out === 'boom' ? x.n : Math.ceil(x.n / 2))); }
    if (scene) arm('lab', `[Лаборатория: в этом ответе опыт по проекту «${p.name}» (${D.STAGES[projStage(p)].toLowerCase()}) заканчивается так — ${r.name.toLowerCase()}: ${r.flavor}. Покажи это действиями, звуком и реакцией людей. Исход решён кубиком, не меняй его. Цифр и кубиков не называй.]`, { key: p.id });
    touch();
}
/** Готово → выпустить: вещь в Оружейную, мод на технику или костюм, новую технику. */
export function release(p, target = '') {
    const out = p.out;
    const owner = userName();
    let made = null;
    if (['gadget', 'weapon', 'ammo', 'armor', 'med', 'other', 'soft'].includes(out)) {
        const kind = out === 'weapon' ? 'pistol' : out === 'ammo' ? 'ammo' : out === 'armor' ? 'armor' : 'gadget';
        made = addItem({ kind, name: p.name, desc: p.note || p.spec, owner, gadget: kind === 'gadget' ? { does: cut(p.spec || p.note, 300), max: 3, reliab: 4 } : undefined }, { src: 'lab', from: 'лаба' });
    } else if (out === 'mod') {
        const v = vehById(target), s = suitById(target), it = itemById(target);
        if (v) { v.mods.push({ name: p.name, from: 'лаба' }); made = v; }
        else if (s) { s.upgrades.push({ name: p.name, from: 'лаба' }); made = s; }
        else if (it) { it.mods.push(p.name); made = it; }
    } else if (out === 'suit') made = addSuit({ who: owner, name: p.name, look: p.spec, note: p.note }, { src: 'lab' });
    else if (out === 'vehicle') made = addVeh({ name: p.name, desc: p.note, owner }, { src: 'lab' });
    if (made) { p.released.push(made.id); projLog(p, `Выпущено: ${made.name || p.name}`, 'stage'); logFeed(`Из лабы: ${p.name}`, 'lab'); touch(); }
    return made;
}
export function bury(p, why) { p.dead = true; p.deadWhy = cut(str(why), 400) || 'брошен'; projLog(p, `На кладбище: ${p.deadWhy}`, 'boom'); touch(); }
export function revive(p) {
    const n = addProject({ name: `${p.name} — заново`, field: p.field, out: p.out, note: `Вырос из старого: ${p.deadWhy || p.note}`, team: p.team, ty: hedyYear() });
    n.needs = [];
    projLog(n, `Оживлён из кладбища: ${p.name}`, 'sys');
    touch();
    return n;
}

// ───────────── полигон, клин, занос, тир ─────────────

export function protoTest(it) {
    const g = it.gadget || {};
    const r = d20();
    const fail = D.PROTO_FAIL[Math.max(1, Math.min(5, num(g.reliab, 3)))];
    const out = r <= Math.max(1, Math.round(fail / 3)) && g.proto ? 'boom' : r <= fail ? 'fail' : r <= fail + 4 ? 'weak' : 'ok';
    return { roll: r, fail, out, text: rnd(D.PROTO_OUT[out]) };
}
export function skidRoll(v, s = vdyn(v.id)) {
    const r = d20();
    const sum = r + num(v.stats?.handling, 3) * 2 - Math.round((s?.dmg?.tires || 0) / 10);
    return { roll: r, sum, ok: sum >= D.SKID_OK || r === 20, crash: r === 1 };
}
export function rangeSkill(who) {
    const n = norm(who);
    for (const [k, v] of Object.entries(D.RANGE_SKILL)) if (n.includes(k)) return v;
    return 3;
}
/** Тир: 10 выстрелов, каждый — d20 + навык·2 + точность ствола → кольца 0–10. */
export function rangeShoot(who, it) {
    const sk = rangeSkill(who);
    const acc = num(it?.stats?.acc, 3);
    const shots = [];
    for (let i = 0; i < 10; i++) {
        const r = d20();
        const v = r === 1 ? 0 : Math.max(0, Math.min(10, Math.round((r + sk * 2 + acc) / 3.1)));
        shots.push(v);
    }
    return { who, item: it?.name || 'ствол', shots, total: shots.reduce((a, b) => a + b, 0) };
}

// ───────────── разовые заметки модели (на один ответ) ─────────────

export function arm(kind, text, extra = {}) {
    const m = M();
    m.shots = m.shots.filter(s => s.kind !== kind || s.key !== extra.key);
    m.shots.push({ kind, text, after: lastIndex(), at: Date.now(), ...extra });
    save();
    try { A?.updatePrompt?.(); } catch { /* */ }
}
export function disarm(at) { const m = M(); m.shots = m.shots.filter(s => String(s.at) !== String(at)); save(); try { A?.updatePrompt?.(); } catch { /* */ } }
export function spendShots(i) {
    const m = M();
    const before = m.shots.length;
    m.shots = m.shots.filter(s => !(Number(i) > (s.after ?? -1)));
    if (m.shots.length !== before) save();
}

// ───────────── кубики «сами»: перед ответом модели ─────────────

function recentEv(n = 3) {
    const c = chat();
    const out = [];
    for (let i = c.length - 1, k = 0; i >= 0 && k < n; i--) {
        const m = c[i];
        if (!m || m.extra?.type === 'comment') continue;
        k++;
        const ev = eventsAt(i);
        if (ev) out.push(...ev);
    }
    return out;
}
const FIGHT_RE = /стрел|выстрел|перестрел|пальб|огонь!|пули|очеред|прицел|ствол|курок|спуск|засад|граната|нож[а-я]*\s+(в|под|меж)|бой\b|драк|shoot|gunfire|ambush/i;
export function fighting() {
    const ev = recentEv(3);
    if (ev.some(e => ['fire', 'draw', 'jam'].includes(e.t))) return true;
    if (M().items.some(it => dyn(it.id)?.hands && D.isGun(it.kind))) return true;
    const c = chat();
    for (let i = c.length - 1, k = 0; i >= 0 && k < 2; i--) { const m = c[i]; if (!m || m.extra?.type === 'comment') continue; k++; if (FIGHT_RE.test(plain(m.mes).slice(-2500))) return true; }
    return false;
}
const CHASE_RE = /погон|преслед|оторвать|на хвосте|газ в пол|вираж|chase|pursuit/i;
export function chasing() {
    const c = chat();
    for (let i = c.length - 1, k = 0; i >= 0 && k < 2; i--) { const m = c[i]; if (!m || m.extra?.type === 'comment') continue; k++; if (CHASE_RE.test(plain(m.mes).slice(-2500))) return true; }
    return false;
}
/** Кубик на ответ: один бросок на (что, номер будущего ответа) — свайп того же ответа видит тот же исход. */
function rollOnce(key, fn) {
    const m = M();
    if (m.rolls[key] !== undefined) return m.rolls[key];
    const v = fn();
    m.rolls[key] = v;
    const keys = Object.keys(m.rolls);
    if (keys.length > 120) for (const k of keys.slice(0, keys.length - 120)) delete m.rolls[k];
    save();
    return v;
}
function autoDice(type) {
    if (!cfg().dice) return [];
    const target = ['swipe', 'regenerate', 'continue'].includes(type) ? lastIndex() : lastIndex() + 1;
    const out = [];
    const here = inScene();
    if (fighting()) {
        for (const it of M().items) {
            const s = dyn(it.id);
            if (!s || !here.some(n => same(n, s.holder))) continue;
            if (D.isGun(it.kind) && s.hands && s.state === 'ok' && s.inMag > 0) {
                const at = D.JAM_AT(s.cond);
                if (!at) continue;
                const r = rollOnce(`jam:${it.id}:${target}`, d20);
                if (r <= at) out.push(`у ${short(s.holder)} клинит ${it.name} (${D.condWord(s.cond)}): жмёт на спуск — выстрела нет; чтобы стрелять дальше, передёрнуть затвор или сменить ствол`);
            }
            if (it.gadget?.proto && !['lost', 'broken'].includes(s.state) && s.charges !== 0) {
                const r = rollOnce(`proto:${it.id}:${target}`, () => protoTest(it));
                if (r.out !== 'ok') out.push(`если ${short(s.holder)} пустит в ход прототип «${it.name}» — он ${r.text}`);
            }
        }
    }
    if (chasing()) {
        for (const v of M().vehicles) {
            const s = vdyn(v.id);
            if (!s || !s.driver || !here.some(n => same(n, s.driver))) continue;
            const r = rollOnce(`skid:${v.id}:${target}`, () => skidRoll(v, s));
            if (r.crash) out.push(`${v.name} под ${short(s.driver)} срывается в занос и бьётся — без жертв, но погоня для этой машины, скорее всего, кончена`);
            else if (!r.ok) out.push(`${v.name} заносит на вираже: ${short(s.driver)} теряет пару секунд и дистанцию`);
        }
    }
    return out;
}

// ───────────── заметка модели ─────────────

const holderOf = (it) => dyn(it.id)?.holder || it.owner;
function personLine(who) {
    const W = world();
    const list = carried(who);
    if (!list.length) return '';
    const parts = list.slice(0, 8).map(it => {
        const s = W.items.get(it.id);
        const sl = D.slotById(s.slot);
        const bits = [];
        if (D.isGun(it.kind) && it.cap) bits.push(s.inMag <= 0 ? 'ПУСТО' : `${s.inMag}/${it.cap}`);
        if (D.isGun(it.kind) && s.mags.length) bits.push(`+${s.mags.length} маг.`);
        if (it.gadget?.max) bits.push(s.charges <= 0 ? 'зарядов нет' : `${s.charges} зар.`);
        if (['throw', 'explosive'].includes(it.kind)) bits.push(`×${s.qty}`);
        if (s.state === 'jammed') bits.push('ЗАКЛИНИЛ');
        if (s.hands) bits.push('в руках');
        else if (sl && !sl.hand) bits.push(sl.short);
        if (it.mods.length) bits.push(it.mods.slice(0, 2).join(', '));
        if (it.kind === 'armor' && it.armor) bits.push(D.ARMOR_STOPS[it.armor.level]);
        if (it.legend) bits.push(`паспорт на «${it.legend.alias || '?'}»${it.legend.burned ? ' — СГОРЕЛ' : ''}`);
        return `${it.name}${it.caliber ? ` (${it.caliber})` : ''}${bits.length ? ` — ${bits.join(', ')}` : ''}`;
    });
    return `${short(who)}: ${parts.join('; ')}${list.length > 8 ? `; и ещё ${list.length - 8}` : ''}`;
}
function gadgetLines(who) {
    return carried(who).filter(it => it.gadget && (it.gadget.does || it.gadget.limit)).slice(0, 3)
        .map(it => `«${it.name}» у ${short(who)}: ${it.gadget.does}${it.gadget.limit ? `; предел — ${it.gadget.limit}` : ''}${it.gadget.side ? `; побочка — ${it.gadget.side}` : ''}${it.gadget.proto ? '; это прототип' : ''}`);
}
function vehLine() {
    const k = clock();
    const here = inScene();
    const l = norm(k.loc);
    const out = [];
    for (const v of M().vehicles) {
        const s = vdyn(v.id);
        if (!s || ['lost'].includes(s.state)) continue;
        const near = (s.driver && here.some(n => same(n, s.driver))) || (l && s.where && (l.includes(norm(s.where)) || norm(s.where).includes(l)));
        if (!near) continue;
        const dmg = D.zonesOf(v.kind).filter(([z]) => (s.dmg[z] || 0) >= 25).map(([z, t]) => `${t} ${s.dmg[z] >= 70 ? 'разбит' : 'побит'}`);
        out.push(`${v.name}${v.model ? ` (${v.model})` : ''}${s.driver ? `, за рулём ${short(s.driver)}` : ''}: ${D.FUEL[v.fuelType] || 'бак'} ${s.fuel}% (≈${kmLeft(v, s)} км)${dmg.length ? `, ${dmg.join(', ')}` : ''}${s.burn >= 50 ? ', засвечена — её ищут' : ''}${v.mods.length ? `; тюнинг: ${v.mods.slice(0, 3).map(x => x.name).join(', ')}` : ''}`);
        if (out.length >= 2) break;
    }
    return out;
}
function suitLines() {
    const here = inScene();
    const out = [];
    for (const s of M().suits) {
        const d = sdyn(s.id);
        if (!d || !d.worn || !here.some(n => same(n, s.who))) continue;
        const dz = D.SZONES.filter(([z]) => (d.dmg[z] || 0) >= 25).map(([z, t]) => `${t} ${d.dmg[z] >= 70 ? 'разбит' : 'повреждён'}`);
        const sys = s.systems.filter(y => num(y.pct, 100) < 60).map(y => `${y.name} ${y.pct}%`);
        out.push(`${short(s.who)} в костюме «${s.name}»${dz.length ? `: ${dz.join(', ')}` : ''}${sys.length ? `; системы: ${sys.join(', ')}` : ''}`);
    }
    return out;
}
export function promptNote(type) {
    const c = cfg();
    if (!c.on || c.prompt === 'off' || !hasChat()) return '';
    if (type === 'quiet' || type === 'impersonate') return '';
    const parts = [];
    const here = inScene();
    const fight = fighting();
    const lines = here.map(personLine).filter(Boolean);
    const veh = vehLine();
    const suits = suitLines();
    const dice = autoDice(type);
    if (lines.length && (fight || c.prompt === 'always' || here.length)) {
        parts.push(`[Боекомплект (Ангар) — что у кого с собой прямо сейчас:\n${lines.join('\n')}${fight ? `\n${D.RULES}` : ''}]`);
        if (fight) {
            const g = here.flatMap(gadgetLines);
            if (g.length) parts.push(`[Гаджеты: ${g.join(' | ')}]`);
            const kinds = [...new Set(here.flatMap(w => carried(w)).filter(it => D.WOUND[it.kind] && (dyn(it.id)?.hands || D.isGun(it.kind))).map(it => it.kind))];
            if (kinds.length) parts.push(`[Если попали — ${kinds.slice(0, 4).map(k => D.WOUND[k]).join('; ')}. Бронежилет не делает неуязвимым: синяк, треснувшее ребро, сбитое дыхание.]`);
        }
    }
    if (veh.length) parts.push(`[Техника рядом: ${veh.join(' | ')}. Бензин и урон считаются, машина сама не чинится.]`);
    if (suits.length) parts.push(`[Костюмы: ${suits.join(' | ')}]`);
    if (dice.length) parts.push(`[Ангар · кубик на этот ответ: ${dice.join('; ')}. Исход решён, не меняй его и не называй кубиков.]`);
    for (const s of M().shots) parts.push(s.text);
    return parts.join('\n');
}

// ───────────── Летописец ─────────────

const CHRON_RULE = `

ang — оружие, патроны, техника, костюмы и лаборатория в ЭТОМ посте (строка «АНГАР» во входе, у вещей — id). Только то, что правда случилось в посте; ничего — {}. Пустые поля не пиши.
{"fire":[{"id":"","n":1}],"reload":[""],"draw":[""],"holster":[""],"give":[{"id":"","to":""}],"take":[{"id":"","who":""}],"drop":[{"id":"","where":""}],"dirty":[""],"clean":[""],"jam":[""],"break":[""],"use":[{"id":"","n":1}],"veh":[{"id":"","fuel":0,"dmg":{},"where":"","driver":"","burn":0}],"suit":[{"id":"","dmg":{},"worn":true,"where":"","st":""}],"lab":[{"id":"","note":""}],"newlab":"","seen":[{"kind":"","name":"","who":""}]}
fire — выстрелы из ствола (id из списка): «выстрелил» — 1, «дважды» — 2, «очередь» — 5–10, «опустошил магазин» — сколько там было; брошенная граната или выстрел из гаджета — тоже fire. reload — перезарядил. draw / holster — достал / убрал. give — отдал кому; take — взял, подобрал; drop — бросил, потерял, отобрали (where — где осталось). dirty — ствол в грязи, воде, песке; clean — почистил; jam — заклинило по тексту; break — сломалось. use — гаджет потратил заряды (n). veh — машина, мотоцикл, катер, джет, корабль: fuel — сколько бака ушло, отрицательное число в % (по городу −3…−8, за город −15…−30, полёт −10…−40), dmg — урон по зонам 0–100 (перед, зад, left, right, roof, glass, tires, engine; у корабля hull, engines, warp, life, shields, systems), where — где теперь стоит, driver — кто за рулём, burn — засветка +10…+40 (камеры, погоня, номера видели). suit — костюм: dmg по зонам (head, torso, arms, legs, systems), worn true/false — надели/сняли, where — где лежит, st — intact|damaged|repair|lost. lab — по каким проектам работали (id), note 4–12 слов. newlab — название нового изобретения, если его начали. seen — оружие, гаджеты, броня или техника, которых НЕТ в списке, но они появились у кого-то в посте: kind (pistol|revolver|smg|rifle|sniper|shotgun|knife|melee|throw|explosive|nonlethal|gadget|armor|car|bike|truck|boat|jet|ship), name — как в тексте, who — у кого.`;

const VEH_RE = /машин|тачк|авто|руль|рулём|газ[уа]?\b|тормоз|мотоцикл|байк|джип|фургон|грузовик|катер|лодк|джет|квинджет|корабл|скиталец|скитальц|бак\b|бензин|заправ|гараж|парковк|колес|шин[аыу]|фар[аыу]|car|bike|jet|ship/i;
const SUIT_RE = /костюм|броня|бронекостюм|маск[аеуи]|шлем|скафандр|снаряжени|экипировк|солярис|suit|armou?r|helmet/i;
const LAB_RE = /лаборатор|лаб[аеуы]\b|прототип|изобрет|чертёж|чертеж|паяльн|схем[аеуы]|опыт|эксперимент|разработк|мастерск|прибор|верстак|lab\b/i;
export function chronHook(i = lastIndex()) {
    const c = cfg();
    if (!c.on || !c.chron || !hasChat()) return null;
    const W = world();
    const here = inScene();
    const text = plain(chat()[i]?.mes || '');
    const recent = (s) => s?.last != null && s.last >= lastIndex() - 6;
    const lines = [];
    const items = M().items.filter(it => {
        const s = W.items.get(it.id);
        if (!s || ['lost', 'broken'].includes(s.state) || it.kind === 'ammo' || it.kind === 'legend') return false;
        return s.hands || (!s.where && here.some(n => same(n, s.holder))) || (s.last != null && s.last >= lastIndex() - 6);
    }).slice(0, 16);
    if (items.length) lines.push(`вещи — ${items.map(it => { const s = W.items.get(it.id); return `${it.id} ${short(s.holder || it.owner) || '—'}: ${it.name}${D.isGun(it.kind) && it.cap ? ` [${s.inMag}/${it.cap}]` : it.gadget?.max ? ` [${s.charges} зар.]` : ''}${s.hands ? ' (в руках)' : ''}`; }).join('; ')}`);
    const k = clock();
    const l = norm(k.loc);
    const vehWords = VEH_RE.test(text);
    const veh = M().vehicles.filter(v => { const s = W.veh.get(v.id); if (!s || s.state === 'lost') return false; return (s.driver && here.some(n => same(n, s.driver))) || recent(s) || (l && s.where && (l.includes(norm(s.where)) || norm(s.where).includes(l))) || (vehWords && here.some(n => same(n, v.owner))) || norm(text).includes(norm(v.name).replace(/[«»]/g, '')); }).slice(0, 5);
    if (veh.length) lines.push(`техника — ${veh.map(v => `${v.id} ${v.name} (${short(v.owner) || '—'}, бак ${W.veh.get(v.id).fuel}%)`).join('; ')}`);
    const suitWords = SUIT_RE.test(text);
    const suits = M().suits.filter(s => { const d = W.suits.get(s.id); return here.some(n => same(n, s.who)) && (d?.worn || recent(d) || suitWords); }).slice(0, 5);
    if (suits.length) lines.push(`костюмы — ${suits.map(s => `${s.id} ${short(s.who)}: ${s.name}${W.suits.get(s.id)?.worn ? ' (надет)' : ''}`).join('; ')}`);
    const pl = LAB_RE.test(text) ? projectsNow().filter(p => !p.dead && (W.proj.get(p.id)?.stage ?? 0) < D.STAGES.length - 1).slice(0, 6) : [];
    if (pl.length) lines.push(`проекты лабы — ${pl.map(p => `${p.id} ${p.name} (${D.STAGES[W.proj.get(p.id)?.stage ?? 0]})`).join('; ')}`);
    return { key: '"ang": {}', rule: CHRON_RULE, input: `АНГАР: ${lines.join('. ') || 'в списке пусто — смотри только seen и newlab'}.`, tokens: 300 };
}

const ID_OK = (list) => (id) => list.some(x => x.id === id);
/** Ответ Летописца → записи поста (только с id, которые есть). */
export function normEvents(a) {
    if (!a || typeof a !== 'object') return [];
    const m = M();
    const isItem = ID_OK(m.items), isVeh = ID_OK(m.vehicles), isSuit = ID_OK(m.suits), isProj = ID_OK(m.projects);
    const out = [];
    const ids = (v) => arr(v).map(x => (typeof x === 'string' ? x : str(x?.id))).map(str).filter(Boolean);
    for (const x of arr(a.fire)) { const id = str(x?.id ?? x); if (isItem(id)) out.push({ t: 'fire', id, n: Math.max(1, Math.min(200, Math.round(num(x?.n, 1)))) }); }
    for (const t of ['reload', 'draw', 'holster', 'dirty', 'clean', 'jam', 'break']) for (const id of ids(a[t])) if (isItem(id)) out.push({ t, id });
    for (const x of arr(a.give)) { const id = str(x?.id); if (isItem(id) && str(x?.to)) out.push({ t: 'give', id, to: cut(str(x.to), 60) }); }
    for (const x of arr(a.take)) { const id = str(x?.id ?? x); if (isItem(id)) out.push({ t: 'take', id, who: cut(str(x?.who), 60) }); }
    for (const x of arr(a.drop)) { const id = str(x?.id ?? x); if (isItem(id)) out.push({ t: 'drop', id, where: cut(str(x?.where), 80) }); }
    for (const x of arr(a.use)) { const id = str(x?.id ?? x); if (isItem(id)) out.push({ t: 'use', id, n: Math.max(1, Math.min(50, Math.round(num(x?.n, 1)))) }); }
    for (const x of arr(a.veh)) {
        const id = str(x?.id); if (!isVeh(id)) continue;
        const dmg = {};
        for (const [z, v] of Object.entries(x?.dmg && typeof x.dmg === 'object' ? x.dmg : {})) { const n = clamp(v); if (n) dmg[str(z)] = n; }
        const e = { t: 'veh', id, fuel: Math.max(-100, Math.min(100, Math.round(num(x?.fuel, 0)))), dmg, where: cut(str(x?.where), 80), driver: cut(str(x?.driver), 60), burn: clamp(x?.burn ?? 0), state: str(x?.state) };
        if (e.fuel || Object.keys(dmg).length || e.where || e.driver || e.burn || e.state) out.push(e);
    }
    for (const x of arr(a.suit)) {
        const id = str(x?.id); if (!isSuit(id)) continue;
        const dmg = {};
        for (const [z, v] of Object.entries(x?.dmg && typeof x.dmg === 'object' ? x.dmg : {})) { const n = clamp(v); if (n) dmg[str(z)] = n; }
        const e = { t: 'suit', id, dmg, where: cut(str(x?.where), 80), st: D.SUIT_ST[str(x?.st)] ? str(x.st) : '' };
        if (typeof x?.worn === 'boolean') e.worn = x.worn;
        if (Object.keys(dmg).length || e.where || e.st || typeof e.worn === 'boolean') out.push(e);
    }
    for (const x of arr(a.lab)) { const id = str(x?.id ?? x); if (isProj(id)) out.push({ t: 'lab', id, note: cut(str(x?.note), 120) }); }
    if (str(a.newlab)) out.push({ t: 'newlab', name: cut(str(a.newlab), 90) });
    for (const x of arr(a.seen)) { if (str(x?.name)) out.push({ t: 'seen', kind: cut(str(x.kind), 20), name: cut(str(x.name), 80), who: cut(str(x.who), 60) }); }
    return out.slice(0, 60);
}

/** После Летописца: запись поста, тосты, прототипы. Возвращает строки для тоста. */
export function afterPost(i, j, msg) {
    if (!cfg().on) return [];
    const c = chat();
    const m = msg || c[i];
    if (!m) return [];
    const ev = normEvents(j?.ang);
    const key = keyOf(m);
    const store = M().posts;
    if (ev.length) store[key] = { i, ev, at: Date.now() };
    else if (store[key]) delete store[key];
    trimPosts();
    touch();
    const out = [];
    const W = world();
    for (const e of ev) {
        const it = e.id ? itemById(e.id) : null;
        const s = it ? W.items.get(it.id) : null;
        if (e.t === 'fire' && it && s && D.isGun(it.kind) && it.cap) out.push(s.inMag <= 0 ? `${short(s.holder)}: ${it.name} пуст` : `${short(s.holder)} · ${it.name}: ${s.inMag}/${it.cap}`);
        if (e.t === 'reload' && it && s && (s.noMag || s.noAmmo)) out.push(`${short(s.holder)}: перезаряжать ${it.name} нечем`);
        if (e.t === 'drop' && it) out.push(`${it.name} остался: ${e.where || 'на месте'}`);
        if (e.t === 'use' && it?.gadget?.proto) {
            const r = protoTest(it);
            if (r.out !== 'ok') arm('proto', `[Ангар · прототип «${it.name}»: в прошлый раз он ${r.text}. Если им пользуются снова — так же; это железо, а не каприз.]`, { key: it.id });
        }
    }
    const seen = ev.filter(e => e.t === 'seen' && !isKnown(e));
    if (seen.length) out.push(`Новое в посте: ${seen.slice(0, 3).map(e => e.name).join(', ')} — можно добавить в Ангаре`);
    const nl = ev.find(e => e.t === 'newlab');
    if (nl && !M().projects.some(p => norm(p.name) === norm(nl.name))) out.push(`Новое изобретение: ${nl.name} — в лабе`);
    return out;
}
function trimPosts() {
    const store = M().posts;
    const keys = Object.keys(store);
    if (keys.length < 500) return;
    const live = new Set(chat().map(keyOf));
    const dead = keys.filter(k => !live.has(k)).sort((a, b) => (store[a].at || 0) - (store[b].at || 0));
    for (const k of dead.slice(0, Math.max(0, keys.length - 400))) delete store[k];
}
/** Предложения из постов: «появилось, а в Ангаре нет». */
export function isKnown(e) {
    const n = norm(e.name);
    if (M().hide.includes(n)) return true;
    return [...M().items, ...M().vehicles].some(x => norm(x.name) === n || (n.length > 4 && (norm(x.name).includes(n) || n.includes(norm(x.name)))));
}
export function suggestions() {
    const W = world();
    const out = [];
    for (const e of W.seen) if (!isKnown(e) && !out.some(x => norm(x.name) === norm(e.name))) out.push(e);
    for (const e of W.newlab) if (!M().projects.some(p => norm(p.name) === norm(e.name)) && !M().hide.includes(norm(e.name)) && !out.some(x => norm(x.name) === norm(e.name))) out.push({ ...e, kind: 'lab' });
    return out.slice(-12).reverse();
}
export function hideSuggestion(name) { const m = M(); m.hide = [...new Set([...m.hide, norm(name)])].slice(-200); touch(); }

// ───────────── деньги: банк Телефона (Phone-ST) ─────────────

let bankMod = null;
export async function bank() {
    if (bankMod !== null) return bankMod;
    try { const b = await import('/scripts/extensions/third-party/Phone-ST/bank.js'); bankMod = typeof b.getBank === 'function' ? b : false; } catch { bankMod = false; }
    return bankMod;
}
export function balance() {
    if (!bankMod) return null;
    try { const bk = bankMod.getBank(); return { v: num(bk.balance), text: bankMod.fmtMoney(bk.balance) }; } catch { return null; }
}
export function money(n) { try { return bankMod?.fmtMoney ? bankMod.fmtMoney(n) : `$${Math.round(n).toLocaleString('ru-RU')}`; } catch { return `$${n}`; } }
export const priceNum = (p) => { const s = String(p ?? '').replace(/\s/g, '').replace(',', '.'); const m = s.match(/-?\d+(\.\d+)?/); if (!m) return 0; let v = Number(m[0]); if (/k|тыс/i.test(s)) v *= 1000; if (/m|млн/i.test(s)) v *= 1e6; return Math.round(v); };
export async function pay(amount, label, category = 'оружие') {
    const b = await bank();
    if (!b || !(amount > 0)) return { ok: false, why: b ? '' : 'банк Телефона не найден — без списания' };
    try {
        const bal = num(b.getBank().balance);
        if (bal < amount) return { ok: false, why: `на счету ${b.fmtMoney(bal)} — не хватает` };
        b.addTransaction({ amount: -amount, label: cut(label, 80), category });
        return { ok: true };
    } catch (e) { return { ok: false, why: String(e?.message || e) }; }
}

// ───────────── запросы к умной модели ─────────────

async function askJson(system, user, tokens, what, check, story = null) {
    const msgs = [{ role: 'system', content: system }, { role: 'user', content: user }];
    const o = { what: `Ангар: ${what}`, check };
    if (story && A?.askFillJson && cfg().model === 'deep') return A.askFillJson(msgs, tokens, o, story);
    if (cfg().model === 'deep' && A?.askDeepJson) return A.askDeepJson(msgs, tokens, o);
    if (A?.askJson) return A.askJson(msgs, tokens, o);
    throw new Error('Нужен Life: Ангар говорит через его модели (Мир → ⚙)');
}
const ERA_LINE = () => {
    const e = era();
    const k = clock();
    return `Эпоха: ${e.name} (${e.title}), дата истории: ${[k.date || storyDay(), k.time].filter(Boolean).join(', ') || 'неизвестна'}${k.loc ? `, место: ${k.loc}` : ''}.`;
};
const STYLE = 'Мир — ролевая God Complex (AU по MCU), по-русски. Держи канон и эпоху: никаких анахронизмов (в 1940-х — оружие 1940-х, в 2014 — 2014-го). Цены — в долларах США эпохи. Характеристики — честные, как у настоящих образцов; без инструкций по изготовлению и переделке.';
const ITEM_SCHEMA = '{"kind":"pistol|revolver|smg|rifle|sniper|shotgun|heavy|knife|melee|throw|explosive|nonlethal|gadget|armor|legend|disguise|ammo|gear|other","name":"короткое имя","model":"реальная модель или «своя разработка»","caliber":"","cap":0,"feed":"mag|cyl|tube|clip|single|belt|charge|none","mags":2,"ammo":"fmj|hp|sub|ap|tracer|rubber|tranq|emp|shock|vib","stats":{"dmg":3,"acc":3,"range":3,"conceal":3,"noise":3,"reliab":4,"weight":"0,7 кг","eff":"50 м","rate":"полуавтомат"},"price":0,"desc":"2–4 предложения: что это, каково в руке, где хорошо и чем плохо","mods":[],"slot":"","qty":1,"gadget":{"does":"","max":3,"recharge":"","side":"","limit":"","reliab":4,"proto":false},"armor":{"level":3,"covers":""},"legend":{"alias":"","nation":"","docs":"","cover":""}}';

/** Магазин: ассортимент от умной модели. forWho — витрина под человека: по его досье (стиль боя, навыки, характер). */
const shopKey = (shop, cat, forWho = '') => `${era().id}:${shop.id}:${cat}${forWho ? `:${norm(canon(forWho))}` : ''}`;
export async function shopGen(shop, cat, ask = '', more = false, forWho = '') {
    const e = era();
    const key = shopKey(shop, cat, forWho);
    const fw = forWho ? canon(forWho) : '';
    const dos = fw ? dossierOf(fw) : null;
    let about = '';
    if (fw && !dos) { try { about = cut(str(A?.lore?.card?.(fw, 1400)), 1400); } catch { /* */ } }
    const fit = fw ? ',"fit":"одна фраза: чем подойдёт именно ему (или чем не подойдёт)"' : '';
    const m = M();
    const have = m.shop[key]?.list || [];
    const n = Math.max(4, Math.min(16, num(cfg().shopN, 10)));
    const catTxt = cat === 'all' ? 'всего понемногу: пистолеты, длинноствольное, ножи, нелетальное, броня, шпионские гаджеты, патроны' : (D.SHOP_CATS.find(c => c[0] === cat)?.[1] || cat);
    const isVeh = cat === 'vehicle';
    const sys = isVeh ? `Ты — ${shop.name}: продавец техники в ролевой истории. ${shop.desc} ${STYLE}
Собери предложение: ${Math.min(n, 8)} позиций — машины, мотоциклы, фургоны${['aim', 'ship', 'shield'].includes(e.id) ? ', катера, может быть джет' : ''}. Честные характеристики и описание живым языком: что за машина, как едет, чем хороша для шпиона и чем плоха.${shop.id === 'black' ? ' Чёрный рынок: перебитые номера, тёмное прошлое — в описании.' : ''}
Ответ — только JSON: {"items":[{"kind":"car|bike|truck|boat|jet","name":"","model":"","color":"","price":0,"desc":"2–4 предложения","fuelType":"gas|diesel|charge|jet","stats":{"speed":3,"handling":3,"armor":1,"seats":5,"range":600},"mods":[]${fit}}]}` : `Ты — ${shop.name}: продавец в ролевой истории. ${shop.desc} ${STYLE}
Собери ассортимент: ${n} позиций, раздел — ${catTxt}. У каждой — честная характеристика и описание живым языком, как у хорошего продавца: что это, каково в руке, для чего и чем плохо. Разные ценовые уровни, есть что-то неожиданное.${shop.id === 'black' ? ' Чёрный рынок: у части товара тёмное прошлое — номера спилены, «засветилось» где-то; это в описании.' : ''}${shop.pay !== 'money' ? ' Тут не платят деньгами — price ставь 0, а в desc скажи, чего это будет стоить (подпись, услуга, вопрос Джека).' : ''}
Ответ — только JSON: {"items":[${fit ? ITEM_SCHEMA.replace(/\}$/, `${fit}}`) : ITEM_SCHEMA}]}. Пустые поля не пиши. Для ammo: caliber, qty (сколько патронов в упаковке), price за упаковку.`;
    if (isVeh) { /* схема техники уже в sys */ }
    const forLine = fw ? `\nВитрина под одного покупателя: ${fw}. ${dos ? `Его досье: ${dossierLine(dos)}.` : `О нём: ${about || 'карточки нет — по канону и истории'}.`}\nПодбери под его стиль боя, навыки, тело и характер — не шаблон «для агента»; того, что у него уже есть, не предлагай (${ownedLine(fw) || 'ничего нет'}).` : '';
    const usr = `${ERA_LINE()}\nКто покупает: ${fw || cast().join(', ')}.${forLine}${ask ? `\nПросьба покупателя: ${ask}` : ''}${more && have.length ? `\nУже на витрине (не повторяй): ${have.map(x => x.name).join(', ')}` : ''}`;
    const j = await askJson(sys, usr, 4200, 'магазин', (x) => Array.isArray(x?.items) && x.items.length);
    const list = arr(j.items).filter(x => str(x?.name)).slice(0, 16).map(x => ({ ...x, fit: cut(str(x.fit), 200), _id: uid(), _veh: isVeh, _for: fw }));
    m.shop[key] = { at: Date.now(), list: more ? [...have, ...list] : list, ask, for: fw };
    touch();
    return m.shop[key].list;
}
export const shopList = (shop, cat, forWho = '') => M().shop[shopKey(shop, cat, forWho)]?.list || [];
export async function buy(shop, x, owner) {
    const why = x.fit && same(x._for, owner) ? x.fit : '';
    if (x._veh) {
        const v = normVeh({ ...x, why }, { owner, src: 'shop' });
        if (!v.base.where) v.base.where = shop.id === 'aim' ? 'гараж А.И.М.' : 'гараж';
        const price = priceNum(x.price);
        let paid = D.PAY_WORD[shop.pay] || '';
        if (shop.pay === 'money' && price > 0) {
            const r = await pay(price, `${shop.name}: ${v.name}`, 'транспорт');
            if (!r.ok && r.why && !/не найден/.test(r.why)) throw new Error(r.why);
            paid = r.ok ? `−${money(price)}` : r.why;
        }
        addVeh(v);
        logFeed(`${shop.name}: ${v.name} → ${short(owner)}${paid ? ` (${paid})` : ''}`, 'shop');
        return { it: v, paid, veh: true };
    }
    const it = normItem({ ...x, why }, { owner, src: 'shop', from: shop.name });
    if (!it.where) { it.where = shop.pay === 'req' && /А\.И\.М|Щ\.И\.Т|Гидр|С\.Н\.Р/.test(shop.name) ? `склад: ${shop.name.replace(/^(Склад|Арсенал|Квартирмейстер)\s*/i, '')}` : 'дома'; it.base.where = it.where; it.base.holder = owner; }
    const price = priceNum(x.price);
    let paid = '';
    if (shop.pay === 'money' && price > 0) {
        const r = await pay(price, `${shop.name}: ${it.name}`, 'оружие');
        if (!r.ok && r.why && !/не найден/.test(r.why)) throw new Error(r.why);
        paid = r.ok ? `−${money(price)}` : r.why;
    } else paid = D.PAY_WORD[shop.pay] || '';
    addItem(it);
    logFeed(`${shop.name}: ${it.name} → ${short(owner)}${paid ? ` (${paid})` : ''}`, 'shop');
    return { it, paid };
}

// ───────────── квартирмейстер: досье бойца и набор по логике ─────────────
// Набор собирается не из того, что уже мелькало, а из того, кто он: стиль боя, навыки, тело, характер, привычки.
// Сначала досье (одно на человека и эпоху; правится руками и держит все наборы в одной логике), потом набор
// под сценарий. Каждая вещь — с «почему ему»; что из истории — помечено, основа — логика.

const dosKey = (who) => `${norm(canon(who))}:${era().id}`;
export function dossierOf(who) { return M().dossier[dosKey(who)] || null; }
export function normDossier(p) {
    if (!p || typeof p !== 'object') return null;
    const list = (v, n, len) => arr(v).map(x => cut(str(x), len)).filter(Boolean).slice(0, n);
    const d = {
        style: cut(str(p.style), 280), role: cut(str(p.role), 60),
        skills: list(p.skills, 7, 50), weak: list(p.weak, 4, 100),
        temper: cut(str(p.temper), 280), rules: list(p.rules, 4, 150),
    };
    return d.style || d.skills.length || d.temper ? d : null;
}
export function setDossier(who, patch, edited = false) {
    const cur = dossierOf(who) || {};
    const d = normDossier({ ...cur, ...patch });
    const m = M();
    if (!d) { delete m.dossier[dosKey(who)]; touch(); return null; }
    m.dossier[dosKey(who)] = { ...d, who: canon(who), era: era().id, at: storyDay() || '', edited: !!(edited || cur.edited) };
    touch();
    return m.dossier[dosKey(who)];
}
export function dropDossier(who) { delete M().dossier[dosKey(who)]; touch(); }
export const dossierLine = (d) => (d ? [
    d.role && `роль: ${d.role}`, d.style && `стиль боя: ${d.style}`, d.skills?.length && `навыки: ${d.skills.join(', ')}`,
    d.weak?.length && `слабые места: ${d.weak.join('; ')}`, d.temper && `характер в снаряжении: ${d.temper}`, d.rules?.length && `его правила: ${d.rules.join('; ')}`,
].filter(Boolean).join('. ') : '');

/** Способности из Life (Персонаж → способности с пределами). */
export function powersOf(who) {
    try {
        const by = A?.chatMeta?.()?.powers?.by || {};
        const k = Object.keys(by).find(n => same(n, who));
        return k ? arr(by[k]).filter(x => x && str(x.name)) : [];
    } catch { return []; }
}
function heroOf(who) {
    try { const list = A?.settings?.()?.hero?.list || {}; const k = Object.keys(list).find(n => same(n, who)); return k ? list[k] : null; } catch { return null; }
}
const SKILL_RE = /оруж|бо[йюяеё]|драк|стрел|снайпер|винтов|пистолет|револьвер|автомат|нож|клин[оу]к|лезви|рукопаш|единоборств|тренир|навык|умеет|умени|спецназ|агент|шпион|разведк|убий|убийц|киллер|наёмн|наемн|солдат|сержант|арми|войн|фронт|бионик|протез|сыворот|способн|мутант|энерги|боев|тактик|мисси|задани|операци|прикрыти|легенд|маскир|взрыв|гранат|брон|костюм|гаджет|изобрет|пилот|вожд|паранои|параноик|кошмар|триггер|охран|тайник|привычк|травм|страх|тревог|бдительн|контрол|защит|weapon|sniper|knife|fight|combat|assassin|soldier|spy|agent|skill|arm\b/i;

/** Материалы на досье: карточка, ядро характера, способности, лор о бое и навыках, герой. */
export async function dossierText(who) {
    const name = canon(who);
    const parts = [];
    try { const t = A?.lore?.card?.(name, 3500); if (str(t)) parts.push(`## Карточка\n${t}`); } catch { /* */ }
    try { const t = A?.lore?.core?.(name); if (str(t)) parts.push(`## Ядро характера\n${cut(t, 1600)}`); } catch { /* */ }
    const pw = powersOf(name);
    if (pw.length) parts.push(`## Способности (с пределами)\n${pw.slice(0, 10).map(x => `- ${str(x.name)}${x.can ? `: ${str(x.can)}` : ''}${x.limit ? `; предел: ${str(x.limit)}` : ''}${x.cost ? `; цена: ${str(x.cost)}` : ''}`).join('\n')}`);
    if (!(cfg().model === 'deep' && A?.askFillJson)) {   // в умном запросе свод о нём придёт сам
        try {
            const p = A?.story?.person?.(name);
            if (p) {
                const bits = [p.who, p.arc, ...[['черты', p.traits], ['привычки', p.habits], ['страхи', p.fears], ['раны', p.wounds]].filter(([, v]) => arr(v).length).map(([l, v]) => `${l}: ${arr(v).join(', ')}`), p.now && `сейчас: ${p.now}`];
                parts.push(`## Свод истории о нём\n${bits.filter(Boolean).join('\n')}`);
            }
        } catch { /* */ }
    }
    try { const t = await A?.lore?.about?.(name, { re: SKILL_RE, max: 7000 }); if (str(t)) parts.push(`## Лор о нём: бой, навыки, привычки\n${t}`); } catch { /* */ }
    const h = heroOf(name);
    if (h && (h.alias || h.suitLook)) parts.push(`## Герой\n${[h.alias && `имя героя: ${h.alias}`, h.suitLook && `костюм: ${cut(h.suitLook, 300)}`].filter(Boolean).join('; ')}`);
    return parts.join('\n\n');
}
/** Тело сейчас: раны, действующие вещества, беременность — то, что режет снаряжение. */
export async function bodyNow(who) {
    const out = [];
    try { const h = A?.senses?.hurt?.(who); if (num(h?.lvl) >= 1) out.push(`ранен: тяжесть ${h.lvl} из 4${num(h.n) > 1 ? `, ран ${h.n}` : ''}`); } catch { /* */ }
    try { const fx = arr(A?.senses?.fx?.(who)); if (fx.length) out.push(`действует: ${fx.map(x => str(x?.what)).filter(Boolean).join(', ')}`); } catch { /* */ }
    if (same(who, userName())) { await loadZ(); const z = pregnant(); if (z) out.push(`беременна, ${z.text} — без отдачи в живот, тяжёлого, бега и прыжков${z.week >= 20 ? '; ремни и броня на живот не садятся' : ''}`); }
    return out.join('; ');
}
function sceneText(scen) {
    const k = clock();
    const lines = [`Место: ${k.loc || 'неизвестно'}${k.cast.length ? `; в сцене: ${k.cast.join(', ')}` : ''}.`];
    if (scen === 'now') {
        const c = chat();
        const posts = [];
        for (let i = c.length - 1; i >= 0 && posts.length < 3; i--) {
            const m = c[i];
            if (!m || m.extra?.type === 'comment') continue;
            posts.unshift(`[#${i}] ${m.name}: ${cut(plain(m.mes), 900)}`);
        }
        if (posts.length) lines.push(`Последние посты:\n${posts.join('\n\n')}`);
    }
    return lines.join('\n');
}
const ownedLine = (who) => {
    const W = world();
    const it = M().items.filter(x => same(x.owner, who)).map(x => { const s = W.items.get(x.id) || {}; return `${x.name}${s.where ? ` (${s.where})` : s.slot ? ` (${D.slotById(s.slot)?.short || 'при себе'})` : ''}`; });
    const vs = M().vehicles.filter(x => same(x.owner, who)).map(x => x.name);
    const ss = M().suits.filter(x => same(x.who, who)).map(x => `костюм «${x.name}»`);
    return [...it, ...vs, ...ss].slice(0, 40).join(', ');
};
const SRC_WORD = { logic: 'логика', story: 'из истории' };
const KIT_EXTRA = '"why":"почему именно ему — одной фразой, через его навык, тело, характер или привычку","src":"logic|story"';
function normKitList(list, n) {
    return arr(list).filter(x => x && str(x.name)).slice(0, n).map(x => ({
        ...x, name: cut(str(x.name), 80), why: cut(str(x.why), 240), src: x.src === 'story' ? 'story' : 'logic',
        slot: D.slotById(str(x.slot)) ? str(x.slot) : '', where: cut(str(x.where), 80),
    }));
}

/** Набор от квартирмейстера: досье бойца → набор под сценарий. fresh — досье заново; alt — другой вариант. */
export async function kitGen(who, { scen = 'now', ask = '', fresh = false, alt = null } = {}) {
    who = canon(who);
    const S = D.kitScen(scen);
    const dos = fresh ? null : dossierOf(who);
    const e = era();
    const lab = projectsNow().filter(p => !p.dead && projStage(p) >= D.STAGES.length - 1 && ['gadget', 'weapon', 'ammo', 'armor', 'med', 'other'].includes(p.out)).map(p => p.name);
    const max = S.id === 'war' ? 14 : S.id === 'cover' ? 9 : 12;
    const sys = `Ты — квартирмейстер и инструктор ролевой истории God Complex (шпионы, агенты, герои). Собери набор персонажа «${who}» — НЕ список того, что уже мелькало в истории, а то, что такой человек с его стилем боя, навыками, телом, характером и привычками реально взял бы ${S.ask}.
Сначала досье бойца. Если досье дано — держись его, не переписывай; если нет — составь по материалам: стиль боя (как он дерётся и убивает или как избегает драки), роль, сильные навыки, слабые места и ограничения, характер в снаряжении (как характер решает, что и как он носит: паранойя — второй нож в ботинке и ствол в каждой комнате; сентиментальность — старый ствол, который давно пора сменить; брезгует шумом — глушитель и нож), его личные правила ношения.
Потом набор. Правила:
— Каждая вещь вытекает из досье: в why — почему именно ему, одной фразой. Никаких «на всякий случай» и шаблонного «как у всех агентов».
— Основа — логика (src:"logic"). Канонное и любимое из истории можно (src:"story"), но логических больше половины.
— Реализм ремесла: что прячется под одеждой эпохи и сезона, что звенит на рамке и светится на досмотре, что выдаёт легенду; вес и сколько рук свободно; патронов — разумно, под его стволы.
— Изобретения Хеди — только настоящие, из её лаборатории (список ниже); новых не выдумывай — для нового есть лаба.
— Учитывай тело: раны, беременность, бионику, сыворотку, силы — что они дают и что запрещают.
— Не больше ${max} вещей; техника и костюмы — только если сценарий их правда требует (не больше 2 и 2).
${STYLE}
Ответ — только JSON: {"profile":{"style":"1–2 предложения","role":"2–4 слова","skills":["до 7 коротких"],"weak":["до 4"],"temper":"1–2 предложения","rules":["до 4 коротких"]},"items":[${ITEM_SCHEMA.replace(/\}$/, `,${KIT_EXTRA}}`)}],"vehicles":[{"kind":"car|bike|truck|boat|jet|ship","name":"","model":"","color":"","plate":"","desc":"","stats":{"speed":3,"handling":3,"armor":1,"seats":5,"range":600},"where":"",${KIT_EXTRA}}],"suits":[{"name":"","kind":"hero|tactical|armor|uniform|stealth|space","look":"как выглядит, для картинок, 1–3 предложения","note":"","systems":[],"armor":3,${KIT_EXTRA}}],"why":"одно предложение: логика набора в целом"}.
У каждой вещи slot — куда на теле: ${D.SLOTS.map(s => s.id).join('|')}; "" — не на теле, тогда where: где лежит (дома, в машине, тайник, сейф).`;
    const body = await bodyNow(who);
    const usr = [
        ERA_LINE(),
        `Персонаж: ${who}. Сценарий: «${S.name}» — ${S.ask}.${str(ask) ? `\nУточнение: ${cut(str(ask), 300)}` : ''}`,
        dos ? `Досье (уже собрано${dos.edited ? ', поправлено руками' : ''} — держись его, profile верни таким же): ${dossierLine(dos)}.` : 'Досье ещё нет — составь его по материалам ниже.',
        body ? `Тело сейчас: ${body}.` : '',
        `Уже есть у него в Ангаре (это его вещи; не повторяй, но опирайся — патроны под его стволы, ножны под его нож): ${ownedLine(who) || 'ничего'}.`,
        lab.length ? `Готовые изобретения из лаборатории Хеди (можно выдать): ${lab.join(', ')}.` : '',
        alt?.length ? `Предыдущий вариант набора был: ${alt.join(', ')}. Дай ДРУГОЙ вариант по тому же досье — другой подход к сценарию, не повторяя этих вещей.` : '',
        `## Сцена\n${sceneText(S.id)}`,
        `## Материалы на досье\n${await dossierText(who) || 'карточки и лора о нём не нашлось — опирайся на свод истории и канон MCU'}`,
    ].filter(Boolean).join('\n');
    const j = await askJson(sys, usr, 6400, `квартирмейстер: ${short(who)}`, (x) => x && Array.isArray(x.items) && x.items.length, { who, world: true, pairs: false });
    if (!dos) setDossier(who, normDossier(j.profile) || {});
    const res = {
        who, scen: S.id, era: e.id, at: Date.now(), ask: cut(str(ask), 300), why: cut(str(j.why), 300),
        items: normKitList(j.items, max), vehicles: normKitList(j.vehicles, 2), suits: normKitList(j.suits, 2),
    };
    M().kits[norm(who)] = res;
    touch();
    return res;
}
export const lastKit = (who) => { const k = M().kits[norm(canon(who))]; return k && k.era === era().id ? k : null; };
export const srcWord = (s) => SRC_WORD[s] || SRC_WORD.logic;

/** Из истории: что уже было в чате и лоре — оружие, техника, изобретения, костюмы. */
export async function fromStory(kind) {
    const what = {
        arm: 'оружие, ножи, гаджеты, броню, документы-легенды и патроны, которые были у персонажей в истории; у кого что; где лежит',
        gar: 'машины, мотоциклы, катера, джеты и корабли, которые были в истории: чьи, где стоят, в каком состоянии',
        lab: 'изобретения и разработки Хеди (и совместные), которые были в истории и лоре: что, когда (год её жизни), в каком состоянии; что взорвалось или брошено',
        suit: 'костюмы героев и тактическое снаряжение: чей, как выглядит, в каком состоянии, где лежит',
    }[kind];
    const have = {
        arm: M().items.map(x => x.name), gar: M().vehicles.map(x => x.name), lab: M().projects.map(x => x.name), suit: M().suits.map(x => `${x.who}: ${x.name}`),
    }[kind] || [];
    const schema = {
        arm: `{"items":[${ITEM_SCHEMA.replace('"kind"', '"owner":"чьё","where":"где лежит, если не при себе","kind"')}]}`,
        gar: '{"vehicles":[{"kind":"car|bike|truck|boat|jet|ship","name":"","model":"","color":"","plate":"","owner":"","where":"","desc":"","stats":{"speed":3,"handling":3,"armor":1,"seats":5,"range":600}}]}',
        lab: '{"projects":[{"name":"","field":"energy|bio|tech|weapon|cyber|chem|space|other","out":"gadget|weapon|ammo|mod|armor|suit|vehicle|med|soft|other","stage":4,"ty":2014,"note":"1–3 предложения: что и чем кончилось","team":[],"dead":false,"deadWhy":""}]}',
        suit: '{"suits":[{"who":"","name":"","kind":"hero|tactical|armor|uniform|stealth|space","look":"для картинок","note":"","where":"","systems":[],"armor":3}]}',
    }[kind];
    const sys = `Ты — архивист ролевой истории God Complex. Прочитай свод истории, лор и последние события и выпиши ${what}. Только то, что действительно есть в истории или лоре; не выдумывай. ${STYLE}
Ответ — только JSON: ${schema}. Не больше 20 позиций.`;
    const usr = `${ERA_LINE()}\nУже есть (не повторяй): ${have.join('; ') || 'ничего'}.\n\n${await historyText()}`;
    const check = (x) => x && (Array.isArray(x.items) || Array.isArray(x.vehicles) || Array.isArray(x.projects) || Array.isArray(x.suits));
    return askJson(sys, usr, 5200, `из истории (${kind})`, check, { world: true, pairs: false });
}

/** Свод для «из истории»: события Horae, лорбуки по теме, последние посты. */
const LORE_RE = /изобр|разработ|прототип|прибор|устройств|гаджет|костюм|броня|оружи|пистолет|винтовк|нож|корабл|скиталец|джет|квинджет|машин|мотоцикл|лаборатор|варп|сыворот|двигател/i;
async function historyText() {
    const parts = [];
    try {
        const ev = (A?.horaeEvents?.() || []).slice(-80).map(e => `${e.timestamp?.story_date || ''} — ${e.event?.summary || ''}`.trim()).filter(l => l.length > 6).join('\n');
        if (ev) parts.push(`## События (Horae)\n${cut(ev, 6000)}`);
    } catch { /* */ }
    try {
        const wi = await import('/scripts/world-info.js');
        const names = [...(wi.world_names || [])];
        const bits = [];
        let len = 0;
        for (const b of names) {
            let data = null;
            try { data = await (ctx().loadWorldInfo ? ctx().loadWorldInfo(b) : wi.loadWorldInfo(b)); } catch { /* */ }
            for (const e of Object.values(data?.entries || {})) {
                if (!e || e.disable || !str(e.content) || !LORE_RE.test(`${e.comment} ${e.content}`)) continue;
                const piece = `### ${b}: ${str(e.comment)}\n${cut(str(e.content), 1500)}`;
                if (len + piece.length > 12000) break;
                bits.push(piece); len += piece.length;
            }
            if (len > 12000) break;
        }
        if (bits.length) parts.push(`## Лор по теме\n${bits.join('\n\n')}`);
    } catch { /* */ }
    const c = chat();
    const posts = [];
    let pl = 0;
    for (let i = c.length - 1; i >= 0 && pl < 9000; i--) {
        const m = c[i];
        if (!m || m.extra?.type === 'comment') continue;
        const t = `[#${i}] ${m.name}: ${cut(plain(m.mes), 1200)}`;
        posts.unshift(t); pl += t.length;
    }
    if (posts.length) parts.push(`## Последние посты\n${posts.join('\n\n')}`);
    return parts.join('\n\n');
}

/** Кубик инсайтов: d20 → жанр → короткий брейншторм умной модели. p — проект (инсайт к нему), x — вещь/техника/костюм. */
export async function insights(roll, { p = null, x = null, ask = '' } = {}) {
    const g = D.insightOf(roll);
    const ps = projectsNow().filter(q => !q.dead).slice(0, 14).map(q => `${q.name} (${D.STAGES[projStage(q)]}, ${D.fieldName(q.field)})`);
    const mats = M().materials.slice(0, 10).map(m => `${m.name} ×${m.qty}`);
    const gear = [...M().items.filter(it => it.kind !== 'ammo').slice(0, 10).map(it => it.name), ...M().vehicles.slice(0, 4).map(v => v.name), ...M().suits.slice(0, 4).map(s => s.name)];
    const focus = p ? `Инсайт к проекту «${p.name}» (${D.fieldName(p.field)}, ${D.STAGES[projStage(p)]}): ${p.note || '—'}${blockedBy(p).length ? `; ждёт: ${blockedBy(p).map(q => q.name).join(', ')}` : ''}.` : x ? `Инсайт к «${x.name}»: что с ним можно сделать в лабе — мод, апгрейд, неожиданное применение.` : '';
    const sys = `Ты — внутренний голос Хеди Барлоу в лаборатории: гениальный инженер, мутант с трансмутацией энергии, дочь Тони Старка, директор А.И.М. Брейншторм: 4 идеи, каждая коротко — заголовок до 6 слов и 1–2 предложения сути, без воды и лекций. Жанр броска — «${g.name}»: ${g.ask}. Держи её лор, эпоху и то, что у неё реально есть; можно смешно. По-русски.
Ответ — только JSON: {"ideas":[{"title":"","text":"","field":"energy|bio|tech|weapon|cyber|chem|space|other","out":"gadget|weapon|ammo|mod|armor|suit|vehicle|med|soft|other"}]}`;
    const usr = `${ERA_LINE()}\n${focus}\nПроекты: ${ps.join('; ') || 'нет'}.\nМатериалы: ${mats.join(', ') || 'нет'}.\nЖелезо: ${gear.join(', ') || 'нет'}.${ask ? `\nОна думает о: ${ask}` : ''}`;
    const j = await askJson(sys, usr, 1800, 'инсайт', (y) => Array.isArray(y?.ideas) && y.ideas.length);
    const ideas = arr(j.ideas).filter(y => str(y?.title) || str(y?.text)).slice(0, 5).map(y => ({ id: uid(), title: cut(str(y.title), 60), text: cut(str(y.text), 260), field: str(y.field), out: str(y.out) }));
    const m = M();
    m.insights.unshift({ id: uid(), at: clock().date || storyDay(), roll, kind: g.id, for: p?.name || x?.name || '', ideas });
    m.insights = m.insights.slice(0, 30);
    touch();
    return { g, ideas };
}

/** Заполнить вещь по названию: «Глок 19 с глушителем» → характеристика и описание. */
export async function describe(it) {
    const sys = `Ты — оружейник ролевой истории. По названию и тому, что уже заполнено, дай честную характеристику и описание живым языком. ${STYLE}\nОтвет — только JSON: ${ITEM_SCHEMA}`;
    const usr = `${ERA_LINE()}\nВещь: ${it.name}${it.model ? ` (${it.model})` : ''}, вид: ${D.kindName(it.kind)}${it.owner ? `, чья: ${it.owner}` : ''}.${it.desc ? `\nУже написано: ${it.desc}` : ''}`;
    const j = await askJson(sys, usr, 1600, 'описание вещи', (x) => x && str(x.name));
    const n = normItem({ ...j, kind: D.KINDS.some(k => k[0] === str(j.kind)) ? j.kind : it.kind });
    for (const k of ['model', 'desc', 'caliber', 'feed', 'ammo', 'price']) if (!str(it[k]) && n[k]) it[k] = n[k];
    if (!it.cap && n.cap) { it.cap = n.cap; setDyn(it.id, { inMag: n.cap, mags: Array.from({ length: Math.max(1, (n.base.mags || []).length) }, () => n.cap) }); }
    it.stats = { ...n.stats, ...it.stats };
    if (n.gadget && !it.gadget) it.gadget = n.gadget;
    if (n.armor && !it.armor) it.armor = n.armor;
    if (!it.mods.length && n.mods.length) it.mods = n.mods;
    touch();
    return it;
}

// ───────────── картинки (через Life → Гардероб) ─────────────

export async function draw(kind, x) {
    if (!A?.drawPicture) throw new Error('Рисую через Life → Гардероб, а их нет. Можно загрузить свою картинку.');
    const e = era();
    const old = e.id === 'ssr';
    let prompt = '', aspect = '4:3', who = null;
    if (kind === 'item') prompt = `${old ? '1940s ' : ''}Product photo of ${x.model || x.name} (${D.kindName(x.kind)}${x.caliber ? `, ${x.caliber}` : ''})${x.mods?.length ? ` with ${x.mods.join(', ')}` : ''}, lying on a dark worn workbench, moody single side light, shallow depth of field, realistic metal and wear, ${old ? 'black-and-white wartime photograph, film grain' : 'cinematic, 35mm film look'}, no people, no text.`;
    else if (kind === 'veh') { prompt = `${old ? '1940s ' : ''}${x.color || ''} ${x.model || x.name} (${D.vkindOf(x.kind)[1]}) parked ${x.base?.where ? `at ${x.base.where}` : 'in a dim industrial hangar'}, three-quarter view, realistic, cinematic light, ${old ? 'wartime photograph, film grain' : '35mm film look'}, no people, no text, no license plate text.`; aspect = '16:9'; }
    else if (kind === 'suit') { prompt = `Full-body character sheet of ${short(x.who)} wearing ${x.name}: ${x.look || x.note}. Standing pose, front view, plain dark studio background, soft light, detailed materials, no text.`; aspect = '3:4'; who = [x.who]; }
    else if (kind === 'proj') { prompt = old ? `1940s engineering drawing on yellowed drafting paper: ${x.name}. ${x.note || ''} Pencil and ink linework, exploded view, measurement lines, paper texture, no readable text.` : `Holographic blueprint of ${x.name}. ${cut(x.note || x.spec || '', 220)} Glowing amber and white wireframe schematic over a dark graphite lab table, exploded view, fine technical linework, no readable text, no people.`; aspect = '16:9'; }
    const url = await A.drawPicture(prompt, { aspect, max: 1400, prefix: `angar_${kind}`, who });
    x.img = url;
    touch();
    return url;
}

// ───────────── старт чата: лор и переезд лабы Арта ─────────────

/** Изобретения, техника и костюмы из лора — раз на чат, по её году жизни. */
export function seed() {
    const m = M();
    if (m.seeded >= 1) return 0;
    let n = 0;
    const ty = hedyYear() + 0.001;
    const y = storyYear();
    const e = era();
    for (const inv of D.INVENTIONS) {
        if (inv.ty > ty || m.projects.some(p => p.key === inv.key)) continue;
        const p = normProject({ ...inv, stage: 4 }, { src: 'lore' });
        p.key = inv.key;
        p.base.at = -1;
        m.projects.push(p);
        n++;
    }
    for (const v of D.SEED_VEHICLES) {
        if (v.from > y + 0.01 || (v.to != null && v.to + 1 <= y) || m.vehicles.some(x => x.key === v.key)) continue;
        const x = normVeh({ ...v, where: v.whereBy?.[e.id] || v.where }, { src: 'lore' });
        x.key = v.key; x.base.at = -1; x.desc = v.desc;
        m.vehicles.push(x);
        n++;
    }
    const mainOf = new Set(m.suits.filter(x => x.main).map(x => norm(x.who)));
    for (const s of D.SEED_SUITS) {
        if ((s.era && s.era !== e.id) || (s.notEra || []).includes(e.id)) continue;
        const yy = s.who === 'Хеди' ? hedyYear() : y;
        if (s.from > yy + 0.01 || (s.to != null && s.to + 1 <= yy) || m.suits.some(x => x.key === s.key)) continue;
        const x = normSuit({ ...s, main: !mainOf.has(norm(s.who)), where: s.whereBy?.[e.id] || s.where }, { src: 'lore' });
        mainOf.add(norm(s.who));
        x.base.at = -1;
        m.suits.push(x);
        n++;
    }
    m.seeded = 1;
    if (n) logFeed(`Из лора: ${n} — изобретения, техника, костюмы`, 'sys');
    touch();
    return n;
}
/** Лаба Арта переезжает сюда (раз на чат). Арт дальше открывает эту лабу и не ведёт свою. */
export function migrateArtur() {
    try {
        const md = ctx().chatMetadata;
        const ar = md?.artur;
        if (!ar || !Array.isArray(ar.projects) || ar.labMoved) return 0;
        let n = 0;
        for (const p of ar.projects) {
            if (!p || M().projects.some(x => x.artur === p.id || norm(x.name) === norm(p.name))) continue;
            const q = normProject({ name: p.name, field: p.field, note: p.note, team: p.team, bans: p.bans, img: p.img, stage: p.stage, pct: p.pct, artur: p.id }, { src: 'artur' });
            q.log = arr(p.log).slice(0, 40).map(l => ({ t: str(l.t), kind: str(l.kind) || 'note', at: str(l.at), mes: l.mes }));
            q.created = str(p.created);
            M().projects.unshift(q);
            n++;
        }
        ar.labMoved = true;
        touch();
        if (n) logFeed(`Из лабы Арта переехало проектов: ${n}`, 'lab');
        return n;
    } catch (e) { console.warn('[Ангар] переезд лабы Арта', e); return 0; }
}

// ───────────── сводки для Life ─────────────

/** Короткая строка «кто чем вооружён» для Сцены Life и трекера. */
export function armedSummary() {
    const out = [];
    for (const who of inScene()) {
        const list = carried(who).filter(it => D.isGun(it.kind) || ['knife', 'gadget', 'nonlethal', 'throw'].includes(it.kind));
        if (!list.length) continue;
        out.push({ who, list: list.slice(0, 5).map(it => ({ it, line: ammoLine(it), empty: empty(it), jam: dyn(it.id)?.state === 'jammed', hands: dyn(it.id)?.hands })) });
    }
    return out;
}

// ───────────── тренировочный зал (3 этаж дома): спарринг ─────────────
// Кубик d20 + поправки (навык из досье, суперсолдат, наработанные тренировки, беременность), потолок ±6 — как у лабы.
// Тренировки копятся по человеку и приёму; на 5, 10 и 20 навык сам уходит в досье квартирмейстера.

export const SPAR_DRILLS = [
    ['box', 'Бокс', /бокс|удар|рукопаш|кулак/i], ['knife', 'Ножевой бой', /нож|клин|лезви/i], ['grap', 'Рукопашный', /рукопаш|захват|борьб|самбо|дзюдо|бросок/i],
    ['dodge', 'Уклонение', /уклон|ловк|скорост|реакц/i], ['arm', 'Против бионики', /бионик|железн|вибраниев|рук[аи]/i],
];
export const SPAR_LVL = [['light', 'Лёгкая'], ['norm', 'Обычная'], ['hard', 'Жёсткая']];
const drillOf = (id) => SPAR_DRILLS.find(d => d[0] === id) || SPAR_DRILLS[0];
export function trainOf(who) { const m = M(); if (!m.train || typeof m.train !== 'object') m.train = {}; const k = norm(canon(who)); return (m.train[k] ||= {}); }
export function sparMods(who, drill) {
    const [, , re] = drillOf(drill);
    const why = [];
    let mod = 0;
    const d = dossierOf(who);
    if (d?.skills?.some(x => re.test(x))) { mod += 3; why.push('навык из досье'); }
    if (/баки|bucky|барнс/i.test(who)) { mod += 3; why.push('суперсолдат'); }
    const n = trainOf(who)[drill] || 0;
    const t = Math.min(4, Math.floor(n / 5));
    if (t) { mod += t; why.push(`тренировки ×${n}`); }
    if (same(who, userName()) && pregnant()) { mod -= 2; why.push('беременность'); }
    return { mod: Math.max(-6, Math.min(6, mod)), why };
}
const SPAR_FLAV = [
    [0, 'Ничья: оба на матах, дышат как после марафона и смеются.'],
    [1, 'На волосок — победа скорее на упрямстве, чем на технике.'],
    [4, 'Уверенно: один раз открылся — и всё.'],
    [8, 'Чисто: проигравший даже не понял, откуда прилетело.'],
];
/** Раунд спарринга. a — тренер, b — ученик. При беременности — только лёгкий и без бросков. */
export function sparRound(a, b, drill = 'box', lvl = 'norm') {
    const preg = pregnant() && [a, b].some(n => same(n, userName()));
    let note = '';
    if (preg && (lvl !== 'light' || drill === 'grap')) { lvl = 'light'; if (drill === 'grap') drill = 'dodge'; note = 'беременность: только лёгкая, без бросков и ударов в корпус'; }
    const ma = sparMods(a, drill), mb = sparMods(b, drill);
    const ra = d20(), rb = d20();
    const sa = ra + ma.mod, sb = rb + mb.mod;
    const win = sa === sb ? '' : sa > sb ? a : b;
    const margin = Math.abs(sa - sb);
    let flav = SPAR_FLAV[0][1];
    for (const [k, t] of SPAR_FLAV) if (margin >= k) flav = t;
    const bruiseP = preg ? 0 : lvl === 'hard' ? 0.5 : lvl === 'norm' ? 0.2 : 0.04;
    const bruise = Math.random() < bruiseP ? (win ? (same(win, a) ? b : a) : b) : '';
    const grew = [];
    for (const w of [a, b]) {
        const t = trainOf(w);
        t[drill] = (t[drill] || 0) + 1;
        if ([5, 10, 20].includes(t[drill])) {
            const other = same(w, a) ? b : a;
            const label = `${drillOf(drill)[1].toLowerCase()} — ${t[drill]} тренировок${same(w, b) ? ` у ${short(other)}` : ''}`;
            const cur = dossierOf(w) || {};
            const skills = [...arr(cur.skills).filter(x => !norm(x).startsWith(norm(drillOf(drill)[1]))), label].slice(-7);
            setDossier(w, { ...cur, skills });
            grew.push(`${short(w)}: ${label}`);
        }
    }
    const r = { id: uid(), at: clock().date || storyDay(), a, b, drill, lvl, ra, rb, ma: ma.mod, mb: mb.mod, wa: ma.why, wb: mb.why, sa, sb, win, bruise, flav, note, grew };
    const m = M();
    m.spar = [r, ...arr(m.spar)].slice(0, 30);
    touch();
    return r;
}
export function sparScene(r) {
    const [, dn] = drillOf(r.drill);
    const lv = SPAR_LVL.find(x => x[0] === r.lvl)?.[1].toLowerCase() || '';
    arm('spar', `[Тренировочный зал (3 этаж): спарринг ${short(r.a)} × ${short(r.b)} — ${dn.toLowerCase()}, ${lv}. Исход решён кубиком: ${r.win ? `сильнее ${short(r.win)}` : 'ничья'} — ${r.flav}${r.bruise ? ` ${short(r.bruise)} заработал(а) синяк.` : ''}${r.note ? ` (${r.note})` : ''} Покажи это действиями, дыханием, подколками; цифр и кубиков не называй.]`, { key: 'spar' });
}

