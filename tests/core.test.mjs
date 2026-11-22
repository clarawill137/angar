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
assert.equal(M.projects.length, D.INVENTIONS.length, 'в 2024-м известны все изобретения');
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

console.log('ангар · логика: все проверки прошли');
