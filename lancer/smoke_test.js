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
    classList: { _s: new Set(),
      toggle(c, f){ if (f === undefined) { this._s.has(c) ? this._s.delete(c) : this._s.add(c); } else if (f) this._s.add(c); else this._s.delete(c); },
      add(c){ this._s.add(c); }, remove(c){ this._s.delete(c); }, contains(c){ return this._s.has(c); } },
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
  + 'toggleEdit:toggleEdit,editOn:editOn,'
  + 'openSearch:openSearch,closeSearchDlg:closeSearchDlg,renderSearchResults:renderSearchResults,'
  + 'showLicenseResults:showLicenseResults,addLicenseByName:addLicenseByName,'
  + 'openCustomWeaponDlg:openCustomWeaponDlg,addCustomWeapon:addCustomWeapon,'
  + 'openCustomSystemDlg:openCustomSystemDlg,addCustomSystem:addCustomSystem,'
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
  + 'dispVal:dispVal,dispField:dispField,mountCap:mountCap,STR:STR,L:L,'
  + 'frameMatches:frameMatches,showFrameResults:showFrameResults,pickFrame:pickFrame,'
  + 'frameLabel:frameLabel,'
  + 'descBox:descBox,editDesc:editDesc,toggleDesc:toggleDesc,closeDesc:closeDesc,renderDescBoxes:renderDescBoxes,'
  + 'frameAvailable:frameAvailable,toggleLicenseFilter:toggleLicenseFilter,'
  + 'TRIGGERS:TRIGGERS,findTrigger:findTrigger,trigDisp:trigDisp,triggerMatches:triggerMatches,'
  + 'showTriggerResults:showTriggerResults,addTriggerByName:addTriggerByName};';
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
X.applyFrame('Blackbeard');
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
X.applyFrame('Lancaster');
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
X.showFrameResults('');
if (!elA['frameResults'].innerHTML.includes('Эверест')) throw new Error('G: frame picker must include Everest (Эверест in RU)');
if (elA['frameResults'].innerHTML.includes('Чёрная Борода')) throw new Error('G: frame picker must NOT include Blackbeard at rank I');
if (elA['licenseRankSum'].textContent !== '1') throw new Error('G: license rank sum should be 1');
if (elA['licenseRankSum'].style.color !== '#ff6b6b') throw new Error('G: rank sum should be red when it differs from LL (0)');
// rank 2: frame + LL2 gear yes, LL3 other licenses no
S.pilot.licenses[0].rank = 2; X.save(); X.renderLists();
if (!X.frameAvailable('Blackbeard')) throw new Error('G: Blackbeard frame must be available at rank II');
if (!X.itemAvailable(bristleG)) throw new Error('G: Bristlecrown must be available at rank II');
if (X.itemAvailable(railgunG)) throw new Error('G: Railgun (Deaths Head LL3) must NOT be available');
X.showFrameResults('');
if (!elA['frameResults'].innerHTML.includes('Чёрная Борода')) throw new Error('G: frame picker must include Blackbeard at rank II');
// unlicensed weapons must not appear in search results at all
X.showWeaponResults(0, 'vijaya');
box = elA['mountResults-0'].innerHTML;
if ((box.match(/class="dbrow"/g) || []).length !== 0) throw new Error('G: unlicensed Vijaya Rockets must not appear in search results');
// applyFrame with unlicensed frame must warn in the confirm text
gA.confirmCalls.length = 0;
X.applyFrame('Tokugawa');
if (!gA.confirmCalls.some(m => /нет лицензии/.test(m))) throw new Error('G: applyFrame must warn about missing license');
// filter OFF: everything available, frames datalist full
X.toggleLicenseFilter(false);
if (!X.itemAvailable(railgunG)) throw new Error('G: with filter OFF, Railgun must be available');
if (!X.frameAvailable('Tokugawa')) throw new Error('G: with filter OFF, Tokugawa must be available');
// пикер с выключенным фильтром находит все 29 фреймов
X.showFrameResults('');
if (!elA['frameResults'].innerHTML.includes('Показано 8 из 29')) throw new Error('G: with filter OFF, frame picker must find all 29 frames');
if (!elA['frameResults'].innerHTML.includes('Эверест')) throw new Error('G: frame picker must show Everest with filter OFF');
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
if (!sysHtml.includes('2 SP')) throw new Error('I: SP must show in the system meta line (2 SP) for book systems');
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
SK.mounts[0].weapons.push({name:'My Custom Gun', dmg:'1d6', range:'10', desc:''});
XK.renderLists();
mountsHtmlL = elK['mounts'].innerHTML;
if ((mountsHtmlL.match(/class="tag"/g) || []).length !== 1) throw new Error('L: a custom weapon must show no tag chips');
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
if ((sysHtmlN.match(/2 SP/g) || []).length !== 3) throw new Error('N: the 3 starter systems must show their SP in the meta line (2 SP each)');
if ((sysHtmlN.match(/Limited 3: заряды/g) || []).length !== 1) throw new Error('N: only Pattern-B (Limited 3) must show a charges stepper');
SN.systems[0].sp = 99; // tampered save must not change a book system's SP
if (XN.sysSp(SN.systems[0]) !== 2) throw new Error('N: sysSp must take the book value for a DB system');
XN.renderLists();
if (!elN['spCounter'].textContent.includes('использовано 6 из 6')) throw new Error('N: the SP counter must use book values, not the tampered save');
SN.systems.push({ name: 'My Custom System', sp: 3, desc: '' });
XN.renderLists();
const sysHtmlN2 = elN['systems'].innerHTML;
if ((sysHtmlN2.match(/type="number"/g) || []).length !== 0) throw new Error('N: no SP input must appear — even for a custom system (display-only)');
if (!sysHtmlN2.includes('SP 3')) throw new Error('N: the custom system must show its SP as text (SP 3)');
if (!sysHtmlN2.includes('Кастомная система')) throw new Error('N: the custom system must be labelled as custom');
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
// имя, сохранённое по-русски, разрешается при отображении (поиск и пикер хранят EN-ключ)
SO.mounts[0].weapons.push({name:'Штурмовая винтовка', dmg:'', range:'', desc:''});
XO.renderLists();
if (!elO['mounts'].innerHTML.includes('Assault Rifle')) throw new Error('O: a RU-stored weapon name must resolve to EN in EN mode');
XO.setLang('ru');
if (!elO['mounts'].innerHTML.includes('Штурмовая винтовка')) throw new Error('O: a RU-stored weapon name must display in RU mode');
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

// PHASE P: v17 — корпорация и роль фреймов, двуязычные datalist'ы, компонент описания, фикс dispField
const { X: XP, S: SP2, DB: DBP, elements: elP, g: gP } = runEval({});
// корпорация и роль в базе фреймов
if (DBP.frames['Blackbeard'].src !== 'IPS-N' || DBP.frames['Blackbeard'].role[0] !== 'Striker' || DBP.frames['Blackbeard'].roler[0] !== 'Штурмовик') throw new Error('P: Blackbeard must carry IPS-N / Striker / Штурмовик');
if (DBP.frames['Tortuga'].role.join() !== 'Defender,Striker' || DBP.frames['Tortuga'].roler.join() !== 'Защитник,Штурмовик') throw new Error('P: Tortuga must carry two roles');
if (DBP.frames['Everest'].role[0] !== 'Balanced' || DBP.frames['Everest'].roler[0] !== 'Универсал') throw new Error('P: Everest must be Balanced / Универсал');
if (DBP.frames['Death’s Head'].src !== 'SSC' || DBP.frames['Death’s Head'].sf !== 'Smith-Shimano') throw new Error('P: Death’s Head must carry SSC / Smith-Shimano');
// поиск фреймов: корпорация, роль, оба языка
if (!XP.frameMatches('Blackbeard', 'ips-n')) throw new Error('P: frame search must match the corporation code');
if (!XP.frameMatches('Death’s Head', 'smith-shimano')) throw new Error('P: frame search must match the full corporation name');
if (!XP.frameMatches('Blackbeard', 'штурмовик')) throw new Error('P: frame search must match the RU role');
if (!XP.frameMatches('Blackbeard', 'striker')) throw new Error('P: frame search must match the EN role');
if (!XP.frameMatches('Death’s Head', 'артиллерия')) throw new Error('P: frame search must match the RU role Artillery');
if (!XP.frameMatches('Blackbeard', 'чёрная борода')) throw new Error('P: frame search must match the RU name');
if (!XP.frameMatches('Blackbeard', 'll2')) throw new Error('P: frame search must match LL');
if (XP.frameMatches('Blackbeard', 'артиллерия')) throw new Error('P: frame search must not match a wrong role');
if (XP.frameLabel(DBP.frames['Blackbeard']) !== 'IPS-N · Штурмовик · LL2') throw new Error('P: frame label must be corp, RU role, LL in RU mode');
// результаты поиска фреймов: фильтр лицензий + корпорация и роль в строке
XP.toggleLicenseFilter(false);
XP.showFrameResults('штурмовик');
let frBox = elP['frameResults'].innerHTML;
if (!frBox.includes('Чёрная Борода') || !frBox.includes('IPS-N') || !frBox.includes('Штурмовик')) throw new Error('P: frame results must show the RU name, corporation and role');
if (!frBox.includes('Нельсон') || !frBox.includes('Тортуга')) throw new Error('P: frame results for штурмовик must include Nelson and Tortuga');
XP.showFrameResults('xyz-no-such-frame');
if (!elP['frameResults'].innerHTML.includes('Ничего не найдено')) throw new Error('P: frame results must show not-found for an unknown query');
// pickFrame: ставит фрейм и применяет его (confirm в стабе = true)
XP.pickFrame('Blackbeard');
if (SP2.mech.frame !== 'Blackbeard') throw new Error('P: pickFrame must set mech.frame');
if (SP2.mounts.map(m=>m.type).join() !== DBP.frames['Blackbeard'].m.join()) throw new Error('P: pickFrame must apply the frame mounts');
// поиск лицензий — в модалке (v25): двуязычный, без Эвереста, с корпорацией
XP.showLicenseResults('', null, 20);
let licBox = elP['licenseResults'].innerHTML;
if (!licBox.includes('Blackbeard') || !licBox.includes('Чёрная Борода')) throw new Error('P: license search must offer EN and RU names in RU mode');
if (!licBox.includes('IPS-N')) throw new Error('P: license search must show the corporation');
if (licBox.includes('Эверест') || licBox.includes('Everest')) throw new Error('P: license search must not offer Everest (no license needed)');
XP.showLicenseResults('штурмовик', null, 20);
if (!elP['licenseResults'].innerHTML.includes('Чёрная Борода')) throw new Error('P: license search must match the RU role');
XP.setLang('en');
XP.showLicenseResults('чёрная борода', null, 20);
licBox = elP['licenseResults'].innerHTML;
if (!licBox.includes('Blackbeard')) throw new Error('P: license search must find Blackbeard by its RU name in EN mode');
XP.setLang('ru');
// выбор лицензии в модалке добавляет строку с рангом I
const nLicBefore = SP2.pilot.licenses.length;
XP.addLicenseByName('Blackbeard');
if (SP2.pilot.licenses.length !== nLicBefore + 1 || SP2.pilot.licenses[SP2.pilot.licenses.length-1].name !== 'Blackbeard' || SP2.pilot.licenses[SP2.pilot.licenses.length-1].rank !== 1) throw new Error('P: addLicenseByName must add the license with rank I');
// поиск талантов двуязычный: по EN-имени находится, показывается RU
XP.showTalentResults('ace');
if (!elP['talentResults'].innerHTML.includes('Ас')) throw new Error('P: talent search must find Ace by its EN name');
// фикс dispField (v15): Core System / описание / трейты переводятся в RU-режиме
// (фрейм сейчас Blackbeard — после pickFrame выше)
if (XP.dispField('mech.coreSystem') !== DBP.frames['Blackbeard'].cr) throw new Error('P: dispField coreSystem must be RU in RU mode');
if (XP.dispField('mech.traits') !== DBP.frames['Blackbeard'].tr) throw new Error('P: dispField traits must be RU in RU mode');
if (XP.dispField('mech.coreDesc') !== DBP.frames['Blackbeard'].cdr) throw new Error('P: dispField coreDesc must be RU in RU mode');
XP.setLang('en');
if (XP.dispField('mech.coreSystem') !== DBP.frames['Blackbeard'].c) throw new Error('P: dispField coreSystem must be EN in EN mode');
if (XP.dispField('mech.traits') !== DBP.frames['Blackbeard'].t) throw new Error('P: dispField traits must be EN in EN mode');
XP.setLang('ru');
// компонент описания: <details> вместо textarea, правка по кнопке
XP.addWeaponByIndex(0, DBP.weapons.findIndex(w=>w.n==='Assault Rifle'));
const mountsHtmlP = elP['mounts'].innerHTML;
if (!mountsHtmlP.includes('<details class="desc"')) throw new Error('P: weapon rows must render the description as <details>');
if (!mountsHtmlP.includes('Штурмовая винтовка')) throw new Error('P: weapon rows must keep the RU weapon name');
if (!mountsHtmlP.includes('1d6 кинетический')) throw new Error('P: weapon rows must keep the RU damage text');
const sysHtmlP = elP['systems'].innerHTML;
if (!sysHtmlP.includes('<details class="desc"')) throw new Error('P: system rows must render the description as <details>');
if (!sysHtmlP.includes('2 SP')) throw new Error('P: system rows must keep the SP text in the meta line');
if (!elP['coreDescBox'].innerHTML.includes('<details class="desc"')) throw new Error('P: coreDesc must render as <details>');
if (!elP['coreDescBox'].innerHTML.includes('Штурмовая гарпунная система')) throw new Error('P: coreDesc box must show the RU core description');
if (!elP['traitsBox'].innerHTML.includes('Гарпунный трос')) throw new Error('P: traits box must show the RU traits');
XP.editDesc('coreDesc');
if (!elP['coreDescBox'].innerHTML.includes('id="editingDesc"')) throw new Error('P: editDesc must show the editing textarea for Core System');
// подпись под заголовком переводится
if (XP.L('u146') !== 'Мех, пилот, правила. Данные хранятся только в этом браузере (localStorage).') throw new Error('P: u146 RU tagline must exist');
XP.setLang('en');
if (XP.L('u146') !== 'Mech, pilot, rules. Data is stored only in this browser (localStorage).') throw new Error('P: u146 EN tagline must exist');

// PHASE Q: v18 — поиск триггеров + фикс переполнения описания на телефоне
const { X: XQ, S: SQ, DB: DBQ, elements: elQ, g: gQ } = runEval({});
if (XQ.TRIGGERS.length !== 22) throw new Error('Q: TRIGGERS must have 22 core-book triggers');
if (!XQ.TRIGGERS.every(t=>t.en && t.ru)) throw new Error('Q: every trigger must have EN and RU names');
const gsw = XQ.TRIGGERS.find(t=>t.en==='Get Somewhere Quickly');
if (!gsw || gsw.alt !== 'Get Somewhere Fast' || gsw.ru !== 'Быстро добраться') throw new Error('Q: Get Somewhere Quickly must carry the Fast alias and RU name');
if (!XQ.triggerMatches(gsw, 'быстро')) throw new Error('Q: trigger search must match the RU name');
if (!XQ.triggerMatches(gsw, 'fast')) throw new Error('Q: trigger search must match the Fast alias');
if (!XQ.triggerMatches(XQ.TRIGGERS.find(t=>t.en==='Apply Fists to Faces'), 'морды')) throw new Error('Q: trigger search must match the RU name');
if (!XQ.triggerMatches(XQ.TRIGGERS.find(t=>t.en==='Charm'), 'charm')) throw new Error('Q: trigger search must match the EN name in RU mode');
if (XQ.triggerMatches(XQ.TRIGGERS.find(t=>t.en==='Charm'), 'угрожать')) throw new Error('Q: trigger search must not match a wrong trigger');
if (XQ.trigDisp('Бить морды') !== 'Бить морды') throw new Error('Q: trigDisp must show the RU name in RU mode');
XQ.setLang('en');
if (XQ.trigDisp('Бить морды') !== 'Apply Fists to Faces') throw new Error('Q: trigDisp must resolve the RU name to EN in EN mode');
if (XQ.trigDisp('Apply Fists to Faces') !== 'Apply Fists to Faces') throw new Error('Q: trigDisp must show the EN name in EN mode');
if (XQ.trigDisp('My Custom Trigger') !== 'My Custom Trigger') throw new Error('Q: trigDisp must pass custom triggers through');
XQ.setLang('ru');
XQ.showTriggerResults('угр');
if (!elQ['triggerResults'].innerHTML.includes('Угрожать')) throw new Error('Q: trigger results must show the RU name for угр');
if (!elQ['triggerResults'].innerHTML.includes('Threaten')) throw new Error('Q: trigger results must show the EN name as a hint');
const nTrigBefore = SQ.triggers.length;
XQ.addTriggerByName('Spot');
if (SQ.triggers.length !== nTrigBefore + 1) throw new Error('Q: addTriggerByName must add a trigger');
if (SQ.triggers[SQ.triggers.length-1].name !== 'Spot' || SQ.triggers[SQ.triggers.length-1].bonus !== 2) throw new Error('Q: added trigger must store the EN name with +2');
if (!elQ['triggers'].innerHTML.includes('Замечать')) throw new Error('Q: added trigger must display in RU');
// CSS: превью описания не должно раздувать карточку (v18, баг с телефона)
if (!staticHtml.includes('.desc-preview { color:var(--dim); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0; flex:1 1 auto; }')) throw new Error('Q: desc preview must have min-width:0 to shrink');
if (!staticHtml.includes('.core-grid > * { min-width:0; }')) throw new Error('Q: core-grid children must have min-width:0');
if (!staticHtml.includes('details.desc { border:1px solid var(--line); border-radius:6px; padding:8px 10px; background:var(--panel2); min-width:0; }')) throw new Error('Q: details.desc must have min-width:0');

// PHASE R: v20 — фрейм переехал на вкладку пилота, на вкладке меха — только текст
const mechIdx = staticHtml.indexOf('id="tab-mech"');
const pilotIdx = staticHtml.indexOf('id="tab-pilot"');
if (mechIdx < 0 || pilotIdx < 0 || pilotIdx < mechIdx) throw new Error('R: tabs must be present in order');
if (staticHtml.includes('data-f="mech.frame"')) throw new Error('R: mech.frame must not be an editable input anymore');
if (staticHtml.includes('id="frames"')) throw new Error('R: frames datalist must be gone');
if (!staticHtml.includes('id="mechFrameName"')) throw new Error('R: Mech tab must show the frame name read-only');
if (staticHtml.includes('id="framePick"')) throw new Error('R: the frame picker input must be gone (search is in the modal now)');
if (staticHtml.includes('applyFrame()')) throw new Error('R: the Apply Frame button must be gone');
if (!staticHtml.includes("openSearch('frame')")) throw new Error('R: the frame section must have a search icon opening the modal');
const { X: XR, S: SR, elements: elR, g: gR } = runEval({});
SR.pilot.licenses.push({name:'Blackbeard', rank:2}); XR.save(); XR.renderLists();
XR.pickFrame('Blackbeard');
if (SR.mech.frame !== 'Blackbeard') throw new Error('R: pickFrame must set mech.frame');
if (elR['mechFrameName'].textContent !== 'Чёрная Борода') throw new Error('R: Mech tab must show the frame name in RU');
// applyFrame — только с явным аргументом (из модалки через pickFrame)
gR.confirmCalls.length = 0;
XR.applyFrame('Swallowtail');
if (!gR.confirmCalls.some(m => /нет лицензии/.test(m))) throw new Error('R: applyFrame must warn about missing license');
if (SR.mech.frame !== 'Swallowtail') throw new Error('R: applyFrame must apply the frame');
if (elR['mechFrameName'].textContent !== 'Махаон') throw new Error('R: Mech tab must show the new frame name in RU');
// пустой аргумент — ничего не делает
gR.confirmCalls.length = 0;
XR.applyFrame('');
if (gR.confirmCalls.length !== 0) throw new Error('R: applyFrame with an empty name must do nothing');
if (SR.mech.frame !== 'Swallowtail') throw new Error('R: empty applyFrame must not change the frame');

// PHASE S: v21 — оружие и системы только для просмотра; кастомные — через модалку
const { X: XS, S: SS, DB: DBS, elements: elS, g: gS } = runEval({});
// в карточках систем нет input'ов — только текст, SP, мета и описание
let sysHtmlS = elS['systems'].innerHTML;
if (sysHtmlS.includes('<input')) throw new Error('S: system rows must not contain inputs');
if (!sysHtmlS.includes('Заряды HEX образца Б')) throw new Error('S: system rows must show the RU name');
if (!sysHtmlS.includes('Развёртываемое')) throw new Error('S: system rows must show the system type (meta info)');
if (!sysHtmlS.includes('GMS · LL0 · 2 SP')) throw new Error('S: system rows must show the corporation/license/SP (meta info)');
if (!sysHtmlS.includes('2 SP')) throw new Error('S: system rows must show the SP in the meta line');
if (!sysHtmlS.includes('<details class="desc"')) throw new Error('S: system rows must render the description as <details>');
if (sysHtmlS.includes('✎')) throw new Error('S: system descriptions must not offer editing');
// в карточках оружия нет input'ов — урон, дальность и теги только текстом
XS.addWeaponByIndex(0, DBS.weapons.findIndex(w=>w.n==='Assault Rifle'));
let mountsHtmlS = elS['mounts'].innerHTML;
if ((mountsHtmlS.match(/<input/g) || []).length !== 0) throw new Error('S: weapon rows must not contain inputs (the search is in the modal now)');
if (!mountsHtmlS.includes('Штурмовая винтовка')) throw new Error('S: weapon rows must show the RU name');
if (!mountsHtmlS.includes('1d6 кинетический')) throw new Error('S: weapon rows must show the damage as text');
if (!mountsHtmlS.includes('Дальность 10')) throw new Error('S: weapon rows must show the range as text');
if (!mountsHtmlS.includes('GMS · LL0 · Main')) throw new Error('S: weapon rows must show the corporation/license (meta info)');
if (!mountsHtmlS.includes('Надёжное 2')) throw new Error('S: weapon rows must keep the tag chips');
if (!mountsHtmlS.includes('<details class="desc"')) throw new Error('S: weapon rows must render the description as <details>');
if (mountsHtmlS.includes('✎')) throw new Error('S: weapon descriptions must not offer editing');
// модалка кастомного оружия
XS.openCustomWeaponDlg(0);
if (!elS['customWeaponDlg']._open) throw new Error('S: openCustomWeaponDlg must open the dialog');
elS['cwName'].value = 'My Custom Gun'; elS['cwDmg'].value = '2d6'; elS['cwRange'].value = '15'; elS['cwDesc'].value = 'Custom effect';
XS.addCustomWeapon();
if (SS.mounts[0].weapons[SS.mounts[0].weapons.length-1].name !== 'My Custom Gun') throw new Error('S: addCustomWeapon must add the entered weapon');
if (!elS['mounts'].innerHTML.includes('My Custom Gun')) throw new Error('S: the custom weapon must display');
if (!elS['mounts'].innerHTML.includes('Кастомное оружие')) throw new Error('S: the custom weapon must be labelled as custom');
if (elS['customWeaponDlg']._open) throw new Error('S: addCustomWeapon must close the dialog');
// без названия — не добавляется (в стабе alert бросает)
XS.openCustomWeaponDlg(0);
elS['cwName'].value = '';
const nWBefore = SS.mounts[0].weapons.length;
let alerted = false;
try { XS.addCustomWeapon(); } catch (e) { alerted = /Введите название/.test(e.message); }
if (!alerted) throw new Error('S: addCustomWeapon without a name must alert');
if (SS.mounts[0].weapons.length !== nWBefore) throw new Error('S: addCustomWeapon without a name must not add');
// модалка кастомной системы (с Limited)
XS.openCustomSystemDlg();
if (!elS['customSystemDlg']._open) throw new Error('S: openCustomSystemDlg must open the dialog');
elS['csName'].value = 'My Custom System'; elS['csSp'].value = 3; elS['csLim'].value = 2; elS['csDesc'].value = 'Custom system effect';
XS.addCustomSystem();
const cs = SS.systems[SS.systems.length-1];
if (cs.name !== 'My Custom System' || cs.sp !== 3 || cs.lim !== 2 || cs.left !== 2) throw new Error('S: addCustomSystem must store name, SP and Limited charges');
if (!elS['systems'].innerHTML.includes('My Custom System')) throw new Error('S: the custom system must display');
if (!elS['systems'].innerHTML.includes('Кастомная система')) throw new Error('S: the custom system must be labelled as custom');
if (!elS['systems'].innerHTML.includes('Limited 2: заряды')) throw new Error('S: the custom Limited system must show a charges stepper');

// PHASE T: v22 — отклонённый диалог применения фрейма ничего не меняет
const { X: XT, S: ST, DB: DBT, elements: elT, g: gT } = runEval({});
const realConfirm = global.confirm;
global.confirm = () => false;
XT.pickFrame('Blackbeard');
if (ST.mech.frame !== 'Everest') throw new Error('T: dismissing the apply confirm must not change the frame name');
if (ST.mech.coreSystem !== DBT.frames['Everest'].c) throw new Error('T: dismissing the apply confirm must not change the Core System');
if (ST.mech.traits !== DBT.frames['Everest'].t) throw new Error('T: dismissing the apply confirm must not change the traits');
if (ST.mounts.map(m=>m.type).join() !== DBT.frames['Everest'].m.join()) throw new Error('T: dismissing the apply confirm must not change the mounts');
global.confirm = realConfirm;
XT.pickFrame('Blackbeard');
if (ST.mech.frame !== 'Blackbeard') throw new Error('T: accepting the confirm must set the frame');
if (ST.mech.coreSystem !== DBT.frames['Blackbeard'].c) throw new Error('T: accepting the confirm must set the Core System');
if (ST.mech.traits !== DBT.frames['Blackbeard'].t) throw new Error('T: accepting the confirm must set the traits');
if (ST.mounts.map(m=>m.type).join() !== DBT.frames['Blackbeard'].m.join()) throw new Error('T: accepting the confirm must set the mounts');
if (elT['mechFrameName'].textContent !== 'Чёрная Борода') throw new Error('T: the Mech tab must show the new frame name after applying');

// PHASE U: v23 — тоггл редактирования маунтов, талантов и триггеров
const { X: XU, S: SU, DB: DBU, elements: elU, g: gU } = runEval({});
// по умолчанию редактирование включено
if (!XU.editOn('mounts') || !XU.editOn('talents') || !XU.editOn('triggers')) throw new Error('U: editing must be ON by default for all three blocks');
if (!elU['editToggleMounts'].classList.contains('on') || !elU['editToggleTalents'].classList.contains('on') || !elU['editToggleTriggers'].classList.contains('on')) throw new Error('U: edit toggles must be ON by default');
// маунты: выключить — исчезают поиск, удаление, добавление и подсказка
XU.toggleEdit('mounts');
if (XU.editOn('mounts')) throw new Error('U: toggleEdit must turn mounts editing OFF');
if (elU['editToggleMounts'].classList.contains('on')) throw new Error('U: the mounts toggle must switch OFF');
if (elU['weaponsHint'].style.display !== 'none') throw new Error('U: the weapons hint must hide when mounts editing is OFF');
if (elU['addMountBtn'].style.display !== 'none') throw new Error('U: the + Mount button must hide when mounts editing is OFF');
let mountsHtmlU = elU['mounts'].innerHTML;
if (mountsHtmlU.includes("openSearch('weapon'")) throw new Error('U: the weapon search must hide when mounts editing is OFF');
if (mountsHtmlU.includes('Кастомное Оружие')) throw new Error('U: the + Custom Weapon button must hide when mounts editing is OFF');
if (mountsHtmlU.includes('delWeapon') || mountsHtmlU.includes('delMount')) throw new Error('U: delete buttons must hide when mounts editing is OFF');
if (mountsHtmlU.includes('<select')) throw new Error('U: the mount type select must hide when mounts editing is OFF');
if (!mountsHtmlU.includes('<b>Main</b>')) throw new Error('U: the mount type must show as text when mounts editing is OFF');
// оружие остаётся карточкой, степпер Limited — на месте
XU.addWeaponByIndex(0, DBU.weapons.findIndex(w=>w.n==='Assault Rifle'));
mountsHtmlU = elU['mounts'].innerHTML;
if (!mountsHtmlU.includes('Штурмовая винтовка')) throw new Error('U: the weapon card must stay visible in view mode');
if (mountsHtmlU.includes('delWeapon')) throw new Error('U: the weapon delete button must hide in view mode');
// таланты: выключить — строки текстом, без полей и удаления
SU.talents[0].name = 'Ace'; XU.renderLists();
XU.toggleEdit('talents');
if (elU['talentsHint'].style.display !== 'none') throw new Error('U: the talents hint must hide when talents editing is OFF');
if (elU['talentAddRow'].style.display !== 'none') throw new Error('U: the talent search and + Talent button must hide when talents editing is OFF');
let talHtmlU = elU['talents'].innerHTML;
if (talHtmlU.includes('<input') || talHtmlU.includes('<select') || talHtmlU.includes('delRow')) throw new Error('U: talent rows must not contain inputs, selects or delete buttons in view mode');
if (!talHtmlU.includes('Ас I')) throw new Error('U: talent rows must show the name and rank as one text in view mode');
if (talHtmlU.includes('<span class="dim">I</span>')) throw new Error('U: the talent rank must not hang in a separate column in view mode');
// триггеры: выключить — строки текстом; подсказка про правила остаётся
SU.triggers[0].name = 'Act Unseen or Unheard'; XU.renderLists();
XU.toggleEdit('triggers');
if (elU['triggerAddRow'].style.display !== 'none') throw new Error('U: the trigger search and + Trigger button must hide when triggers editing is OFF');
let trigHtmlU = elU['triggers'].innerHTML;
if (trigHtmlU.includes('<input') || trigHtmlU.includes('delRow')) throw new Error('U: trigger rows must not contain inputs or delete buttons in view mode');
if (!trigHtmlU.includes('Действовать незаметно') || !trigHtmlU.includes('+2')) throw new Error('U: trigger rows must show the name and bonus as text in view mode');
// включить обратно — контролы возвращаются
XU.toggleEdit('mounts'); XU.toggleEdit('talents'); XU.toggleEdit('triggers');
if (!XU.editOn('mounts') || !XU.editOn('talents') || !XU.editOn('triggers')) throw new Error('U: toggling back must restore editing');
if (elU['mounts'].innerHTML.includes('<b>Main</b>') && !elU['mounts'].innerHTML.includes('<select')) throw new Error('U: the mount type select must return when mounts editing is ON');
if (!elU['talents'].innerHTML.includes('<input')) throw new Error('U: talent inputs must return when talents editing is ON');

// PHASE V: v24 — тоггл редактирования в остальных блоках
const { X: XV, S: SV, DB: DBV, elements: elV, g: gV } = runEval({});
['systems','licenses','mech','pilot','hase','core'].forEach(b=>{ if (!XV.editOn(b)) throw new Error('V: editing must be ON by default for ' + b); });
if (elV['mechCard'].classList.contains('view') || elV['pilotCard'].classList.contains('view') || elV['haseCard'].classList.contains('view') || elV['coreCard'].classList.contains('view')) throw new Error('V: static cards must not have the view class by default');
// системы: выключить — поиск, добавление и ✕ исчезают, карточки остаются
XV.toggleEdit('systems');
if (elV['systemsHint'].style.display !== 'none' || elV['systemAddRow'].style.display !== 'none') throw new Error('V: the systems search, hint and add button must hide when systems editing is OFF');
let sysHtmlV = elV['systems'].innerHTML;
if (sysHtmlV.includes('delRow')) throw new Error('V: system delete buttons must hide when systems editing is OFF');
if (!sysHtmlV.includes('Заряды HEX образца Б')) throw new Error('V: the system cards must stay visible in view mode');
// лицензии: выключить — строки текстом, фильтр и секция фрейма скрыты
SV.pilot.licenses.push({name:'Blackbeard', rank:2}); XV.renderLists();
XV.toggleEdit('licenses');
if (elV['licenseFilterRow'].style.display !== 'none' || elV['licensesHint'].style.display !== 'none' || elV['licenseAddRow'].style.display !== 'none') throw new Error('V: the license filter, hint and add button must hide when licenses editing is OFF');
let licHtmlV = elV['licenses'].innerHTML;
if (licHtmlV.includes('<input') || licHtmlV.includes('<select') || licHtmlV.includes('delLicense')) throw new Error('V: license rows must not contain inputs, selects or delete buttons in view mode');
if (!licHtmlV.includes('Чёрная Борода II')) throw new Error('V: license rows must show the name and rank as one text in view mode');
if (licHtmlV.includes('<span class="dim">II</span>')) throw new Error('V: the license rank must not hang in a separate column in view mode');
// статичные карточки: выключить — класс view, поля как текст
XV.toggleEdit('mech'); XV.toggleEdit('pilot'); XV.toggleEdit('hase'); XV.toggleEdit('core');
if (!elV['mechCard'].classList.contains('view')) throw new Error('V: the Mech card must get the view class when mech editing is OFF');
if (!elV['pilotCard'].classList.contains('view')) throw new Error('V: the Pilot card must get the view class when pilot editing is OFF');
if (!elV['haseCard'].classList.contains('view')) throw new Error('V: the HASE card must get the view class when hase editing is OFF');
if (!elV['coreCard'].classList.contains('view')) throw new Error('V: the Core System card must get the view class when core editing is OFF');
if (elV['editToggleMech'].classList.contains('on')) throw new Error('V: the mech toggle must switch OFF');
if (elV['coreDescBox'].innerHTML.includes('✎') || elV['traitsBox'].innerHTML.includes('✎')) throw new Error('V: the Core System edit buttons must hide when core editing is OFF');
// включить обратно — всё возвращается
XV.toggleEdit('systems'); XV.toggleEdit('licenses'); XV.toggleEdit('mech'); XV.toggleEdit('pilot'); XV.toggleEdit('hase'); XV.toggleEdit('core');
if (elV['mechCard'].classList.contains('view') || elV['coreCard'].classList.contains('view')) throw new Error('V: the view class must be removed when editing is back ON');
if (!elV['systems'].innerHTML.includes('delRow')) throw new Error('V: system delete buttons must return when systems editing is ON');
if (!elV['coreDescBox'].innerHTML.includes('✎')) throw new Error('V: the Core System edit button must return when core editing is ON');

// PHASE W: v25 — слайдер-тогглы, удаление кнопки «Применить фрейм», «Описание» лишнее, единая модалка поиска
const { X: XW, S: SW, DB: DBW, elements: elW, g: gW } = runEval({});
// в статике не должно остаться встроенных полей поиска и их результатов
['mountPick-','systemPick','talentPick','triggerPick','framePick','mountResults-','systemResults','talentResults','triggerResults','frameResults','licenseDb','talentDb'].forEach(id=>{
  if (staticHtml.includes('id="'+id)) throw new Error('W: inline search ' + id + ' must be gone from the static HTML');
});
if (staticHtml.includes('applyFrame()')) throw new Error('W: the Apply Frame button must be gone');
if (staticHtml.includes('Редактирование')) throw new Error('W: the word Редактирование must be gone from the static HTML');
if (staticHtml.includes('id="searchDlg"') === false) throw new Error('W: the search dialog must exist');
if (!staticHtml.includes("openSearch('system'") || !staticHtml.includes("openSearch('talent'") || !staticHtml.includes("openSearch('trigger'") || !staticHtml.includes("openSearch('license'") || !staticHtml.includes("openSearch('frame'")) throw new Error('W: every static block must have a search icon opening the modal');
if (!elW['mounts'].innerHTML.includes("openSearch('weapon'")) throw new Error('W: the mounts must have a search icon opening the modal');
// строки: удалённые ключи ушли, новые динамические — на месте
if (XW.STR.u009 || XW.STR.u157 || XW.STR.u069) throw new Error('W: removed strings u009/u157/u069 must not be in STR');
if (!XW.STR.edit_toggle || !XW.STR.search_ph_license) throw new Error('W: the new dynamic strings must be in STR');
if (!XW.STR.p002 || !XW.STR.p003 || !XW.STR.p009 || !XW.STR.p010) throw new Error('W: the moved search placeholders must stay in STR');
// тогглы — кнопки-слайдеры без текста (в статике — button.toggle.on, без чекбокса и слова)
['editToggleMounts','editToggleTalents','editToggleTriggers','editToggleSystems','editToggleLicenses','editToggleMech','editTogglePilot','editToggleHase','editToggleCore'].forEach(id=>{
  if (!staticHtml.includes('<button type="button" class="toggle on" id="' + id + '"')) throw new Error('W: toggle ' + id + ' must be a slider button in the static HTML');
  if (!elW[id].classList.contains('on')) throw new Error('W: toggle ' + id + ' must be ON by default');
});
if (staticHtml.includes('edit-toggle')) throw new Error('W: no checkbox toggles must remain in the static HTML');
if (!staticHtml.includes('id="licenseFilterToggle"')) throw new Error('W: the license filter checkbox must stay (it is not an edit toggle)');
XW.toggleEdit('mounts');
if (elW['editToggleMounts'].classList.contains('on')) throw new Error('W: the mounts slider must switch OFF');
XW.toggleEdit('mounts');
// модалка: открывается, показывает результаты, плейсхолдер — по виду поиска
XW.openSearch('weapon', 0);
if (!elW['searchDlg']._open) throw new Error('W: openSearch must open the dialog');
if (!elW['searchDlgResults'].innerHTML.includes('Штурмовая винтовка')) throw new Error('W: the weapon search modal must show results');
if (!elW['searchDlgResults'].innerHTML.includes('closeSearchDlg()')) throw new Error('W: picking a result must close the modal');
if (elW['searchDlgInput'].placeholder !== XW.L('ph_weapsearch')) throw new Error('W: the weapon search placeholder must be set');
XW.renderSearchResults('assault');
if (!elW['searchDlgResults'].innerHTML.includes('Штурмовая винтовка')) throw new Error('W: the modal search must filter by query');
XW.renderSearchResults('xyz-no-such-weapon');
if (!elW['searchDlgResults'].innerHTML.includes('Ничего не найдено')) throw new Error('W: the modal must show not-found');
XW.closeSearchDlg();
if (elW['searchDlg']._open) throw new Error('W: closeSearchDlg must close the dialog');
XW.openSearch('system');
if (!elW['searchDlgResults'].innerHTML.includes('Заряды HEX образца Б')) throw new Error('W: the system search modal must show results');
XW.openSearch('talent');
if (!elW['searchDlgResults'].innerHTML.includes('Ас')) throw new Error('W: the talent search modal must show results');
XW.openSearch('trigger');
XW.renderSearchResults('угр');
if (!elW['searchDlgResults'].innerHTML.includes('Угрожать')) throw new Error('W: the trigger search modal must find Угрожать by query');
XW.openSearch('frame');
if (!elW['searchDlgResults'].innerHTML.includes('Эверест')) throw new Error('W: the frame search modal must show results');
XW.openSearch('license');
if (!elW['searchDlgResults'].innerHTML.includes('Чёрная Борода')) throw new Error('W: the license search modal must show results');
if (elW['searchDlgResults'].innerHTML.includes('Эверест')) throw new Error('W: the license search modal must not offer Everest');
XW.closeSearchDlg();
// выбор в модалке добавляет, а «Описание» в карточках больше не пишется
XW.openSearch('weapon', 0);
const wIdx = DBW.weapons.findIndex(w=>w.n==='Assault Rifle');
XW.addWeaponByIndex(0, wIdx); XW.closeSearchDlg();
let mountsHtmlW = elW['mounts'].innerHTML;
if (!mountsHtmlW.includes('Штурмовая винтовка')) throw new Error('W: the picked weapon must be added');
if (mountsHtmlW.includes('Описание')) throw new Error('W: the word Описание must be gone from the weapon cards');
if (!mountsHtmlW.includes('Как и мехи GMS')) throw new Error('W: the description preview must stay as the summary');
if (!elW['coreDescBox'].innerHTML.includes('Активное — Усиление')) throw new Error('W: the Core System description must stay');
if (elW['coreDescBox'].innerHTML.includes('Описание')) throw new Error('W: the word Описание must be gone from the Core System description');


// PHASE X: v26 — иконка поиска слева от кнопки добавления, кнопки переименованы в «+ Кастом …»
['talentSearchRow','triggerSearchRow','systemSearchRow'].forEach(id=>{
  if (staticHtml.includes('id="'+id+'"')) throw new Error('X: the standalone search row ' + id + ' must be gone');
});
['talentAddRow','triggerAddRow','systemAddRow','licenseAddRow'].forEach(id=>{
  if (!staticHtml.includes('id="'+id+'"')) throw new Error('X: the add row ' + id + ' must exist');
});
// иконка — внутри ряда добавления, перед кнопкой
['talent','trigger','system','license'].forEach(kind=>{
  const rowIdx = staticHtml.indexOf('openSearch(\'' + kind + '\')');
  const btnIdx = staticHtml.indexOf('add' + kind[0].toUpperCase() + kind.slice(1) + 'Btn');
  if (rowIdx < 0 || btnIdx < 0 || rowIdx > btnIdx) throw new Error('X: the ' + kind + ' search icon must be left of its add button');
});
if (!staticHtml.includes('>+ Кастом Триггер<') || !staticHtml.includes('>+ Кастом Талант<') || !staticHtml.includes('>+ Кастом Система<') || !staticHtml.includes('>+ Кастом Лицензия<')) throw new Error('X: the add buttons must be renamed to + Кастом …');
['>+ Триггер<','>+ Талант<','>+ Система<','>+ Лицензия<'].forEach(lbl=>{
  if (staticHtml.includes(lbl)) throw new Error('X: the old button label ' + lbl + ' must be gone');
});
if (!XW.STR.u064 || XW.STR.u064.ru !== '+ Кастом Талант' || XW.STR.u088.ru !== '+ Кастом Триггер') throw new Error('X: the renamed button strings must be in STR');
// тоггл скрывает весь ряд добавления целиком
const { X: XX, S: SX, elements: elX } = runEval({});
XX.toggleEdit('talents');
if (elX['talentAddRow'].style.display !== 'none') throw new Error('X: the talent add row must hide when talents editing is OFF');
XX.toggleEdit('talents');
XX.toggleEdit('triggers');
if (elX['triggerAddRow'].style.display !== 'none') throw new Error('X: the trigger add row must hide when triggers editing is OFF');
XX.toggleEdit('triggers');
XX.toggleEdit('systems');
if (elX['systemAddRow'].style.display !== 'none') throw new Error('X: the system add row must hide when systems editing is OFF');
XX.toggleEdit('systems');


// PHASE Y: v27 — гаечный ключ на бегунке слайдера
const knobCount = (staticHtml.match(/<span class="knob">🔧<\/span>/g) || []).length;
if (knobCount !== 9) throw new Error('Y: all 9 toggle knobs must carry the wrench icon (found ' + knobCount + ')');
if (!staticHtml.includes('.toggle .knob') || !staticHtml.includes('display:flex')) throw new Error('Y: the knob must be a flex container centering the icon');


// PHASE Z: v28 — игровой режим: пояснения маунтов, SP-счётчик и предупреждение о лицензиях прячутся; ранги в один текст с именем
const { X: XZ, S: SZ, DB: DBZ, elements: elZ, g: gZ } = runEval({});
// маунты: пояснение ёмкости есть при редактировании, нет в просмотре; тип маунта остаётся текстом
if (!elZ['mounts'].innerHTML.includes('mount-cap')) throw new Error('Z: the mount capacity note must show when mounts editing is ON');
XZ.toggleEdit('mounts');
if (elZ['mounts'].innerHTML.includes('mount-cap')) throw new Error('Z: the mount capacity note must hide when mounts editing is OFF');
if (elZ['mounts'].innerHTML.includes('занимает ещё один маунт')) throw new Error('Z: the mount capacity explanation must hide when mounts editing is OFF');
if (!elZ['mounts'].innerHTML.includes('<b>Main</b>')) throw new Error('Z: the mount type must stay visible as text in view mode');
XZ.toggleEdit('mounts');
if (!elZ['mounts'].innerHTML.includes('mount-cap')) throw new Error('Z: the mount capacity note must return when mounts editing is ON');
// системы: SP-счётчик прячется в просмотре
if (elZ['spCounterRow'].style.display === 'none') throw new Error('Z: the SP counter must show when systems editing is ON');
XZ.toggleEdit('systems');
if (elZ['spCounterRow'].style.display !== 'none') throw new Error('Z: the SP counter must hide when systems editing is OFF');
XZ.toggleEdit('systems');
// таланты: ранг II в один текст с именем в просмотре
SZ.talents[0].name = 'Ace'; SZ.talents[0].rank = 2; XZ.renderLists();
XZ.toggleEdit('talents');
let talHtmlZ = elZ['talents'].innerHTML;
if (!talHtmlZ.includes('Ас II')) throw new Error('Z: the talent name and rank must be one text in view mode');
if (talHtmlZ.includes('<span class="dim">II</span>')) throw new Error('Z: the talent rank must not be a separate column in view mode');
XZ.toggleEdit('talents');
// лицензии: ранг в один текст; предупреждение о нераспознанных лицензиях — только при редактировании
SZ.pilot.licenses.push({name:'Blackbeard', rank:2}); SZ.pilot.licensesNote = 'Foo'; XZ.renderLists();
if (elZ['licensesNote'].style.display === 'none') throw new Error('Z: the unrecognized-license note must show when licenses editing is ON and a note exists');
XZ.toggleEdit('licenses');
let licHtmlZ = elZ['licenses'].innerHTML;
if (!licHtmlZ.includes('Чёрная Борода II')) throw new Error('Z: the license name and rank must be one text in view mode');
if (licHtmlZ.includes('<span class="dim">II</span>')) throw new Error('Z: the license rank must not be a separate column in view mode');
if (elZ['licensesNote'].style.display !== 'none') throw new Error('Z: the unrecognized-license note must hide when licenses editing is OFF');
XZ.toggleEdit('licenses');
// без предупреждения — строка не показывается даже при редактировании
SZ.pilot.licensesNote = ''; XZ.renderLists();
if (elZ['licensesNote'].style.display !== 'none') throw new Error('Z: an empty unrecognized-license note must stay hidden');


// PHASE AA: v29 — описания (короткое целиком, длинное с «подробнее»/«свернуть»), без «SP N» в шапке систем, описание оружия только при редактировании, версия в подвале
const { X: XAA, S: SAA, DB: DBAA, elements: elAA, g: gAA } = runEval({});
// версия трекера в подвале страницы
if (!staticHtml.includes('Версия трекера: 29')) throw new Error('AA: the footer must show the tracker version');
// descBox: короткое описание — целиком, без <details>
const shortHtml = XAA.descBox('t-short', '', 'Короткое описание в одно предложение.', '', '', false);
if (shortHtml.includes('<details')) throw new Error('AA: a short description must not collapse into <details>');
if (!shortHtml.includes('Короткое описание в одно предложение.')) throw new Error('AA: a short description must show in full');
// descBox: длинное описание — превью + «подробнее», внутри — «свернуть»
const longText = 'Длинное описание. '.repeat(20);
const longHtml = XAA.descBox('t-long', '', longText, '', '', false);
if (!longHtml.includes('<details')) throw new Error('AA: a long description must collapse into <details>');
if (!longHtml.includes('подробнее')) throw new Error('AA: a long description must offer «подробнее»');
if (!longHtml.includes('свернуть')) throw new Error('AA: a long description must offer «свернуть» when open');
if (!longHtml.includes('Длинное описание.')) throw new Error('AA: the long description preview must show the start of the text');
// closeDesc: раскрытое описание системы сворачивается обратно
SAA.systems[0].desc = longText; XAA.renderLists();
let sysHtmlAA = elAA['systems'].innerHTML;
if (!sysHtmlAA.includes('подробнее')) throw new Error('AA: the long system description must offer «подробнее»');
XAA.toggleDesc('s-0', true); XAA.renderLists();
if (!elAA['systems'].innerHTML.includes('<details class="desc" open')) throw new Error('AA: toggleDesc(true) must open the description');
XAA.closeDesc('s-0');
if (elAA['systems'].innerHTML.includes('<details class="desc" open')) throw new Error('AA: closeDesc must collapse the description');
// системы: «SP N» справа из шапки убрано, в мета-строке SP остался
sysHtmlAA = elAA['systems'].innerHTML;
if (sysHtmlAA.includes('<span class="dim" style="flex:0 0 auto">SP ')) throw new Error('AA: the system row header must not carry a separate SP label');
if (!sysHtmlAA.includes('2 SP')) throw new Error('AA: the system meta line must still show the SP cost');
// кастомная система: SP в мета-строке
SAA.systems.push({name:'Моя система', sp:3, desc:'Короткое.', lim:0});
XAA.renderLists();
sysHtmlAA = elAA['systems'].innerHTML;
if (!sysHtmlAA.includes('Моя система')) throw new Error('AA: the custom system must render');
if (!sysHtmlAA.includes('Кастомная система · SP 3')) throw new Error('AA: a custom system meta line must show its SP');
// оружие: описание только при редактировании
XAA.addWeaponByIndex(0, DBAA.weapons.findIndex(w=>w.n==='Assault Rifle'));
const wLast = SAA.mounts[0].weapons[SAA.mounts[0].weapons.length-1];
wLast.desc = 'Тестовое описание оружия для проверки.';
XAA.renderLists();
if (!elAA['mounts'].innerHTML.includes('Тестовое описание оружия')) throw new Error('AA: weapon descriptions must show when mounts editing is ON');
XAA.toggleEdit('mounts');
if (elAA['mounts'].innerHTML.includes('Тестовое описание оружия')) throw new Error('AA: weapon descriptions must hide in view mode');
XAA.toggleEdit('mounts');
if (!elAA['mounts'].innerHTML.includes('Тестовое описание оружия')) throw new Error('AA: weapon descriptions must return when mounts editing is ON');


// PHASE AB: v30 — выбор фрейма вернулся на Мех: кнопка поиска справа от названия; подтверждение рассказывает про встроенное оружие
const { X: XAB, S: SAB, DB: DBAB, elements: elAB, g: gAB } = runEval({});
// секция фрейма в Пилоте ушла совсем, вместе с подсказкой и её строками
if (staticHtml.includes('id="frameSection"')) throw new Error('AB: the frame section must be gone from the Pilot tab');
if (staticHtml.includes('u010') || staticHtml.includes('u148')) throw new Error('AB: the frame hint and heading strings must be gone');
if (!('frame_iw_note' in XAB.STR)) throw new Error('AB: the integrated-weapon confirm note must exist in STR');
// кнопка поиска фрейма — справа от названия на вкладке Мех, только при редактировании
if (!staticHtml.includes('id="frameSearchBtn"')) throw new Error('AB: the frame search button must exist');
if (!staticHtml.includes("openSearch('frame')")) throw new Error('AB: the frame search button must open the frame search');
if (elAB['frameSearchBtn'].style.display === 'none') throw new Error('AB: the frame search button must show when mech editing is ON');
XAB.toggleEdit('mech');
if (elAB['frameSearchBtn'].style.display !== 'none') throw new Error('AB: the frame search button must hide when mech editing is OFF');
if (elAB['mechFrameName'].textContent !== 'Эверест') throw new Error('AB: the frame name must stay visible as text in view mode');
XAB.toggleEdit('mech');
// подтверждение смены фрейма: Ланкастер несёт встроенное оружие — про это сказано
gAB.confirmCalls.length = 0;
XAB.applyFrame('Lancaster');
if (!gAB.confirmCalls.some(m => /встроенное оружие фрейма/.test(m))) throw new Error('AB: the apply confirm must mention the integrated weapon for Lancaster');
if (SAB.mech.frame !== 'Lancaster') throw new Error('AB: accepting the confirm must set the frame to Lancaster');
if (elAB['mechFrameName'].textContent !== 'Ланкастер') throw new Error('AB: the Mech tab must show the new frame name');
// Чёрная Борода без встроенного оружия — про него в подтверждении ничего нет
gAB.confirmCalls.length = 0;
XAB.applyFrame('Blackbeard');
if (gAB.confirmCalls.some(m => /встроенное оружие фрейма/.test(m))) throw new Error('AB: the apply confirm must not mention an integrated weapon for Blackbeard');


console.log('SMOKE TEST PASSED: Heat/Stress order, defaults, multi-field search, frame apply (mounts/core/traits/derived stats/integrated weapon), SP counter, systems search, license filter, TDZ regression, license migration, Limited charges, combat-reference blocks, talent search, weapon tag chips, mount badges, fixed SP, RUS/ENG toggle, frame corporation/roles, bilingual datalists, description component, dispField fix, trigger search, description overflow fix, frame moved to Pilot tab, display-only weapons/systems, custom modals, apply confirm dismiss is atomic, edit toggles, edit toggles in the remaining blocks, slider toggles, search modal, no Apply Frame button, no Описание label, search icon left of the + Кастом … button, wrench icon in the slider knob, game mode hides edit-only notes, ranks inline with names, short descriptions shown in full, long ones with подробнее/свернуть, no separate SP label on systems, weapon descriptions only when editing, version in the footer, frame picker back on the Mech tab with the integrated-weapon note in the confirm');
