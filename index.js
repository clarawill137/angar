// ✦ Ангар — транспорт, оружейная, лаба Хеди и костюмы. Живёт рядом с Life: через LifeBridge получает время Horae,
// Летописца (выстрелы, бензин, урон, работа в лабе — по постам), скрытую заметку модели, строку в «Сцене» и трекер.
// Лаба Арта открывается здесь (мост: globalThis.Angar).

import * as C from './core.js';
import * as U from './ui.js';

const ID = 'angar';
let api = null;

function register() {
    const B = globalThis.LifeBridge;
    if (!B?.register) return false;
    B.register({
        id: ID,
        init(a) { api = a; C.setApi(a); },
        prompt: (type) => C.promptNote(type),
        chron: (i) => C.chronHook(i),
        afterPost: (i, j, m) => {
            const t = C.afterPost(i, j, m);
            if (t.length) C.toast('info', t.slice(0, 4).map(C.esc).join(' · '));
            U.renderSoon();
        },
        sceneHtml: () => U.sceneHtml(),
        personRow: (who) => U.personRow(who),
    });
    try {
        api?.shelf?.tracker?.({
            id: 'angar', ico: '🔫', name: 'Боекомплект',
            hint: 'Что у кого с собой и сколько патронов — из Ангара. Счёт ведёт Летописец по постам; свайп и реролл не считаются дважды.',
            on: () => C.cfg().on && C.hasChat(), state: () => U.trackerState(), html: () => U.trackerHtml(), idle: 'В сцене никто не вооружён.',
        });
    } catch (e) { console.warn('[Ангар] трекер', e); }
    return true;
}

// ───────────── палочка, настройки, команда ─────────────

function addWand() {
    const menu = document.getElementById('extensionsMenu');
    if (!menu) return false;
    if (document.getElementById('ang-wand')) return true;
    const el = document.createElement('div');
    el.id = 'ang-wand';
    el.className = 'list-group-item flex-container flexGap5 interactable';
    el.tabIndex = 0;
    el.innerHTML = '<div class="fa-solid fa-warehouse extensionsMenuExtensionButton"></div><span>Ангар</span>';
    el.addEventListener('click', () => { try { $('#extensionsMenu').fadeOut(200); } catch { /* */ } U.open(); });
    menu.append(el);
    return true;
}

function settingsDrawer() {
    const host = document.getElementById('extensions_settings2') || document.getElementById('extensions_settings');
    if (!host || document.getElementById('ang-drawer')) return;
    const s = C.cfg();
    const opt = (v, cur, t) => `<option value="${v}" ${cur === v ? 'selected' : ''}>${t}</option>`;
    host.insertAdjacentHTML('beforeend', `
    <div id="ang-drawer" class="inline-drawer">
        <div class="inline-drawer-toggle inline-drawer-header"><b>✦ Ангар</b><div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div></div>
        <div class="inline-drawer-content">
            <label class="checkbox_label"><input type="checkbox" data-angc="on" ${s.on ? 'checked' : ''}> Включено</label>
            <label class="checkbox_label"><input type="checkbox" data-angc="chron" ${s.chron ? 'checked' : ''}> Летописец считает выстрелы, бензин, урон и лабу</label>
            <label class="checkbox_label"><input type="checkbox" data-angc="dice" ${s.dice ? 'checked' : ''}> Кубики сами: клин, отказ прототипа, занос</label>
            <label class="checkbox_label"><input type="checkbox" data-angc="syncHero" ${s.syncHero ? 'checked' : ''}> Основной костюм → Life → Герои (кадры)</label>
            <label class="checkbox_label"><input type="checkbox" data-angc="fx" ${s.fx ? 'checked' : ''}> Анимации</label>
            <label>Боекомплект модели <select data-angc="prompt">${opt('auto', s.prompt, 'когда есть что сказать')}${opt('always', s.prompt, 'всегда')}${opt('off', s.prompt, 'выкл')}</select></label>
            <label>Магазин, набор и инсайты <select data-angc="model">${opt('deep', s.model, 'умная модель Life')}${opt('chron', s.model, 'модель Летописца')}</select></label>
            <small>Палочка или пульт Life → «Ангар», команда <code>/angar</code> (arm · gar · lab · suit · shop). Нужен Life.</small>
            <div class="menu_button" id="ang_open" style="margin-top:6px">Открыть</div>
        </div>
    </div>`);
    host.querySelectorAll('[data-angc]').forEach(el => el.addEventListener('change', () => {
        const k = el.dataset.angc;
        C.cfg()[k] = el.type === 'checkbox' ? el.checked : el.value;
        C.saveCfg();
        try { api?.updatePrompt?.(); } catch { /* */ }
    }));
    document.getElementById('ang_open')?.addEventListener('click', () => U.open());
}

const HALLS = ['arm', 'gar', 'lab', 'suit', 'shop'];
function registerSlash() {
    try {
        const { SlashCommandParser, SlashCommand } = SillyTavern.getContext();
        SlashCommandParser.addCommandObject(SlashCommand.fromProps({
            name: 'angar',
            helpString: `Ангар: транспорт, оружейная, лаба, костюмы, магазин. Можно сразу зал: /angar ${HALLS.join('|')}`,
            returns: 'ничего',
            unnamedArgumentList: [],
            callback: (_a, v) => { const h = String(v || '').trim().toLowerCase(); U.open(HALLS.includes(h) ? h : null); return ''; },
        }));
    } catch (e) { console.warn('[Ангар] команда', e); }
}

// ───────────── мост для Арта и других ─────────────

globalThis.Angar = {
    version: C.VERSION,
    open: (hall, id) => U.open(hall, id),
    openLab: (id = null) => U.open('lab', id),
    hasLab: () => !!C.cfg().on && C.cfg().artur !== false,
    projects: () => { try { return C.projectsNow().map(p => ({ id: p.id, name: p.name, field: p.field, stage: C.projStage(p), pct: C.projPct(p), dead: !!p.dead })); } catch { return []; } },
};

/** Лаба Арта переезжает сюда, как только чат открыт (иначе обе лабы считали бы работу по постам). */
function armBridge() {
    try { if (C.cfg().on && C.cfg().artur !== false && C.hasChat() && Array.isArray(SillyTavern.getContext().chatMetadata?.artur?.projects)) C.migrateArtur(); } catch (e) { console.warn('[Ангар] мост Арта', e); }
}

jQuery(async () => {
    C.cfg();
    document.addEventListener('click', U.onClick, true);
    document.addEventListener('change', U.onChange);
    document.addEventListener('input', U.onInput);
    settingsDrawer();
    registerSlash();
    if (!addWand()) { let t = 0; const iv = setInterval(() => { if (addWand() || ++t > 40) clearInterval(iv); }, 500); }
    let tries = 0;
    const iv = setInterval(() => {
        if (register()) { clearInterval(iv); console.log('[Ангар] подключился к Life'); C.loadZ(); C.bank(); setTimeout(armBridge, 1500); return; }
        if (++tries > 120) { clearInterval(iv); window.toastr?.warning?.('Ангар живёт рядом с Life, а Life не найден или старый (нужен мост LifeBridge).', '✦ Ангар', { timeOut: 12000 }); }
    }, 500);
    try {
        const { eventSource, event_types: E } = SillyTavern.getContext();
        const refresh = () => { C.bump(); try { api?.updatePrompt?.(); } catch { /* */ } U.renderSoon(); };
        const onAi = (id, type) => {
            if (!api || type === 'impersonate') return;
            const i = Number(id);
            if (Number.isFinite(i)) C.spendShots(i);
            refresh();
        };
        if (E.CHARACTER_MESSAGE_RENDERED) eventSource.on(E.CHARACTER_MESSAGE_RENDERED, onAi);
        else if (E.MESSAGE_RECEIVED) eventSource.on(E.MESSAGE_RECEIVED, onAi);
        for (const ev of [E.MESSAGE_SWIPED, E.MESSAGE_DELETED, E.MESSAGE_EDITED, E.MESSAGE_UPDATED]) if (ev) eventSource.on(ev, refresh);
        eventSource.on(E.CHAT_CHANGED, () => { C.bump(); if (U.isOpen()) U.close(); setTimeout(armBridge, 800); });
        if (E.APP_READY) eventSource.on(E.APP_READY, () => { addWand(); settingsDrawer(); });
    } catch (e) { console.warn('[Ангар] события', e); }
});
