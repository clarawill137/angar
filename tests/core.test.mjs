// Логика Ангара без таверны: счёт патронов по постам, свайпы, перезарядка, бензин, лаба, Летописец, заметка, лор по эпохам.
import assert from 'node:assert/strict';

const ctx = { chat: [], chatMetadata: {}, extensionSettings: {}, name1: 'Хеди', saveMetadataDebounced() {}, saveSettingsDebounced() {} };
globalThis.SillyTavern = { getContext: () => ctx };
let date = '21.11.2024', loc = 'квартира над лавкой Марко', present = ['Баки'];
const norm = (s) => String(s || '').toLowerCase().replace(/ё/g, 'е').trim();
const api = {
    worldState: () => ({ timestamp: { story_date: date, story_time: '18:30' }, scene: { location: loc, characters_present: present } }),
    parseDate: (s) => { const m = String(s).match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/); return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null; },
    hash: (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); },
    canonName: (n) => String(n || '').trim(), sameName: (a, b) => norm(a) === norm(b), shortName: (n) => String(n).split(' ')[0],
    groupMembers: () => ['Баки', 'Тони'], updatePrompt() {}, settings: () => ctx.extensionSettings.life ||= {}, saveSettings() {},
};
const C = await import('../core.js');
const D = await import('../data.js');
C.setApi(api);
const post = (name, mes, user = false) => { ctx.chat.push({ name, mes, is_user: user, swipe_id: 0, swipes: [mes] }); return ctx.chat.length - 1; };
const chron = (i, ang) => C.afterPost(i, { ang }, ctx.chat[i]);

// 1. лор: 2024
const n = C.seed();
const M = C.M();
assert.equal(M.projects.length, D.INVENTIONS.filter(inv => inv.ty <= C.hedyYear() + 0.001).length, 'в ноябре 2024-го известно всё, что придумано до него');
assert.ok(M.projects.length >= 36, 'изобретений по годам стало больше');
const watch = M.items.find(it => it.key === 'cartier');
assert.ok(watch && watch.gadget && /пылинк/.test(watch.gadget.does) && C.dyn(watch.id).slot === 'body', 'часы «Картье» — гаджет на руке у Хеди');
assert.ok(M.projects.find(p => p.key === 'cartier').released.includes(watch.id), 'проект часов знает свою вещь');
assert.ok(!M.projects.some(p => p.key === 'ring'), 'кольцо Баки — только 24 декабря');
assert.ok(M.projects.find(p => p.key === 'warp1').dead, 'варп у Паркера — на кладбище');
assert.deepEqual(M.vehicles.map(v => v.key).sort(), ['boat', 'quinjet', 'skitalets'], 'техника 2024');
assert.deepEqual(M.suits.map(s => s.key), ['solaris'], 'костюмы 2024: Солярис (спрятан)');
assert.match(C.sdyn(M.suits[0].id).where, /мертва/);
assert.equal(C.seed(), 0, 'повторно не сеет');

// 2. ствол Баки и счёт по постам
post('Хеди', 'Привет');
const g = C.addItem({ name: 'Глок 19', kind: 'pistol', model: 'Glock 19', caliber: '9×19 мм', cap: 15, owner: 'Баки', slot: 'thigh_r' });
assert.equal(C.dyn(g.id).inMag, 15);
assert.equal(C.dyn(g.id).mags.length, 2, 'два запасных по умолчанию');
const i1 = post('Баки', 'Он выстрелил трижды.');
chron(i1, { fire: [{ id: g.id, n: 3 }], draw: [g.id] });
assert.equal(C.dyn(g.id).inMag, 12, 'три выстрела');
assert.equal(C.dyn(g.id).hands, true);

// 3. свайп: запись старого варианта выпадает сама
ctx.chat[i1].mes = 'Он выстрелил пять раз.'; ctx.chat[i1].swipe_id = 1; C.bump();
assert.equal(C.dyn(g.id).inMag, 15, 'новый вариант без записи — патроны вернулись');
chron(i1, { fire: [{ id: g.id, n: 5 }] });
assert.equal(C.dyn(g.id).inMag, 10, 'новый вариант — пять');
ctx.chat[i1].mes = 'Он выстрелил трижды.'; ctx.chat[i1].swipe_id = 0; C.bump();
assert.equal(C.dyn(g.id).inMag, 12, 'свайп назад — снова три, без нового запроса');

// 4. перезарядка: тактическая — неполный магазин уходит в запас
const i2 = post('Хеди', 'Баки сменил магазин.', true);
chron(i2, { reload: [g.id] });
assert.equal(C.dyn(g.id).inMag, 15);
assert.deepEqual(C.dyn(g.id).mags.sort((a, b) => b - a), [15, 12]);
const i3 = post('Баки', 'Опустошил магазин.');
chron(i3, { fire: [{ id: g.id, n: 20 }] });
assert.equal(C.dyn(g.id).inMag, 0);
assert.ok(C.empty(g), 'пусто');
assert.equal(C.dyn(g.id).fired, 18, 'выстрелов было столько, сколько патронов');
assert.match(C.promptNote(), /ПУСТО/, 'модель знает, что пусто');

// 5. руками: новая база с этого поста; посты после неё считаются
C.setDyn(g.id, { inMag: 15, mags: [15] });
const i4 = post('Баки', 'Ещё выстрел.');
chron(i4, { fire: [{ id: g.id, n: 1 }] });
assert.equal(C.dyn(g.id).inMag, 14);
ctx.chat[i3].mes = 'Другой вариант'; ctx.chat[i3].swipe_id = 1; C.bump();
assert.equal(C.dyn(g.id).inMag, 14, 'свайп ДО ручной базы не трогает её');
ctx.chat[i3].mes = 'Опустошил магазин.'; ctx.chat[i3].swipe_id = 0; C.bump();

// 6. револьвер: перезарядка из россыпи своего калибра
const r = C.addItem({ name: 'Кольт Питон', kind: 'revolver', caliber: '.357', cap: 6, owner: 'Хеди' });
const box = C.addItem({ name: '.357 Magnum', kind: 'ammo', caliber: '.357', qty: 10, owner: 'Хеди' });
const i5 = post('Хеди', 'Бах-бах-бах-бах.', true);
chron(i5, { fire: [{ id: r.id, n: 4 }], reload: [r.id] });
assert.equal(C.dyn(r.id).inMag, 6);
assert.equal(C.dyn(box.id).qty, 6, 'из пачки ушло четыре');

// 7. чужие id и мусор Летописца не проходят
assert.deepEqual(C.normEvents({ fire: [{ id: 'nope', n: 3 }], reload: ['zzz'], veh: [{ id: 'x' }] }), []);

// 8. гараж: бензин, урон, засветка
const car = C.addVeh({ name: 'Чарджер', kind: 'car', owner: 'Баки', where: 'гараж', stats: { range: 500 } });
const i6 = post('Баки', 'Погоня по Бруклину, пули в правый борт.');
chron(i6, { veh: [{ id: car.id, fuel: -20, dmg: { right: 40, glass: 30 }, driver: 'Баки', burn: 30 }] });
const vs = C.vdyn(car.id);
assert.equal(vs.fuel, 80); assert.equal(vs.dmg.right, 40); assert.equal(vs.state, 'damaged'); assert.equal(vs.burn, 30); assert.equal(C.kmLeft(car), 400);
assert.match(C.promptNote(), /Чарджер/, 'модель знает про машину рядом (водитель в сцене)');

// 9. лаба: работа по посту двигает проект; свайп — откатывает
const p = C.addProject({ name: 'ЭМИ-патроны', field: 'weapon', out: 'ammo' });
const i7 = post('Хеди', 'Хеди возилась с прототипом всю ночь.', true);
chron(i7, { lab: [{ id: p.id, note: 'ночь над прототипом' }] });
assert.equal(C.projPct(p), 5);
ctx.chat[i7].mes = 'вариант'; ctx.chat[i7].swipe_id = 1; C.bump();
assert.equal(C.projPct(p), 0);

// 10. костюм: надели и побили
const s = C.addSuit({ who: 'Хеди', name: 'Тактический', kind: 'tactical', systems: ['связь с Артом'] });
const i8 = post('Хеди', 'Хеди надела костюм, удар в шлем.', true);
present = ['Баки', 'Хеди'];
chron(i8, { suit: [{ id: s.id, worn: true, dmg: { head: 35 } }] });
assert.equal(C.sdyn(s.id).worn, true); assert.equal(C.sdyn(s.id).st, 'damaged');
assert.match(C.promptNote(), /в костюме «Тактический»/);

// 11. Летописец: вход со списком id
const h = C.chronHook();
assert.ok(h && h.key === '"ang": {}');
assert.ok(h.input.includes(g.id), 'id ствола во входе Летописца');
assert.ok(!h.input.includes(p.id), 'про лабу ни слова — проектов во входе нет (экономия)');
assert.ok(!h.input.includes('«Скиталец»'), 'чужая техника без повода — не во входе');
const il = post('Хеди', 'Ночью в лаборатории она снова паяла прототип.', true);
const h2 = C.chronHook(il);
assert.ok(h2.input.includes(p.id), 'пост про лабу — проекты во входе');
ctx.chat.pop();

// 12. предложения из постов
const i9 = post('Баки', 'Он достал из сапога нож Ka-Bar.');
const t = chron(i9, { seen: [{ kind: 'knife', name: 'нож Ka-Bar', who: 'Баки' }] });
assert.ok(t.some(x => /Новое в посте/.test(x)));
assert.equal(C.suggestions().length, 1);
C.hideSuggestion('нож Ka-Bar');
assert.equal(C.suggestions().length, 0);

// 13. кубик на ответ: один бросок на будущий ответ
C.setDyn(g.id, { cond: 10, hands: true, state: 'ok', inMag: 10 });
const a = C.promptNote(), b = C.promptNote();
assert.equal(a, b, 'та же заметка до нового ответа — кубик не перебрасывается');

// 14. 1940-е: год её жизни и что она уже знает
ctx.chatMetadata = {}; date = '10.03.1944'; C.bump();
assert.equal(C.era().id, 'ssr');
assert.ok(Math.abs(C.hedyYear() - 2020.6) < 0.05, `год её жизни в 1944: ${C.hedyYear()}`);
C.seed();
const keys = C.M().projects.map(p => p.key);
assert.ok(keys.includes('artur') && keys.includes('warp2'), 'в 1944 она уже знает Арта и «Скитальца»');
assert.ok(!keys.includes('wipe'), 'прибор 1945-го ещё не сделан');
assert.ok(!keys.includes('serum'), 'сыворотка (2023 её жизни) ещё впереди');
assert.deepEqual(C.M().suits.map(s => s.key).sort(), ['artsuit', 'ssr'], 'в 1944 — костюм с Артом и форма СНР');
assert.equal(C.M().vehicles.length, 0);

// 15. 2014: Баки — снаряжение Зимнего солдата, «Скитальца» ещё нет
ctx.chatMetadata = {}; date = '20.06.2014'; C.bump();
C.seed();
assert.equal(C.era().id, 'run');
assert.ok(C.M().suits.some(s => s.key === 'ws'));
assert.ok(!C.M().vehicles.some(v => v.key === 'skitalets'));
assert.ok(!C.M().projects.some(p => p.key === 'warp2'));

// 16. переезд лабы Арта
ctx.chatMetadata = { artur: { projects: [{ id: 'a1', name: 'Щит-браслет', field: 'energy', stage: 2, pct: 40, team: ['Айрис'], log: [{ t: 'начали', kind: 'sys' }] }] } };
date = '21.11.2024'; C.bump();
assert.equal(C.migrateArtur(), 1);
const moved = C.M().projects.find(x => x.artur === 'a1');
assert.ok(moved && C.projStage(moved) === 2 && C.projPct(moved) === 40);
assert.equal(ctx.chatMetadata.artur.labMoved, true);
assert.equal(C.migrateArtur(), 0, 'второй раз не тащит');

// 17. тир и клин: границы
assert.equal(D.JAM_AT(100), 0); assert.ok(D.JAM_AT(10) > D.JAM_AT(70));
const rs = C.rangeShoot('Баки', { name: 'Глок', stats: { acc: 4 } });
assert.equal(rs.shots.length, 10); assert.ok(rs.total >= 0 && rs.total <= 100);

// 18. квартирмейстер: досье бойца → набор по логике, не по тому, что мелькало
let seen = null;
const reply = {
    profile: { style: 'Снайпер и ножевой боец; вблизи — бионической рукой', role: 'снайпер-ликвидатор', skills: ['снайперская стрельба', 'ножевой бой', 'рукопашный'], weak: ['рука звенит на рамке'], temper: 'Параноик: ножи везде', rules: ['дома ствол под рукой'] },
    items: [
        { kind: 'knife', name: 'Нож в ботинке', slot: 'boot', why: 'паранойя: второй нож', src: 'logic' },
        { kind: 'sniper', name: 'Винтовка', slot: '', where: 'сейф', why: 'основной навык', src: 'story' },
        { kind: 'pistol', name: 'Зиг', slot: 'nonsense', why: 'запасной', src: 'weird' },
    ],
    why: 'Снайпер, который не доверяет тишине',
};
api.askFillJson = async (msgs, tokens, o, story) => { seen = { msgs, tokens, o, story }; return reply; };
let loreRe = null;
api.lore = { card: () => 'Баки Барнс. Снайпер, бионическая левая рука.', core: () => 'если угроза — бьёт первым', about: async (w, o) => { loreRe = o?.re; return '### Баки — бой\nснайпер Ревущих коммандос'; } };
ctx.chatMetadata.powers = { by: { 'Баки': [{ name: 'Бионическая рука', can: 'держит пулю', limit: 'ЭМИ', cost: '' }] } };
api.chatMeta = () => ctx.chatMetadata;
const kit1 = await C.kitGen('Баки', { scen: 'job', ask: 'Острава ночью' });
assert.equal(kit1.items.length, 3);
assert.equal(kit1.items[2].slot, '', 'выдуманный слот отброшен');
assert.equal(kit1.items[2].src, 'logic', 'странный src → логика');
assert.equal(kit1.items[1].src, 'story');
assert.equal(kit1.items[1].where, 'сейф');
const dos = C.dossierOf('Баки');
assert.ok(dos && dos.role === 'снайпер-ликвидатор' && dos.skills.length === 3, 'досье сохранено');
assert.match(seen.msgs[0].content, /НЕ список того, что уже мелькало/);
assert.match(seen.msgs[0].content, /"why":"почему именно ему/, 'в схеме — почему ему');
assert.match(seen.msgs[1].content, /Досье ещё нет/);
assert.match(seen.msgs[1].content, /Бионическая рука: держит пулю; предел: ЭМИ/, 'способности из Life — в материалах');
assert.match(seen.msgs[1].content, /Ревущих коммандос/, 'лор о бое — в материалах');
assert.ok(loreRe && loreRe.test('снайперская винтовка') && !loreRe.test('пекла пирог'), 'лор — только про бой и навыки');
assert.match(seen.msgs[1].content, /«Задание»/);
assert.match(seen.msgs[1].content, /Острава ночью/);
assert.deepEqual(seen.story, { who: 'Баки', world: true, pairs: false });
reply.profile = { style: 'другое', role: 'другое' };
await C.kitGen('Баки', { scen: 'cover' });
assert.match(seen.msgs[1].content, /Досье \(уже собрано/, 'второй сценарий держится того же досье');
assert.match(seen.msgs[1].content, /снайпер-ликвидатор/);
assert.equal(C.dossierOf('Баки').role, 'снайпер-ликвидатор', 'досье не переписано новым ответом');
await C.kitGen('Баки', { scen: 'cover', alt: ['Нож в ботинке'] });
assert.match(seen.msgs[1].content, /ДРУГОЙ вариант/);
C.setDossier('Баки', { role: 'ликвидатор', skills: ['нож', ' ', 'винтовка'] }, true);
assert.equal(C.dossierOf('Баки').edited, true);
assert.deepEqual(C.dossierOf('Баки').skills, ['нож', 'винтовка'], 'пустые навыки отброшены');
await C.kitGen('Баки', { scen: 'now', fresh: true });
assert.equal(C.dossierOf('Баки').role, 'другое', 'fresh — досье заново');
assert.equal(C.lastKit('Баки').scen, 'now');
date = '10.03.1944'; C.bump();
assert.equal(C.dossierOf('Баки'), null, 'в 1944 — своё досье');
assert.equal(C.lastKit('Баки'), null, 'и свой набор');
date = '21.11.2024'; C.bump();
assert.ok(C.dossierOf('Баки'));

// 19. магазин под человека: витрина отдельно, «чем подойдёт» уходит в вещь
let shopSeen = null;
delete api.askFillJson;
api.askDeepJson = async (msgs) => { shopSeen = msgs; return { items: [{ kind: 'knife', name: 'Керамбит', fit: 'под его ножевой бой', price: 120 }] }; };
const shop = D.SHOPS.aim[0];
await C.shopGen(shop, 'knife', '', false, 'Баки');
assert.match(shopSeen[1].content, /Витрина под одного покупателя: Баки/);
assert.match(shopSeen[1].content, /Его досье: роль: другое/);
assert.match(shopSeen[0].content, /"fit":/);
assert.equal(C.shopList(shop, 'knife', 'Баки').length, 1);
assert.equal(C.shopList(shop, 'knife').length, 0, 'общая витрина отдельно');
const bought = await C.buy(shop, C.shopList(shop, 'knife', 'Баки')[0], 'Баки');
assert.equal(bought.it.why, 'под его ножевой бой');
await C.shopGen(shop, 'knife');
assert.doesNotMatch(shopSeen[1].content, /Витрина под одного/, 'без «под кого» — как раньше');
assert.doesNotMatch(shopSeen[0].content, /"fit":/);

// 20. тренировочный зал: спарринг — кубик, поправки, тренировки уходят в досье
const r1 = C.sparRound('Баки', 'Хеди', 'knife', 'norm');
assert.ok(r1.ra >= 1 && r1.ra <= 20 && r1.rb >= 1 && r1.rb <= 20);
assert.ok(r1.wa.includes('суперсолдат'), 'Баки — суперсолдат');
assert.equal(C.trainOf('Хеди').knife, 1);
for (let k = 0; k < 4; k++) C.sparRound('Баки', 'Хеди', 'knife', 'light');
assert.equal(C.trainOf('Хеди').knife, 5);
assert.ok(C.dossierOf('Хеди')?.skills.some(x => /ножевой бой — 5 тренировок у Баки/.test(x)), 'навык ушёл в досье Хеди');
assert.ok(C.sparMods('Хеди', 'knife').why.some(w => /навык из досье|тренировки/.test(w)), 'и даёт поправку');
C.sparScene(r1);
assert.match(C.promptNote(), /Тренировочный зал \(3 этаж\): спарринг Баки × Хеди/);
assert.ok(C.sparMods('Баки', 'box').mod <= 6, 'потолок +6');

// 21. 0.4 — досев: старый чат (засеян до 0.4) получает новые изобретения, удалённое не воскресает, будущее — по дате
ctx.chatMetadata = {}; ctx.chat = []; date = '21.11.2024'; C.bump();
{
    const m = C.M();
    m.seeded = 1;
    m.projects = D.INVENTIONS.filter(inv => !inv.v && inv.key !== 'sharik').map(inv => C.normProject({ ...inv, stage: 4 }, { src: 'lore' })).map((p, i) => { p.key = D.INVENTIONS.filter(inv => !inv.v && inv.key !== 'sharik')[i].key; return p; });
    const n = C.seed();
    assert.ok(n >= 20, `досеяно новых: ${n}`);
    assert.ok(!m.projects.some(p => p.key === 'sharik'), 'удалённый руками Шарик не вернулся');
    assert.ok(m.projects.some(p => p.key === 'cartier') && m.items.some(it => it.key === 'cartier'), 'часы досеяны вместе с вещью');
    assert.ok(m.projects.find(p => p.key === 'jammer').idea, 'придуманное помечено');
    assert.equal(m.projects.find(p => p.key === 'bionic') && C.projStage(m.projects.find(p => p.key === 'bionic')), 2, 'бионическая кисть — ещё прототип');
    const ver = m.ver;
    assert.equal(C.seed(), 0);
    assert.equal(m.ver, ver, 'без новостей — без лишнего сохранения');
    date = '26.12.2024'; C.bump();
    assert.ok(C.seed() >= 3, 'дошли до Рождества — пластырь, кольцо и генератор');
    const ring = m.items.find(it => it.key === 'ring');
    assert.ok(ring && /Баки/.test(ring.owner) && /GPS/.test(ring.gadget.does), 'кольцо Баки — у Баки, с маячком');
    date = '21.11.2024'; C.bump();
}

// 22. мастерская: каталог по эпохе, кубик, статы, ценность, снятие с откатом
{
    const glock = C.addItem({ name: 'Глок 19', kind: 'pistol', caliber: '9×19 мм', cap: 15, owner: 'Баки', price: '600', stats: { dmg: 3, acc: 3, range: 2, conceal: 4, noise: 4, reliab: 5 } });
    const cat = C.upCatalog(glock).map(u => u.id);
    assert.ok(cat.includes('supp') && cat.includes('smart') && cat.includes('extmag'), 'в 2024-м — глушитель, умный прицел, магазины');
    assert.ok(!cat.includes('vshield') && !cat.includes('edge'), 'не своё — мимо');
    assert.equal(C.upType(glock), 'gun');
    assert.equal(C.valueOf(glock).total, 600);
    const supp = C.upSpec(glock, 'supp');
    const mods = C.upMods(glock, supp, 'Баки');
    assert.ok(mods.some(m => m.key === 'who' && m.v === 4), 'Баки — оружейник: +4');
    const r = C.rollUp(glock, supp, mods, { who: 'Баки', roll: 12 });
    assert.equal(r.out, 'win', '12 + 4 = 16 — успех');
    assert.match(C.fxLine(r.fx, 'gun'), /−2 шум/);
    await C.applyUp(r, { scene: true });
    assert.equal(glock.stats.noise, 2);
    assert.equal(glock.stats.conceal, 3);
    assert.ok(glock.mods.includes('Глушитель'));
    assert.equal(C.valueOf(glock).total, 600 + Math.round(600 * 0.12), 'ценность выросла');
    assert.match(C.promptNote(), /Мастерская \(Ангар · кубик\): Баки ставит «Глушитель» на «Глок 19» — успех/);
    // прорыв: сверху +1 к главному
    const opt = C.upSpec(glock, 'optic');
    const r2 = C.rollUp(glock, opt, [], { who: 'Баки', roll: 20 });
    assert.equal(r2.out, 'break');
    assert.equal(r2.fx.d.acc, 2, 'прорыв: точность +2 вместо +1');
    await C.applyUp(r2);
    assert.equal(glock.stats.acc, 5);
    // частичный: побочка
    const ext = C.upSpec(glock, 'extmag');
    const r3 = C.rollUp(glock, ext, [], { who: 'Баки', roll: 11 });
    assert.equal(r3.out, 'part');
    await C.applyUp(r3);
    assert.equal(glock.cap, 23, 'ёмкость ×1.5');
    assert.equal(glock.stats.reliab, 4, 'частично — надёжность −1');
    // снять — всё назад
    const rec = glock.ups.find(u => u.cat === 'extmag');
    C.removeUp(glock, rec.id);
    assert.equal(glock.cap, 15);
    assert.equal(glock.stats.reliab, 5);
    assert.ok(!glock.mods.includes('Удлинённые магазины'));
    // провал и бабах
    const smart = C.upSpec(glock, 'smart');
    const r4 = C.rollUp(glock, smart, [], { who: 'Хеди', roll: 1 });
    assert.equal(r4.out, 'boom', 'лабный апгрейд ствола: единица — бабах');
    await C.applyUp(r4);
    assert.equal(C.dyn(glock.id).cond, 60, 'бабах: состояние −40');
    assert.ok(!glock.mods.includes('Умный прицел А.Р.Т.У.Р.а'));
    // 1944: только своё время
    date = '10.03.1944'; C.bump();
    const c44 = C.upCatalog(glock).map(u => u.id);
    assert.ok(c44.includes('supp') && !c44.includes('smart') && !c44.includes('light'), '1944: глушитель есть, умного прицела нет');
    assert.equal(C.upCatalog(glock).find(u => u.id === 'supp').cost, Math.round(650 * 0.06), 'цены сороковых');
    assert.equal(C.upCatalog(glock).find(u => u.id === 'optic').name, 'Оптический прицел');
    date = '21.11.2024'; C.bump();

    // техника: бак, run-flat, ценность
    const car = C.addVeh({ kind: 'car', name: 'Додж', price: '40000', stats: { speed: 3, handling: 3, armor: 1, range: 600 } });
    const tank = C.upSpec(car, 'vtank');
    await C.applyUp(C.rollUp(car, tank, [], { who: 'Баки', roll: 15 }));
    assert.equal(car.stats.range, 900, 'бак: запас хода ×1.5');
    assert.ok(car.mods.some(m => m.name === 'Дополнительный бак' && m.up));
    const rf = C.upSpec(car, 'vrunflat');
    await C.applyUp(C.rollUp(car, rf, [], { who: 'Баки', roll: 15 }));
    assert.ok(C.valueOf(car).ups > 0);
    const before = C.valueOf(car).total;
    C.removeUp(car, car.ups[0].id);
    assert.equal(car.stats.range, 600, 'сняли бак');
    assert.ok(C.valueOf(car).total < before);

    // костюм: броня, система, статы
    const suit = C.addSuit({ who: 'Хеди', name: 'Солярис', kind: 'hero', armor: 3 });
    assert.deepEqual(C.suitStats(suit), { mob: 3, stealth: 2, power: 3 });
    const vib = C.upSpec(suit, 'svib');
    assert.ok(C.upMods(suit, vib, 'Хеди').some(m => m.key === 'mat' && m.v === -3), 'нет вибраниума — минус три');
    C.M().materials.push({ id: 'vb', name: 'Вибраниум', qty: 2, unit: 'кг' });
    assert.ok(!C.upMods(suit, vib, 'Хеди').some(m => m.key === 'mat'));
    await C.applyUp(C.rollUp(suit, vib, [], { who: 'Хеди', roll: 16 }));
    assert.equal(suit.armor, 4, 'вибраниевая подкладка: броня +1');
    assert.equal(C.matById('vb').qty, 1, 'вибраниум потрачен');
    const jets = C.upSpec(suit, 'sjets');
    await C.applyUp(C.rollUp(suit, jets, [], { who: 'Хеди', roll: 18 }));
    assert.equal(suit.stats.mob, 5);
    assert.ok(suit.systems.some(y => y.name === 'Ускорители'));
    assert.ok(suit.upgrades.some(u => u.name === 'Реактивные ускорители' && u.from === 'мастерская'));
    C.sdyn(suit.id); C.setSdyn(suit.id, { worn: true }); present = ['Хеди'];
    assert.match(C.promptNote(), /в костюме «Солярис» \(броня 4\/5 — держит винтовочную пулю/);
    assert.match(C.promptNote(), /Реактивные ускорители — короткие прыжки/);
    const jrec = suit.ups.find(u => u.cat === 'sjets');
    C.removeUp(suit, jrec.id);
    assert.equal(suit.stats.mob, 3);
    assert.ok(!suit.systems.some(y => y.name === 'Ускорители'), 'система ушла вместе с апгрейдом');

    // изобретение лабы как апгрейд: что даст — по выбору
    const inv = C.addProject({ name: 'Пылевой экран', field: 'cyber', out: 'mod', stage: 4, ty: 2024 });
    const lab = C.upLab(suit).find(u => u.pid === inv.id);
    assert.ok(lab, 'готовое изобретение — в списке «Из лабы»');
    assert.equal(lab.focus, 'stealth', 'кибер в костюме — по умолчанию скрытность');
    const rl = C.rollUp(suit, lab, C.upMods(suit, lab, 'Хеди'), { who: 'Хеди', roll: 10, focus: 'power' });
    assert.equal(rl.out, 'win', '10 + Хеди 4 + своё 1 + база 2 − сложность 1 = 16');
    assert.ok(rl.mods.some(m => m.label === 'своё изобретение'));
    await C.applyUp(rl);
    assert.equal(suit.stats.power, 4, 'выбрали автономность');
    assert.ok(suit.systems.some(y => y.name === 'Пылевой экран'), 'изобретение — своя система в костюме');
    assert.ok(inv.released.includes(suit.id));
    assert.ok(!C.upLab(suit).some(u => u.pid === inv.id), 'второй раз то же не ставится');
    present = ['Баки'];
}

// 23. сплав: части → кубик → одно изобретение; заделы автора — мимо
{
    const a = C.addProject({ name: 'Нано-горошина', field: 'cyber', out: 'gadget', stage: 4, ty: 2024 });
    const b = C.addProject({ name: 'Фотонный щит', field: 'energy', out: 'mod', stage: 1, ty: 2024 });
    C.M().insights.unshift({ id: 'iset', at: '', roll: 12, kind: 'spy', ideas: [{ id: 'i1', title: 'Пуговица-камера', text: 'камера в пуговице', field: 'cyber', out: 'gadget' }] });
    const parts = [{ kind: 'proj', id: a.id }, { kind: 'proj', id: b.id }, { kind: 'idea', set: 'iset', id: 'i1' }].map(C.fusePart);
    assert.ok(parts.every(Boolean));
    const fm = C.fuseMods(parts, ['Тони Старк']);
    assert.ok(fm.some(m => m.key === 'three' && m.v === -1) && fm.some(m => m.label === 'Тони рядом (и спорит)'));
    assert.ok(!fm.some(m => m.key === 'ready'), 'щит не готов — «всё работает» не даём');
    let fuseAsked = null;
    api.askDeepJson = async (msgs, t, o) => { fuseAsked = msgs; if (/сплав/.test(o.what)) return { name: 'Невидимый свидетель', note: 'Пуговица, которая слышит и закрывается щитом.', spec: 'слушает 3 часа', field: 'cyber', out: 'gadget', quirk: '', scene: 'пуговица чуть теплеет' }; return {}; };
    const fr = C.rollFuse(parts, fm, { roll: 17 });
    assert.equal(fr.out, 'win');
    const got = await C.fuse(fr, { helpers: ['Тони Старк'], scene: true });
    assert.equal(got.p.name, 'Невидимый свидетель');
    assert.equal(C.projStage(got.p), 1, 'щит не готов — сплав начинается с теории');
    assert.ok(got.p.needs.includes(b.id), 'ждёт неготовую часть');
    assert.deepEqual(got.p.fused, ['Нано-горошина', 'Фотонный щит', 'Пуговица-камера']);
    assert.ok(C.M().insights.find(x => x.id === 'iset').ideas[0].used, 'идея ушла в сплав');
    assert.match(fuseAsked[0].content, /одну вещь с новой сутью/);
    assert.match(fuseAsked[1].content, /Пуговица-камера \(идея/);
    assert.match(C.promptNote(), /сплавляет Нано-горошина, Фотонный щит и Пуговица-камера/);
    // задел автора: модель полезла в запретное — берём простое имя
    C._setPlanKeys({ titles: ['Задел: сюрприз'], re: /приставк/i });
    api.askDeepJson = async () => ({ name: 'Игровая приставка-щит', note: 'приставка', field: 'cyber', out: 'gadget' });
    const g2 = await C.fuse(C.rollFuse(parts.slice(0, 2), [], { roll: 16 }));
    assert.equal(g2.p.name, 'Нано-горошина × Фотонный щит', 'задел автора не прошёл');
    // провал — урок, бабах — авария
    api.askDeepJson = async () => ({ name: 'Урок: щит глушит горошину', note: 'энергия щита забивает канал', field: 'cyber', out: 'gadget' });
    const g3 = await C.fuse(C.rollFuse(parts.slice(0, 2), [], { roll: 5 }));
    assert.ok(g3.lesson && C.M().insights[0].kind === 'fuse', 'провал: урок в инсайтах');
    C.bumpProject(b, 30);
    const pct0 = C.projPct(b);
    const g4 = await C.fuse(C.rollFuse(parts.slice(0, 2), [], { roll: 1 }));
    assert.ok(g4.boom, 'энергия в сплаве: единица — бабах');
    assert.equal(C.projPct(b), pct0 - 10, 'авария откатила неготовую часть');

    // инсайты: восемь жанров и фильтр заделов
    assert.equal(D.insightOf(15).id, 'up');
    assert.equal(D.insightOf(12).id, 'spy');
    assert.equal(D.insightOf(6).id, 'kin');
    api.askDeepJson = async () => ({ ideas: [{ title: 'Приставка для Баки', text: 'игровая приставка', field: 'tech', out: 'gadget' }, { title: 'Термос-сейф', text: 'держит чай и патроны', scene: 'щёлк — и пахнет чаем', cost: 'тяжёлый', field: 'tech', out: 'gadget' }] });
    const ins = await C.insights(15);
    assert.deepEqual(ins.ideas.map(y => y.title), ['Термос-сейф'], 'задел автора отфильтрован');
    assert.equal(ins.ideas[0].scene, 'щёлк — и пахнет чаем');
    C._setPlanKeys({ titles: [], re: null });
}

// 24. 0.4.2 — «Кошка» (давнее), идеи на Амстердам с 27.12, рецепты сплавов
ctx.chatMetadata = {}; ctx.chat = []; date = '26.12.2024'; C.bump();
{
    C.seed();
    const m = C.M();
    const AMS = ['scarf', 'sugar', 'fogglass', 'striders', 'foam', 'jar', 'peas', 'waterkey', 'canary', 'jammer2', 'armhear'];
    assert.ok(!m.projects.some(p => AMS.includes(p.key)), '26.12 — идей на Амстердам ещё нет');
    const ko = m.projects.find(p => p.key === 'koshka');
    assert.ok(ko && C.projStage(ko) === 4 && ko.idea, '«Кошка» — давно готова');
    const sole = m.items.find(it => it.key === 'koshka');
    assert.ok(sole && C.dyn(sole.id).slot === 'boot' && /без звука/.test(sole.gadget.does) && /Хеди/.test(sole.owner), 'подошвы — в обуви у Хеди');
    assert.deepEqual(C.recipesNow(), [], 'рецептов до 27.12 нет');
    date = '27.12.2024'; C.bump();
    assert.equal(C.seed(), AMS.length, 'с 27.12 — одиннадцать идей');
    for (const k of AMS) { const p = m.projects.find(q => q.key === k); assert.ok(p && p.idea && !p.dead, k); }
    assert.equal(C.projStage(m.projects.find(p => p.key === 'jar')), 0, 'банка — голая идея');
    assert.equal(C.projStage(m.projects.find(p => p.key === 'peas')), 1, 'горошины — уже теория');
    assert.ok(m.projects.find(p => p.key === 'canary').lock, 'канарейка — секрет');
    // «Кошка» апгрейдом: на костюм — тише, на ствол — нет
    const sol = m.suits.find(s => s.key === 'solaris');
    const up = C.upLab(sol).find(u => u.name === 'Подошвы «Кошка»');
    assert.ok(up && up.focus === 'stealth', '«Кошка» на костюм — скрытность');
    const gun = C.addItem({ name: 'ПМ', kind: 'pistol', owner: 'Хеди' });
    assert.ok(!C.upLab(gun).some(u => u.name === 'Подошвы «Кошка»'), 'на ствол подошвы не ставятся');
    assert.ok(!C.upLab(sol).some(u => u.name === 'Нано-генератор для мотоцикла'), 'генератор мотоцикла — только на мотоцикл');
    // рецепты
    const rs = C.recipesNow();
    assert.deepEqual(rs.map(r => r.key).sort(), D.RECIPES.map(r => r.key).sort(), 'все рецепты на месте');
    const dutch = rs.find(r => r.key === 'dutch');
    assert.deepEqual(dutch.names, ['Ключ от воды', 'Сибирский метод', 'Браслет-гусеница']);
    assert.equal(rs.find(r => r.key === 'solrod').refs[0].kind, 'suit', 'Солярис — костюмом');
    assert.equal(rs.find(r => r.key === 'pulse').refs[0].kind, 'item', 'часы — вещью');
    assert.equal(C.recipeOf([...dutch.refs].reverse())?.key, 'dutch', 'порядок частей неважен');
    assert.equal(C.recipeOf(dutch.refs.slice(0, 2)), null, 'двух из трёх мало');
    api.askDeepJson = async (msgs, t, o) => (/сплав/.test(o.what) ? { name: 'Шлюзовой бунт', note: 'Станция воюет за неё.', spec: 'шлюзы, насосы, свет', field: 'cyber', out: 'soft', scene: 'насосы взвыли' } : {});
    const got = await C.fuse(C.rollFuse(dutch.refs.map(C.fusePart), [], { roll: 17 }), { ask: dutch.ask, recipe: 'dutch' });
    assert.equal(got.p.name, 'Голландский метод', 'имя — из рецепта');
    assert.equal(got.p.recipe, 'dutch');
    assert.ok(C.recipesNow().find(r => r.key === 'dutch').done, 'рецепт отмечен сплавленным');
    // модель молчит — рецепт сам описывает, что вышло
    api.askDeepJson = async () => null;
    const pr = C.recipesNow().find(r => r.key === 'prompter');
    const g5 = await C.fuse(C.rollFuse(pr.refs.map(C.fusePart), [], { roll: 18 }), { ask: pr.ask, recipe: 'prompter' });
    assert.equal(g5.p.name, 'Суфлёр');
    assert.match(g5.p.note, /^Горошина из часов/, 'без модели — описание из рецепта');
    m.projects.find(p => p.key === 'canary').dead = true;
    assert.ok(!C.recipesNow().some(r => r.key === 'canarymap'), 'канарейка на кладбище — нет и рецепта');
    date = '21.11.2024'; C.bump();
}

console.log('ангар · логика: все проверки прошли');
