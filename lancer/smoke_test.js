// Smoke test for the Lancer tracker. Run: node smoke_test.js
// Extracts the <script> block from index.html, evals it against a DOM stub
// and checks the core flows (defaults, search, frame apply, licenses,
// migration, Limited charges). No browser needed.
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
const src = html.match(/<script>(.*?)<\/script>/s)[1];
if (!src) throw new Error('no <script> block found in index.html');

function makeEl(id){
  // textContent coerces to string, like a real DOM node
  let _text = '';
  const el = {
    id, value: '', innerHTML: '', style: {},
    checked: false, dataset: {},
    classList: { toggle(){}, add(){}, remove(){} },
    setAttribute(){}, getAttribute(){ return null; },
    addEventListener(){}, appendChild(){},
    showModal(){ this._open = true; }, close(){ this._open = false; },
    querySelector(){ return null; }, querySelectorAll(){ return []; },
  };
  Object.defineProperty(el, 'textContent', {
    get(){ return _text; },
    set(v){ _text = (v === null || v === undefined) ? '' : String(v); },
  });
  return el;
}
function makeStub(store){
  const elements = {};
  const g = {
    localStorage: {
      getItem: k => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: k => { delete store[k]; },
    },
    document: {
      getElementById: id => { if (!elements[id]) elements[id] = makeEl(id); return elements[id]; },
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: () => makeEl('x'),
    },
    window: {},
    confirmCalls: [],
    confirm: m => { g.confirmCalls.push(m); return true; },
    alert: m => { throw new Error('alert: ' + m); },
  };
  return { elements, g };
}
const EXPOSE = '\n;global.__x={getS:function(){return S;},DB:DB,MOUNT_ALLOWED:MOUNT_ALLOWED,'
  + 'weaponMatches:weaponMatches,systemMatches:systemMatches,'
  + 'showWeaponResults:showWeaponResults,showSystemResults:showSystemResults,'
  + 'addWeaponByIndex:addWeaponByIndex,addSystemByIndex:addSystemByIndex,'
  + 'addBlankWeapon:addBlankWeapon,addSystemFromDb:addSystemFromDb,'
  + 'fillWeaponFromDb:fillWeaponFromDb,fillSystemFromDb:fillSystemFromDb,'
  + 'applyFrame:applyFrame,toggleLicenseFilter:toggleLicenseFilter,'
  + 'itemAvailable:itemAvailable,frameAvailable:frameAvailable,'
  + 'sysLim:sysLim,sysLeft:sysLeft,weapLim:weapLim,weapLeft:weapLeft,sysSp:sysSp,'
  + 'weapTags:weapTags,tagLabel:tagLabel,tagChips:tagChips,showTag:showTag,'
  + 'talentRankDesc:talentRankDesc,talentMatches:talentMatches,showTalentResults:showTalentResults,'
  + 'addTalentByIndex:addTalentByIndex,fillTalentFromDb:fillTalentFromDb,'
  + 'MOUNT_TYPES:MOUNT_TYPES,MOUNT_STYLE:MOUNT_STYLE,'
  + 'stepSysCharges:stepSysCharges,stepWeapCharges:stepWeapCharges,'
  + 'fullRepair:fullRepair,renderLists:renderLists,save:save,get:get,set:set,'
  + 'lang:lang,setLang:setLang,applyLang:applyLang,wd:wd,sd:sd,td:td,tagd:tagd,fd:fd,'
  + 'findWeapon:findWeapon,findSystem:findSystem,findTalent:findTalent,frameKey:frameKey,'
  + 'dispVal:dispVal,mountCap:mountCap,STR:STR,L:L};';
function runEval(store){
  const stub = makeStub(store);
  Object.assign(global, stub.g);
  eval(src + EXPOSE);
  return { elements: stub.elements, g: stub.g, X: global.__x, S: global.__x.getS(), DB: global.__x.DB };
}

// PHASE 0: Heat before Stress in the resources card
const resIdx = html.indexOf('Ресурсы боя');
const heatIdx = html.indexOf('🔥', resIdx);
const stressIdx = html.indexOf('⚡', resIdx);
if (!(heatIdx > 0 && stressIdx > 0 && heatIdx < stressIdx)) throw new Error('0: Heat must come before Stress in the resources card');

// PHASE A: fresh-load defaults
let r = runEval({});
let elA = r.elements, gA = r.g, X = r.X, S = r.S, DB = r.DB;
if (S.pilot.ll !== 0) throw new Error('A: fresh LL should be 0');
if (S.mech.frame !== 'Everest') throw new Error('A: fresh frame should be Everest');
if (S.mounts.length !== 3 || S.mounts[0].type !== 'Main' || S.mounts[1].type !== 'Flex' || S.mounts[2].type !== 'Heavy') throw new Error('A: default mounts should be Main/Flex/Heavy');
if (S.systems.length !== 3) throw new Error('A: 3 starter systems expected');
if (S.mech.repairsMax !== 5) throw new Error('A: Everest Repair Cap is 5');
if (!S.mech.coreDesc.includes('Power Up')) throw new Error('A: Everest core desc missing');
if (!S.mech.traits.includes('Initiative')) throw new Error('A: Everest traits missing');
if (S.settings.licenseFilter !== true) throw new Error('A: license filter should default ON');
if (S.pilot.licenses.length !== 0) throw new Error('A: fresh pilot should have no licenses');

// PHASE F: multi-field search - mount, corp, license level (filter OFF = full DB)
X.toggleLicenseFilter(false);
if (DB.weapons.filter(w => X.weaponMatches(w, 'ips-n ll1')).length !== 6) throw new Error('F: "ips-n ll1" should match 6 weapons');
if (DB.weapons.filter(w => X.weaponMatches(w, 'horus ll3')).length !== 5) throw new Error('F: "horus ll3" should match 5 weapons');
if (DB.weapons.filter(w => X.weaponMatches(w, 'smith-shimano ll2')).length !== 6) throw new Error('F: "smith-shimano ll2" should match 6 weapons');
if (DB.systems.filter(s => X.systemMatches(s, 'horus ll2')).length !== 10) throw new Error('F: "horus ll2" should match 10 systems');
if (DB.weapons.filter(w => X.weaponMatches(w, 'gms ll1')).length !== 0) throw new Error('F: "gms ll1" should match nothing (all GMS gear is LL0)');
X.showWeaponResults(1, 'ips-n ll1');
let box = elA['mountResults-1'].innerHTML;
if ((box.match(/class="dbrow"/g) || []).length !== 6) throw new Error('F: "ips-n ll1" should show 6 rows in Flex');
X.showWeaponResults(1, 'main');
box = elA['mountResults-1'].innerHTML;
const nMain = DB.weapons.filter(w => ['Main', 'Aux'].includes(w.m) && X.weaponMatches(w, 'main')).length;
if ((box.match(/class="dbrow"/g) || []).length !== Math.min(8, nMain)) throw new Error('F: "main" row count wrong in Flex');
X.toggleLicenseFilter(true); // back ON for the license tests

// PHASE B: applyFrame Blackbeard with HASE 2/1/2/1 - derived stats
S.mech.frame = 'Blackbeard';
S.pilot.hull = 2; S.pilot.agility = 1; S.pilot.systems = 2; S.pilot.engineering = 1;
X.applyFrame();
const FB = DB.frames['Blackbeard'];
if (S.mech.hpMax !== FB.s.hp + 4) throw new Error('B: hpMax should be frame hp + Hull*2');
if (S.mech.speed !== FB.s.speed + 0) throw new Error('B: speed should be frame speed + floor(Agi/2)');
if (S.mech.evasion !== FB.s.evasion + 1) throw new Error('B: evasion should be frame evasion + Agi');
if (S.mech.edef !== FB.s.edef + 2) throw new Error('B: edef should be frame edef + Systems');
if (S.mech.sp !== FB.s.sp + 1) throw new Error('B: sp should be frame sp + floor(Sys/2)');
if (S.mech.tech !== (FB.s.tech_attack || 0) + 2) throw new Error('B: tech should be frame tech + Systems');
if (S.mech.heatMax !== FB.s.heatcap + 1) throw new Error('B: heatMax should be frame heatcap + Eng');
if (S.mech.repairsMax !== FB.s.repcap + 1) throw new Error('B: repairsMax should be frame repcap + floor(Hull/2)');
if (S.mech.structureMax !== FB.s.structure || S.mech.stressMax !== FB.s.stress) throw new Error('B: structure/stress max should be the frame base');
if (S.mech.coreSystem !== FB.c || S.mech.coreDesc !== FB.cd || S.mech.traits !== FB.t) throw new Error('B: core system/traits should come from the frame');
if (S.mounts.map(m => m.type).join(',') !== FB.m.join(',')) throw new Error('B: mounts should come from the frame');

// PHASE C: Lancaster -> Integrated mount + Latch Drone
S.mech.frame = 'Lancaster';
X.applyFrame();
const im = S.mounts.find(m => m.type === 'Integrated');
if (!im) throw new Error('C: Lancaster must add an Integrated mount');
const latch = im.weapons.find(w => w.name === 'Latch Drone');
if (!latch) throw new Error('C: Integrated mount must hold the Latch Drone');
if (latch.dmg !== '') throw new Error('C: Latch Drone has no damage by design');
if (!latch.desc || !latch.range) throw new Error('C: Latch Drone must have desc and range');

// PHASE D: systems search + SP counter
if (S.systems.reduce((a, s) => a + (+s.sp || 0), 0) !== 6) throw new Error('D: starter systems should cost 6 SP total');
if (!elA['spCounter'].textContent.includes('6')) throw new Error('D: SP counter should show 6 used');
X.showSystemResults('ll2');
let sbox = elA['systemResults'].innerHTML;
const nLL2 = DB.systems.filter(s => X.itemAvailable(s) && X.systemMatches(s, 'll2')).length;
if ((sbox.match(/class="dbrow"/g) || []).length !== Math.min(8, nLL2)) throw new Error('D: "ll2" systems row count wrong');
const shieldIdx = DB.systems.findIndex(s => s.n === 'Type-3 Projected Shield');
X.addSystemByIndex(shieldIdx);
if (S.systems.length !== 4) throw new Error('D: adding a system should grow the list');
if (S.systems.reduce((a, s) => a + (+s.sp || 0), 0) !== 8) throw new Error('D: SP used should be 8 after adding the 2-SP shield');

// PHASE G: licenses filter
const axeG = DB.weapons.find(w => w.n === 'Chain Axe');
const bristleG = DB.weapons.find(w => w.n === 'Bristlecrown Flechette Launcher');
const railgunG = DB.weapons.find(w => w.n === 'Railgun');
const latchG = DB.weapons.find(w => w.n === 'Latch Drone');
if (axeG.lic !== 'Blackbeard' || axeG.ll !== 1) throw new Error('G: Chain Axe lic/ll wrong');
if (railgunG.lic !== 'Death’s Head' || railgunG.ll !== 3) throw new Error('G: Railgun lic/ll wrong');
if (latchG.lic !== '' || latchG.ll !== null) throw new Error('G: Latch Drone should have no license');
if (DB.frames['Blackbeard'].ll !== 2) throw new Error('G: Blackbeard frame needs rank 2');
if (DB.frames['Everest'].ll !== 0) throw new Error('G: Everest frame needs no license');
if (!S.settings.licenseFilter) throw new Error('G: license filter should be ON');
if (S.pilot.licenses.length !== 0) throw new Error('G: pilot should have no licenses yet');
// no licenses: only GMS + no integrated weapons
if (!X.itemAvailable(DB.weapons.find(w => w.n === 'Assault Rifle'))) throw new Error('G: GMS weapons must be available');
if (X.itemAvailable(axeG)) throw new Error('G: Chain Axe must NOT be available without a license');
if (X.itemAvailable(latchG)) throw new Error('G: integrated weapons must NOT be searchable with filter ON');
if (!X.frameAvailable('Everest')) throw new Error('G: Everest must always be available');
if (X.frameAvailable('Blackbeard')) throw new Error('G: Blackbeard frame must NOT be available without a license');
X.showWeaponResults(0, '');
box = elA['mountResults-0'].innerHTML;
const allowed0 = X.MOUNT_ALLOWED[S.mounts[0].type] || X.MOUNT_ALLOWED['Main'];
const gmsOnly = DB.weapons.filter(w => allowed0.includes(w.m) && X.itemAvailable(w));
if (!gmsOnly.every(w => w.lic === 'GMS')) throw new Error('G: with no licenses, search must show GMS only');
if ((box.match(/class="dbrow"/g) || []).length !== Math.min(8, gmsOnly.length)) throw new Error('G: search row count wrong for GMS-only');
// Blackbeard rank 1: LL1 gear yes, LL2 gear no, frame no
S.pilot.licenses.push({ name: 'Blackbeard', rank: 1 }); X.save(); X.renderLists();
if (!X.itemAvailable(axeG)) throw new Error('G: Chain Axe must be available with Blackbeard I');
if (X.itemAvailable(bristleG)) throw new Error('G: Bristlecrown (LL2) must NOT be available with Blackbeard I');
if (X.frameAvailable('Blackbeard')) throw new Error('G: Blackbeard frame needs rank II, not I');
if (!elA['frames'].innerHTML.includes('Эверест')) throw new Error('G: frames datalist must include Everest (Эверест in RU)');
if (elA['frames'].innerHTML.includes('Чёрная Борода')) throw new Error('G: frames datalist must NOT include Blackbeard at rank I');
if (elA['licenseRankSum'].textContent !== '1') throw new Error('G: license rank sum should be 1');
if (elA['licenseRankSum'].style.color !== '#ff6b6b') throw new Error('G: rank sum should be red when it differs from LL (0)');
// rank 2: frame + LL2 gear yes, LL3 other licenses no
S.pilot.licenses[0].rank = 2; X.save(); X.renderLists();
if (!X.frameAvailable('Blackbeard')) throw new Error('G: Blackbeard frame must be available at rank II');
if (!X.itemAvailable(bristleG)) throw new Error('G: Bristlecrown must be available at rank II');
if (X.itemAvailable(railgunG)) throw new Error('G: Railgun (Deaths Head LL3) must NOT be available');
if (!elA['frames'].innerHTML.includes('Чёрная Борода')) throw new Error('G: frames datalist must include Blackbeard at rank II');
// unlicensed weapons must not appear in search results at all
X.showWeaponResults(0, 'vijaya');
box = elA['mountResults-0'].innerHTML;
if ((box.match(/class="dbrow"/g) || []).length !== 0) throw new Error('G: unlicensed Vijaya Rockets must not appear in search results');
// applyFrame with unlicensed frame must warn in the confirm text
S.mech.frame = 'Tokugawa';
gA.confirmCalls.length = 0;
X.applyFrame();
if (!gA.confirmCalls.some(m => /нет лицензии/.test(m))) throw new Error('G: applyFrame must warn about missing license');
// filter OFF: everything available, frames datalist full
X.toggleLicenseFilter(false);
if (!X.itemAvailable(railgunG)) throw new Error('G: with filter OFF, Railgun must be available');
if (!X.frameAvailable('Tokugawa')) throw new Error('G: with filter OFF, Tokugawa must be available');
if ((elA['frames'].innerHTML.match(/<option/g) || []).length !== 29) throw new Error('G: with filter OFF, frames datalist must have all 29 frames');
if (elA['licNoteW'].textContent !== '') throw new Error('G: filter note must be empty when filter is OFF');
X.showWeaponResults(0, 'vijaya');
if ((elA['mountResults-0'].innerHTML.match(/class="dbrow"/g) || []).length !== 1) throw new Error('G: with filter OFF, Vijaya Rockets must appear in search results');
X.toggleLicenseFilter(true);
if (elA['licNoteW'].textContent === '') throw new Error('G: filter note must show when filter is ON');

// PHASE E: TDZ regression - v3 save with flat weapons must migrate, not reset
const storeE = {};
storeE['lancer-tracker-v1'] = JSON.stringify({
  pilot: { name: 'Test' }, mech: { frame: 'Everest' },
  weapons: [
    { name: 'Combat Knife', mount: 'Aux', dmg: '1d3 Kinetic', range: 'Threat 1', desc: '' },
    { name: 'Assault Rifle', mount: 'Main', dmg: '1d6 Kinetic', range: 'Range 15', desc: 'Reliable 2' },
    { name: 'Anti-Materiel Rifle', mount: 'Heavy', dmg: '1d6+2 Kinetic', range: 'Range 20', desc: '' },
  ],
  statuses: [],
});
let rE = runEval(storeE);
let SE = rE.S;
if (SE.mounts.length !== 3) throw new Error('E: migration should create 3 mounts');
if (SE.mounts[1].weapons[0].name !== 'Assault Rifle' || SE.mounts[1].weapons[0].desc !== 'Reliable 2') throw new Error('E: migrated weapon must survive (not silently reset to defaults)');
if (!SE.mech.traits.includes('Initiative')) throw new Error('E: Everest traits must be filled by migration');
if (!SE.mech.coreDesc.includes('Power Up')) throw new Error('E: Everest core desc must be filled by migration');

// PHASE H: migration of old string licenses
const storeH = {};
storeH['lancer-tracker-v1'] = JSON.stringify({ pilot: { name: 'Test', licenses: 'Blackbeard II, Goblin I' }, mech: { frame: 'Everest' }, weapons: [], statuses: [] });
let rH = runEval(storeH);
let SH = rH.S;
if (SH.pilot.licenses.length !== 2 || SH.pilot.licenses[0].name !== 'Blackbeard' || SH.pilot.licenses[0].rank !== 2 || SH.pilot.licenses[1].name !== 'Goblin' || SH.pilot.licenses[1].rank !== 1) throw new Error('H: string licenses should parse to [{Blackbeard,2},{Goblin,1}], got ' + JSON.stringify(SH.pilot.licenses));
if (SH.settings.licenseFilter !== true) throw new Error('H: settings.licenseFilter should default true');
const storeH2 = {};
storeH2['lancer-tracker-v1'] = JSON.stringify({ pilot: { licenses: 'some nonsense' }, mech: {}, weapons: [], statuses: [] });
let rH2 = runEval(storeH2);
let SH2 = rH2.S;
if (SH2.pilot.licenses.length !== 0) throw new Error('H: unparsable licenses should become []');
if (SH2.pilot.licensesNote !== 'some nonsense') throw new Error('H: unparsable licenses text should be kept in licensesNote');

// PHASE I: Limited charges + SP label (fresh eval)
let rI = runEval({});
let elI = rI.elements, XI = rI.X, SI = rI.S, DBI = rI.DB;
const pb = DBI.systems.find(x => x.n === 'Pattern-B HEX Charges');
const t3 = DBI.systems.find(x => x.n === 'Type-3 Projected Shield');
const daisy = DBI.weapons.find(w => w.n === 'Daisy Cutter');
const ar = DBI.weapons.find(w => w.n === 'Assault Rifle');
if (pb.lim !== 3) throw new Error('I: Pattern-B HEX Charges lim should be 3');
if (t3.lim !== 0) throw new Error('I: Type-3 Projected Shield lim should be 0');
if (daisy.lim !== 2) throw new Error('I: Daisy Cutter lim should be 2');
if (ar.lim !== 0) throw new Error('I: Assault Rifle lim should be 0');
if (DBI.weapons.find(w => w.n === 'Prototype Weapon I').lim !== 0) throw new Error('I: Prototype Weapon lim should be 0 (dice val, not charges)');
if (XI.sysLim(SI.systems[0]) !== 3) throw new Error('I: sysLim should derive 3 from DB by name');
if (XI.sysLeft(SI.systems[0]) !== 3) throw new Error('I: sysLeft should default to full (3)');
let sysHtml = elI['systems'].innerHTML;
if ((sysHtml.match(/Limited 3/g) || []).length !== 1) throw new Error('I: exactly one Limited-3 charges row should render for the starter systems');
if (!sysHtml.includes('SP 2')) throw new Error('I: SP must show as a visible static label (SP 2) for book systems');
if (sysHtml.includes('Limited 0')) throw new Error('I: no charges row should render for non-Limited systems');
// stepper clamps
XI.stepSysCharges(0, -1); if (XI.sysLeft(SI.systems[0]) !== 2) throw new Error('I: stepSysCharges -1 should give 2');
XI.stepSysCharges(0, -1); XI.stepSysCharges(0, -1); XI.stepSysCharges(0, -1);
if (XI.sysLeft(SI.systems[0]) !== 0) throw new Error('I: charges must clamp at 0');
XI.stepSysCharges(0, 1); XI.stepSysCharges(0, 1); XI.stepSysCharges(0, 1); XI.stepSysCharges(0, 1);
if (XI.sysLeft(SI.systems[0]) !== 3) throw new Error('I: charges must clamp at max (3)');
// full repair restores charges
XI.stepSysCharges(0, -2);
XI.fullRepair();
if (XI.sysLeft(SI.systems[0]) !== 3) throw new Error('I: fullRepair must restore Limited charges');
// weapons: Daisy Cutter gets a charges row, Assault Rifle does not
const daisyIdx = DBI.weapons.findIndex(w => w.n === 'Daisy Cutter');
XI.addWeaponByIndex(0, daisyIdx);
const arIdx = DBI.weapons.findIndex(w => w.n === 'Assault Rifle');
XI.addWeaponByIndex(0, arIdx);
let mountsHtml = elI['mounts'].innerHTML;
if (!mountsHtml.includes('Limited 2')) throw new Error('I: Daisy Cutter row must show a Limited-2 charges row');
if ((mountsHtml.match(/Limited 2: заряды/g) || []).length !== 1) throw new Error('I: only the Daisy Cutter row should have a charges row');
const mi0 = SI.mounts[0].weapons.findIndex(w => w.name === 'Daisy Cutter');
XI.stepWeapCharges(0, mi0, -1);
if (XI.weapLeft(SI.mounts[0].weapons[mi0]) !== 1) throw new Error('I: stepWeapCharges -1 should give 1');
XI.stepWeapCharges(0, mi0, -1); XI.stepWeapCharges(0, mi0, -1);
if (XI.weapLeft(SI.mounts[0].weapons[mi0]) !== 0) throw new Error('I: weapon charges must clamp at 0');
XI.fullRepair();
if (XI.weapLeft(SI.mounts[0].weapons[mi0]) !== 2) throw new Error('I: fullRepair must restore weapon charges');
// addSystemByIndex sets left for Limited systems
const aegisIdx = DBI.systems.findIndex(x => x.n === 'Aegis Shield Generator');
XI.addSystemByIndex(aegisIdx);
const addedSys = SI.systems[SI.systems.length - 1];
if (addedSys.left !== 1) throw new Error('I: adding a Limited-1 system must set left=1');

// PHASE J: combat-reference blocks live in the Combat resources card, not in Rules
// (count in the static HTML only: the STR dict in <script> repeats the same RU strings)
const staticHtml = html.split('<script>')[0];
for (const s of ['>Оверчардж</summary>', '>Таблица потери структуры (Structure)</summary>',
  '>Таблица перегрева реактора (Stress)</summary>', '>Отдых и полный ремонт</summary>']) {
  if (staticHtml.split(s).length - 1 !== 1) throw new Error('J: ' + s + ' must occur exactly once');
  const pos = staticHtml.indexOf(s);
  if (!(staticHtml.indexOf('Ресурсы боя') < pos && pos < staticHtml.indexOf('id="tab-pilot"'))) throw new Error('J: ' + s + ' must live inside the Combat resources card');
}

// PHASE K: talents — DB, search, add, rank description, name-input bug fix
const { X: XK, S: SK, DB: DBK, elements: elK } = runEval({});
if (DBK.talents.length !== 29) throw new Error('K: DB must hold 29 talents');
const ace = DBK.talents.find(t=>t.n==='Ace');
if (!ace || ace.r.length !== 3 || !ace.t) throw new Error('K: Ace must have terse + 3 ranks');
if (ace.d.some(d=>d.includes('<'))) throw new Error('K: talent rank descs must be plain text');
if (!XK.talentMatches(ace, 'ace supersonic')) throw new Error('K: multi-word talent search must match name+rank');
if (XK.talentMatches(ace, 'ace crack')) throw new Error('K: talent search must AND the words');
XK.addTalentByIndex(DBK.talents.findIndex(t=>t.n==='Ace'));
const lastT = SK.talents[SK.talents.length - 1];
if (lastT.name !== 'Ace' || lastT.rank !== 1) throw new Error('K: adding Ace must append {name:Ace, rank:1}');
const rd = XK.talentRankDesc(lastT);
if (!rd || rd.n !== 'Акробатика' || !rd.d.includes('ловкости')) throw new Error('K: rank I desc of Ace must be Acrobatics (Акробатика in RU)');
XK.showTalentResults('ace');
if ((elK['talentResults'].innerHTML.match(/class="dbrow"/g) || []).length < 1) throw new Error('K: search for ace must show results');
// the name input must not clobber the rank (old bug: its onchange set rank=+name)
XK.fillTalentFromDb(0, 'Crack Shot');
if (SK.talents[0].name !== 'Crack Shot' || SK.talents[0].rank !== 1) throw new Error('K: filling a talent name must keep the rank');
if ((html.match(/S\.talents\[\$\{i\}\]\.rank=\+this\.value/g) || []).length !== 1) throw new Error('K: only the rank select may set rank=+value');

// PHASE L: weapon tag chips + tag reference dialog
if (Object.keys(DBK.tags).length !== 67) throw new Error('L: DB must hold 67 tag definitions');
const rel = DBK.tags['tg_reliable'];
if (!rel || !rel.d.includes('{VAL}')) throw new Error('L: Reliable tag must carry a {VAL} description');
if (XK.tagLabel('tg_reliable', 2) !== 'Надёжное 2') throw new Error('L: tagLabel must substitute {VAL} (Надёжное 2 in RU)');
if (XK.tagLabel('tg_accurate', null) !== 'Точное') throw new Error('L: tagLabel without val must drop {VAL} (Точное in RU)');
const arW = DBK.weapons.find(w=>w.n==='Assault Rifle');
if (JSON.stringify(arW.tg) !== JSON.stringify([['tg_reliable', 2]])) throw new Error('L: Assault Rifle tg must be [[tg_reliable, 2]]');
if (arW.x.startsWith('Reliable')) throw new Error('L: weapon desc must not start with the tags line anymore');
XK.addWeaponByIndex(0, DBK.weapons.findIndex(w=>w.n==='Assault Rifle'));
let mountsHtmlL = elK['mounts'].innerHTML;
if (!mountsHtmlL.includes('class="tag"') || !mountsHtmlL.includes('Надёжное 2')) throw new Error('L: Assault Rifle row must show a Reliable 2 tag chip (Надёжное 2 in RU)');
XK.addBlankWeapon(0);
mountsHtmlL = elK['mounts'].innerHTML;
if ((mountsHtmlL.match(/class="tag"/g) || []).length !== 1) throw new Error('L: a custom (blank) weapon must show no tag chips');
XK.showTag('tg_reliable', '2');
if (elK['tagDlgName'].textContent !== 'Надёжное 2') throw new Error('L: tag dialog must show the tag name (Надёжное 2 in RU)');
if (!elK['tagDlgDesc'].textContent.includes('скользящим ударом')) throw new Error('L: tag dialog must show the tag description with {VAL} substituted');
if (!elK['tagDialog']._open) throw new Error('L: showTag must open the tag dialog');

// PHASE M: mount badges — icon + color per mount type
const { X: XM, S: SM, DB: DBM, elements: elM } = runEval({});
for (const t of XM.MOUNT_TYPES) {
  if (!XM.MOUNT_STYLE[t] || !XM.MOUNT_STYLE[t].icon || !XM.MOUNT_STYLE[t].color) throw new Error('M: MOUNT_STYLE must cover ' + t);
}
XM.applyFrame('Blackbeard');
let mountsM = elM['mounts'].innerHTML;
for (const [type, icon, color] of [['Flex', '⇄', '#9B59B6'], ['Main', '▶', '#5B9BD5'], ['Heavy', '■', '#ED7D31']]) {
  if (!mountsM.includes(icon) || !mountsM.includes(color)) throw new Error('M: ' + type + ' mount must show its badge icon and color');
}
SM.mounts[0].type = 'Superheavy'; XM.renderLists();
mountsM = elM['mounts'].innerHTML;
if (!mountsM.includes('⬢') || !mountsM.includes('#C0392B')) throw new Error('M: changing the mount type must re-render its badge');

// PHASE N: SP is fixed text for book systems, editable only for custom ones;
// Limited charges render as a stepper only where the system has them
const { X: XN, S: SN, DB: DBN, elements: elN } = runEval({});
const sysHtmlN = elN['systems'].innerHTML;
if ((sysHtmlN.match(/type="number"/g) || []).length !== 0) throw new Error('N: book systems must not show an editable SP input');
if ((sysHtmlN.match(/SP 2/g) || []).length !== 3) throw new Error('N: the 3 starter systems must show static "SP 2"');
if ((sysHtmlN.match(/Limited 3: заряды/g) || []).length !== 1) throw new Error('N: only Pattern-B (Limited 3) must show a charges stepper');
SN.systems[0].sp = 99; // tampered save must not change a book system's SP
if (XN.sysSp(SN.systems[0]) !== 2) throw new Error('N: sysSp must take the book value for a DB system');
XN.renderLists();
if (!elN['spCounter'].textContent.includes('использовано 6 из 6')) throw new Error('N: the SP counter must use book values, not the tampered save');
SN.systems.push({ name: 'My Custom System', sp: 3, desc: '' });
XN.renderLists();
const sysHtmlN2 = elN['systems'].innerHTML;
if ((sysHtmlN2.match(/type="number"/g) || []).length !== 1) throw new Error('N: exactly one SP input must appear — for the custom system');
if (XN.sysSp(SN.systems[SN.systems.length - 1]) !== 3) throw new Error('N: sysSp must take the save value for a custom system');

// PHASE O: RUS/ENG toggle — RU fields, bilingual search, display switching
const { X: XO, S: SO, DB: DBO, elements: elO } = runEval({});
// RU-поля есть у каждой позиции базы
for (const w of DBO.weapons) if (!w.nr || !w.xr) throw new Error('O: every weapon must have RU fields');
for (const s of DBO.systems) if (!s.nr || !s.xr) throw new Error('O: every system must have RU fields');
for (const t of DBO.talents) if (!t.nr || !t.rr || !t.dr || t.rr.length !== 3) throw new Error('O: every talent must have RU fields');
for (const id of Object.keys(DBO.tags)) if (!DBO.tags[id].nr || !DBO.tags[id].dr) throw new Error('O: every tag must have RU fields');
for (const k of Object.keys(DBO.frames)) if (!DBO.frames[k].nr || !DBO.frames[k].cr) throw new Error('O: every frame must have RU fields');
if (XO.lang() !== 'ru') throw new Error('O: default language must be ru');
if (XO.L('not_found') !== 'Ничего не найдено') throw new Error('O: L() must return RU by default');
// поиск на любом языке независимо от отображения: RU-запрос в RU-режиме
if (!XO.weaponMatches(DBO.weapons.find(w=>w.n==='Assault Rifle'), 'штурмовая')) throw new Error('O: RU query must match the RU weapon name');
if (!XO.weaponMatches(DBO.weapons.find(w=>w.n==='Assault Rifle'), 'assault')) throw new Error('O: EN query must match the EN weapon name');
if (!XO.talentMatches(DBO.talents.find(t=>t.n==='Ace'), 'ас')) throw new Error('O: RU query must match the RU talent name');
if (!XO.talentMatches(DBO.talents.find(t=>t.n==='Ace'), 'ace')) throw new Error('O: EN query must match the EN talent name');
if (!XO.systemMatches(DBO.systems.find(s=>s.n==='Pattern-B HEX Charges'), 'заряды')) throw new Error('O: RU query must match the RU system name');
// переключение на EN: отображение меняется, сохранение — нет
XO.setLang('en');
if (XO.lang() !== 'en') throw new Error('O: setLang must switch the language');
if (XO.L('not_found') !== 'Nothing found') throw new Error('O: L() must return EN after the switch');
if (XO.td(DBO.talents.find(t=>t.n==='Ace')).n !== 'Ace') throw new Error('O: td() must show EN names in EN mode');
if (XO.tagLabel('tg_reliable', 2) !== 'Reliable 2') throw new Error('O: tagLabel must show EN in EN mode');
// поиск на русском продолжает работать в EN-режиме
if (!XO.weaponMatches(DBO.weapons.find(w=>w.n==='Assault Rifle'), 'штурмовая')) throw new Error('O: RU query must still match in EN mode');
if (!XO.talentMatches(DBO.talents.find(t=>t.n==='Ace'), 'ас')) throw new Error('O: RU talent query must still match in EN mode');
// ввод русского имени в поле подставляет английский ключ в сохранение
XO.addBlankWeapon(0);
XO.fillWeaponFromDb(0, 0, 'Штурмовая винтовка');
if (SO.mounts[0].weapons[0].name !== 'Assault Rifle') throw new Error('O: filling a RU weapon name must store the EN key');
XO.fillSystemFromDb(0, 'Заряды HEX образца Б');
if (SO.systems[0].name !== 'Pattern-B HEX Charges') throw new Error('O: filling a RU system name must store the EN key');
XO.fillTalentFromDb(0, 'Ас');
if (SO.talents[0].name !== 'Ace') throw new Error('O: filling a RU talent name must store the EN key');
// frameKey разрешает оба языка; переключение обратно
if (XO.frameKey('Чёрная Борода') !== 'Blackbeard') throw new Error('O: frameKey must resolve RU frame names');
if (XO.frameKey('Blackbeard') !== 'Blackbeard') throw new Error('O: frameKey must keep EN frame names');
XO.setLang('ru');
if (XO.lang() !== 'ru' || XO.td(DBO.talents.find(t=>t.n==='Ace')).n !== 'Ас') throw new Error('O: switching back to RU must restore RU names');
// термины: Skirmish — Скирмиш, трейт Nelson Skirmisher — Скирмишер
if (!DBO.systems.find(s=>s.n==='SCYLLA-Class NHP').xr.includes('Скирмиш')) throw new Error('O: SCYLLA RU text must use Скирмиш');
if (!DBO.frames['Nelson'].tr.includes('Скирмишер')) throw new Error('O: Nelson RU trait must be Скирмишер');
if (DBO.systems.find(s=>s.n==='SCYLLA-Class NHP').xr.includes('стычк')) throw new Error('O: no стычка must remain in the RU text');
// mountCap на обоих языках
if (XO.mountCap('Flex') !== '1 Main или 2 Aux') throw new Error('O: mountCap must be RU in RU mode');
XO.setLang('en');
if (XO.mountCap('Flex') !== '1 Main or 2 Aux') throw new Error('O: mountCap must be EN in EN mode');

console.log('SMOKE TEST PASSED: Heat/Stress order, defaults, multi-field search, frame apply (mounts/core/traits/derived stats/integrated weapon), SP counter, systems search, license filter, TDZ regression, license migration, Limited charges, combat-reference blocks, talent search, weapon tag chips, mount badges, fixed SP, RUS/ENG toggle');
