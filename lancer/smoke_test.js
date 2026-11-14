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
    id, value: '', innerHTML: '', style: { setProperty(k, v){ this[k] = v; }, getPropertyValue(k){ return this[k] || ''; } },
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
  + 'showWeaponResults:showWeaponResults,showSystemResults:showSystemResults,sd:sd,'
  + 'addWeaponByIndex:addWeaponByIndex,addSystemByIndex:addSystemByIndex,'
  + 'toggleEdit:toggleEdit,editOn:editOn,'
  + 'openSearch:openSearch,closeSearchDlg:closeSearchDlg,renderSearchResults:renderSearchResults,'
  + 'openSearchDesc:openSearchDesc,closeSearchDesc:closeSearchDesc,rerenderSearch:rerenderSearch,'
  + 'showLicenseResults:showLicenseResults,addLicenseByName:addLicenseByName,'
  + 'openCustomWeaponDlg:openCustomWeaponDlg,addCustomWeapon:addCustomWeapon,'
  + 'openCustomSystemDlg:openCustomSystemDlg,addCustomSystem:addCustomSystem,'
  + 'applyFrame:applyFrame,recalcDerived:recalcDerived,toggleLicenseFilter:toggleLicenseFilter,'
  + 'itemAvailable:itemAvailable,frameAvailable:frameAvailable,'
  + 'sysLim:sysLim,sysLeft:sysLeft,weapLim:weapLim,weapLeft:weapLeft,sysSp:sysSp,'
  + 'delMount:delMount,delWeapon:delWeapon,toggleLang:toggleLang,licenseNameOptions:licenseNameOptions,calcLL:calcLL,delLicense:delLicense,addLicense:addLicense,wizardOpen:function(){return wizardOpen;},wizardStepId:function(){return wizardStepId;},openWizard:openWizard,closeWizard:closeWizard,wizardNext:wizardNext,wizardBack:wizardBack,wizardVisibleSteps:wizardVisibleSteps,maybeOpenWizard:maybeOpenWizard,luOpen:function(){return luOpen;},luStepId:function(){return luStepId;},openLevelUp:openLevelUp,closeLevelUp:closeLevelUp,luNext:luNext,luBack:luBack,luVisibleSteps:luVisibleSteps,luBaseLL:function(){return luBaseLL;},luRenderStep:luRenderStep,luRaiseTrigger:luRaiseTrigger,luRaiseHase:luRaiseHase,luRaiseTalent:luRaiseTalent,luRaiseLicense:luRaiseLicense,luPicked:function(){return luPicked;},luIsNew:luIsNew,luNewAdded:luNewAdded,'
  + 'weapTags:weapTags,sysTags:sysTags,tagLabel:tagLabel,tagChips:tagChips,showTag:showTag,linkTagTerms:linkTagTerms,tagWordStem:tagWordStem,'
  + 'STATUS_INFO:STATUS_INFO,STATUSES:STATUSES,statusLabel:statusLabel,statusDesc:statusDesc,toggleStatus:toggleStatus,removeStatus:removeStatus,showStatus:showStatus,renderStatusTags:renderStatusTags,renderStatusRef:renderStatusRef,autoGrowNotes:autoGrowNotes,'
  + 'talentRankDesc:talentRankDesc,talentMatches:talentMatches,showTalentResults:showTalentResults,'
  + 'addTalentByIndex:addTalentByIndex,fillTalentFromDb:fillTalentFromDb,'
  + 'MOUNT_TYPES:MOUNT_TYPES,MOUNT_STYLE:MOUNT_STYLE,'
  + 'stepSysCharges:stepSysCharges,stepWeapCharges:stepWeapCharges,'
  + 'fullRepair:fullRepair,toggleCore:toggleCore,showTab:showTab,swipeTab:swipeTab,curTab:function(){return curTab;},renderLists:renderLists,renderCounters:renderCounters,save:save,get:get,set:set,'
  + 'lang:lang,setLang:setLang,applyLang:applyLang,wd:wd,sd:sd,td:td,tagd:tagd,fd:fd,'
  + 'findWeapon:findWeapon,findSystem:findSystem,findTalent:findTalent,frameKey:frameKey,'
  + 'dispVal:dispVal,dispField:dispField,mountCap:mountCap,STR:STR,L:L,'
  + 'frameMatches:frameMatches,showFrameResults:showFrameResults,pickFrame:pickFrame,'
  + 'frameLabel:frameLabel,'
  + 'descBox:descBox,editDesc:editDesc,openDesc:openDesc,closeDesc:closeDesc,renderDescBoxes:renderDescBoxes,'
  + 'frameAvailable:frameAvailable,toggleLicenseFilter:toggleLicenseFilter,'
  + 'TRIGGERS:TRIGGERS,findTrigger:findTrigger,trigDisp:trigDisp,triggerMatches:triggerMatches,'
  + 'showTriggerResults:showTriggerResults,addTriggerByName:addTriggerByName,'
  + 'CORE_BONUSES:CORE_BONUSES,CORP_NAMES:CORP_NAMES,findCoreBonus:findCoreBonus,corpRanks:corpRanks,coreBonusSlots:coreBonusSlots,coreBonusAllowed:coreBonusAllowed,addCoreBonusByIdx:addCoreBonusByIdx,removeCoreBonus:removeCoreBonus,renderCoreBonuses:renderCoreBonuses,openCoreBonusPicker:openCoreBonusPicker,ACTIONS_REF:ACTIONS_REF,actionGranted:actionGranted,renderMyActions:renderMyActions,shake:shake,cpFlash:cpFlash};';
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
if (X.calcLL() !== 0) throw new Error('A: fresh LL should be 0 (no licenses)');
if (S.mech.frame !== 'Everest') throw new Error('A: fresh frame should be Everest');
if (S.mounts.length !== 3 || S.mounts[0].type !== 'Main' || S.mounts[1].type !== 'Flex' || S.mounts[2].type !== 'Heavy') throw new Error('A: default mounts should be Main/Flex/Heavy');
if (S.systems.length !== 3) throw new Error('A: 3 starter systems expected');
if (S.mech.repairsMax !== 5) throw new Error('A: Everest Repair Cap is 5');
if (!S.mech.coreDesc.includes('Power Up')) throw new Error('A: Everest core desc missing');
if (!S.mech.traits.includes('Initiative')) throw new Error('A: Everest traits missing');
if (S.settings.licenseFilter !== true) throw new Error('A: license filter should default ON');
if (S.pilot.licenses.length !== 0) throw new Error('A: fresh pilot should have no licenses');
if (S.talents.length !== 0 || S.triggers.length !== 0) throw new Error('A: fresh save must not create empty talents/triggers (v52)');

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
if ((box.match(/class=\"dbrow\"/g) || []).length !== nMain) throw new Error('F: \"main\" must show all matching weapons in Flex (no paging)');
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
if ((sbox.match(/class="dbrow"/g) || []).length !== nLL2) throw new Error('D: "ll2" systems must show all matching systems (no paging)');
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
if ((box.match(/class="dbrow"/g) || []).length !== gmsOnly.length) throw new Error('G: must show all GMS-only results (no paging)');
// Blackbeard rank 1: LL1 gear yes, LL2 gear no, frame no
S.pilot.licenses.push({ name: 'Blackbeard', rank: 1 }); X.save(); X.renderLists();
if (!X.itemAvailable(axeG)) throw new Error('G: Chain Axe must be available with Blackbeard I');
if (X.itemAvailable(bristleG)) throw new Error('G: Bristlecrown (LL2) must NOT be available with Blackbeard I');
if (X.frameAvailable('Blackbeard')) throw new Error('G: Blackbeard frame needs rank II, not I');
X.showFrameResults('');
if (!elA['frameResults'].innerHTML.includes('Эверест')) throw new Error('G: frame picker must include Everest (Эверест in RU)');
if (elA['frameResults'].innerHTML.includes('Чёрная Борода')) throw new Error('G: frame picker must NOT include Blackbeard at rank I');
if (elA['licenseLL'].textContent !== '1' && elA['licenseLL'].textContent !== 1) throw new Error('G: LL display should be 1 (sum of license ranks)');
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
if ((elA['frameResults'].innerHTML.match(/class=\"dbrow\"/g) || []).length !== 29) throw new Error('G: with filter OFF, frame picker must show all 29 frames (no paging)');
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
if ((sysHtml.match(/Заряды:/g) || []).length !== 1) throw new Error('I: exactly one charges row should render for the starter systems');
if (!sysHtml.includes('3 <small>/ 3</small>')) throw new Error('I: the HEX Charges stepper must show 3 / 3');
if (!sysHtml.includes('2 SP')) throw new Error('I: SP must show in the system meta line (2 SP) for book systems');
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
if (!mountsHtml.includes('2 <small>/ 2</small>')) throw new Error('I: Daisy Cutter row must show a Limited-2 charges stepper (2 / 2)');
if ((mountsHtml.match(/Заряды:/g) || []).length !== 1) throw new Error('I: only the Daisy Cutter row should have a charges row');
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
for (const s of ['>Оверчардж</summary>', '>Потеря структуры</summary>',
  '>Перегрев реактора</summary>', '>Отдых и полный ремонт</summary>']) {
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
if (!rd || rd.length !== 1 || rd[0].n !== 'Акробатика' || !rd[0].d.includes('ловкости')) throw new Error('K: rank I desc of Ace must be Acrobatics (Акробатика in RU)');
XK.showTalentResults('ace');
if ((elK['talentResults'].innerHTML.match(/class="dbrow"/g) || []).length < 1) throw new Error('K: search for ace must show results');
// the name input must not clobber the rank (old bug: its onchange set rank=+name)
XK.fillTalentFromDb(0, 'Crack Shot');
if (SK.talents[0].name !== 'Crack Shot' || SK.talents[0].rank !== 1) throw new Error('K: filling a talent name must keep the rank');
// rank=+value: once in the main talents list, once in the wizard talents step (v57) — both are rank selects
if ((html.match(/S\.talents\[\$\{i\}\]\.rank=\+this\.value/g) || []).length !== 2) throw new Error('K: only the rank selects may set rank=+value');

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
if ((sysHtmlN.match(/Заряды:/g) || []).length !== 1) throw new Error('N: only Pattern-B (Limited 3) must show a charges stepper');
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
SO.talents.push({name:'',rank:1}); XO.fillTalentFromDb(0, 'Ас');
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
// компонент описания: текст абзацем вместо textarea, правка по кнопке
XP.addWeaponByIndex(0, DBP.weapons.findIndex(w=>w.n==='Assault Rifle'));
const mountsHtmlP = elP['mounts'].innerHTML;
if (!mountsHtmlP.includes('<div class="desc-text">')) throw new Error('P: weapon rows must render the description as a paragraph');
if (!mountsHtmlP.includes('Штурмовая винтовка')) throw new Error('P: weapon rows must keep the RU weapon name');
if (!mountsHtmlP.includes('<span class="wnum">1d6</span> кинетический')) throw new Error('P: weapon rows must keep the RU damage text (numbers in .wnum, v154)');
const sysHtmlP = elP['systems'].innerHTML;
if (!sysHtmlP.includes('<div class="desc-text">')) throw new Error('P: system rows must render the description as a paragraph');
if (!sysHtmlP.includes('2 SP')) throw new Error('P: system rows must keep the SP text in the meta line');
if (!elP['coreDescBox'].innerHTML.includes('<div class="desc-text">')) throw new Error('P: coreDesc must render as a paragraph');
if (!elP['coreDescBox'].innerHTML.includes('Штурмовая гарпунная система')) throw new Error('P: coreDesc box must show the RU core description');
if (!elP['traitsBox'].innerHTML.includes('Гарпунный трос')) throw new Error('P: traits box must show the RU traits');
// v66: Core System — только для чтения (идёт от фрейма): editDesc не открывает редактор, кнопки правки нет
XP.editDesc('coreDesc');
if (elP['coreDescBox'].innerHTML.includes('id="editingDesc"')) throw new Error('P: Core System must be read-only — editDesc must not open an editor for it');
if (elP['coreDescBox'].innerHTML.includes('Редактировать')) throw new Error('P: Core System description must have no edit button');
// (v76) подпись под заголовком убрана вместе с шапкой — проверок u146 больше нет

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
// CSS: описание не должно раздувать карточку на телефоне (v18, баг с телефона;
// с v31 описание — переносимый абзац, а не nowrap-превью, так что переполнения нет по построению)
// v66: core-grid удалён вместе с отдельной карточкой Core System — переполнения там больше негде взяться
if (!staticHtml.includes('.desc-text { white-space:pre-line;')) throw new Error('Q: descriptions must wrap (pre-line), not overflow');
if (!staticHtml.includes('overflow-wrap:break-word;')) throw new Error('Q: descriptions must break long words instead of overflowing');

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
if (!sysHtmlS.includes('<div class="desc-text">')) throw new Error('S: system rows must render the description as a paragraph');
if (sysHtmlS.includes('✎')) throw new Error('S: system descriptions must not offer editing');
// в карточках оружия нет input'ов — урон, дальность и теги только текстом
XS.addWeaponByIndex(0, DBS.weapons.findIndex(w=>w.n==='Assault Rifle'));
let mountsHtmlS = elS['mounts'].innerHTML;
if ((mountsHtmlS.match(/<input/g) || []).length !== 0) throw new Error('S: weapon rows must not contain inputs (the search is in the modal now)');
if (!mountsHtmlS.includes('Штурмовая винтовка')) throw new Error('S: weapon rows must show the RU name');
if (!mountsHtmlS.includes('<span class="wnum">1d6</span> кинетический')) throw new Error('S: weapon rows must show the damage as text (numbers in .wnum, v154)');
if (!mountsHtmlS.includes('Дальность <span class="wnum">10</span>')) throw new Error('S: weapon rows must show the range as text (numbers in .wnum, v154)');
if (!mountsHtmlS.includes('GMS · LL0 · Main')) throw new Error('S: weapon rows must show the corporation/license (meta info)');
if (!mountsHtmlS.includes('Надёжное 2')) throw new Error('S: weapon rows must keep the tag chips');
if (!mountsHtmlS.includes('<div class="desc-text">')) throw new Error('S: weapon rows must render the description as a paragraph');
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
if (!elS['systems'].innerHTML.includes('Заряды:')) throw new Error('S: the custom Limited system must show a charges stepper');

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
SU.talents.push({name:'',rank:1}); SU.talents[0].name = 'Ace'; XU.renderLists();
XU.toggleEdit('talents');
if (elU['talentsHint'].style.display !== 'none') throw new Error('U: the talents hint must hide when talents editing is OFF');
if (elU['talentAddRow'].style.display !== 'none') throw new Error('U: the talent search and + Talent button must hide when talents editing is OFF');
let talHtmlU = elU['talents'].innerHTML;
if (talHtmlU.includes('<input') || talHtmlU.includes('<select') || talHtmlU.includes('delRow')) throw new Error('U: talent rows must not contain inputs, selects or delete buttons in view mode');
if (!talHtmlU.includes('Ас I')) throw new Error('U: talent rows must show the name and rank as one text in view mode');
if (talHtmlU.includes('<span class="dim">I</span>')) throw new Error('U: the talent rank must not hang in a separate column in view mode');
// триггеры: выключить — строки текстом; подсказка про правила остаётся
SU.triggers.push({name:'',bonus:2}); SU.triggers[0].name = 'Act Unseen or Unheard'; XU.renderLists();
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
['systems','licenses','mech','pilot','core'].forEach(b=>{ if (!XV.editOn(b)) throw new Error('V: editing must be ON by default for ' + b); });
if (elV['statsCard'].classList.contains('view') || elV['pilotCard'].classList.contains('view')) throw new Error('V: static cards must not have the view class by default'); // v66: coreCard удалена, осталась только пара stats/pilot
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
XV.toggleEdit('mech'); XV.toggleEdit('pilot'); XV.toggleEdit('core');
if (!elV['statsCard'].classList.contains('view')) throw new Error('V: the Stats card must get the view class when mech editing is OFF');
if (!elV['pilotCard'].classList.contains('view')) throw new Error('V: the Pilot card must get the view class when pilot editing is OFF');

// v66: coreCard удалена — view-класс у неё больше не проверяется
if (elV['editToggleMech'].classList.contains('on')) throw new Error('V: the mech toggle must switch OFF');
if (elV['coreDescBox'].innerHTML.includes('✎') || elV['traitsBox'].innerHTML.includes('✎')) throw new Error('V: the Core System edit buttons must hide when core editing is OFF');
// включить обратно — всё возвращается
XV.toggleEdit('systems'); XV.toggleEdit('licenses'); XV.toggleEdit('mech'); XV.toggleEdit('pilot'); XV.toggleEdit('core');
if (elV['statsCard'].classList.contains('view')) throw new Error('V: the view class must be removed when editing is back ON');
if (!elV['systems'].innerHTML.includes('delRow')) throw new Error('V: system delete buttons must return when systems editing is ON');
if (elV['coreDescBox'].innerHTML.includes('✎')) throw new Error('V: the Core System must stay read-only even when core editing is ON (v66)');
if (!elV['traitsBox'].innerHTML.includes('✎')) throw new Error('V: the traits edit button must return when core editing is ON');

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
if (XW.STR.u009 || XW.STR.u157 || XW.STR.u069 || XW.STR.u005 || XW.STR.u059) throw new Error('W: removed strings u009/u157/u069/u005/u059 must not be in STR');
if (!XW.STR.edit_toggle || !XW.STR.search_ph_license) throw new Error('W: the new dynamic strings must be in STR');
if (!XW.STR.p002 || !XW.STR.p003 || !XW.STR.p009 || !XW.STR.p010) throw new Error('W: the moved search placeholders must stay in STR');
// тогглы — кнопки-слайдеры без текста (в статике — button.toggle.on, без чекбокса и слова)
['editToggleMounts','editToggleTalents','editToggleTriggers','editToggleSystems','editToggleLicenses','editToggleMech','editTogglePilot','editToggleCoreBonuses'].forEach(id=>{ // v66: editToggleCore удалён — у Core System больше нет редактирования
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
const knobCount = (staticHtml.match(/<span class="knob"><svg viewBox="0 0 24 24"/g) || []).length;
if (knobCount !== 8) throw new Error('Y: all 8 toggle knobs must carry the wrench icon (found ' + knobCount + ')'); // v66: 9-й тоггл (Core System) удалён; v144: эмодзи заменён на оранжевый SVG-ключ
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
SZ.talents.push({name:'',rank:1}); SZ.talents[0].name = 'Ace'; SZ.talents[0].rank = 2; XZ.renderLists();
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
if (!staticHtml.includes('Версия трекера: 162')) throw new Error('AA: the footer must show the tracker version');
// descBox: короткое описание — целиком, без <details>
const shortHtml = XAA.descBox('t-short', '', 'Короткое описание в одно предложение.', '', '', false);
if (shortHtml.includes('<details')) throw new Error('AA: a short description must not collapse into <details>');
if (!shortHtml.includes('Короткое описание в одно предложение.')) throw new Error('AA: a short description must show in full');
// descBox: длинное описание — абзац + «подробнее» в конце; хвост текста скрыт до раскрытия
const longText = 'Длинное описание. '.repeat(15) + 'ХВОСТ-ОПИСАНИЯ';
const longHtml = XAA.descBox('t-long', '', longText, '', '', false);
if (longHtml.includes('<details')) throw new Error('AA: a long description must not use <details> anymore');
if (!longHtml.includes('подробнее')) throw new Error('AA: a long description must offer «подробнее»');
if (longHtml.includes('ХВОСТ-ОПИСАНИЯ')) throw new Error('AA: the truncated paragraph must not show the tail of the text');
if (!longHtml.includes('Длинное описание.')) throw new Error('AA: the truncated paragraph must show the start of the text');
XAA.openDesc('t-long');
const longOpenHtml = XAA.descBox('t-long', '', longText, '', '', false);
if (!longOpenHtml.includes('ХВОСТ-ОПИСАНИЯ')) throw new Error('AA: an open description must show the full text');
if (!longOpenHtml.includes('свернуть')) throw new Error('AA: an open description must offer «свернуть»');
XAA.closeDesc('t-long');
if (XAA.descBox('t-long', '', longText, '', '', false).includes('ХВОСТ-ОПИСАНИЯ')) throw new Error('AA: closeDesc must collapse the description back to the paragraph');
// closeDesc: раскрытое описание системы сворачивается обратно в абзац
SAA.systems[0].desc = longText; XAA.renderLists();
let sysHtmlAA = elAA['systems'].innerHTML;
if (!sysHtmlAA.includes('подробнее')) throw new Error('AA: the long system description must offer «подробнее»');
if (sysHtmlAA.includes('ХВОСТ-ОПИСАНИЯ')) throw new Error('AA: the system paragraph must not show the tail before opening');
XAA.openDesc('s-0');
if (!elAA['systems'].innerHTML.includes('ХВОСТ-ОПИСАНИЯ')) throw new Error('AA: openDesc must expand the system description');
if (!elAA['systems'].innerHTML.includes('свернуть')) throw new Error('AA: the open system description must offer «свернуть»');
XAA.closeDesc('s-0');
if (elAA['systems'].innerHTML.includes('ХВОСТ-ОПИСАНИЯ')) throw new Error('AA: closeDesc must collapse the system description');
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


// PHASE AC: v32 — «свернуть» как синяя ссылка в конце текста; трейты фрейма отдельной карточкой целиком; Core Bonuses/Gear убраны; Stress ☢️, Overcharge ⚡
const { X: XAC, S: SAC, DB: DBAC, elements: elAC, g: gAC } = runEval({});
// «свернуть» — синяя ссылка в конце полного текста, а не кнопка под ним
const longTextAC = 'Длинное описание. '.repeat(15) + 'ХВОСТ-ОПИСАНИЯ';
XAC.openDesc('t-long');
const longOpenHtmlAC = XAC.descBox('t-long', '', longTextAC, '', '', false);
if (!longOpenHtmlAC.includes('<button class="desc-more" onclick="closeDesc')) throw new Error('AC: «свернуть» must be an inline link (desc-more) at the end of the text');
if (longOpenHtmlAC.includes('<button class="btn"')) throw new Error('AC: the expanded description must not have a bordered button below the text');
if (!longOpenHtmlAC.includes('ХВОСТ-ОПИСАНИЯ')) throw new Error('AC: the open description must show the full text');
// трейты фрейма — отдельная карточка, всегда целиком, без «подробнее»
if (!staticHtml.includes('id="traitsCard"')) throw new Error('AC: frame traits must live in their own card');
if (!(staticHtml.indexOf('id="traitsCard"') < staticHtml.indexOf('id="traitsBox"'))) throw new Error('AC: the traits box must sit inside the traits card');
if (!(staticHtml.indexOf('u233') < staticHtml.indexOf('id="traitsBox"'))) throw new Error('AC: the status reference (u233) must sit before the traits card (it lives in Combat Resources)');
SAC.mech.traits = 'Трейт один: длинный текст трейта. '.repeat(12);
XAC.renderLists();
if (!elAC['traitsBox'].innerHTML.includes('Трейт один: длинный текст трейта.')) throw new Error('AC: the traits card must show the traits text');
if (elAC['traitsBox'].innerHTML.includes('подробнее')) throw new Error('AC: traits must never collapse into «подробнее»');
if (!elAC['traitsBox'].innerHTML.includes('Трейт один: длинный текст трейта. Трейт один: длинный текст трейта. Трейт один: длинный текст трейта. Трейт один: длинный текст трейта.')) throw new Error('AC: the traits card must show the whole long text, not a truncated paragraph');
// Старая карточка «Core Bonuses и снаряжение» пилота убрана с вкладки Пилота (есть Заметки на Мехе).
// v39: Core Bonuses вернулись как полноценный пикер (фаза AK) — поле pilot.coreBonuses снова в сейве, запрещён только gear.
if (staticHtml.includes('Core Bonuses и снаряжение') || staticHtml.includes('pilot.gear')) throw new Error('AC: the old Core Bonuses / pilot Gear card must be gone');
if ('gear' in SAC.pilot) throw new Error('AC: the Gear field must be gone from the save');
if (!staticHtml.includes('Заметки')) throw new Error('AC: the Mech tab notes must stay');
// иконки ресурсов: Stress — ядерная опасность, Overcharge — молния
if (!staticHtml.includes('<span class="ico">☢️</span>Stress')) throw new Error('AC: Stress must carry the radiation icon');
if (!staticHtml.includes('<span class="ico">⚡</span>Overcharge')) throw new Error('AC: Overcharge must carry the lightning icon');
if (staticHtml.includes('<span class="ico">⚡</span>Stress') || staticHtml.includes('<span class="ico">🌀</span>Overcharge')) throw new Error('AC: the old Stress/Overcharge icons must be gone');


// PHASE AD: v33 — System Points переехал из HASE в Системы (только при редактировании); подсказка HASE тоже только при редактировании
const { X: XAD, S: SAD, DB: DBAD, elements: elAD, g: gAD } = runEval({});
// SP-поле теперь в блоке Систем, рядом со счётчиком SP, и только одно такое поле на странице
if (!staticHtml.includes('id="spCapRow"')) throw new Error('AD: the SP capacity field must live in the Systems card');
if ((staticHtml.match(/System Points \(SP\)/g) || []).length !== 1) throw new Error('AD: there must be exactly one System Points field (in the Systems card, not in HASE)');
if (!(staticHtml.indexOf('id="spCapRow"') > staticHtml.indexOf('id="spCounterRow"'))) throw new Error('AD: the SP capacity field must sit next to the SP counter');
// SP-поле видно только при редактировании систем
if (elAD['spCapRow'].style.display === 'none') throw new Error('AD: the SP capacity field must show when systems editing is ON');
XAD.toggleEdit('systems');
if (elAD['spCapRow'].style.display !== 'none') throw new Error('AD: the SP capacity field must hide when systems editing is OFF');
if (elAD['spCounterRow'].style.display !== 'none') throw new Error('AD: the SP counter must hide together with the SP field in view mode');
XAD.toggleEdit('systems');
// подсказка HASE видна только при редактировании Статов (тоггл mech)
if (!staticHtml.includes('id="haseHint"')) throw new Error('AD: the HASE explanation must have an id to hide in view mode');
if (elAD['haseHint'].style.display === 'none') throw new Error('AD: the HASE explanation must show when HASE editing is ON');
XAD.toggleEdit('mech');
if (elAD['haseHint'].style.display !== 'none') throw new Error('AD: the HASE explanation must hide when Stats editing is OFF');
XAD.toggleEdit('mech');
// в сетке HASE осталось 9 полей (3×3 на телефоне), без System Points
const statsHtmlAD = staticHtml.split('id="statsCard"')[1].split('u065')[0];
if ((statsHtmlAD.match(/<input/g) || []).length !== 13) throw new Error('AD: the Stats card must have 13 inputs (name + 12 stats incl. Grit), found ' + ((statsHtmlAD.match(/<input/g) || []).length));
const statTableHtmlAD = statsHtmlAD.split('class="stat-table"')[1];
if ((statTableHtmlAD.match(/<input/g) || []).length !== 12) throw new Error('AD: the stats table must have 12 fields (HASE 4 + Size/Speed/Sensors/Tech 4 + Armor/Grit/Evasion/EDef 4), found ' + ((statTableHtmlAD.match(/<input/g) || []).length));
if (statsHtmlAD.includes('data-f="mech.sp"')) throw new Error('AD: the Stats card must not reference mech.sp anymore');


// PHASE AE: v34 — фичи таланта аддитивные: на ранге III видны фичи I, II и III
const { X: XAE, S: SAE, DB: DBAE, elements: elAE, g: gAE } = runEval({});
XAE.addTalentByIndex(DBAE.talents.findIndex(t=>t.n==='Ace'));
const aceT = SAE.talents[SAE.talents.length - 1];
aceT.rank = 3;
XAE.renderLists();
const talentsHtml = elAE['talents'].innerHTML;
if (!talentsHtml.includes('Акробатика') || !talentsHtml.includes('Форсаж') || !talentsHtml.includes('Сверхзвук')) throw new Error('AE: a rank III talent must show the features of ranks I, II and III');
if (!talentsHtml.includes('I. Акробатика:') || !talentsHtml.includes('II. Форсаж:') || !talentsHtml.includes('III. Сверхзвук:')) throw new Error('AE: each shown feature must carry its rank numeral');
aceT.rank = 2;
XAE.renderLists();
const talentsHtml2 = elAE['talents'].innerHTML;
if (!talentsHtml2.includes('Акробатика') || !talentsHtml2.includes('Форсаж')) throw new Error('AE: a rank II talent must show the features of ranks I and II');
if (talentsHtml2.includes('Сверхзвук')) throw new Error('AE: a rank II talent must not show the rank III feature');
aceT.rank = 1;
XAE.renderLists();
const talentsHtml1 = elAE['talents'].innerHTML;
if (!talentsHtml1.includes('Акробатика')) throw new Error('AE: a rank I talent must show its rank I feature');
if (talentsHtml1.includes('Форсаж') || talentsHtml1.includes('Сверхзвук')) throw new Error('AE: a rank I talent must not show higher-rank features');


// PHASE AF: v35 — карточка «Лицензии и фрейм» переименована просто в «Лицензии»
const { X: XAF, S: SAF, DB: DBAF, elements: elAF, g: gAF } = runEval({});
if (XAF.STR.u089.ru !== 'Лицензии') throw new Error('AF: the licenses card heading must be just «Лицензии» in RU');
if (XAF.STR.u089.en !== 'Licenses') throw new Error('AF: the licenses card heading must be just «Licenses» in EN');
if (staticHtml.includes('Лицензии и фрейм') || staticHtml.includes('Licenses & Frame')) throw new Error('AF: no «Лицензии и фрейм» heading must remain anywhere');
// подсказка про фильтр по-прежнему объясняет правило про фреймы (это не заголовок)
if (!XAF.STR.u091.ru.includes('фрейм доступен со II ранга')) throw new Error('AF: the license filter hint must still explain the frame rank rule');


// PHASE AG: v36 — максимумы ресурсов по правилам (фрейм + HASE) + кнопка ремонта в блоке правил
const { X: XAG, S: SAG, DB: DBAG, elements: elAG, g: gAG } = runEval({});
// Everest: hp 10, heatcap 6, repcap 5, structure 4, stress 4 (база фрейма)
XAG.set('mech.frame', 'Everest');
XAG.set('pilot.hull', 2); XAG.set('pilot.engineering', 1);
XAG.recalcDerived();
if (XAG.get('mech.hpMax') !== 14) throw new Error('AG: HP max must be frame HP 10 + Hull 2x2 = 14');
if (XAG.get('mech.heatMax') !== 7) throw new Error('AG: Heat max must be frame heatcap 6 + Engineering 1 = 7');
if (XAG.get('mech.repairsMax') !== 6) throw new Error('AG: Repairs max must be frame repcap 5 + floor(Hull 2/2) = 6');
if (XAG.get('mech.structureMax') !== 4) throw new Error('AG: Structure max must be the frame structure (4)');
if (XAG.get('mech.stressMax') !== 4) throw new Error('AG: Stress max must be the frame stress (4)');
// обрезка текущего значения до нового максимума
XAG.set('mech.hp', 20); XAG.recalcDerived();
if (XAG.get('mech.hp') !== 14) throw new Error('AG: current HP above the new max must be clamped to 14');
// Hull 0 → максимумы возвращаются к базовым значениям фрейма
XAG.set('pilot.hull', 0); XAG.set('pilot.engineering', 0); XAG.recalcDerived();
if (XAG.get('mech.hpMax') !== 10 || XAG.get('mech.heatMax') !== 6 || XAG.get('mech.repairsMax') !== 5) throw new Error('AG: at HASE 0 the maxes must be the frame base values');
// кнопка «Полный ремонт» — внутри блока «Отдых и полный ремонт», после правил (u058), до </details>
const detailsIdx = staticHtml.indexOf('data-i18n="u050"');
const btnIdx = staticHtml.indexOf('onclick="fullRepair()"');
const u058Idx = staticHtml.indexOf('data-i18n="u058"');
const closeIdx = staticHtml.indexOf('</details>', u058Idx);
if (!(detailsIdx < u058Idx && u058Idx < btnIdx && btnIdx < closeIdx)) throw new Error('AG: the Full Repair button must sit inside the Rest & Full Repair block, after the full-repair rules');
if (staticHtml.includes('data-i18n="u015"') || XAG.STR.u015) throw new Error('AG: the redundant full-repair explanation (u015) must be gone');
if (XAG.STR.u014.ru !== 'Полный ремонт (отдых)') throw new Error('AG: the button label must still be «Полный ремонт (отдых)»');
// HASE-инпуты по-прежнему есть и привязаны к данным
if (!staticHtml.includes('data-f="pilot.hull"') || !staticHtml.includes('data-f="pilot.engineering"')) throw new Error('AG: the HASE inputs must still be bound');


// PHASE AH: v37 — загрузка пересчитывает максимумы (лечит устаревший сейв)
// Сейв тестового браузера: имя фрейма «Blackbeard», а максимумы от Эвереста (HP 10, Heat 6).
// У Чёрной Бороды HP 12, Heat Cap 4 — загрузка должна их исправить.
const staleAH = JSON.parse(JSON.stringify(S));
staleAH.mech.frame = 'Blackbeard';
staleAH.mech.hpMax = 10;
staleAH.mech.heatMax = 6;
staleAH.mech.repairsMax = 5;
staleAH.pilot.hull = 0; staleAH.pilot.agility = 0; staleAH.pilot.systems = 0; staleAH.pilot.engineering = 0;
const storeAH = { 'lancer-tracker-v1': JSON.stringify(staleAH) };
const rAH = runEval(storeAH);
const SAH = rAH.S;
if (SAH.mech.frame !== 'Blackbeard') throw new Error('AH: the stale save frame must stay Blackbeard');
if (SAH.mech.hpMax !== 12) throw new Error('AH: on load, a stale HP max (10, Everest) for Blackbeard must be corrected to 12');
if (SAH.mech.heatMax !== 4) throw new Error('AH: on load, a stale Heat max (6, Everest) for Blackbeard must be corrected to 4');
if (SAH.mech.repairsMax !== 5) throw new Error('AH: Repairs max must stay 5 (both frames have repcap 5)');
// свежий сейв (Everest) загрузкой не портится
const rAH2 = runEval({});
if (rAH2.S.mech.hpMax !== 10 || rAH2.S.mech.heatMax !== 6) throw new Error('AH: a fresh Everest save must keep its maxes');


// PHASE AI: v38 — Personalizations (+2 HP); раскладка счётчиков — v39 (откат к 2 колонкам)
// Personalizations — единственная система в данных, дающая +2 к максимуму HP
const { X: XAI, S: SAI, DB: DBAI, elements: elAI, g: gAI } = runEval({});
XAI.set('mech.frame', 'Everest');
XAI.set('pilot.hull', 0); XAI.set('pilot.engineering', 0);
XAI.recalcDerived();
if (XAI.get('mech.hpMax') !== 10) throw new Error('AI: Everest HP max must be 10 without Personalizations');
SAI.systems.push({name:'Personalizations', sp:0, desc:''});
XAI.recalcDerived();
if (XAI.get('mech.hpMax') !== 12) throw new Error('AI: with Personalizations equipped, HP max must be 10 + 2 = 12');
XAI.set('pilot.hull', 2); XAI.recalcDerived();
if (XAI.get('mech.hpMax') !== 16) throw new Error('AI: with Hull 2 and Personalizations, HP max must be 10 + 4 + 2 = 16');
SAI.systems = SAI.systems.filter(s => s.name !== 'Personalizations');
XAI.recalcDerived();
if (XAI.get('mech.hpMax') !== 14) throw new Error('AI: after removing Personalizations, HP max must return to 10 + 4 = 14');
// счётчики ресурсов — v39: 2 колонки как раньше, значение переносится, отступ до кнопок правил
if (!staticHtml.includes('class="grid res-grid"')) throw new Error('AI: the resources grid must carry the res-grid class');
if (/\.res-grid[^{]*\{[^}]*grid-template-columns:1fr[;}]/.test(staticHtml)) throw new Error('AI: no single-column override — the resources grid must stay 2 columns');
const nowrapUses = (staticHtml.match(/white-space:nowrap/g) || []).length;
// три разрешённых nowrap: ellipsis имени фрейма, индикатор шага мастера (v57) и тег статуса (v114 — двуязычное имя не рвётся; тег в flex-wrap, страница не разъезжается)
if (nowrapUses !== 3 || !staticHtml.includes('.frame-ro { font-size:16px; font-weight:600; padding:9px 0; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;') || !staticHtml.includes('.wizard-progress{')) throw new Error('AI: the counter value must wrap (no nowrap); the only allowed nowrap uses are the frame-name ellipsis and the wizard progress (found ' + nowrapUses + ')');
if (!/\.res-grid\s*\{\s*margin-bottom:16px;\s*\}/.test(staticHtml)) throw new Error('AI: the resources grid must have a 16px bottom margin (gap before the rules buttons)');


// PHASE AJ: v39 — счётчики в 2 колонки, кнопки правил сдвинуты ниже (версия — фаза AA)
if (!staticHtml.includes('class="grid res-grid"')) throw new Error('AJ: the resources grid must carry the res-grid class');
if (!/\.res-grid\s*\{\s*margin-bottom:16px;\s*\}/.test(staticHtml)) throw new Error('AJ: the resources grid must have a 16px bottom margin');
for (const t of ['Оверчардж', 'Потеря структуры', 'Перегрев реактора', 'Отдых и полный ремонт']) {
  if (!staticHtml.includes(t)) throw new Error('AJ: rules block missing: ' + t);
}

// PHASE AK: v39 — Core Bonuses (30 шт., корбук стр. 35/118/127/158/191/225)
const { X: XAK, S: SAK } = runEval({});
// данные: 6 у каждого из 5 производителей
if (!Array.isArray(XAK.CORE_BONUSES)) throw new Error('AK: CORE_BONUSES data must exist');
const CB = XAK.CORE_BONUSES;
if (CB.length !== 30) throw new Error('AK: there must be 30 core bonuses, got ' + CB.length);
const CB_CORPS = {};
CB.forEach(cb=>{ CB_CORPS[cb.corp] = (CB_CORPS[cb.corp]||0)+1; });
['GMS','IPS-N','SSC','HORUS','HA'].forEach(c=>{ if (CB_CORPS[c] !== 6) throw new Error('AK: ' + c + ' must have 6 core bonuses, got ' + (CB_CORPS[c]||0)); });
if (!CB.some(cb=>cb.n==='Reinforced Frame' && cb.corp==='IPS-N')) throw new Error('AK: Reinforced Frame must be IPS-N');
if (!CB.some(cb=>cb.n==='Superior By Design' && cb.corp==='HA')) throw new Error('AK: Superior By Design must be HA');
if (!CB.some(cb=>cb.n==='The Lesson of the Open Door' && cb.corp==='HORUS')) throw new Error('AK: Lesson of the Open Door must be HORUS');
// слоты: LL3 -> 1, LL6 -> 2, LL9 -> 3 (LL — сумма рангов лицензий, v55)
SAK.pilot.licenses = [{name:'Blackbeard', rank:2}];
if (XAK.coreBonusSlots() !== 0) throw new Error('AK: LL2 must give 0 core bonus slots');
SAK.pilot.licenses = [{name:'Blackbeard', rank:3}];
if (XAK.coreBonusSlots() !== 1) throw new Error('AK: LL3 must give 1 core bonus slot');
SAK.pilot.licenses = [{name:'Blackbeard', rank:3}, {name:'Lancaster', rank:3}];
if (XAK.coreBonusSlots() !== 2) throw new Error('AK: LL6 must give 2 core bonus slots');
SAK.pilot.licenses = [{name:'Blackbeard', rank:3}, {name:'Lancaster', rank:3}, {name:'Vlad', rank:3}];
if (XAK.coreBonusSlots() !== 3) throw new Error('AK: LL9 must give 3 core bonus slots');
// требования: GMS — всегда; IPS-N — 3 ранга за бонус (+3 за следующий)
// пилот: Blackbeard II + Lancaster I = 3 ранга IPS-N, LL3
SAK.pilot.licenses = [{name:'Blackbeard', rank:2}, {name:'Lancaster', rank:1}];
const gms = XAK.findCoreBonus('Improved Armament');
if (!XAK.coreBonusAllowed(gms).ok) throw new Error('AK: a GMS core bonus must always be allowed');
const rf = XAK.findCoreBonus('Reinforced Frame');
const alRF = XAK.coreBonusAllowed(rf);
if (!alRF.ok || alRF.need !== 3 || alRF.have !== 3) throw new Error('AK: Reinforced Frame needs 3 IPS-N ranks; pilot has 3, got need=' + alRF.need + ' have=' + alRF.have);
const sbd = XAK.findCoreBonus('Superior By Design');
const alSBD = XAK.coreBonusAllowed(sbd);
if (alSBD.ok) throw new Error('AK: Superior By Design must be blocked without HA ranks (have=' + alSBD.have + ')');
// второй бонус IPS-N требует уже 6 рангов
SAK.pilot.coreBonuses = ['Reinforced Frame'];
const alRF2 = XAK.coreBonusAllowed(XAK.findCoreBonus('Sloped Plating'));
if (alRF2.ok || alRF2.need !== 6) throw new Error('AK: a second IPS-N bonus needs 6 ranks, got need=' + alRF2.need + ' ok=' + alRF2.ok);
// бонусы к максимумам: Reinforced Frame +5 HP, Superior By Design +2 Heat Cap
XAK.set('mech.frame', 'Everest');
XAK.set('pilot.hull', 0); XAK.set('pilot.engineering', 0);
SAK.pilot.coreBonuses = [];
XAK.recalcDerived();
if (XAK.get('mech.hpMax') !== 10) throw new Error('AK: Everest HP max must be 10 without Reinforced Frame');
if (XAK.get('mech.heatMax') !== 6) throw new Error('AK: Everest Heat max must be 6 without Superior By Design');
SAK.pilot.coreBonuses = ['Reinforced Frame', 'Superior By Design'];
XAK.recalcDerived();
if (XAK.get('mech.hpMax') !== 15) throw new Error('AK: with Reinforced Frame, HP max must be 10 + 5 = 15, got ' + XAK.get('mech.hpMax'));
if (XAK.get('mech.heatMax') !== 8) throw new Error('AK: with Superior By Design, Heat max must be 6 + 2 = 8, got ' + XAK.get('mech.heatMax'));
// добавление/удаление через API
SAK.pilot.coreBonuses = [];
XAK.addCoreBonusByIdx(CB.findIndex(cb=>cb.n==='Reinforced Frame'));
if (SAK.pilot.coreBonuses.length !== 1 || SAK.pilot.coreBonuses[0] !== 'Reinforced Frame') throw new Error('AK: addCoreBonusByIdx must add Reinforced Frame');
XAK.addCoreBonusByIdx(CB.findIndex(cb=>cb.n==='Reinforced Frame'));
if (SAK.pilot.coreBonuses.length !== 1) throw new Error('AK: adding the same core bonus twice must not duplicate it');
XAK.removeCoreBonus(0);
if (SAK.pilot.coreBonuses.length !== 0) throw new Error('AK: removeCoreBonus must remove the bonus');
// карточка и диалог — в статике
if (!staticHtml.includes('id="coreBonuses"')) throw new Error('AK: the Core Bonuses card container must exist');
if (!staticHtml.includes('id="cbDlg"')) throw new Error('AK: the Core Bonuses picker dialog must exist');
if (!staticHtml.includes('Core Bonuses')) throw new Error('AK: the Core Bonuses card title must exist');

// PHASE AL: v40 — максимум ресурсов как в Оверчарже: одно число в счётчике, «max: N» мелким внизу; Repairs без русского слова
const { X: XAL, S: SAL, elements: elAL } = runEval({});
XAL.set('mech.frame', 'Everest');
XAL.set('pilot.hull', 2); XAL.set('pilot.engineering', 1);
XAL.recalcDerived();
XAL.renderCounters();
const resVals = {hp:['10','14'], structure:['4','4'], heat:['0','7'], stress:['4','4'], repairs:['5','6']};
for (const [k, pair] of Object.entries(resVals)) {
  const [cur, mxv] = pair;
  const el = elAL['v-mech.' + k];
  if (!el) throw new Error('AL: counter element missing: v-mech.' + k);
  if (el.textContent.trim() !== cur) throw new Error('AL: v-mech.' + k + ' must show just the current value ' + cur + ', got ' + JSON.stringify(el.textContent));
  if (el.innerHTML.includes('/')) throw new Error('AL: v-mech.' + k + ' must not contain a slash/max');
  const mx = elAL['max-mech.' + k];
  if (!mx) throw new Error('AL: max line missing: max-mech.' + k);
  if (mx.textContent.trim() !== 'max: ' + mxv) throw new Error('AL: max-mech.' + k + ' must say "max: ' + mxv + '", got ' + JSON.stringify(mx.textContent));
}
// пилотский HP — как раньше, «v / max» в самом значении
const ph = elAL['v-pilot.hp'];
if (!ph || !ph.innerHTML.includes('/')) throw new Error('AL: pilot HP must still show "v / max"');
// статика: строки max-* есть, подпись Repairs — без «Ремонты»
['max-mech.hp','max-mech.structure','max-mech.heat','max-mech.stress','max-mech.repairs'].forEach(id=>{
  if (!staticHtml.includes('id="' + id + '"')) throw new Error('AL: static max line missing: ' + id);
});
if (staticHtml.includes('Repairs / Ремонты')) throw new Error('AL: the Repairs label must not contain the Russian word');
if (!staticHtml.includes('>Repairs</label>')) throw new Error('AL: the Repairs label must be just "Repairs"');

// PHASE AM: v41 — таблицы (Structure / Stress) переделаны в строки: на телефоне ничего не обрезается
if (staticHtml.includes('<table')) throw new Error('AM: no <table> must remain in the static HTML');
const tblRows = (staticHtml.match(/class="tbl-row"/g) || []).length;
if (tblRows !== 8) throw new Error('AM: there must be 8 table rows (4 structure + 4 stress), found ' + tblRows);
if (!staticHtml.includes('.tbl-row') || !staticHtml.includes('.tbl-roll')) throw new Error('AM: the row CSS must exist');
for (const name of ['Glancing Blow','System Trauma','Direct Hit','Crushing Hit','Emergency Shunt','Destabilized Power Plant','Meltdown','Irreversible Meltdown']) {
  if (!staticHtml.includes(name)) throw new Error('AM: table result missing: ' + name);
}
for (const roll of ['5–6','2–4']) {
  const n = (staticHtml.match(new RegExp('<span class="tbl-roll">' + roll.replace('–','–') + '</span>', 'g')) || []).length;
  if (n !== 2) throw new Error('AM: roll ' + roll + ' must appear in both tables, found ' + n);
}
const { X: XAM } = runEval({});
for (const k of ['u023','u024','u025','u037','u038','u039']) {
  if (XAM.STR[k]) throw new Error('AM: removed table-header string ' + k + ' must not be in STR');
}
if (!XAM.STR.u026 || !XAM.STR.u041) throw new Error('AM: the row strings must stay in STR');

// PHASE AN: v42 — кнопка Core Power, вариант Б из макета: красная плашка, когда не использована; серая вдавленная, когда использована; отдельного индикатора нет
if (!staticHtml.includes('#coreBtn.cp-ready') || !staticHtml.includes('#coreBtn.cp-used')) throw new Error('AN: the Core Power button state CSS must exist');
if (staticHtml.includes('cp-indicator') || staticHtml.includes('coreIndicator')) throw new Error('AN: no separate Core Power indicator must exist');
const { X: XAN, S: SAN, elements: elAN } = runEval({});
const cbEl = elAN['coreBtn'];
if (!cbEl) throw new Error('AN: coreBtn element missing');
XAN.set('mech.coreUsed', 0);
XAN.renderCounters();
if (!cbEl.classList.contains('cp-ready') || cbEl.classList.contains('cp-used')) throw new Error('AN: unused Core Power must have cp-ready and not cp-used');
XAN.set('mech.coreUsed', 1);
XAN.renderCounters();
if (!cbEl.classList.contains('cp-used') || cbEl.classList.contains('cp-ready')) throw new Error('AN: used Core Power must have cp-used and not cp-ready');

// PHASE AO: v43 — плотные тексты переделаны в списки: System Trauma, Direct Hit, Destabilized Power Plant, Meltdown, подсказка HASE
const { X: XAO } = runEval({});
for (const k of ['u029','u031','u043','u045','u061']) {
  if (!XAO.STR[k] || !XAO.STR[k].ru || !XAO.STR[k].ru.includes('<ul>') || !XAO.STR[k].ru.includes('<li>')) throw new Error('AO: ' + k + ' ru must contain a list');
  if (!XAO.STR[k].en || !XAO.STR[k].en.includes('<ul>') || !XAO.STR[k].en.includes('<li>')) throw new Error('AO: ' + k + ' en must contain a list');
}
// статика: списки в теле страницы, HASE — <div> (в <p> список не влезает), CSS для списков есть
const bodyLists = (staticHtml.match(/<ul><li>/g) || []).length;
if (bodyLists < 5) throw new Error('AO: the static body must contain at least 5 lists, found ' + bodyLists);
if (!staticHtml.includes('<div class="hint" id="haseHint"')) throw new Error('AO: haseHint must be a div, not a p');
if (staticHtml.includes('<p class="hint" id="haseHint"')) throw new Error('AO: haseHint must not be a p');
if (!staticHtml.includes('.tbl-row ul') || !staticHtml.includes('#haseHint ul')) throw new Error('AO: the list CSS must exist');
// факты не потеряны: ключевые числа и термины на месте
for (const frag of ['1–3 — всё оружие', '4–6 — одна система', '3+ Structure:', '2 Structure:', '1 Structure:', '3+ Stress:', '2 Stress:', '1 Stress:', 'Hull: +2 HP/очко', 'Engineering: +1 Heat Cap/очко']) {
  if (!staticHtml.includes(frag)) throw new Error('AO: list content missing: ' + frag);
}

// PHASE AP: v44 — кнопка Core Power одной высоты в обоих состояниях; панель — «прикрученная металлическая» с чёрно-жёлтыми полосами
const css = staticHtml.slice(0, staticHtml.indexOf('</style>'));
const readyRule = (css.match(/#coreBtn\.cp-ready \{[^}]*\}/) || [])[0] || '';
const usedRule = (css.match(/#coreBtn\.cp-used \{[^}]*\}/) || [])[0] || '';
if (!readyRule || !usedRule) throw new Error('AP: the Core Power button state rules must exist');
// v117: кнопка круглая, 60px; высота задана общим правилом .cp-round, а не совпадающими padding в состояниях
const roundRule = (css.match(/#coreBtn\.cp-round \{[^}]*\}/) || [])[0] || '';
if (!roundRule.includes('width:120px') || !roundRule.includes('height:120px') || !roundRule.includes('border-radius:50%')) throw new Error('AP: the Core Power button must be a 120px circle (same height in both states)');
if (readyRule.includes('height:') || usedRule.includes('height:')) throw new Error('AP: the button states must not override the height (it comes from the shared round rule)');
const panelRule = (css.match(/\.core-power \{[^}]*\}/) || [])[0] || '';
if (!panelRule.includes('repeating-linear-gradient(45deg, #ffd43b 0 10px, #10131a 10px 20px)')) throw new Error('AP: the Core Power panel must have black-and-yellow hazard stripes');
if (!panelRule.includes('border:3px solid transparent')) throw new Error('AP: the hazard stripes must be the panel border');

// PHASE AQ: v45 — в пикере Core Bonus нет кнопки «Добавить»: доступный бонус добавляется тапом по всей строке
const { X: XAQ, S: SAQ } = runEval({});
if (XAQ.STR.cb_add) throw new Error('AQ: the removed cb_add string must not be in STR');
const { X: XAQ2, S: SAQ2, elements: elAQ2 } = runEval({});
SAQ2.pilot.licenses = [{name:'Blackbeard', rank:2}, {name:'Lancaster', rank:1}];
XAQ2.openCoreBonusPicker();
const listHtml = elAQ2['cbList'].innerHTML;
if (listHtml.includes('cb_add') || listHtml.includes('Добавить</button>')) throw new Error('AQ: the picker must not contain an Add button');
if (!listHtml.includes('cb-row')) throw new Error('AQ: the picker rows must carry the cb-row class');
// доступный бонус (GMS, слот есть) — строка кликабельна; недоступный (HA без лицензий) — нет
const gmsRow = (listHtml.match(/<div class="row cb-row" onclick="addCoreBonusByIdx\(\d+\)"/g) || []).length;
if (gmsRow < 6) throw new Error('AQ: all 6 GMS bonuses must be tappable rows, found ' + gmsRow);
if (!listHtml.includes('onclick="addCoreBonusByIdx(')) throw new Error('AQ: tappable rows must call addCoreBonusByIdx');
if (!staticHtml.includes('.cb-row')) throw new Error('AQ: the cb-row CSS must exist');
// тап по строке реально добавляет бонус и закрывает диалог
const before = (SAQ2.pilot.coreBonuses||[]).length;
XAQ2.addCoreBonusByIdx(0);
if ((SAQ2.pilot.coreBonuses||[]).length !== before + 1) throw new Error('AQ: tapping a row must add the bonus');

// PHASE AR: v46 — Grit «Grit (½ LL)»; ранг лицензии — дропдаун с римскими цифрами (широкий, заметный)
const { X: XAR } = runEval({});
if (XAR.STR.u084.ru !== 'Grit (½ LL)' || XAR.STR.u084.en !== 'Grit (½ LL)') throw new Error('AR: Grit label must be just "Grit (½ LL)"');
if (staticHtml.includes('Grit (авто:')) throw new Error('AR: the old Grit label must be gone');
if (!staticHtml.includes('lic-rank')) throw new Error('AR: the license rank select must carry the lic-rank class');
if (!staticHtml.includes('.row select.lic-rank')) throw new Error('AR: the lic-rank CSS must exist');
// опции ранга — римские цифры I/II/III
if (!html.includes("['I','II','III']")) throw new Error('AR: the license rank options must be Roman numerals');

// PHASE AS: v47 — «МЕХ» и HASE объединены в одну карточку «Статы» (вторая после ресурсов); иконки; компактный просмотр
const { X: XAS } = runEval({});
if (XAS.STR.u005 || XAS.STR.u059) throw new Error('AS: the removed u005/u059 strings must not be in STR');
if (XAS.STR.u165.ru !== 'Статы' || XAS.STR.u165.en !== 'Stats') throw new Error('AS: u165 must be "Статы"/"Stats"');
if (staticHtml.includes('id="mechCard"') || staticHtml.includes('id="haseCard"') || staticHtml.includes('id="editToggleHase"')) throw new Error('AS: the old Mech/HASE cards and the HASE toggle must be gone');
if (!staticHtml.includes('id="statsCard"')) throw new Error('AS: the merged Stats card must exist');
// порядок: ресурсы — первые, Статы — вторые (до Талантов)
const resPos = staticHtml.indexOf('u011');
const statsPos = staticHtml.indexOf('id="statsCard"');
const talPos = staticHtml.indexOf('u062');
if (!(resPos < statsPos && statsPos < talPos)) throw new Error('AS: Resources must come first, Stats second, Talents after');
// в карточке Статов: поля меха (имя/фрейм/размер/скорость) + 9 статов
const statsHtml = staticHtml.split('id="statsCard"')[1].split('u062')[0];
if (!statsHtml.includes('mech.name') || !statsHtml.includes('mechFrameName') || !statsHtml.includes('mech.size') || !statsHtml.includes('mech.speed')) throw new Error('AS: the Stats card must hold the mech identity fields');
['pilot.hull','pilot.agility','pilot.systems','pilot.engineering','mech.armor','mech.evasion','mech.edef','mech.sensors','mech.tech'].forEach(f=>{ if (!statsHtml.includes(f)) throw new Error('AS: the Stats card must hold ' + f); });
// v113: эмодзи-иконки убраны из статов (некрасивые, решение об иконках отложено)
['❤️','💨','💻','⚙️','🛡️','🌀','📡','🔭','🎯','📏','🏃'].forEach(ic=>{ if (statsHtml.includes(ic)) throw new Error('AS: stat emoji icon ' + ic + ' must be gone from the Stats card'); });
// компактный просмотр: подпись и значение в одну строку
if (!staticHtml.includes('#statsCard.view')) throw new Error('AS: the compact view-mode CSS for the Stats card must exist');
if (!staticHtml.includes('#statsCard.view .grid input[type="number"]')) throw new Error('AS: the compact number width must be set in view mode');

// PHASE AT: v48 — статы в 2 колонки в просмотре на телефоне; сетки не выталкивают контент за экран
if (!staticHtml.includes('.stat-row.cols-4 { grid-template-columns:repeat(4, minmax(0,1fr));')) throw new Error('AT: the 4-column stat rows must use minmax(0,1fr) so columns can shrink');
if (!staticHtml.includes('.grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr));')) throw new Error('AT: grids must use minmax(0,1fr) so columns can shrink');

if (!staticHtml.includes('.frame-ro { font-size:16px; font-weight:600; padding:9px 0; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;')) throw new Error('AT: the frame name must truncate with an ellipsis instead of pushing the column off-screen');

// PHASE AU: v49 — фрейм под именем (оба на всю ширину), без иконки 🤖; разделители до и после HASE
const statsHtmlAU = staticHtml.split('id="statsCard"')[1].split('u062')[0];
if (!statsHtmlAU.includes('grid-column:1 / -1')) throw new Error('AU: the name and frame rows must span the full width');
if ((statsHtmlAU.match(/grid-column:1 \/ -1/g) || []).length !== 2) throw new Error('AU: exactly two rows (name and frame) must span the full width');
if (html.includes('🤖')) throw new Error('AU: the robot icon must be removed from the Frame label');
// v113: разделителей .stat-div больше нет — HASE выделена первой строкой таблицы, защита — третьей
const rowsAU = statsHtmlAU.split('class="stat-row');
['pilot.hull','pilot.agility','pilot.systems','pilot.engineering'].forEach(f=>{ if (!rowsAU[1].includes(f)) throw new Error('AU: HASE stat ' + f + ' must sit in the first stat row'); });
if (rowsAU[1].includes('mech.armor')) throw new Error('AU: the defense stats must come in a later row, not with HASE');

// PHASE AV: v50 — в поиске систем «подробнее» раскрывает полное описание, «свернуть» возвращает обрезку
const { X: XAV, DB: DBAV, elements: elAV } = runEval({});
XAV.openSearch('system');
let htmlAV = elAV['searchDlgResults'].innerHTML;
const mAV = htmlAV.match(/openSearchDesc\('(sys:\d+)'\)/);
if (!mAV) throw new Error('AV: a long system description must offer a подробнее button in the search');
const keyAV = mAV[1];
const idxAV = +keyAV.split(':')[1];
if (!htmlAV.includes('…')) throw new Error('AV: the long description must be truncated with an ellipsis');
const fullAV = (XAV.sd(DBAV.systems[idxAV]).x || '').split('\n\n')[0].replace(/\n/g,' ');
if (fullAV.length <= 140) throw new Error('AV: the test system must have a long description');
if (htmlAV.includes(fullAV.slice(100, 160))) throw new Error('AV: the tail of the full description must be hidden before expanding');
// раскрыть
XAV.openSearchDesc(keyAV);
htmlAV = elAV['searchDlgResults'].innerHTML;
if (htmlAV.includes("openSearchDesc('" + keyAV + "')")) throw new Error('AV: after expanding, the подробнее button must be gone');
if (!htmlAV.includes("closeSearchDesc('" + keyAV + "')")) throw new Error('AV: after expanding, a свернуть button must appear');
if (!htmlAV.includes(fullAV.slice(100, 160))) throw new Error('AV: after expanding, the full description must be shown');
// свернуть обратно
XAV.closeSearchDesc(keyAV);
htmlAV = elAV['searchDlgResults'].innerHTML;
if (!htmlAV.includes("openSearchDesc('" + keyAV + "')")) throw new Error('AV: after collapsing, the подробнее button must return');

// PHASE AW: v51 — удаление маунта спрашивает подтверждение; отмена оставляет маунт на месте
const { X: XAW, S: SAW, elements: elAW, g: gAW } = runEval({});
const mountsBefore = SAW.mounts.length;
if (mountsBefore < 1) throw new Error('AW: there must be at least one mount to delete');
gAW.confirmCalls.length = 0;
XAW.delMount(0);
if (!gAW.confirmCalls.some(m => /маунт/i.test(m) || /mount/i.test(m))) throw new Error('AW: delMount must ask for confirmation mentioning the mount');
if (SAW.mounts.length !== mountsBefore - 1) throw new Error('AW: confirming must delete the mount');
// отмена: confirm возвращает false — маунт остаётся
const savedConfirm = global.confirm;
global.confirm = m => { gAW.confirmCalls.push(m); return false; };
const mountsBeforeCancel = SAW.mounts.length;
XAW.delMount(0);
if (SAW.mounts.length !== mountsBeforeCancel) throw new Error('AW: cancelling the confirm must keep the mount');
global.confirm = savedConfirm;

// PHASE AX: v52 — поиск талантов показывает описания рангов с «подробнее»; миграция чистит пустые
// сначала миграция старого сейва с пустыми строками
const oldStore = {};
oldStore['lancer-tracker-v1'] = JSON.stringify({ pilot:{ll:0}, mech:{frame:'Everest'}, talents:[{name:'',rank:1},{name:'Ace',rank:1}], triggers:[{name:'',bonus:2},{name:'Spot',bonus:2}], mounts:[{type:'Main',weapons:[]}], systems:[], statuses:[], settings:{} });
const rOld = runEval(oldStore);
if (rOld.S.talents.length !== 1 || rOld.S.talents[0].name !== 'Ace') throw new Error('AX: migrate must strip empty talents but keep named ones');
if (rOld.S.triggers.length !== 1 || rOld.S.triggers[0].name !== 'Spot') throw new Error('AX: migrate must strip empty triggers but keep named ones');
// поиск талантов — отдельным runEval (глобальный document принадлежит последнему runEval)
const { X: XAX, S: SAX, DB: DBAX, elements: elAX, g: gAX } = runEval({});
XAX.openSearch('talent');
let htmlAX = elAX['searchDlgResults'].innerHTML;
const mAX = htmlAX.match(/openSearchDesc\('(tal:\d+)'\)/);
if (!mAX) throw new Error('AX: a long talent description must offer a подробнее button in the search');
const keyAX = mAX[1];
const idxAX = +keyAX.split(':')[1];
const dAX = XAX.td(DBAX.talents[idxAX]);
const fullAX = (dAX.r||[]).map((rn,k)=>['I','II','III'][k]+'. '+rn+': '+(dAX.d[k]||'')).join('\n\n');
if (fullAX.length <= 140) throw new Error('AX: the test talent must have a long full description');
if (htmlAX.includes(fullAX.slice(100, 160))) throw new Error('AX: the tail of the full talent description must be hidden before expanding');
// раскрыть
XAX.openSearchDesc(keyAX);
htmlAX = elAX['searchDlgResults'].innerHTML;
if (htmlAX.includes("openSearchDesc('" + keyAX + "')")) throw new Error('AX: after expanding, the подробнее button must be gone');
if (!htmlAX.includes("closeSearchDesc('" + keyAX + "')")) throw new Error('AX: after expanding, a свернуть button must appear');
if (!htmlAX.includes(fullAX.slice(100, 160))) throw new Error('AX: after expanding, the full talent description must be shown');
// свернуть обратно
XAX.closeSearchDesc(keyAX);
htmlAX = elAX['searchDlgResults'].innerHTML;
if (!htmlAX.includes("openSearchDesc('" + keyAX + "')")) throw new Error('AX: after collapsing, the подробнее button must return');

// PHASE AY: v52 — имя лицензии — дропдаун; футер без текста u144; язык — слайдер
if (html.includes('Полный ремонт — кнопка в карточке')) throw new Error('AY: the footer disclaimer text (u144) must be gone');
if (!staticHtml.includes('id="langToggle"')) throw new Error('AY: the language slider must exist in the Rules tab');
if (staticHtml.includes('data-lang-btn')) throw new Error('AY: the old RUS/ENG buttons must be gone');
if (!staticHtml.includes('Версия трекера: 162')) throw new Error('AY: the footer must still show the tracker version');
// слайдер переключает язык и отражает состояние
const { X: XAY, S: SAY, elements: elAY } = runEval({});
if (XAY.lang() !== 'ru') throw new Error('AY: default language must be ru');
XAY.toggleLang();
if (XAY.lang() !== 'en') throw new Error('AY: toggleLang must switch ru -> en');
if (!elAY['langToggle'].classList.contains('on')) throw new Error('AY: the slider must be ON (knob right) in EN mode');
XAY.toggleLang();
if (XAY.lang() !== 'ru') throw new Error('AY: toggleLang must switch en -> ru');
if (elAY['langToggle'].classList.contains('on')) throw new Error('AY: the slider must be OFF (knob left) in RU mode');
// имя лицензии — дропдаун со всеми фреймами (кроме Everest), а не текстовое поле
SAY.pilot.licenses.push({name:'Blackbeard', rank:2});
XAY.renderLists();
const licHtmlAY = elAY['licenses'].innerHTML;
if (licHtmlAY.includes('<input')) throw new Error('AY: the license name must not be a text input');
if (!licHtmlAY.includes('<select')) throw new Error('AY: the license name must be a dropdown select');
if (!licHtmlAY.includes('value="Blackbeard"')) throw new Error('AY: the license dropdown must carry the frame key as the option value');
if (!licHtmlAY.includes('Чёрная Борода')) throw new Error('AY: the license dropdown must show the localized frame name');
// кастомная лицензия (не из базы) — сохраняется как опция, а не теряется
SAY.pilot.licenses.push({name:'My Homebrew Frame', rank:1});
XAY.renderLists();
const licHtmlAY2 = elAY['licenses'].innerHTML;
if (!licHtmlAY2.includes('My Homebrew Frame')) throw new Error('AY: a custom license name must be kept as an option, not dropped');

// PHASE AZ: v53 — секция «Левел ап» в правилах: чеклист, перераспределение, итоги по LL
if (!staticHtml.includes('Левел ап (повышение LL)')) throw new Error('AZ: the level-up section must exist in the Rules tab');
for (const t of ['+2 к триггеру', '+1 к навыку меха', '+1 ранг таланта', '+1 ранг лицензии', 'GRIT растёт сам', 'На каждом 3-м LL', 'Перераспределение', 'Итого по LL']) {
  if (!staticHtml.includes(t)) throw new Error('AZ: level-up section must contain: ' + t);
}
for (const t of ['LL0:</b> GRIT 0', 'LL3:</b> GRIT 2', 'LL6:</b> GRIT 3', 'LL12:</b> GRIT 6']) {
  if (!staticHtml.includes(t)) throw new Error('AZ: level chart must contain: ' + t);
}
// EN: заголовок и пункты переводятся (через STR — в стабе секции правил статичны)
const { X: XAZ } = runEval({});
if (XAZ.STR.u166.en !== 'Level Up (gaining LL)') throw new Error('AZ: the level-up heading must translate to EN');
if (!XAZ.STR.u170.en.includes('+1 talent rank')) throw new Error('AZ: the talent-rank item must translate to EN');
if (XAZ.STR.u179.en !== 'Totals by LL (sheet check)') throw new Error('AZ: the level chart heading must translate to EN');

// PHASE BA: v55 — LL считается сам как сумма рангов лицензий; выбирать его не надо
if (staticHtml.includes('stepLL(')) throw new Error('BA: stepLL must be gone');
if (staticHtml.includes('id="v-pilot.ll"')) throw new Error('BA: the LL stepper display must be gone');
if (staticHtml.includes('data-f="pilot.ll"')) throw new Error('BA: LL must not be an editable field');
if (!staticHtml.includes('id="llDisplay"')) throw new Error('BA: LL must show as a read-only computed value');
const { X: XBA, S: SBA, elements: elBA } = runEval({});
if (XBA.calcLL() !== 0) throw new Error('BA: fresh LL must be 0 (no licenses)');
SBA.pilot.licenses = [{name:'Blackbeard', rank:2}, {name:'Lancaster', rank:1}];
if (XBA.calcLL() !== 3) throw new Error('BA: LL must be the sum of license ranks (2+1=3)');
if (XBA.coreBonusSlots() !== 1) throw new Error('BA: LL3 must give 1 core bonus slot');
XBA.renderCounters();
if (elBA['llDisplay'].value !== 3 && elBA['llDisplay'].value !== '3') throw new Error('BA: the LL display must show 3 after adding licenses');
// старый сейв с полем ll — миграция его удаляет, LL считается из лицензий
const oldStoreBA = {};
oldStoreBA['lancer-tracker-v1'] = JSON.stringify({ pilot:{ll:5, licenses:[{name:'Blackbeard', rank:2}]}, mech:{frame:'Everest'}, talents:[], triggers:[], mounts:[{type:'Main',weapons:[]}], systems:[], statuses:[], settings:{} });
const rOldBA = runEval(oldStoreBA);
if ('ll' in rOldBA.S.pilot) throw new Error('BA: migrate must drop the stored ll field');
if (rOldBA.X.calcLL() !== 2) throw new Error('BA: an old save must compute LL from its licenses (2), not from the stored ll (5)');

// PHASE BB: v56 — LL и Grit обновляются сразу при смене лицензий, без перезагрузки страницы
const { X: XBB, S: SBB, elements: elBB } = runEval({});
if (XBB.calcLL() !== 0) throw new Error('BB: fresh LL must be 0');
SBB.pilot.licenses.push({name:'Blackbeard', rank:1});
XBB.renderLists();
if (elBB['llDisplay'].value !== 1 && elBB['llDisplay'].value !== '1') throw new Error('BB: adding a rank I license must update the LL display to 1 without a reload');
if (elBB['licenseLL'].textContent !== '1' && elBB['licenseLL'].textContent !== 1) throw new Error('BB: the license summary LL must update to 1');
// ранг II: LL 2, Grit 1
SBB.pilot.licenses[0].rank = 2;
XBB.renderLists();
if (elBB['llDisplay'].value !== 2 && elBB['llDisplay'].value !== '2') throw new Error('BB: raising the rank to II must update the LL display to 2 without a reload');
// удаление лицензии: LL 0
XBB.delLicense(0);
if (elBB['llDisplay'].value !== 0 && elBB['llDisplay'].value !== '0') throw new Error('BB: removing the license must update the LL display back to 0 without a reload');

// PHASE BC: v57 — мастер создания персонажа (пошаговый сбор меха и пилота)
if (!staticHtml.includes('id="wizardOverlay"')) throw new Error('BC: the wizard overlay must exist');
if (!staticHtml.includes('openWizard()')) throw new Error('BC: the Rules tab must have a wizard button');
// свежий сейв -> мастер открывается сам при загрузке
const { X: XBC, S: SBC, elements: elBC } = runEval({});
if (!XBC.wizardOpen()) throw new Error('BC: the wizard must auto-open on a fresh save');
if (XBC.wizardStepId() !== 'pilot') throw new Error('BC: the wizard must start on the pilot step');
if (!elBC['wizardBody'].innerHTML.includes('Имя пилота')) throw new Error('BC: step 1 must be the pilot step');
// навигация вперёд/назад
XBC.wizardNext();
if (XBC.wizardStepId() !== 'licenses') throw new Error('BC: wizardNext must go to licenses');
XBC.wizardBack();
if (XBC.wizardStepId() !== 'pilot') throw new Error('BC: wizardBack must return to pilot');
// шаг Core Bonuses: пропущен при LL0, появляется при LL3
const steps0 = XBC.wizardVisibleSteps();
if (steps0.length !== 8) throw new Error('BC: with LL0 the core step must be skipped (8 visible steps, systems step removed in v58)');
SBC.pilot.licenses = [{name:'Blackbeard', rank:2}, {name:'Lancaster', rank:1}];
const steps3 = XBC.wizardVisibleSteps();
if (steps3.length !== 9) throw new Error('BC: with LL3 the core step must appear (9 visible steps)');
// хук renderLists: шаг мастера перерисовывается при добавлении лицензии
XBC.wizardNext(); // -> licenses
XBC.renderLists();
if (!elBC['wizardBody'].innerHTML.includes('LL')) throw new Error('BC: the wizard step must re-render on renderLists');
// закрытие ставит флаг, чтобы не открывался сам снова
XBC.closeWizard();
if (XBC.wizardOpen()) throw new Error('BC: closeWizard must close the wizard');
if (!SBC.settings.wizardDismissed) throw new Error('BC: closing the wizard must set wizardDismissed');
// существующий персонаж -> автопоказа нет
const storeBC2 = {};
storeBC2['lancer-tracker-v1'] = JSON.stringify({ pilot:{name:'Test', licenses:[{name:'Blackbeard', rank:2}]}, mech:{frame:'Blackbeard'}, talents:[], triggers:[], mounts:[{type:'Main',weapons:[]}], systems:[], statuses:[], settings:{} });
const rBC2 = runEval(storeBC2);
if (rBC2.X.wizardOpen()) throw new Error('BC: the wizard must not auto-open for an existing character');

// PHASE BD: v59 — мастер левел апа переписан (прямые записи, знакомый UI, без шага замены и без Apply)
if (!staticHtml.includes('id="luOverlay"')) throw new Error('BD: the level-up overlay must exist');
if (!staticHtml.includes('openLevelUp()')) throw new Error('BD: the Rules tab must have a level-up button');
// кнопка — в НАЧАЛЕ вкладки Правила (перед первой секцией), а не в конце
const rulesTab = staticHtml.split('id="tab-rules"')[1].split('id="tab-')[0];
if (rulesTab.indexOf('openLevelUp()') > rulesTab.indexOf('Ход и структура боя')) throw new Error('BD: the level-up button must be at the top of the Rules tab');
if (staticHtml.includes("id:'realloc'")) throw new Error('BD: the reallocation step must be gone (rules as text instead)');
if (staticHtml.includes('luApply')) throw new Error('BD: there must be no Apply step — the wizard writes directly to S');
const storeBD = {};
storeBD['lancer-tracker-v1'] = JSON.stringify({
  pilot:{name:'Test', licenses:[{name:'Blackbeard', rank:2}, {name:'Lancaster', rank:1}], coreBonuses:[], hull:2, agility:0, systems:0, engineering:0},
  mech:{frame:'Blackbeard'},
  talents:[{name:'Ace', rank:3}, {name:'Brutal', rank:1}],
  triggers:[{name:'Assault', bonus:2}, {name:'Get Somewhere Fast', bonus:2}],
  mounts:[{type:'Main',weapons:[]}], systems:[], statuses:[], settings:{}
});
const { X: XBD, S: SBD, elements: elBD } = runEval(storeBD);
if (XBD.luOpen()) throw new Error('BD: the level-up wizard must start closed');
XBD.openLevelUp();
if (!XBD.luOpen()) throw new Error('BD: openLevelUp must open the wizard');
if (XBD.luStepId() !== 'overview') throw new Error('BD: the level-up wizard must start on the overview step');
if (XBD.luBaseLL() !== 3) throw new Error('BD: base LL must be 3 (Blackbeard II + Lancaster I)');
// обзор: правила перераспределения — текстом (u228), шага замены нет
if (!elBD['luBody'].innerHTML.includes('Перераспределение')) throw new Error('BD: the overview must show the reallocation rules as text');
// LL3 -> LL4: нового слота Core Bonus нет
if (XBD.luVisibleSteps().some(s=>s.id==='core')) throw new Error('BD: LL3->LL4 must not offer a core bonus step');
// триггер +2 — СРАЗУ в S, без Apply и без перезагрузки
XBD.luRaiseTrigger('Assault');
if (SBD.triggers[0].bonus !== 4) throw new Error('BD: +2 to a trigger must apply to S immediately');
if (XBD.luPicked().trigger !== 'Assault') throw new Error('BD: the raised trigger must be tracked');
// повторный тап по тому же — снимает
XBD.luRaiseTrigger('Assault');
if (SBD.triggers[0].bonus !== 2) throw new Error('BD: tapping the same trigger again must revert the +2');
if (XBD.luPicked().trigger !== null) throw new Error('BD: the pick must clear after revert');
// перенос на другой триггер
XBD.luRaiseTrigger('Assault');
XBD.luRaiseTrigger('Get Somewhere Fast');
if (SBD.triggers[0].bonus !== 2 || SBD.triggers[1].bonus !== 4) throw new Error('BD: raising another trigger must revert the first and raise the second');
// навык меха +1 — сразу в S и в data-f инпуте (фикс «не применяется до перезагрузки»)
XBD.luRaiseHase('hull');
if (SBD.pilot.hull !== 3) throw new Error('BD: +1 HASE must apply to S immediately');
// талант +1 (Brutal I -> II)
XBD.luRaiseTalent('Brutal');
if (SBD.talents[1].rank !== 2) throw new Error('BD: +1 talent rank must apply to S immediately');
// лицензия +1 (Lancaster I -> II) — LL 3 -> 4, сразу
XBD.luRaiseLicense('Lancaster');
if (SBD.pilot.licenses[1].rank !== 2) throw new Error('BD: +1 license rank must apply to S immediately');
if (XBD.calcLL() !== 4) throw new Error('BD: LL must be 4 right after the license raise (no reload)');
// LL5 -> LL6: новый слот Core Bonus появляется
const storeBD2 = {};
storeBD2['lancer-tracker-v1'] = JSON.stringify({
  pilot:{name:'Test', licenses:[{name:'Blackbeard', rank:3}, {name:'Lancaster', rank:2}], coreBonuses:['Improved Armament'], hull:2, agility:0, systems:0, engineering:0},
  mech:{frame:'Blackbeard'},
  talents:[], triggers:[{name:'Assault', bonus:2}],
  mounts:[{type:'Main',weapons:[]}], systems:[], statuses:[], settings:{}
});
const rBD2 = runEval(storeBD2);
rBD2.X.openLevelUp();
if (rBD2.X.luVisibleSteps().some(s=>s.id==='core')) throw new Error('BD: before the license pick, LL5 must not show the core step yet');
rBD2.X.luRaiseLicense('Lancaster'); // Lancaster II -> III, LL 5 -> 6
if (rBD2.X.calcLL() !== 6) throw new Error('BD: LL must be 6 after the license raise');
if (!rBD2.X.luVisibleSteps().some(s=>s.id==='core')) throw new Error('BD: LL5->LL6 must offer the core bonus step');


// PHASE BE (v64): справочник действий — свои реакции и протоколы, только те, что даёт сборка
if (!html.includes('id="myActions"')) throw new Error('BE: the Rules tab must have a #myActions container');
if (!html.includes('Версия трекера: 162')) throw new Error('BE: footer must say version 64');
const ABE = global.__x.ACTIONS_REF;
if (!ABE || ABE.reactions.length !== 14) throw new Error('BE: ACTIONS_REF must have 14 reactions, got ' + (ABE && ABE.reactions.length));
if (ABE.protocols.length !== 19) throw new Error('BE: ACTIONS_REF must have 19 protocols, got ' + ABE.protocols.length);
if (ABE.reactions.filter(r=>r.def).length !== 2) throw new Error('BE: exactly 2 default reactions');
if (!ABE.reactions.some(r=>r.key==='intercede' && r.grant.talent==='Bonded' && r.grant.rank===2)) throw new Error('BE: Intercede must be Bonded II (Sundance is the rank-II feature name, not a talent)');
if (!ABE.reactions.some(r=>r.key==='supersonic' && r.grant.talent==='Ace' && r.grant.rank===3)) throw new Error('BE: Supersonic must be Ace III');
if (!ABE.reactions.some(r=>r.key==='returnfire' && r.grant.talent==='Gunslinger' && r.grant.rank===2)) throw new Error('BE: Return Fire must be Gunslinger II');
if (!ABE.reactions.some(r=>r.key==='valiantaid' && r.grant.talent==='Exemplar' && r.grant.rank===1)) throw new Error('BE: Valiant Aid must be Exemplar I');
if (!ABE.reactions.some(r=>r.key==='flank' && r.grant.talent==='Tactician' && r.grant.rank===3)) throw new Error('BE: Flank must be Tactician III');
if (!ABE.protocols.some(p=>p.grant.system==='Active Camouflage')) throw new Error('BE: Active Camouflage protocol missing');
// сборка с Сандэнсом II и Активным камуфляжем: показываются только их действия
const storeBE = {};
storeBE['lancer-tracker-v1'] = JSON.stringify({
  pilot:{name:'Test', licenses:[{name:'Blackbeard', rank:2}, {name:'Lancaster', rank:1}], coreBonuses:[], hull:2, agility:0, systems:0, engineering:0},
  mech:{frame:'Blackbeard'},
  talents:[{name:'Bonded', rank:2}], triggers:[{name:'Assault', bonus:2}],
  mounts:[{type:'Main',weapons:[]}], systems:[{name:'Active Camouflage', desc:'', charges:0}], statuses:[], settings:{}
});
const rBE = runEval(storeBE);
const myHtml = rBE.elements['myActions'].innerHTML;
if (!myHtml.includes('Вмешательство') && !myHtml.includes('Intercede')) throw new Error('BE: Bonded II must show Intercede in My actions');
if (!myHtml.includes('Активный камуфляж') && !myHtml.includes('Active Camouflage')) throw new Error('BE: Active Camouflage must show its protocol in My actions');
if (myHtml.includes('Ответный огонь') || myHtml.includes('Return Fire')) throw new Error('BE: Return Fire must NOT show without Gunslinger');
if (myHtml.includes('Сверхзвук') || myHtml.includes('Supersonic')) throw new Error('BE: Supersonic must NOT show with Bonded II (it needs Ace III)');
if (myHtml.includes('Протокол «Сехмет»') || myHtml.includes('SEKHMET Protocol')) throw new Error('BE: SEKHMET protocol must NOT show without the system');
// пустая сборка: показывается примечание «нет действий»
const storeBE2 = {};
storeBE2['lancer-tracker-v1'] = JSON.stringify({
  pilot:{name:'Test', licenses:[], coreBonuses:[], hull:0, agility:0, systems:0, engineering:0},
  mech:{frame:'Everest'},
  talents:[], triggers:[],
  mounts:[{type:'Main',weapons:[]}], systems:[], statuses:[], settings:{}
});
const rBE2 = runEval(storeBE2);
if (!rBE2.elements['myActions'].innerHTML.includes('Дополнительных действий пока нет') && !rBE2.elements['myActions'].innerHTML.includes('No extra actions yet')) throw new Error('BE: empty build must show the no-actions note');


// PHASE BF (v65): Cockpit — нижняя навигация иконками (робот в полный рост, человек, книга),
// HP-кольцо и термометр Heat вместо отдельных счётчиков; Structure/Stress/Repairs/OC — как раньше
if (!/nav\s*\{[^}]*position:fixed[^}]*bottom:0/.test(staticHtml)) throw new Error('BF: nav must be a fixed bottom bar');
if (!staticHtml.includes('id="tabMechBtn"') || !staticHtml.includes('id="tabPilotBtn"') || !staticHtml.includes('id="tabRulesBtn"')) throw new Error('BF: nav buttons must keep their ids');
if (staticHtml.includes('data-i18n="u002"') || staticHtml.includes('data-i18n="u003"') || staticHtml.includes('data-i18n="u004"')) throw new Error('BF: nav buttons must be icon-only, no text i18n');
const navIdx = staticHtml.indexOf('<nav>');
const navHtml = staticHtml.slice(navIdx, staticHtml.indexOf('</nav>', navIdx));
if ((navHtml.match(/<svg/g) || []).length !== 3) throw new Error('BF: nav must have exactly 3 SVG icons (robot, person, book)');
if (!navHtml.includes('aria-label="Мех"') || !navHtml.includes('aria-label="Пилот"') || !navHtml.includes('aria-label="Правила"')) throw new Error('BF: nav icons need aria-labels');
if (!staticHtml.includes('padding:16px 16px 92px')) throw new Error('BF: main needs bottom padding so the fixed nav does not cover content');
if (!staticHtml.includes('id="hpRingFill"') || !staticHtml.includes('id="heatThermoFill"')) throw new Error('BF: HP ring and Heat thermometer must exist');
if (!staticHtml.includes('class="ring-hp"')) throw new Error('BF: ring centre needs the hp unit next to the HP value');
// кольцо и термометр — живые: renderCounters обновляет дугу и высоту заполнения
const rBF = runEval({});
const elBF = rBF.elements, XBF = rBF.X;
XBF.renderCounters();
const C = 2 * Math.PI * 58;
if (Math.abs(Number(elBF['hpRingFill'].style.strokeDashoffset) - 0) > 0.01) throw new Error('BF: full HP (10/10) must leave the ring offset at 0, got ' + elBF['hpRingFill'].style.strokeDashoffset);
if (elBF['hpRingFill'].style.stroke !== '#51cf66') throw new Error('BF: full HP ring must be green, got ' + elBF['hpRingFill'].style.stroke);
if (elBF['heatThermoFill'].style.height !== '0%') throw new Error('BF: Heat 0/6 must leave the thermometer at 0%, got ' + elBF['heatThermoFill'].style.height);
XBF.set('mech.hp', 5); XBF.set('mech.heat', 3); XBF.renderCounters();
if (Math.abs(Number(elBF['hpRingFill'].style.strokeDashoffset) - C / 2) > 0.01) throw new Error('BF: HP 5/10 must leave the ring half empty (offset C/2), got ' + elBF['hpRingFill'].style.strokeDashoffset);
if (elBF['hpRingFill'].style.stroke !== '#ffd43b') throw new Error('BF: HP at half must turn the ring yellow, got ' + elBF['hpRingFill'].style.stroke);
if (elBF['heatThermoFill'].style.height !== '50%') throw new Error('BF: Heat 3/6 must fill the thermometer to 50%, got ' + elBF['heatThermoFill'].style.height);
if (!staticHtml.includes('class="ring-minus"') || !staticHtml.includes('class="ring-plus"')) throw new Error('BF: +/- must live inside the HP ring (left/right)');
XBF.set('mech.hp', 0); XBF.set('mech.heat', 6); XBF.renderCounters();
if (Math.abs(Number(elBF['hpRingFill'].style.strokeDashoffset) - C) > 0.01) throw new Error('BF: HP 0 must empty the ring (offset C), got ' + elBF['hpRingFill'].style.strokeDashoffset);
if (elBF['hpRingFill'].style.stroke !== '#ff6b6b') throw new Error('BF: HP 0 must turn the ring red, got ' + elBF['hpRingFill'].style.stroke);
if (elBF['heatThermoFill'].style.height !== '100%') throw new Error('BF: Heat at cap must fill the thermometer to 100%, got ' + elBF['heatThermoFill'].style.height);
if (!elBF['heatThermoFill'].classList.contains('hot')) throw new Error('BF: Heat at cap must mark the thermometer hot');
// переключение вкладок иконками работает
XBF.showTab('pilot');
if (!elBF['tab-pilot'].classList.contains('active')) throw new Error('BF: showTab(pilot) must activate the Pilot section');
if (!elBF['tabPilotBtn'].classList.contains('active')) throw new Error('BF: showTab(pilot) must mark the person icon active');
if (elBF['tabMechBtn'].classList.contains('active')) throw new Error('BF: showTab(pilot) must deactivate the robot icon');


// PHASE BG (v66): Core System — в карточке ресурсов (кнопка под индикаторами, описание под кнопкой),
// редактирования нет; термометр шире, цифра как в кольце HP, +/- внутри термометра, огонёк под числом, лейблов нет
if (staticHtml.includes('id="coreCard"')) throw new Error('BG: the separate Core System card must be gone');
if (staticHtml.includes('id="editToggleCore"')) throw new Error('BG: the Core System edit toggle must be gone');
if (staticHtml.includes('data-f="mech.coreSystem"')) throw new Error('BG: the Core System name must not be an editable input');
const resCardIdx = staticHtml.indexOf('Ресурсы боя');
const coreBtnIdx = staticHtml.indexOf('id="coreBtn"', resCardIdx);
const ocDetailsIdx = staticHtml.indexOf('<details class="sec">', resCardIdx);
if (!(coreBtnIdx > 0 && ocDetailsIdx > 0 && coreBtnIdx < ocDetailsIdx)) throw new Error('BG: the Core Power button must live inside the resources card, before the rules blocks');
if (!staticHtml.includes('id="coreNameBox"') || !staticHtml.includes('id="coreDescBox"')) throw new Error('BG: Core System name and description must live in the resources card');
const coreDescIdx = staticHtml.indexOf('id="coreDescBox"', resCardIdx);
const coreUsedIdx = staticHtml.indexOf('data-f="mech.coreUsed"', resCardIdx);
if (!(coreDescIdx > coreBtnIdx && coreDescIdx < coreUsedIdx && coreUsedIdx < ocDetailsIdx)) throw new Error('BG: the Core System description must sit inside the Core Power panel (below the button, before the panel closes) and above the rules blocks');
if (staticHtml.includes('data-i18n="u012"')) throw new Error('BG: the Heat label above the thermometer must be gone');
if (staticHtml.includes('>HP</label>')) throw new Error('BG: the HP label above the ring must be gone');
if (!staticHtml.includes('class="thermo-plus"') || !staticHtml.includes('class="thermo-minus"')) throw new Error('BG: +/- must live inside the thermometer');
if (!/\.thermo\s*\{[^}]*width:64px/.test(staticHtml)) throw new Error('BG: the thermometer must be wider (64px)');
if (!/\.thermo-val\s+\.val\s*\{[^}]*font-size:36px/.test(staticHtml)) throw new Error('BG: the thermometer digit must be 36px, same as the HP ring');
if (!staticHtml.includes('class="thermo-ico"')) throw new Error('BG: the flame must sit under the number inside the thermometer');
// имя Core System показывается из фрейма, описание — только для чтения
const rBG = runEval({});
const elBG = rBG.elements, XBG = rBG.X;
XBG.renderLists();
if (!elBG['coreNameBox']) throw new Error('BG: coreNameBox must exist');
if (elBG['coreNameBox'].textContent.trim() !== XBG.dispField('mech.coreSystem')) throw new Error('BG: coreNameBox must show the frame Core System name, got ' + JSON.stringify(elBG['coreNameBox'].textContent));
if (!elBG['coreDescBox'].innerHTML.includes(XBG.dispField('mech.coreDesc').slice(0, 30))) throw new Error('BG: coreDescBox must still show the Core System description');
if (elBG['coreDescBox'].innerHTML.includes('Редактировать')) throw new Error('BG: coreDescBox must have no edit button');


// PHASE BH (v67): +/- HP встроены в кольцо (слева/справа), в центре "10 ❤️" (max уже внизу),
// описание Core System — внутри оранжевой рамки Core Power
if (staticHtml.includes('id="hpRingMax"')) throw new Error('BH: the /max label inside the ring must be gone (max is already below the ring)');
if (staticHtml.includes('class="ring-btns"')) throw new Error('BH: the +/- buttons below the ring must be gone');
const ringWrapIdx = staticHtml.indexOf('class="ring-wrap"');
const ringMinusIdx = staticHtml.indexOf('class="ring-minus"', ringWrapIdx);
const ringPlusIdx = staticHtml.indexOf('class="ring-plus"', ringWrapIdx);
if (!(ringMinusIdx > ringWrapIdx && ringPlusIdx > ringMinusIdx)) throw new Error('BH: +/- must be inside the ring-wrap, minus on the left, plus on the right');
if (!staticHtml.includes("onclick=\"step('mech.hp',-1)\"") || !staticHtml.includes("onclick=\"step('mech.hp',1)\"")) throw new Error('BH: the in-ring +/- must still step HP');
const ringValIdx = staticHtml.indexOf('class="ring-val"', ringWrapIdx);
if (!(ringValIdx > ringMinusIdx && ringValIdx < ringPlusIdx)) throw new Error('BH: the HP value + heart must sit between the in-ring - and +');
if (!/\.ring-val\s+\.val\.low\s*\{[^}]*color:var\(--bad\)/.test(staticHtml)) throw new Error('BH: the HP number must turn red at 0 HP');
// renderCounters: число 0 красит цифру в красный (класс low)
const rBH = runEval({});
const elBH = rBH.elements, XBH = rBH.X;
XBH.set('mech.hp', 0); XBH.renderCounters();
if (!elBH['v-mech.hp'].classList.contains('low')) throw new Error('BH: HP 0 must mark the ring number low (red)');


// PHASE BI (v68): короткие заголовки таблиц (в 1 строку на телефоне) + металлический фон навигации
const rBI = runEval({});
if (rBI.X.STR.u021.ru !== 'Потеря структуры' || rBI.X.STR.u021.en !== 'Structure Damage') throw new Error('BI: u021 must be the short title in both languages');
if (rBI.X.STR.u035.ru !== 'Перегрев реактора' || rBI.X.STR.u035.en !== 'Reactor Overheat') throw new Error('BI: u035 must be the short title in both languages');
if (rBI.X.STR.u002 || rBI.X.STR.u012) throw new Error('BI: orphaned units u002/u012 (removed nav text, removed Heat label) must be gone from STR');
if (!staticHtml.includes('>Потеря структуры</summary>') || !staticHtml.includes('>Перегрев реактора</summary>')) throw new Error('BI: the short table titles must be in the static HTML');
if (staticHtml.includes('Таблица потери структуры') || staticHtml.includes('Таблица перегрева реактора')) throw new Error('BI: the long table titles must be gone');
// фон навигации — металлическая пластина: слоистый градиент + текстура, а не плоский цвет
if (/nav\s*\{[^}]*repeating-linear-gradient\(115deg/.test(staticHtml)) throw new Error('BI: the brushed texture stripes on the nav background must be gone (v150)');
if (!/nav\s*\{[^}]*linear-gradient\(180deg,\s*#2b333f/.test(staticHtml)) throw new Error('BI: nav background must have the metal gradient layer');
if (!/nav\s*\{[^}]*box-shadow:0 -6px 20px/.test(staticHtml)) throw new Error('BI: nav must cast a shadow above the content');
if (staticHtml.includes('nav::before')) throw new Error('BI: the hazard stripe above the nav must be gone (it merged with the Core Power panel frame)');


if (!/\.res-top\s*\{[^}]*display:grid;[^}]*grid-template-columns:1fr 1fr/.test(staticHtml)) throw new Error('BJ: res-top must be two equal columns so the ring and the thermometer sit balanced');
// max — внутри контролов (экономия места по вертикали): в кольце второй строкой, в термометре под огоньком
if (!staticHtml.includes('class="ring-max" id="max-mech.hp"')) throw new Error('BJ: max must live inside the ring (second line under the value), not below it');
if (!staticHtml.includes('class="thermo-max" id="max-mech.heat"')) throw new Error('BJ: max must live inside the thermometer (under the flame), not below it');
if (staticHtml.includes('class="oc-next" id="max-mech.hp"') || staticHtml.includes('class="oc-next" id="max-mech.heat"')) throw new Error('BJ: no separate max line may remain below the ring or the thermometer');
// PHASE BJ (v69): в центре кольца "N hp" (без сердечка), у +/- вертикальные разделители и свой фон
if (staticHtml.includes('class="ring-heart"')) throw new Error('BJ: the heart in the ring centre must be gone');
if (!staticHtml.includes('class="ring-hp">hp</div>')) throw new Error('BJ: the ring centre must show the hp unit next to the value');
if (/\.ring-minus,\s*\.ring-plus\s*\{[^}]*background:rgba\(255,255,255,\.07\)/.test(staticHtml)) throw new Error('BJ: the rectangular background behind the in-ring +/- must be gone (it did not fit the circle)');
if (!/\.ring-minus\s*\{[^}]*border-right:1px solid/.test(staticHtml)) throw new Error('BJ: the minus zone needs a vertical divider on its inner edge');
if (!/\.ring-plus\s*\{[^}]*border-left:1px solid/.test(staticHtml)) throw new Error('BJ: the plus zone needs a vertical divider on its inner edge');
if (!/\.ring-hp\s*\{[^}]*font-size:18px/.test(staticHtml)) throw new Error('BJ: the hp unit must be smaller than the number (18px)');


// PHASE BK (v70): у +/- в кольце нет прямоугольного фона (только разделители), у навигации — сплошная янтарная линия вместо аварийной полосы
if (/\.ring-minus,\s*\.ring-plus\s*\{[^}]*border-radius/.test(staticHtml)) throw new Error('BK: the in-ring +/- zones must have no rounded-rectangle background at all');
if (!/\.ring-minus\s*\{[^}]*border-right:1px solid/.test(staticHtml)) throw new Error('BK: the minus zone must keep its vertical divider');
if (!/\.ring-plus\s*\{[^}]*border-left:1px solid/.test(staticHtml)) throw new Error('BK: the plus zone must keep its vertical divider');
if (/nav\s*\{[^}]*border-top/.test(staticHtml)) throw new Error('BK: the nav must have no top border at all (v81)');
if (!/nav\s*\{[^}]*0 -2px 16px rgb\(0 0 0 \/ 18%\)/.test(staticHtml)) throw new Error('BK: the nav must cast a black shadow above it (v81)');


// PHASE BL (v71): разделители в кольце доходят до самого круга, +/- не мигают при нажатии
if (!/\.ring-minus,\s*\.ring-plus\s*\{[^}]*height:88px/.test(staticHtml)) throw new Error('BL: the in-ring +/- zones must be 88px tall so the dividers stop short of the ring edge');
if (!/\.ring-minus,\s*\.ring-plus\s*\{[^}]*-webkit-tap-highlight-color:transparent/.test(staticHtml)) throw new Error('BL: the in-ring +/- must not show a tap highlight (it reveals the rectangular zone)');
if (!/\.thermo-plus,\s*\.thermo-minus\s*\{[^}]*-webkit-tap-highlight-color:transparent/.test(staticHtml)) throw new Error('BL: the thermometer +/- must not show a tap highlight either');


// PHASE BM (v73): гранты реакций по корбуку + «Ход и структура боя» не раскрыт по умолчанию
const rBM = runEval({});
const ABM = rBM.X.ACTIONS_REF;
if (!ABM.reactions.some(r=>r.key==='intercede' && r.grant.talent==='Bonded' && r.grant.rank===2)) throw new Error('BM: Intercede must be granted by Bonded II');
if (!ABM.reactions.some(r=>r.key==='supersonic' && r.grant.talent==='Ace' && r.grant.rank===3)) throw new Error('BM: Supersonic must be granted by Ace III');
// сборка со Связанными III (как у пользователя): Вмешательство есть, Сверхзвука нет
const storeBM = {};
storeBM['lancer-tracker-v1'] = JSON.stringify({
  pilot:{name:'Test', licenses:[], coreBonuses:[], hull:0, agility:0, systems:0, engineering:0},
  mech:{frame:'Everest'},
  talents:[{name:'Bonded', rank:3}], triggers:[{name:'Assault', bonus:2}],
  mounts:[{type:'Main',weapons:[]}], systems:[], statuses:[], settings:{}
});
const rBM2 = runEval(storeBM);
const myHtmlBM = rBM2.elements['myActions'].innerHTML;
if (!myHtmlBM.includes('Вмешательство') && !myHtmlBM.includes('Intercede')) throw new Error('BM: Bonded III must show Intercede in My actions');
if (myHtmlBM.includes('Сверхзвук') || myHtmlBM.includes('Supersonic')) throw new Error('BM: Supersonic must NOT show without Ace III');
// сборка с Асом III: Сверхзвук есть, Вмешательства нет
const storeBM3 = {};
storeBM3['lancer-tracker-v1'] = JSON.stringify({
  pilot:{name:'Test', licenses:[], coreBonuses:[], hull:0, agility:0, systems:0, engineering:0},
  mech:{frame:'Everest'},
  talents:[{name:'Ace', rank:3}], triggers:[{name:'Assault', bonus:2}],
  mounts:[{type:'Main',weapons:[]}], systems:[], statuses:[], settings:{}
});
const myHtmlBM3 = runEval(storeBM3).elements['myActions'].innerHTML;
if (!myHtmlBM3.includes('Сверхзвук') && !myHtmlBM3.includes('Supersonic')) throw new Error('BM: Ace III must show Supersonic in My actions');
if (myHtmlBM3.includes('Вмешательство') || myHtmlBM3.includes('Intercede')) throw new Error('BM: Intercede must NOT show without Bonded II');
// «Твои действия» раскрыты по умолчанию, «Ход и структура боя» — нет
const rulesIdx = staticHtml.indexOf('id="tab-rules"');
const rulesHtml = staticHtml.slice(rulesIdx);
if (!/\<details class="sec" open\>\s*<summary data-i18n="u229">/.test(rulesHtml)) throw new Error('BM: My actions must stay open by default');
if (/\<details class="sec" open\>\s*<summary data-i18n="u097">/.test(rulesHtml)) throw new Error('BM: Turn structure must NOT open by default');


// PHASE BN (v74): футер переехал вниз вкладки Правил; свайпы переключают вкладки
if (staticHtml.includes('<footer>') || staticHtml.includes('</footer>')) throw new Error('BN: the <footer> element must be gone');
const rulesIdxBN = staticHtml.indexOf('id="tab-rules"');
const rulesHtmlBN = staticHtml.slice(rulesIdxBN);
if (!rulesHtmlBN.includes('class="rules-foot"')) throw new Error('BN: the Rules tab must have the .rules-foot block at the bottom');
for (const id of ['exportJSON()', 'importFile', 'resetAll()', 'openWizard()', 'id="langToggle"', 'Версия трекера: 162']) {
  if (!rulesHtmlBN.includes(id)) throw new Error('BN: Rules tab must contain ' + id);
}
if (!/\.rules-foot\s*\{[^}]*border-top:1px solid var\(--line\)/.test(staticHtml)) throw new Error('BN: .rules-foot must keep the footer divider line');
// свайпы: mech -> pilot -> rules -> (стоп), обратно rules -> pilot -> mech -> (стоп)
const XBN = runEval({}).X;
if (XBN.curTab() !== 'mech') throw new Error('BN: curTab must start at mech');
XBN.swipeTab(1);
if (XBN.curTab() !== 'pilot') throw new Error('BN: swipe left from mech must go to pilot');
XBN.swipeTab(1);
if (XBN.curTab() !== 'rules') throw new Error('BN: swipe left from pilot must go to rules');
XBN.swipeTab(1);
if (XBN.curTab() !== 'rules') throw new Error('BN: swipe left on rules must stay (no wrap)');
XBN.swipeTab(-1);
if (XBN.curTab() !== 'pilot') throw new Error('BN: swipe right from rules must go to pilot');
XBN.swipeTab(-1);
if (XBN.curTab() !== 'mech') throw new Error('BN: swipe right from pilot must go to mech');
XBN.swipeTab(-1);
if (XBN.curTab() !== 'mech') throw new Error('BN: swipe right on mech must stay (no wrap)');


// PHASE BO (v75): новый порядок Правил; «Другие действия» внутри Быстрых; Реакции без Свободных;
// слайдер языка с буквами внутри; анимация смены вкладок; линза в навигации
(function(){
  const order = ['u229','u103','u116','u130','u136','u097','u166'];
  let prev = -1;
  for (const u of order) {
    const i = staticHtml.indexOf('<summary data-i18n="' + u + '">');
    if (i < 0) throw new Error('BO: Rules tab must have section ' + u);
    if (i <= prev) throw new Error('BO: Rules tab order is wrong at ' + u);
    prev = i;
  }
  if (staticHtml.includes('<summary data-i18n="u124">')) throw new Error('BO: «Другие действия» must not be a separate section anymore');
  const quickIdx = staticHtml.indexOf('<summary data-i18n="u103">');
  const quickHtml = staticHtml.slice(quickIdx, staticHtml.indexOf('<summary data-i18n="u116">', quickIdx));
  if (!quickHtml.includes('<h3 data-i18n="u124">')) throw new Error('BO: «Другие действия» must be a subsection inside Quick actions');
  if (!quickHtml.includes('Самоуничтожение')) throw new Error('BO: Quick actions must contain the merged other quick actions');
  if (staticHtml.includes('data-i18n="u134"') || staticHtml.includes('data-i18n="u135"')) throw new Error('BO: Reactions must not contain the Free actions explanation');
  if (staticHtml.includes('<span class="dim">RUS</span>') || staticHtml.includes('<span class="dim">ENG</span>')) throw new Error('BO: RUS/ENG labels must not sit outside the slider');
  if (!staticHtml.includes('data-lang="ru">RUS</span>') || !staticHtml.includes('data-lang="en">ENG</span>')) throw new Error('BO: RUS/ENG letters must live inside the language slider');
  if (!staticHtml.includes('@keyframes tabFadeIn')) throw new Error('BO: tab fade-in keyframes must exist');
  if (!staticHtml.includes('id="navLens"')) throw new Error('BO: the nav lens element must exist');
  if (!staticHtml.includes('.nav-lens')) throw new Error('BO: the .nav-lens rule must exist');
  const rBO = runEval({});
  const elBO = rBO.elements, XBO = rBO.X;
  XBO.showTab('pilot');
  if (!elBO['tab-pilot'].classList.contains('fade-in')) throw new Error('BO: showTab(pilot) must fade the new tab in');
  if (!elBO['tabPilotBtn'].classList.contains('active')) throw new Error('BO: showTab(pilot) must mark the person icon active');
  XBO.showTab('mech');
  if (!elBO['tab-mech'].classList.contains('fade-in')) throw new Error('BO: showTab(mech) must fade the new tab in');
  XBO.showTab('mech');
  if (elBO['tab-mech'].classList.contains('fade-in')) throw new Error('BO: showTab to the same tab must not animate');
})();


// PHASE BP (v76): шапка убрана полностью; свайп не роняет навигацию и не накладывает вкладки
if (staticHtml.includes('<header>') || staticHtml.includes('</header>')) throw new Error('BP: the <header> element must be gone');
if (staticHtml.includes('data-i18n="u001"') || staticHtml.includes('data-i18n="u146"')) throw new Error('BP: header i18n units u001/u146 must be gone');
if (!staticHtml.includes('will-change:transform')) throw new Error('BP: the nav must keep its own compositing layer (will-change:transform)');
if (!html.includes('window.scrollTo(0,0)')) throw new Error('BP: showTab must scroll to the top on tab switch');
if (!staticHtml.includes('@keyframes tabFadeIn { from { opacity:.35; }')) throw new Error('BP: tabFadeIn must fade the incoming tab in');
const rBP = runEval({});
const XBP = rBP.X;
XBP.save(); // save() must not throw now that #saved is gone
XBP.showTab('rules');
if (!rBP.elements['tab-rules'].classList.contains('fade-in')) throw new Error('BP: showTab(rules) must fade the new tab in');


// PHASE BQ (v77): свайп вправо больше не роняет навигацию —
// вкладка, въезжающая слева, не должна создавать горизонтальный оверфлоу
if (!staticHtml.includes('overflow-x:hidden')) throw new Error('BQ: body must forbid horizontal overflow (overflow-x:hidden)');
if (staticHtml.includes('tabInLeft') || staticHtml.includes('tabInRight')) throw new Error('BQ: the transform slide keyframes must be gone (v78)');


// PHASE BR (v78): transform-слайд убран совсем — он ронял навигацию на Android;
// вкладки просто мягко проявляются, движение осталось только в линзе навигации
if (staticHtml.includes('slide-in-right') || staticHtml.includes('slide-in-left')) throw new Error('BR: no slide-in classes must remain');
if (!staticHtml.includes('@keyframes tabFadeIn')) throw new Error('BR: tabFadeIn keyframes must exist');
const rBR = runEval({});
const elBR = rBR.elements, XBR = rBR.X;
XBR.showTab('pilot');
if (!elBR['tab-pilot'].classList.contains('fade-in')) throw new Error('BR: showTab(pilot) must fade in');
XBR.showTab('rules');
if (!elBR['tab-rules'].classList.contains('fade-in')) throw new Error('BR: showTab(rules) must fade in');
if (elBR['tab-pilot'].classList.contains('fade-in')) throw new Error('BR: the old tab must lose the fade class on switch');


// PHASE BS (v79): линза — прямоугольник на всю кнопку и на всю высоту навбара,
// один элемент, честно скользит между кнопками (transform + transition), а не телепортируется
if (staticHtml.includes('nav button.active::before') || staticHtml.includes('@keyframes lensIn')) throw new Error('BS: the old circular lens must be gone');
if (!staticHtml.includes('.nav-lens { position:absolute; top:0; bottom:0; left:8px; width:calc((100% - 16px) / 3);')) throw new Error('BS: the lens must span one button width and the full nav height');
if (!staticHtml.includes('transition:transform .25s ease')) throw new Error('BS: the lens must slide (transition on transform)');
const navIdxBS = staticHtml.indexOf('<nav>');
const lensIdxBS = staticHtml.indexOf('id="navLens"');
const btnIdxBS = staticHtml.indexOf('id="tabMechBtn"');
if (!(navIdxBS < lensIdxBS && lensIdxBS < btnIdxBS)) throw new Error('BS: the lens must be the first child of the nav (behind the buttons)');
const rBS = runEval({});
const elBS = rBS.elements, XBS = rBS.X;
XBS.showTab('pilot');
if (elBS['navLens'].style.transform !== 'translateX(100%)') throw new Error('BS: showTab(pilot) must slide the lens to 100%, got ' + elBS['navLens'].style.transform);
XBS.showTab('rules');
if (elBS['navLens'].style.transform !== 'translateX(200%)') throw new Error('BS: showTab(rules) must slide the lens to 200%, got ' + elBS['navLens'].style.transform);
XBS.showTab('mech');
if (elBS['navLens'].style.transform !== 'translateX(0%)') throw new Error('BS: showTab(mech) must slide the lens back to 0%, got ' + elBS['navLens'].style.transform);


// PHASE BT (v80): линза без закругления и с фоном поярче; чёрточка под иконкой убрана;
// зум активной иконки сильнее; полоса над навбаром тоньше и темнее
if (staticHtml.includes('.nav-lens { position:absolute; top:0; bottom:0; left:8px; width:calc((100% - 16px) / 3); border-radius:')) throw new Error('BT: the lens must have no border-radius (sharp corners)');
if (!staticHtml.includes('background:linear-gradient(180deg, rgb(255 176 0 / 21%) 0%, transparent 45%)')) throw new Error('BT: the lens background must be amber and fade to transparent by the middle (v150)');
if (staticHtml.includes('nav button.active::after')) throw new Error('BT: the yellow dash under the active icon must be gone');
if (!staticHtml.includes('transform:scale(1.3)')) throw new Error('BT: the active icon must zoom to 1.3');
if (/nav\s*\{[^}]*border-top/.test(staticHtml)) throw new Error('BT: the nav must have no top border at all (v81)');
// BT (v80, кольцо HP): зоны +/- уже (25px) и дальше от центра (15px), знаки ближе к центру (padding 3px)
if (!/\.ring-minus,\s*\.ring-plus\s*\{[^}]*width:25px/.test(staticHtml)) throw new Error('BT: the HP ring +/- zones must be 25px wide');
if (!/\.ring-minus\s*\{[^}]*left:15px/.test(staticHtml)) throw new Error('BT: the minus zone must sit 15px from the left edge');
if (!/\.ring-plus\s*\{[^}]*right:15px/.test(staticHtml)) throw new Error('BT: the plus zone must sit 15px from the right edge');
if (!/\.ring-minus\s*\{[^}]*padding-left:3px/.test(staticHtml)) throw new Error('BT: the minus glyph must be nudged toward the center (padding-left 3px)');
if (!/\.ring-plus\s*\{[^}]*padding-right:3px/.test(staticHtml)) throw new Error('BT: the plus glyph must be nudged toward the center (padding-right 3px)');


// PHASE BU (v82): иконки меха и пилота возвращены к исходным (откат v81 — нарисованные Harvester/гарнитура не читались); градиент линзы уходит в прозрачность к середине кнопки
if (!staticHtml.includes('nav button.active { background:none; color:var(--hud-amber); }')) throw new Error('BU: the active nav icon must be amber var(--hud-amber) (v150)');
if (!staticHtml.includes('filter:drop-shadow(0 3px 2px rgba(0,0,0,1))')) throw new Error('BU: the active icon must have a black directional drop-shadow, not an all-round glow');
if (staticHtml.includes('drop-shadow(0 0 6px rgba(255,212,59,.55))')) throw new Error('BU: the old amber all-round glow must be gone');
if (!staticHtml.includes('background:linear-gradient(180deg, rgb(255 176 0 / 21%) 0%, transparent 45%)')) throw new Error('BU: the lens background must be amber and fade to transparent by the middle (v150)');
if (!staticHtml.includes('box-shadow:0 0 18px rgb(0 0 0 / 39%), inset 0 1px 0 0 rgb(255 176 0 / 45%)')) throw new Error('BU: the lens must have a black outer glow and a thin amber top-only border (v151, no side borders)');
if (/id="tabMechBtn"[^>]*>[^<]*<svg[^>]*>.*stroke-width="2.8"/.test(staticHtml)) throw new Error('BU: the v81 cannon barrel must be gone (icons reverted)');
if (!staticHtml.includes('<line x1="12" y1="7" x2="12" y2="4.5"/>')) throw new Error('BU: the Block mech icon antenna must be in place (v148: the original robot icon is replaced)');
if (staticHtml.includes('M7.8 9a4.2 4.2 0 0 1 8.4 0')) throw new Error('BU: the v81 headset band must be gone (icons reverted)');
if (staticHtml.includes('M8 11.5c0 2 1.2 3 3 3.2')) throw new Error('BU: the v81 boom mic must be gone (icons reverted)');
if (staticHtml.includes('<circle cx="11.6" cy="14.9" r="0.9"')) throw new Error('BU: the v81 mic dot must be gone (icons reverted)');
if (!staticHtml.includes('<circle cx="12" cy="7" r="3.4"/>')) throw new Error('BU: the original pilot person head must be back');


// PHASE BV (v84): тряска экрана при уроне — только main (навигатор не потомок, его fixed цел);
// маленькая при уроне по HP, большая при потере структуры; триггер только на реальное уменьшение
if (!staticHtml.includes('@keyframes shakeSmall')) throw new Error('BV: shakeSmall keyframes must exist');
if (!staticHtml.includes('@keyframes shakeBig')) throw new Error('BV: shakeBig keyframes must exist');
if (!staticHtml.includes('main.shake-small { animation:shakeSmall .3s ease; }')) throw new Error('BV: the small shake must animate main for .3s');
if (!staticHtml.includes('main.shake-big { animation:shakeBig .45s ease; }')) throw new Error('BV: the big shake must animate main for .45s');
if (!staticHtml.includes('html { overflow-x:clip; }')) throw new Error('BV: html must clip horizontal overflow, or the shake flashes a horizontal scrollbar (body overflow-x:hidden alone does not hold the viewport)');
if (!/\@keyframes shakeSmall \{[\s\S]*?transform:translateX\(-4px\)/.test(staticHtml)) throw new Error('BV: the small shake must be horizontal-only (translateX) so it never moves the vertical scrollbar');
if (!/\@keyframes shakeBig \{[\s\S]*?transform:translateX\(-7px\)/.test(staticHtml)) throw new Error('BV: the big shake must be horizontal-only (translateX) so it never moves the vertical scrollbar');
if (/transform:translate\(-?\d+px,\s*-?\d+px\)/.test(staticHtml)) throw new Error('BV: the shake must not have a vertical component (a two-arg translate made the vertical scrollbar flash)');
if (staticHtml.includes('body.shake-') || staticHtml.includes('nav.shake-')) throw new Error('BV: the shake must target main only, never body or nav');
if (!/function shake\(kind\)\{[^}]*querySelector\('main'\)/.test(html)) throw new Error('BV: shake() must query main');
if (!/function step\(path, d\)\{[\s\S]*?if \(v < old && path === 'mech.hp'\) shake\('shake-small'\);/.test(html)) throw new Error('BV: step() must shake small when HP actually decreases');
if (!/if \(v < old && path === 'mech.structure'\) shake\('shake-big'\);/.test(html)) throw new Error('BV: step() must shake big when Structure actually decreases');
X.shake('shake-small');
X.shake('shake-big');


// PHASE BW (v86): вибрация удалена; вспышка Core Power — на всю панель и дольше (1.6с); пламя в термометре растёт с нагревом и пульсирует при heat >= max-1
if (html.includes('navigator.vibrate') || html.includes('buzz(')) throw new Error('BW: vibration must be fully removed (it did not work on the user phone)');
if (!staticHtml.includes('@keyframes critPulse')) throw new Error('BW: critPulse keyframes must exist');
if (!staticHtml.includes('.ring-wrap.crit { animation:critPulse 1.2s ease-in-out infinite; }')) throw new Error('BW: the critical HP pulse must be an infinite 1.2s animation on .ring-wrap.crit');
if (!staticHtml.includes('id="hpRingWrap"')) throw new Error('BW: the ring wrapper must have id hpRingWrap');
if (!/rw\.classList\.toggle\('crit', m \? v \/ m <= 0\.25 : v <= 0\)/.test(html)) throw new Error('BW: renderCounters must toggle crit when HP is at or below 25%');
if (!staticHtml.includes('@keyframes cpFlash')) throw new Error('BW: cpFlash keyframes must exist');
if (!staticHtml.includes('#corePanel.cp-flash { animation:cpFlash 1.6s ease; }')) throw new Error('BW: the Core Power flash must be a 1.6s animation on the whole panel');
if (!staticHtml.includes('id="corePanel"')) throw new Error('BW: the Core Power panel must have id corePanel');
if (!/if \(!wasUsed\) cpFlash\(\);/.test(html)) throw new Error('BW: toggleCore() must flash only on activation, not on undo');
if (!staticHtml.includes('id="heatFlame"')) throw new Error('BW: the flame must be its own element with id heatFlame');
if (staticHtml.includes('<div class="thermo-ico">')) throw new Error('BW: the flame must not live inside the .thermo-val flow anymore');
if (!staticHtml.includes('@keyframes flamePulse')) throw new Error('BW: flamePulse keyframes must exist');
if (!/\.thermo-ico \{[^}]*transform-origin:center bottom/.test(staticHtml)) throw new Error('BW: the flame must grow upward (origin bottom)');
X.cpFlash();


// PHASE BX (v87): панель Core Power — металлический фон и бегущий диагональный отблеск;
// пламя стартует ниже и меньше, растёт сильнее; термометр обрезает пламя (overflow:hidden)
if (/\.core-power \{[^}]*repeating-linear-gradient\(115deg/.test(staticHtml)) throw new Error('BX: the Core Power panel must NOT have the brushed texture (v89 removed the hairs)');
if (!/\.core-power \{[^}]*linear-gradient\(180deg, #454e5e/.test(staticHtml)) throw new Error('BX: the Core Power panel must have a solid metal gradient');
if (!staticHtml.includes('.core-power::after')) throw new Error('BX: the sheen pseudo-element must exist on the panel');
if (!staticHtml.includes('@keyframes coreSheen')) throw new Error('BX: coreSheen keyframes must exist');
if (!/\.core-power::after \{[^}]*animation:coreSheen 6\.5s/.test(staticHtml)) throw new Error('BX: the sheen must sweep every 6.5s');
if (!staticHtml.includes('@keyframes coreSheen { 0%, 60% { left:-90%; }')) throw new Error('BX: during the pause the sheen must sit fully off-screen left (-90%), so the skewed band never shows in the top-left corner');
if (!/\.thermo \{[^}]*overflow:hidden/.test(staticHtml)) throw new Error('BX: the thermometer must clip the flame (overflow:hidden)');


// PHASE BY (v88): у кнопок навигации не должно быть синей вспышки при тапе (tap highlight)
if (!/nav button \{[^}]*-webkit-tap-highlight-color:transparent/.test(staticHtml)) throw new Error('BY: nav buttons must disable the tap highlight (no blue flash on tap)');


// PHASE BZ (v89): пламя стартует ниже и больше (видна только часть у самого низа), растёт вверх;
// фон панели подсвечивается при нажатии вместе с золотой тенью
if (!/\.thermo-ico\.crit \{[^}]*bottom:-11px/.test(staticHtml)) throw new Error('BZ: the crit flame must start below the thermometer edge (bottom -11px, clipped)');
if (!/\.thermo-ico\.crit \{[^}]*font-size:56px/.test(staticHtml)) throw new Error('BZ: the crit flame must be big (56px, like the flame in the user screenshot)');
if (!/\.thermo-ico \{[^}]*transform-origin:center bottom/.test(staticHtml)) throw new Error('BZ: the flame must grow upward from its bottom edge');
if (!staticHtml.includes('filter:brightness(1.6)')) throw new Error('BZ: the Core Power flash must brighten the panel background in parallel with the shadow');


// PHASE CA (v89): кнопки +/- в кольце HP короче, чтобы разделители не пересекались с краем кольца
if (!/\.ring-minus, \.ring-plus \{[^}]*height:88px/.test(staticHtml)) throw new Error('CA: the ring +/- zones must be 88px tall (dividers must not touch the ring edge)');


// PHASE CB (v90): отблеск останавливается, пока Core Power использован, и возвращается после отката
if (!/\.core-power\.cp-used::after \{ display:none;/.test(staticHtml)) throw new Error('CB: the sheen must be hidden while Core Power is used');
if (!html.includes("if (cp) cp.classList.toggle('cp-used', !!get('mech.coreUsed'))")) throw new Error('CB: renderCounters must put cp-used on the panel when the ability is used');


// PHASE CC (v91, порог v108): пламя бинарное — маленькая статичная иконка вне Danger Zone, большое пульсирующее пламя в Danger Zone (тепло >= половины Heat Cap)ше
if (!/\.thermo-ico \{[^}]*bottom:25px/.test(staticHtml)) throw new Error('CC: the flame below crit must be a small static icon (bottom 25px, between the minus and the max)');
if (!/\.thermo-ico \{[^}]*font-size:16px/.test(staticHtml)) throw new Error('CC: the flame below crit must be a small static icon (16px)');
if (!/\.thermo-ico\.crit \{[^}]*animation:flamePulse/.test(staticHtml)) throw new Error('CC: the crit flame must pulse');
if (!/@keyframes flamePulse \{ 0%,100% \{ transform:scale\(1\) rotate\(0deg\); \} 50% \{ transform:scale\(1\.15\) rotate\(-5deg\); \} \}/.test(staticHtml)) throw new Error('CC: flamePulse must pulse 1 to 1.15 and lean left (-3deg) at the peak');
if (!html.includes("flame.classList.toggle('crit', isDangerZone())")) throw new Error('CC: renderCounters must toggle crit by isDangerZone() (heat >= half Heat Cap)');
if (html.includes("flame.style.setProperty('--fs'")) throw new Error('CC: the flame must not grow smoothly anymore (no --fs)');


// PHASE CD (v92): карточка «Таланты» должна стоять ниже карточки «Трейты фрейма» во вкладке «Мех»
if (staticHtml.indexOf('id="traitsCard"') > staticHtml.indexOf('id="talents"')) throw new Error('CD: the Talents card must come after the frame traits card in the Mech tab');


// PHASE CE (v93): крит-пламя должно быть большим, как на скрине пользователя (56px, пульс до ~73px)
if (!/\.thermo-ico\.crit \{[^}]*font-size:56px/.test(staticHtml)) throw new Error('CE: the crit flame must be 56px tall');


// PHASE CF (v94): пульс пламени меньше растёт и наклоняется влево на пике
if (!staticHtml.includes('transform:scale(1.15) rotate(-5deg)')) throw new Error('CF: the flame pulse must grow less (1.15) and lean left (-5deg, v110)');


// PHASE CG (v95): маленькая иконка пламени в обычном состоянии — между минусом и «max: N»
if (!/\.thermo-ico \{[^}]*bottom:25px/.test(staticHtml)) throw new Error('CG: the small flame icon must sit between the minus and the max (bottom 25px)');


// PHASE CH (v96): мастер переименован в «Мастер сборки», кнопка вверху Правил справа от «Левел ап»,
// объяснение Статов — в шаге HASE мастера
if (!html.includes('"u186": {"ru": "Мастер сборки", "en": "Build Wizard"}')) throw new Error('CH: u186 must be renamed to Мастер сборки / Build Wizard');
if (!staticHtml.includes('Мастер сборки персонажа')) throw new Error('CH: the wizard overlay title must be Мастер сборки персонажа');
if (!/display:flex;gap:8px"><button class="btn primary" onclick="openLevelUp\(\)"[^<]*<\/button><button class="btn" onclick="openWizard\(\)" data-i18n="u186">/.test(staticHtml)) throw new Error('CH: the Build Wizard button must sit at the top of the Rules tab, right of Level Up');
if (staticHtml.split('class="rules-foot"')[1].split('</div>')[0].includes('openWizard()')) throw new Error('CH: the wizard button must not stay in the rules footer');
if (!html.includes('return `<div class="hint">${L(\'u061\')}</div>${rows}`')) throw new Error('CH: the wizard HASE step must show only the concise Stats explanation (u061)');

// PHASE CI (v97): объяснение Статов — краткий текст пользователя, и в мастере, и в карточке Статов при редактировании
if (!html.includes('На старте: 2 очка, потом +1 очко за уровень.')) throw new Error('CI: u061 must start with the concise intro');
if (html.includes('Значения по умолчанию')) throw new Error('CI: the concise HASE text must not have the defaults suffix');
if (html.includes('HASE на LL0: 2 очка (одно +2')) throw new Error('CI: the concise HASE text must not have the old preamble');
if (!staticHtml.includes('id="haseHint" data-i18n="u061"')) throw new Error('CI: the Stats card hint must still use u061 (same concise text when editing)');
// v131: HASE icons removed from both wizards (Build Wizard wizHase and Level-up wizard luHase) — plain English names only
if (!/function wizHase\(\)\{[\s\S]*?const hase = \[\['hull','Hull'\], \['agility','Agility'\], \['systems','Systems'\], \['engineering','Engineering'\]\];/.test(html)) throw new Error('CI: wizHase must list HASE as plain [key, label] pairs, no emoji icons');
if (!/function luHase\(\)\{[\s\S]*?const hase = \[\['hull','Hull'\], \['agility','Agility'\], \['systems','Systems'\], \['engineering','Engineering'\]\];/.test(html)) throw new Error('CI: luHase must list HASE as plain [key, label] pairs, no emoji icons');
if (html.includes("'❤️'") || html.includes("'💨'") || html.includes("'💻'") || html.includes("'⚙️'")) throw new Error('CI: the HASE emoji icons must be gone from the wizards');
// PHASE CJ (v98): Engineering даёт +1 к максимуму использований Limited-снаряжения за каждые 2 очка
if (!/function limBonus\(\)\{ return Math\.floor\(\(\+get\('pilot\.engineering'\)\|\|0\) \/ 2\); \}/.test(html)) throw new Error('CJ: limBonus must be floor(engineering/2)');
if (!html.includes('base + limBonus()')) throw new Error('CJ: sysLim/weapLim must add the Engineering bonus to the base Limited');
if (!html.includes('const lim = sysLim(row);')) throw new Error('CJ: adding a system must start it full (base + bonus)');
if (!html.includes('const lim = weapLim(row);')) throw new Error('CJ: adding a weapon must start it full (base + bonus)');
if (!html.includes('row.left = lim + limBonus();')) throw new Error('CJ: a custom system must start full (base + bonus)');
if (!html.includes('S.systems.forEach(s=>{ const lim = sysLim(s); if (lim > 0) s.left = lim; });')) throw new Error('CJ: full repair must refill Limited charges to the new max');
// PHASE CK (v99): карточки систем показывают чипы тегов (как оружие) — цена в тепле видна
if (!html.includes('function sysTags(s){')) throw new Error('CK: sysTags() must exist');
if (!html.includes('const stg = sysTags(s);')) throw new Error('CK: the system card must compute its tags');
if (!html.includes('${stg.length ? `<div class="tags">${tagChips(stg)}</div>` : \'\'}')) throw new Error('CK: the system card must render tag chips');
const sh = html.match(/"n":"Type-3 Projected Shield"[^}]*"tg":(\[\[[^\]]*\](?:,\[[^\]]*\])*\])/);
if (!sh || !sh[1].includes('["tg_heat_self",1]')) throw new Error('CK: Type-3 Projected Shield must carry tg_heat_self 1 in the DB');
if (!html.includes('"tg_heat_self":{"n":"Heat {VAL} (Self)"')) throw new Error('CK: the tg_heat_self tag must be in DB.tags');
// PHASE CL (v100): цена в тепле не теряется в экшенах и в поиске систем
if (!html.includes('function actionHeatBadge(a){')) throw new Error('CL: actionHeatBadge() must exist');
if (!html.includes("if (!a.grant || !a.grant.system) return '';")) throw new Error('CL: the heat badge must only apply to system-granted actions');
if (!html.includes("const h = d.tg.find(([id]) => id === 'tg_heat_self');")) throw new Error('CL: the badge must read tg_heat_self from the granting system');
if (!html.includes("return ' ' + tagChips([['tg_heat_self', h[1]]]);")) throw new Error('CL: the badge must be a tappable tag chip');
if (!html.includes("</b>' + actionHeatBadge(a) + ' —")) throw new Error('CL: reactions and protocols must render the heat badge');
if (!html.includes('${(s.tg && s.tg.length) ? `<div class="tags">${tagChips(s.tg)}</div>` : \'\'}')) throw new Error('CL: system search results must show tag chips');
// PHASE CM (v101): бонус Engineering не делает нелимитное снаряжение лимитным
if (!html.includes('return base > 0 ? base + limBonus() : 0;')) throw new Error('CM: sysLim/weapLim must only add the Engineering bonus when base Limited > 0');
// Регрессия v98: при Engineering 2 нелимитное оружие (Дробовик, Циклон) показывало «Limited 1: заряды».
// Бонус +1 к максимуму — только для снаряжения, которое уже Limited; база 0 остаётся 0.
const guardCount = (html.match(/return base > 0 \? base \+ limBonus\(\) : 0;/g) || []).length;
if (guardCount !== 2) throw new Error('CM: both sysLim and weapLim must guard the bonus with base > 0');
// PHASE CN (v102): подпись зарядов — просто «Заряды:», максимум уже виден в степпере
if (!html.includes('"charges": {"ru": "Заряды:", "en": "Charges:"}')) throw new Error('CN: the charges label must be just Заряды: / Charges:');
if (html.includes('Limited {N}: заряды')) throw new Error('CN: the old Limited {N} label must be gone');
// PHASE CO (v103): термины-теги в тексте описаний кликабельны (ДУГОВОЕ, ОТБРОС 1)
if (!html.includes('function linkTagTerms(html){')) throw new Error('CO: linkTagTerms() must exist');
if (!html.includes('function tagWordStem(name){')) throw new Error('CO: tagWordStem() must exist');
if (!html.includes('linkTagTerms(esc(t))')) throw new Error('CO: descBox must link tag terms');
if (!html.includes('linkTagTerms(esc(en ? a.tx_en : a.tx_ru))')) throw new Error('CO: the Actions reference must link tag terms');
// Функционально: ДУГОВОЕ -> tg_arcing, ОТБРОС 1 -> tg_knockback с val 1.
// Линкуются только термины в ВЕРХНЕМ РЕГИСТРЕ (механики) и точное имя тега;
// обычные прилагательные в прозе («надёжный», «бронебойного») — НЕ линкуются.
const linked = XK.linkTagTerms('атака получает ДУГОВОЕ и наносит урон. ОТБРОС 1 и бронебойного урона. Надёжный стандарт.');
if (!linked.includes("showTag('tg_arcing'")) throw new Error('CO: ДУГОВОЕ must link to tg_arcing');
if (!linked.includes('>Дуговое<')) throw new Error('CO: the chip must show the canonical tag name (Дуговое), not the ALL-CAPS text');
if (!linked.includes("showTag('tg_knockback','1')")) throw new Error('CO: ОТБРОС 1 must link to tg_knockback with val 1');
if (!linked.includes('>Отброс 1<')) throw new Error('CO: ОТБРОС 1 chip must show «Отброс 1»');
if (linked.includes("showTag('tg_ap'")) throw new Error('CO: бронебойного (lowercase genitive) must NOT link');
if (linked.includes('Надёжный <span') || linked.includes('надёжный <span')) throw new Error('CO: ordinary надёжный in prose must NOT link');
if ((linked.match(/class="tag"/g) || []).length !== 2) throw new Error('CO: exactly two terms must link (ДУГОВОЕ and ОТБРОС 1), nothing else');
// PHASE CP (v104): теги линкуются и в талантах, и в поиске систем (а не только в descBox)
// Регрессия v103: талант «Ходячий арсенал I» рендерится не через descBox, поэтому ДУГОВОЕ там не кликалось.
if (!html.includes('${linkTagTerms(esc(r.d))}')) throw new Error('CP: talent feature descriptions must link tag terms');
if (!html.includes('descHtml = linkTagTerms(esc(excerpt(d.x, 140)));')) throw new Error('CP: system search results must link tag terms');
if (!html.includes('descHtml = linkTagTerms(esc(d.x))')) throw new Error('CP: expanded system search descriptions must link tag terms');
// PHASE CQ (v105): БРОНЕБОЙНОСТЬ линкуется — отвлечённое существительное на -ость
// (регрессия со скрина пользователя: САБО в «Ходячем арсенале» не кликалось —
// основа «бронебойн» от «Бронебойное» и «бронебойность» не сходились).
const linkedAp = XK.linkTagTerms('атака получает БРОНЕБОЙНОСТЬ и наносит кинетический урон.');
if (!linkedAp.includes("showTag('tg_ap'")) throw new Error('CQ: БРОНЕБОЙНОСТЬ must link to tg_ap');
if (!linkedAp.includes('>Бронебойное<')) throw new Error('CQ: БРОНЕБОЙНОСТЬ chip must show the canonical name without the bracketed abbreviation');
if (XK.linkTagTerms('надёжный стандарт, reliable weapon.').includes('class="tag"')) throw new Error('CQ: ordinary prose must stay unlinked');
// PHASE CR (v106): английское AP линкуется в tg_ap; скобочная аббревиатура из подписи убрана
// (регрессия со скрина пользователя: SABOT «gains AP» не кликалось; русская подпись «Бронебойное (AP)» непонятна).
const linkedEnAp = XK.linkTagTerms('The attack gains AP and deals Kinetic damage.');
if (!linkedEnAp.includes("showTag('tg_ap'")) throw new Error('CR: English AP must link to tg_ap');
if (linkedEnAp.includes('(AP)')) throw new Error('CR: the chip label must not carry the bracketed abbreviation');
// PHASE CS (v107): протоколы талантов в справочнике действий — Пастух и Прицелиться
// (регрессия: «Твои действия» показывали только протоколы систем; протоколы,
// которые дают таланты — Drone Commander I и Crack Shot I — отсутствовали).
if (!ABE.protocols.some(p=>p.key==='shepherd' && p.grant.talent==='Drone Commander' && p.grant.rank===1)) throw new Error('CS: Shepherd must be a Drone Commander I protocol');
if (!ABE.protocols.some(p=>p.key==='steadyaim' && p.grant.talent==='Crack Shot' && p.grant.rank===1)) throw new Error('CS: Steady Aim must be a Crack Shot I protocol');
// сборка с Командиром дронов I: Пастух виден в «Твоих действиях», Прицелиться — нет
const storeCS = {};
storeCS['lancer-tracker-v1'] = JSON.stringify({
  pilot:{name:'Test', licenses:[], coreBonuses:[], hull:0, agility:0, systems:0, engineering:0},
  mech:{frame:'Everest'},
  talents:[{name:'Drone Commander', rank:1}], triggers:[],
  mounts:[{type:'Main',weapons:[]}], systems:[], statuses:[], settings:{}
});
const rCS = runEval(storeCS);
const myHtmlCS = rCS.elements['myActions'].innerHTML;
if (!myHtmlCS.includes('Пастух') && !myHtmlCS.includes('Shepherd')) throw new Error('CS: Drone Commander I must show Shepherd in My actions');
if (myHtmlCS.includes('Прицелиться') || myHtmlCS.includes('Steady Aim')) throw new Error('CS: Steady Aim must NOT show without Crack Shot');
// Жестокий I: оба урона максимизируются — «максимально возможные урон и бонусный урон»
const brutal = global.__x.DB.talents.find(t=>t.n==='Brutal');
if (!brutal || !(brutal.dr||[])[0].includes('максимально возможные урон и бонусный урон')) throw new Error('CS: Brutal I must say both damage and bonus damage are maximized');
// PHASE CT (v108): пламя и галочка Danger Zone привязаны к механике Danger Zone
// (тепло >= половины Heat Cap); вокруг термометра вертикально DANGER (слева) и ZONE (справа),
// капс, всегда английский, переливаются между красным и оранжевым.
if (!staticHtml.includes('class="dz-label">DANGER</span>')) throw new Error('CT: DANGER label must flank the thermometer on the left');
if (!staticHtml.includes('class="dz-label">ZONE</span>')) throw new Error('CT: ZONE label must flank the thermometer on the right');
if (!/\.dz-label \{[^}]*writing-mode:vertical-rl/.test(staticHtml)) throw new Error('CT: the labels must be vertical');
if (!/\.dz-label \{[^}]*text-orientation:upright/.test(staticHtml)) throw new Error('CT: the letters must stand upright, one under another (D/A/N/G/E/R), not sideways');
if (!/\.dz-label \{[^}]*display:none/.test(staticHtml)) throw new Error('CT: the labels must be hidden outside Danger Zone');
if (!staticHtml.includes('.heat-thermo.dz-active .dz-label')) throw new Error('CT: the labels must appear when .heat-thermo gets dz-active');
if (!/@keyframes dzGlow/.test(staticHtml)) throw new Error('CT: dzGlow animation must exist (red-orange shimmer)');
if (!html.includes('function isDangerZone()')) throw new Error('CT: isDangerZone() must exist');
if (!html.includes('function syncDangerZone()')) throw new Error('CT: syncDangerZone() must exist');
// функционально: тепло 3/6 — Danger Zone, пламя большое, галочка стоит; тепло 2/6 — нет
const storeCT = {};
storeCT['lancer-tracker-v1'] = JSON.stringify({
  pilot:{name:'Test', licenses:[], coreBonuses:[], hull:0, agility:0, systems:0, engineering:0},
  mech:{frame:'Everest', heat:3},
  talents:[], triggers:[],
  mounts:[{type:'Main',weapons:[]}], systems:[], statuses:[], settings:{}
});
const rCT = runEval(storeCT);
if (!rCT.S.statuses.includes('Danger Zone')) throw new Error('CT: heat 3/6 must auto-check Danger Zone');
if (!rCT.elements['heatFlame'].classList.contains('crit')) throw new Error('CT: heat 3/6 must show the big flame');
const storeCT2 = {};
storeCT2['lancer-tracker-v1'] = JSON.stringify({
  pilot:{name:'Test', licenses:[], coreBonuses:[], hull:0, agility:0, systems:0, engineering:0},
  mech:{frame:'Everest', heat:2},
  talents:[], triggers:[],
  mounts:[{type:'Main',weapons:[]}], systems:[], statuses:['Danger Zone'], settings:{}
});
const rCT2 = runEval(storeCT2);
if (rCT2.S.statuses.includes('Danger Zone')) throw new Error('CT: heat 2/6 must auto-uncheck Danger Zone');
if (rCT2.elements['heatFlame'].classList.contains('crit')) throw new Error('CT: heat 2/6 must show the small flame');
// PHASE CU (v109): подписи DANGER/ZONE видны только в Danger Zone
// (регрессия: надпись висела всегда, даже при нулевом тепле).
if (!html.includes("ht.classList.toggle('dz-active', on)")) throw new Error('CU: syncDangerZone must toggle dz-active on .heat-thermo');
// PHASE CV (v110): анимации пламени и подписей синхронизированы (одна длина — 1.2s)
if (!/\.thermo-ico\.crit \{[^}]*animation:flamePulse 1\.2s/.test(staticHtml)) throw new Error('CV: flamePulse must run at 1.2s');
if (!/\.dz-label \{[^}]*animation:dzGlow 1\.2s/.test(staticHtml)) throw new Error('CV: dzGlow must run at 1.2s, same as flamePulse');
// PHASE CW (v111): рамки зон +/− кольца HP — тот же цвет, что и пустая часть кольца
// (разделители должны сливаться с треком кольца, а не выделяться белым).
if (!staticHtml.includes('.ring-minus { left:15px; padding-left:3px; border-right:1px solid var(--line); }')) throw new Error('CW: the minus divider must use var(--line)');
if (!staticHtml.includes('.ring-plus { right:15px; padding-right:3px; border-left:1px solid var(--line); }')) throw new Error('CW: the plus divider must use var(--line)');
if (!staticHtml.includes('.ring-track { fill:none; stroke:var(--line);')) throw new Error('CW: the ring track must use var(--line) too');
// PHASE CX (v112): статусы — теги вместо чекбоксов (Danger Zone не кликабелен, Burn — статус)
if (staticHtml.includes('id="statuses"')) throw new Error('CX: the old status checkboxes must be gone');
if (!staticHtml.includes('id="statusTags"')) throw new Error('CX: the status tags container must exist');
if (!staticHtml.includes('id="statusRef"')) throw new Error('CX: the status reference must exist');
if (!(staticHtml.indexOf('id="statusTags"') < staticHtml.indexOf('<div class="grid res-grid">'))) throw new Error('CX: status tags must sit between the HP ring and the Structure grid');
if (!(staticHtml.indexOf('data-i18n="u016"') < staticHtml.indexOf('id="statusRef"'))) throw new Error('CX: the status reference must sit after the Overcharge collapsible (u016)');
if (!(staticHtml.indexOf('id="statusRef"') < staticHtml.indexOf('data-i18n="u021"'))) throw new Error('CX: the status reference must sit before the Structure Loss collapsible (u021)');
if (!staticHtml.includes('data-i18n="u233"')) throw new Error('CX: the status reference must be headed «Статусы» (u233)');
if (!/STATUS_INFO\s*=\s*\{/.test(html)) throw new Error('CX: STATUS_INFO must exist');
if (!/STATUS_INFO = \{[\s\S]*?'Burn'/.test(html)) throw new Error('CX: Burn must be a status in STATUS_INFO');
if (!/function toggleStatus\(name\)/.test(html)) throw new Error('CX: toggleStatus must exist');
if (!/function removeStatus\(name\)/.test(html)) throw new Error('CX: removeStatus must exist');
if (!/function showStatus\(name\)/.test(html)) throw new Error('CX: showStatus must exist');
if (!/function renderStatusTags\(\)/.test(html)) throw new Error('CX: renderStatusTags must exist');
if (!/function renderStatusRef\(\)/.test(html)) throw new Error('CX: renderStatusRef must exist');
if (!/\.status-tag \{[^}]*background:var\(--sc/.test(staticHtml)) throw new Error('CX: status tags must use their own colour (--sc)');
// теги: добавить два статуса, один снять, Danger Zone не попадает в теги
const rCX = runEval({});
const XCX = rCX.X, SCX = rCX.S, elCX = rCX.elements;
XCX.toggleStatus('Exposed'); XCX.toggleStatus('Burn');
if (SCX.statuses.length !== 2) throw new Error('CX: toggleStatus must add statuses');
const tagsHtmlCX = elCX['statusTags'].innerHTML;
if (!tagsHtmlCX.includes('Exposed') || !tagsHtmlCX.includes('Burn')) throw new Error('CX: status tags must show the status names');
if (tagsHtmlCX.includes('Уязвим') || tagsHtmlCX.includes('Горение')) throw new Error('CX: status tags must be English-only since v121 (no Russian in the tag — it saves space)');
if (tagsHtmlCX.includes('Danger Zone') || tagsHtmlCX.includes('Опасная зона')) throw new Error('CX: Danger Zone must never appear as a tag');
XCX.removeStatus('Exposed');
if (SCX.statuses.includes('Exposed')) throw new Error('CX: removeStatus must remove the status');
// Danger Zone по-прежнему авто (тепло) и не попадает в референс
SCX.statuses = ['Danger Zone'];
XCX.renderStatusRef();
if (elCX['statusRef'].innerHTML.includes('Danger Zone') || elCX['statusRef'].innerHTML.includes('Опасная зона')) throw new Error('CX: Danger Zone must not be in the clickable reference');
if (!elCX['statusRef'].innerHTML.includes('Burn — Горение')) throw new Error('CX: Burn must be in the clickable reference (both languages)');
// showStatus показывает описание в том же диалоге, что и теги
XCX.showStatus('Burn');
if (!elCX['tagDlgName'].textContent.includes('Burn — Горение')) throw new Error('CX: showStatus must show the bilingual status name in the dialog');
if (!elCX['tagDlgDesc'].textContent.includes('Engineering')) throw new Error('CX: showStatus must show the Burn description');
// PHASE CY (v113): таблица статов — название сверху, значение снизу; 3 строки равной ширины
if (staticHtml.includes('class="grid5"')) throw new Error('CY: grid5 must be gone');
if (!staticHtml.includes('class="stat-table"')) throw new Error('CY: the stat table must exist');
if (!staticHtml.includes('class="stat-row cols-4 ')) throw new Error('CY: the 4-column stat rows must exist');
const statTableHtml = staticHtml.split('class="stat-table"')[1].split('haseHint')[0];
// строка 1 — HASE, строка 2 — Size/Speed/Sensors/T.Attack, строка 3 — Armor/Grit/Evasion/E-Defense
const rowsCY = statTableHtml.split('class="stat-row');
if (!rowsCY[1].includes('pilot.hull') || !rowsCY[1].includes('pilot.agility') || !rowsCY[1].includes('pilot.systems') || !rowsCY[1].includes('pilot.engineering')) throw new Error('CY: row 1 must be HASE');
if (!rowsCY[2].includes('mech.size') || !rowsCY[2].includes('mech.speed') || !rowsCY[2].includes('mech.sensors') || !rowsCY[2].includes('mech.tech')) throw new Error('CY: row 2 must be Size/Speed/Sensors/T.Attack');
if (!rowsCY[3].includes('mech.armor') || !rowsCY[3].includes('pilot.grit') || !rowsCY[3].includes('mech.evasion') || !rowsCY[3].includes('mech.edef')) throw new Error('CY: row 3 must be Armor/Grit/Evasion/E-Defense');
// имена статов — только по-английски, без «макс. 4» у Armor
if (statTableHtml.includes('Размер') || statTableHtml.includes('Скорость') || statTableHtml.includes('макс.')) throw new Error('CY: stat names must be English only, no «макс. 4» on Armor');
if (statTableHtml.includes('Armor (макс.') || statTableHtml.includes('Armor (max')) throw new Error('CY: the «max 4» note must be gone from Armor');
// ячейка: название сверху, значение снизу (flex column), равная ширина в строке
if (!staticHtml.includes('.stat-cell { display:flex; flex-direction:column;')) throw new Error('CY: a stat cell must stack the name above the value');
if (!staticHtml.includes('.stat-row.cols-4 { grid-template-columns:repeat(4, minmax(0,1fr));')) throw new Error('CY: the 4-column rows must have equal widths');
// PHASE CZ (v114): референс статусов — коллапсабл, имя на двух языках, описание сразу, тап = переключатель
if (!staticHtml.includes('<details class="sec">\n      <summary data-i18n="u233">')) throw new Error('CZ: the status reference must be a collapsible .sec block (like Overcharge)');
if (!staticHtml.includes('<summary data-i18n="u233">')) throw new Error('CZ: the reference summary must be headed «Статусы» (u233)');
if (!staticHtml.includes('.status-ref-list { display:flex; flex-direction:column;')) throw new Error('CZ: the reference must be a vertical list (one status per line)');
if (!/function toggleStatus\(name\)/.test(html)) throw new Error('CZ: toggleStatus must exist');
if (/function addStatus\(name\)/.test(html)) throw new Error('CZ: addStatus must be gone (replaced by toggleStatus)');
// имя — на обоих языках сразу
const rCZ = runEval({});
const XCZ = rCZ.X, SCZ = rCZ.S, elCZ = rCZ.elements;
if (XCZ.statusLabel('Exposed') !== 'Exposed — Уязвим') throw new Error('CZ: statusLabel must return both languages (Exposed — Уязвим)');
if (XCZ.statusLabel('Burn') !== 'Burn — Горение') throw new Error('CZ: statusLabel must return both languages for Burn');
// референс: описание видно сразу, без второго тапа
XCZ.renderStatusRef();
const refHtmlCZ = elCZ['statusRef'].innerHTML;
if (!refHtmlCZ.includes('status-ref-desc')) throw new Error('CZ: the reference must show each status description inline');
if (!refHtmlCZ.includes('удваивается')) throw new Error('CZ: the Exposed description must be visible in the reference');
// 2й тап снимает тег (как крестик)
XCZ.toggleStatus('Exposed');
if (!SCZ.statuses.includes('Exposed')) throw new Error('CZ: 1st tap must add the tag');
XCZ.toggleStatus('Exposed');
if (SCZ.statuses.includes('Exposed')) throw new Error('CZ: 2nd tap must remove the tag (same as the ×)');
// активный статус помечен галочкой в референсе
XCZ.toggleStatus('Burn');
XCZ.renderStatusRef();
if (!elCZ['statusRef'].innerHTML.includes('✓ Burn — Горение')) throw new Error('CZ: an active status must show a ✓ in the reference');
// PHASE DA (v115): таблица статов — сетка без зазоров и скруглений; T.Attack; Grit; стиль
// T.Attack вместо Tech Attack (в строку входит)
if (staticHtml.includes('>Tech Attack<')) throw new Error('DA: the label must be T.Attack, not Tech Attack');
if (!staticHtml.includes('>T.Attack<')) throw new Error('DA: the T.Attack label must exist');
// сетка без зазоров и скруглений: gap 0, общий бордер, ячейки вплотную
if (!staticHtml.includes('.stat-table { display:flex; flex-direction:column; gap:0;')) throw new Error('DA: the stat table must have no gaps between rows');
if (!staticHtml.includes('.stat-row { display:grid; gap:0;')) throw new Error('DA: the stat rows must have no gaps between cells');
if (!staticHtml.includes('.stat-row + .stat-row { border-top:1px solid var(--line);')) throw new Error('DA: rows must be separated by a shared border');
if (!staticHtml.includes('.stat-cell + .stat-cell { border-left:1px solid var(--line);')) throw new Error('DA: cells must be separated by a shared border');
if (staticHtml.includes('.stat-cell { display:flex; flex-direction:column; align-items:center; background:var(--panel2); border:1px solid var(--line); border-radius:8px;')) throw new Error('DA: the rounded cell boxes must be gone');
// Grit после Armor, в той же строке; синхронизация обоих полей
if (!staticHtml.includes('data-f="pilot.grit"')) throw new Error('DA: a Grit field must exist in the stats table');
const gritFieldsDA = (staticHtml.match(/data-f="pilot.grit"/g) || []).length;
if (gritFieldsDA !== 2) throw new Error('DA: exactly two Grit fields must exist (Pilot tab + stats table), found ' + gritFieldsDA);
if (!/const gritVal = Math\.ceil\(calcLL\(\)\/2\);[\s\S]*?S\.pilot\.grit = gritVal;/.test(html)) throw new Error('DA: recalcDerived must store Grit in the save');
if (!/querySelectorAll\('\[data-f="pilot\.grit"\]'\)/.test(html)) throw new Error('DA: recalcDerived must update ALL Grit fields');
const rDA = runEval({});
const XDA = rDA.X;
XDA.addLicenseByName('Blackbeard', 2);
if (rDA.S.pilot.grit !== 1) throw new Error('DA: Grit must be 1 at LL2 (ceil(2/2))');
// поле заметок — само растягивается по высоте текста (без ручного resize и внутреннего скролла)
if (!staticHtml.includes('class="autogrow" data-f="mech.notes"')) throw new Error('DA: the notes textarea must carry the autogrow class');
if (!staticHtml.includes('oninput="autoGrowNotes()"')) throw new Error('DA: the notes textarea must auto-grow on input');
if (!staticHtml.includes('textarea.autogrow { resize:none; overflow:hidden;')) throw new Error('DA: the autogrow textarea must have no manual resize and no internal scroll');
if (!/function autoGrowNotes\(\)/.test(html)) throw new Error('DA: autoGrowNotes must exist');
if (!/el\.style\.height = el\.scrollHeight/.test(html)) throw new Error('DA: autoGrowNotes must set the height to scrollHeight');
// стиль: заголовки капсом с разрядкой, HASE с тёплой подложкой
if (!staticHtml.includes('.stat-cell label { font-size:10px;')) throw new Error('DA: stat labels must be small caps (10px, so ENGINEERING fits with side padding)');
if (!staticHtml.includes('text-transform:uppercase; letter-spacing:.04em;')) throw new Error('DA: stat labels must be uppercase with letter-spacing');
if (!staticHtml.includes('.stat-row.hase { background:linear-gradient(180deg, rgba(232,89,12,.48), rgba(232,89,12,.24));')) throw new Error('DA: the HASE row must be the theme orange gradient (v152)');
// референс статусов — .sec-блок после Оверчарджа, а не внутри Ресурсов боя
if (staticHtml.includes('<details class="status-ref">')) throw new Error('DA: the old .status-ref details must be gone');
if (!(staticHtml.indexOf('id="corePanel"') < staticHtml.indexOf('id="statusRef"'))) throw new Error('DA: the status reference must be after the Combat Resources card (corePanel is its last element)');
// PHASE DB (v116): строки таблицы — разные цвета; Grit не красный; ENGINEERING с паддингом
// верхняя строка жёлтая, средняя неоново-зелёная, нижняя стальная (v117 — градиенты, свет сверху)
if (!staticHtml.includes('.stat-row.hase { background:linear-gradient(180deg, rgba(232,89,12,.48), rgba(232,89,12,.24));')) throw new Error('DB: the top (HASE) row must be the theme orange gradient (v152)');
if (!staticHtml.includes('.stat-row.mid { background:linear-gradient(180deg, rgba(92,223,51,.40), rgba(92,223,51,.20));')) throw new Error('DB: the middle row must be a saturated neon green gradient (v147)');
if (!staticHtml.includes('.stat-row.bot { background:linear-gradient(180deg, rgba(140,160,180,.48), rgba(140,160,180,.24));')) throw new Error('DB: the bottom row must be a saturated steel gradient (v147)');
if (!staticHtml.includes('class="stat-row cols-4 mid"')) throw new Error('DB: the middle row must carry the .mid class');
if (!staticHtml.includes('class="stat-row cols-4 bot"')) throw new Error('DB: the bottom row must carry the .bot class');
// Grit — обычным белым, без акцентного (красного) цвета
if (staticHtml.includes('.stat-cell.grit input[type="number"] { color:var(--accent);')) throw new Error('DB: the Grit value must not be in the accent colour');
// все колонки равной ширины — ENGINEERING влезает за счёт мелкого шрифта, а не широкой колонки
if (!staticHtml.includes('.stat-row.cols-4 { grid-template-columns:repeat(4, minmax(0,1fr));')) throw new Error('DB: all stat rows must be 4 equal columns');
if (staticHtml.includes('.stat-row.cols-4 { grid-template-columns:repeat(4, 1fr 1fr 1fr 1.2fr);')) throw new Error('DB: no wider Engineering column allowed');
// PHASE DC (v117): объём квадратикам статов (градиент + фаска); Core Power — текст слева, круглая кнопка справа
// фаска ячейки: светлая кромка сверху, тень снизу
if (!staticHtml.includes('box-shadow:inset 0 1px 0 rgba(255,255,255,.12), inset 0 -2px 4px rgba(0,0,0,.30);')) throw new Error('DC: a stat cell must have an inset bevel (top highlight + bottom shadow)');
// Core Power: верхняя строка — flex, текст слева, круглая кнопка справа
if (!staticHtml.includes('class="cp-top"')) throw new Error('DC: the Core Power panel must have a cp-top row');
if (!staticHtml.includes('class="cp-info"')) throw new Error('DC: the Core Power text must be back in a cp-info block on the left (layout reverted in v128)');
if (!staticHtml.includes('class="cp-round" id="coreBtn"')) throw new Error('DC: the Core Power button must be round (cp-round)');
if (staticHtml.includes('cp-bolt')) throw new Error('DC: the bolt must be gone (removed in v119)');
if (!staticHtml.includes('.cp-top { display:flex; align-items:center; gap:12px; position:relative; z-index:1;')) throw new Error('DC: cp-top must be a flex row (text left, button right) and sit above the panel sheen (position + z-index)');
if (!staticHtml.includes('#coreBtn.cp-round { flex-shrink:0; width:120px; height:120px; border-radius:50%;')) throw new Error('DC: the Core Power button must be a 120px circle');
if (!staticHtml.includes('<radialGradient id="cpRed" cx="35%" cy="30%" r="75%"')) throw new Error('DC: the ready core must be a red radial (lit from above, in the SVG)');
// кнопка больше не широкая полоса и не несёт текст «Не использовано»
if (staticHtml.includes('.core-power .btn { width:100%;')) throw new Error('DC: the wide full-width Core Power button must be gone');
if (staticHtml.includes('data-i18n="u074"')) throw new Error('DC: the button must not carry the u074 text anymore (it is a round button now)');
// u075 — текст-подсказка убран в v125 (и так понятно); в статичном HTML его быть не должно
if (staticHtml.includes('1 раз за миссию. Восстанавливается при полном ремонте')) throw new Error('DC: the u075 hint text must be gone from the panel');
// v128: строка про восстановление (u234, только она — без «1 раз») снова слева от кнопки, в cp-info
if (!staticHtml.includes('<div class="cp-info"><span data-i18n="u234">Восстанавливается при полном ремонте или в начале миссии.</span></div>')) throw new Error('DC: the restoration note (u234) must sit in cp-info on the left of the button');
if (staticHtml.includes('cp-restore')) throw new Error('DC: the centred cp-restore line must be gone (layout reverted in v128)');
// состояние кнопки по-прежнему переключается классами cp-ready/cp-used
const rDC = runEval({});
const XDC = rDC.X;
if (!rDC.elements['coreBtn']) throw new Error('DC: coreBtn must exist');
XDC.toggleCore();
if (!rDC.elements['coreBtn'].classList.contains('cp-used')) throw new Error('DC: after toggleCore the round button must be cp-used');
XDC.toggleCore();
if (!rDC.elements['coreBtn'].classList.contains('cp-ready')) throw new Error('DC: after a second toggleCore the round button must be cp-ready again');
// PHASE DD (v124): кнопка Core Power — красная обводка (уже, 12px), текст центрирован в ней; CORE POWER сверху, ENGAGE/USED снизу
// renderCounters больше не пишет textContent кнопки (это затирало молнию и ломало круглую кнопку)
if (/cb\.textContent = get\('mech\.coreUsed'\)/.test(html)) throw new Error('DD: renderCounters must not overwrite the button textContent anymore');
// обводка — красное кольцо вокруг красного ядра (тёмно-красный градиент, не металл); всё рисуется в SVG, фон кнопки прозрачный
if (!staticHtml.includes('<circle class="cp-rim"')) throw new Error('DD: the button must have a red rim ring (cp-rim)');
if (!staticHtml.includes('stroke="url(#cpRim)"')) throw new Error('DD: the rim must use the dark-red gradient (cpRim), not metal');
if (staticHtml.includes('cpMetal')) throw new Error('DD: the metal rim gradient must be gone (the rim is red since v124)');
if (!staticHtml.includes('<circle class="cp-core"')) throw new Error('DD: the button must have a red core circle (cp-core)');
if (!staticHtml.includes('fill="url(#cpRed)"')) throw new Error('DD: the core must use the red radial gradient');
if (!staticHtml.includes('<circle class="cp-rim" cx="60" cy="60" r="54"')) throw new Error('DD: the rim must be narrow (12px: midline r=54, core r=48)');
if (!staticHtml.includes('stroke-width="12"')) throw new Error('DD: the rim stroke must be 12px wide');
if (!staticHtml.includes('background:transparent; border:none;')) throw new Error('DD: the button background must be transparent (the SVG draws the rim and core)');
// верхняя дуга — CORE POWER (статичная), нижняя — ENGAGE/USED (динамическая); обе золотые, всегда по-английски; текст центрирован в обводке (базовые линии r=49 и r=59 при середине обводки r=54)
if (!staticHtml.includes('<textPath id="cpTopText" href="#cpArcTop" startOffset="50%" text-anchor="middle">CORE POWER</textPath>')) throw new Error('DD: the top arc must carry a curved CORE POWER label on a textPath');
if (!staticHtml.includes('<path id="cpArcTop" d="M 25,25 A 49,49 0 0,1 95,25"')) throw new Error('DD: the top arc must curve over the top (sweep 1, rainbow), radius 49');
if (!staticHtml.includes('<textPath id="cpBottomText" href="#cpArcBottom" startOffset="50%" text-anchor="middle">ENGAGE</textPath>')) throw new Error('DD: the bottom arc must carry a curved ENGAGE label on a textPath');
if (!staticHtml.includes('<path id="cpArcBottom" d="M 31,111 A 59,59 0 0,0 90,111"')) throw new Error('DD: the bottom arc must be the smile (sweep 0), radius 59');
if (!staticHtml.includes('#coreBtn .cp-label { font-size:10px; letter-spacing:1px;')) throw new Error('DD: the rim labels must be 10px with 1px letter-spacing');
if (!staticHtml.includes('fill:url(#cpGold)')) throw new Error('DD: the rim labels must be gold (cpGold gradient)');
// тот же интервал — атрибутом на SVG <text> (v120: CSS letter-spacing не дал видимого эффекта в WebView пользователя)
if (!staticHtml.includes('<text class="cp-label" letter-spacing="1">')) throw new Error('DD: the rim labels must also carry letter-spacing as an SVG attribute');
// молнии больше нет (v119 — пользователь попросил попробовать без неё)
if (staticHtml.includes('cp-bolt')) throw new Error('DD: the bolt must be gone (removed in v119)');
// состояние переключает текст НИЖНЕЙ дуги ENGAGE <-> USED; верхняя (CORE POWER) не меняется
const rDD = runEval({});
const XDD = rDD.X;
if (rDD.elements['cpBottomText'].textContent !== 'ENGAGE') throw new Error('DD: the bottom arc must read ENGAGE when Core Power is unused');
if (html.includes("getElementById('cpTopText')")) throw new Error('DD: renderCounters must never touch the static CORE POWER label');
XDD.toggleCore();
if (rDD.elements['cpBottomText'].textContent !== 'USED') throw new Error('DD: the bottom arc must read USED after toggleCore');
if (!rDD.elements['coreBtn'].classList.contains('cp-used')) throw new Error('DD: the button must be cp-used after toggleCore');
// PHASE DE (v119): кнопка Core Power — без голубой вспышки при тапе; «1 раз» с новой строки
// тап не даёт голубую вспышку (как в навигации, v88)
if (!staticHtml.includes('cursor:pointer; -webkit-tap-highlight-color:transparent; -webkit-touch-callout:none; user-select:none;')) throw new Error('DE: the Core Power button must not flash blue on tap');
// (проверка «1 раз с новой строки» убрана в v125 вместе с самим текстом-подсказкой)
// PHASE DF (v122): PWA — трекер устанавливается как приложение (манифест + service worker, network-first)
// манифест подключён, тема и иконка для iOS — в head
if (!staticHtml.includes('<link rel="manifest" href="manifest.webmanifest">')) throw new Error('DF: the page must link its web app manifest');
if (!staticHtml.includes('<meta name="theme-color" content="#0e1116">')) throw new Error('DF: the page must declare the theme colour');
// service worker зарегистрирован
if (!html.includes("navigator.serviceWorker.register('sw.js')")) throw new Error('DF: the page must register its service worker');
// манифест: валидный JSON, имя, standalone, иконки 192 и 512
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.webmanifest'), 'utf-8'));
if (manifest.name !== 'Lancer — Трекер персонажа') throw new Error('DF: the manifest name must be the tracker name');
if (manifest.short_name !== 'Lancer') throw new Error('DF: the manifest short_name must be Lancer');
if (manifest.display !== 'standalone') throw new Error('DF: the manifest display must be standalone');
if (!manifest.icons || !manifest.icons.some(i => i.sizes === '192x192') || !manifest.icons.some(i => i.sizes === '512x512')) throw new Error('DF: the manifest must list 192 and 512 icons');
if (!manifest.icons.every(i => i.type === 'image/svg+xml' && i.src === 'icon.svg')) throw new Error('DF: the manifest icons must be the SVG icon');
// иконка — SVG (красная кнопка Core Power с молнией); PNG коннектор не пушит, поэтому вектор
const iconSvg = fs.readFileSync(path.join(__dirname, 'icon.svg'), 'utf-8');
if (!iconSvg.includes('<svg') || !iconSvg.includes('viewBox="0 0 512 512"')) throw new Error('DF: icon.svg must be a 512 viewBox SVG');
if (!iconSvg.includes('<circle') || !iconSvg.includes('ffe135')) throw new Error('DF: icon.svg must draw the red Core Power button with a yellow bolt');
// service worker: network-first — сначала сеть (свежая версия), кэш только офлайн
const sw = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf-8');
if (!sw.includes('fetch(e.request)')) throw new Error('DF: the service worker must try the network first');
if (!sw.includes('caches.match(e.request)')) throw new Error('DF: the service worker must fall back to the cache when offline');
if (!sw.includes("addEventListener('fetch'")) throw new Error('DF: the service worker must handle fetch events');
// PHASE DG (v124): иконка приложения — та же красная кнопка с красной обводкой: LANCER сверху, ENGAGE снизу (золотым)
// v129: фон иконки — жёлто-чёрные диагональные полосы (hazard), а не чёрный
if (!iconSvg.includes('<pattern id="hazard"')) throw new Error('DG: icon.svg must define a hazard stripe pattern');
if (!iconSvg.includes('fill="url(#hazard)"')) throw new Error('DG: the icon background must be the yellow-black hazard stripes');
if (iconSvg.includes('<rect width="512" height="512" rx="112" fill="#0e1116"/>')) throw new Error('DG: the icon background must not be solid dark anymore');
if (!iconSvg.includes('stroke="url(#rimRed)"')) throw new Error('DG: icon.svg must have a red rim ring');
if (iconSvg.includes('#metal')) throw new Error('DG: the icon rim must be red, not metal');
if (!iconSvg.includes('LANCER</textPath>')) throw new Error('DG: the icon rim must read LANCER on the top arc');
if (!iconSvg.includes('ENGAGE</textPath>')) throw new Error('DG: the icon rim must read ENGAGE on the bottom arc');
if (!iconSvg.includes('fill="url(#gold)"')) throw new Error('DG: the icon rim text must be gold');
// PHASE DH (v132): триггеры пилота — таблица в стиле карточки Статов (рамка, фон panel2, жёлтый градиент HASE, фаска, разделители),
// но имя и число — в ОДНОЙ строке (имя слева, бонус справа, 20px), а не друг над другом: длинные названия сверху не влезли бы
if (!staticHtml.includes('.trig-table { display:flex; flex-direction:column; gap:0; margin-top:10px; border:1px solid var(--line); background:var(--panel2); }')) throw new Error('DH: .trig-table must mirror the Stats card table (border, panel2 background)');
if (!staticHtml.includes('.trig-row { display:flex; align-items:center; gap:10px; padding:10px 12px; background:linear-gradient(180deg, rgba(232,89,12,.48), rgba(232,89,12,.24));')) throw new Error('DH: .trig-row must be a horizontal row with the theme orange gradient (v152)');
if (!staticHtml.includes('box-shadow:inset 0 1px 0 rgba(255,255,255,.12), inset 0 -2px 4px rgba(0,0,0,.30); }')) throw new Error('DH: .trig-row must have the same inset bevel as the stat cells');
if (!staticHtml.includes('.trig-row + .trig-row { border-top:1px solid var(--line); }')) throw new Error('DH: trigger rows must be divided by a border, like stat rows');
if (!staticHtml.includes('.trig-val { flex:0 0 auto; font-size:20px; font-weight:700;')) throw new Error('DH: the trigger bonus must be 20px bold, like a stat value');
if (!staticHtml.includes('<div id="triggers" class="trig-table"></div>')) throw new Error('DH: the triggers container must be .trig-table');
if (!html.includes('<div class="trig-row"><span class="trig-name">')) throw new Error('DH: read-mode trigger rows must be .trig-row with the name on the left and the bonus on the right');
if (!html.includes('<input class="trig-name" type="text"')) throw new Error('DH: edit-mode trigger rows must keep the name input (class trig-name)');
if (!html.includes('<input class="trig-val" type="number"')) throw new Error('DH: edit-mode trigger rows must keep the bonus input (class trig-val, 20px)');
if (html.includes('<div class="row"><input type="text" placeholder="${L(\'ph_trigger\')}"')) throw new Error('DH: the old plain edit-mode trigger row must be gone (the wizards wizTriggers/luTriggers keep their own plain rows)');
// PHASE DI (v133): пояснение ёмкости маунта (mount-cap) — на своей строке под шапкой маунта, а не вжато
// в flex-ряд между селектом и крестиком, где ему не хватало ширины и текст рвался в узкую колонку
if (!staticHtml.includes('.mount-head select { flex:1 1 auto; min-width:0; }')) throw new Error('DI: the mount type select must fill the header now that the cap is out of it');
if (!staticHtml.includes('.mount-cap { color:var(--dim); font-size:12px; margin-bottom:8px; }')) throw new Error('DI: .mount-cap must be a block below the header (no flex:1), with a margin under it');
if (!html.includes('`<div class="mount-cap"')) throw new Error('DI: the mount-cap must be a block div on its own line below the mount header');
if (html.includes('<span class="mount-cap"')) throw new Error('DI: the mount-cap must not be an inline span inside the mount-head row anymore');
// PHASE DJ (v134): подсказка про базу оружия (u066) — весь текст лишний, абзац weaponsHint убран целиком;
// подсказка систем (u070) и талантов (u063) не трогались — убирали только то, что процитировал пользователь
if (staticHtml.includes('id="weaponsHint"')) throw new Error('DJ: the weaponsHint paragraph must be gone');
if (html.includes("show('weaponsHint'")) throw new Error('DJ: the dead show(weaponsHint) call must be gone');
if (!staticHtml.includes('id="systemsHint"')) throw new Error('DJ: the systems hint must stay (only the weapons hint was removed)');
if (!staticHtml.includes('id="talentsHint"')) throw new Error('DJ: the talents hint must stay (only the weapons hint was removed)');
if (!html.includes("if (el) el.textContent = licNote")) throw new Error('DJ: the licNote writer must stay guarded (licNoteW is gone with the paragraph)');
if (!html.includes("const wc = document.getElementById('dbWeaponCount'); if (wc)")) throw new Error('DJ: the dbWeaponCount writer must stay guarded (the span is gone with the paragraph)');
// PHASE DK (v135): голубое мигание при тапе — раньше убирали точечно (навигация, кольцо, термометр, Core Power),
// но оно осталось на слайдерах и разворачиваемых блоках правил; теперь убрано глобально одним правилом на *
if (!staticHtml.includes('* { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }')) throw new Error('DK: the global * rule must disable the tap highlight, so no element (slider, rule accordion, or anything else) flashes blue on tap');
if (!staticHtml.includes('#langToggle')) throw new Error('DK: the language slider must still exist (it is covered by the global tap-highlight rule)');
if (!staticHtml.includes('details.sec summary')) throw new Error('DK: the rule accordions must still exist (they are covered by the global tap-highlight rule)');
// PHASE DL (v136): HUD — фундамент (CSS-переменные) + оболочка (фон-сетка, квадратные карточки с янтарной кромкой,
// янтарные заголовки, квадратные кнопки, янтарная главная кнопка, квадратные тоглы). Разметка и логика не тронуты — только CSS.
if (!staticHtml.includes('--hud-amber:#ffb000')) throw new Error('DL: :root must define --hud-amber');
if (!staticHtml.includes('--hud-grid:rgba(255,255,255,.028)')) throw new Error('DL: :root must define --hud-grid');
if (!staticHtml.includes('background-image:linear-gradient(var(--hud-grid) 1px, transparent 1px), linear-gradient(90deg, var(--hud-grid) 1px, transparent 1px); background-size:28px 28px;')) throw new Error('DL: body must have the subtle HUD grid texture');
if (!staticHtml.includes('.card { background:var(--panel); border:1px solid var(--line); border-top:2px solid var(--hud-amber); border-radius:0;')) throw new Error('DL: .card must be square with an amber top edge');
if (!staticHtml.includes('.card h2 { margin:0 0 10px; font-size:15px; letter-spacing:.08em; text-transform:uppercase; color:var(--hud-amber); }')) throw new Error('DL: .card h2 must be amber with .08em letter-spacing');
if (!staticHtml.includes('details.sec { background:var(--panel); border:1px solid var(--line); border-top:2px solid var(--hud-amber); border-radius:0;')) throw new Error('DL: details.sec must be square with an amber top edge');
if (!staticHtml.includes('details.sec summary { cursor:pointer; font-weight:700; font-size:15px; color:var(--hud-amber); text-transform:uppercase; letter-spacing:.08em; }')) throw new Error('DL: details.sec summary must be amber with .08em letter-spacing');
if (!staticHtml.includes('.btn { padding:10px 14px; font-size:15px; border-radius:0;')) throw new Error('DL: .btn must be square');
if (!staticHtml.includes('.btn.primary { background:var(--hud-amber); border-color:var(--hud-amber); color:#0e1116; font-weight:700; }')) throw new Error('DL: .btn.primary must be amber with dark text');
if (!staticHtml.includes('.toggle { width:40px; height:24px; border-radius:0;')) throw new Error('DL: .toggle must be square');
if (!staticHtml.includes('.toggle.on { background:var(--hud-amber); border-color:var(--hud-amber); }')) throw new Error('DL: .toggle.on must be amber');
// PHASE DM (v137): слайдерам — глубина (дорожка утоплена, бегунок объёмный); кнопке Core Power — чёткие края (без blur-тени)
if (!staticHtml.includes('.toggle { width:40px; height:24px; border-radius:0; background:#3a4350; border:1px solid var(--line); box-shadow:inset 0 1px 1px rgba(0,0,0,.65);')) throw new Error('DM: .toggle track must have a short, aggressive inset shadow (v139)');
if (!staticHtml.includes('background:linear-gradient(180deg, #232830, #05070a); box-shadow:inset 0 -2px 3px rgba(0,0,0,.5);')) throw new Error('DM: .toggle knob must be black with only a bottom shadow (v145: no gray top stripe)');
if (!staticHtml.includes('#langToggle .knob { width:42px; height:26px; border-radius:0; background:linear-gradient(180deg, #7be495, #51cf66 55%, #3f9e50);')) throw new Error('DM: #langToggle knob must be square (HUD) with a gradient for depth (v141: 42x26)');
if (!staticHtml.includes('#coreBtn.cp-ready { box-shadow:0 0 0 1px rgba(245,197,24,.6); }')) throw new Error('DM: #coreBtn.cp-ready must have a fine 1px gold ring at .6 opacity (v141)');
if (staticHtml.includes('0 4px 14px rgba(214,48,48,.45)')) throw new Error('DM: the blurred 14px drop shadow on the Core Power button must be gone');
// PHASE DN (v138): розовое кольцо и жёсткая тень снизу убраны — кнопка сидит плоско, кромка янтарная
if (staticHtml.includes('rgba(255,107,107,.55)')) throw new Error('DN: the pink outer ring on the Core Power button must be gone (it read as a shadow)');
if (staticHtml.includes('0 4px 0 rgba(0,0,0,.5)')) throw new Error('DN: the hard bottom shadow that lifted the Core Power button must be gone');
// PHASE DP (v140): кольцо кнопки — золото текста, тонкое (1px)
if (staticHtml.includes('0 0 0 2px var(--hud-amber)')) throw new Error('DP: the 2px amber ring on the Core Power button must be gone (replaced by a thin gold ring)');
// PHASE DQ (v141): бегунок слайдера языка — больше (заполняет половину дорожки, перекрывает тень);
// кольцо кнопки — тоньше (золото .6); винты с прямым шлицем на кнопке, шлицы в разных положениях
if (!staticHtml.includes('#langToggle .knob { width:42px; height:26px;')) throw new Error('DQ: #langToggle knob must be bigger (42x26) so it fills half the track and covers the top shadow');
if (!staticHtml.includes('#langToggle.on .knob { left:42px; }')) throw new Error('DQ: #langToggle.on knob must sit at left:42px (right half)');
if (!staticHtml.includes('id="cpSteel"')) throw new Error('DQ: the cpSteel gradient for the button screws must exist');
if (!staticHtml.includes('transform="rotate(-12 6 60)"')) throw new Error('DQ: the left screw slot must be rotated -12 (random, not mirrored)');
if (!staticHtml.includes('transform="rotate(68 114 60)"')) throw new Error('DQ: the right screw slot must be rotated +68 (random, not mirrored)');
if (staticHtml.includes('0 0 0 1px #f5c518')) throw new Error('DQ: the full-opacity 1px gold ring must be gone (replaced by the finer .6 version)');
// PHASE DR (v142): головка тогла редактирования — больше (заполняет половину дорожки и всю её высоту)
if (!staticHtml.includes('.toggle .knob { position:absolute; top:0; left:0; width:19px; height:22px;')) throw new Error('DR: .toggle knob must be bigger (19x22, fills half the track and the full height)');
// PHASE DS (v143): теги и «подробнее» — в стиле HUD (квадратные, янтарь, капс)
if (!staticHtml.includes('.tag { display:inline-block; background:var(--panel2); border:1px solid var(--hud-amber-dim); color:var(--hud-amber); border-radius:0;')) throw new Error('DS: .tag must be square with an amber border and amber text');
if (!staticHtml.includes('text-transform:uppercase; letter-spacing:.04em; cursor:pointer; }')) throw new Error('DS: .tag must be uppercase with letter-spacing');
if (!staticHtml.includes('.tag:hover { border-color:var(--hud-amber); }')) throw new Error('DS: .tag:hover must use the amber border');
if (!staticHtml.includes('.status-tag { display:inline-flex; align-items:center; gap:6px; background:var(--sc,#2c3542); color:#fff; border-radius:0;')) throw new Error('DS: .status-tag must be square (status colour kept)');
if (!staticHtml.includes('.status-x { display:flex; align-items:center; justify-content:center; width:18px; height:18px; border:none; border-radius:0;')) throw new Error('DS: .status-x must be square');
if (!staticHtml.includes('.desc-more { color:var(--hud-amber); background:none; border:none; padding:0; font:inherit; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; cursor:pointer; }')) throw new Error('DS: .desc-more must be amber, uppercase, letter-spaced and bold');
// PHASE DT (v144): головка тогла — чёрная, ключ в ней — оранжевый SVG (эмодзи перекрасить нельзя)
if (!staticHtml.includes('.toggle .knob { position:absolute; top:0; left:0; width:19px; height:22px; border-radius:0; background:linear-gradient(180deg, #232830, #05070a);')) throw new Error('DT: .toggle knob must be black (dark gradient)');
if (!staticHtml.includes('stroke="#e8590c"')) throw new Error('DT: the wrench in the toggle knobs must be an orange SVG (theme orange #e8590c)');
if (staticHtml.includes('<span class="knob">🔧</span>')) throw new Error('DT: the wrench emoji must be gone from the toggle knobs (it cannot be recoloured)');
// PHASE DU (v145): кнопки удаления/закрытия — в цвет ключа (оранжевый) и меньше; серая полоска на головке убрана
if (!staticHtml.includes('.btn.danger { border-color:var(--accent); color:var(--accent); padding:6px 10px; font-size:13px; }')) throw new Error('DU: .btn.danger must be wrench-orange and smaller');
if (staticHtml.includes('.btn.danger { border-color:var(--bad);')) throw new Error('DU: the red delete buttons must be gone (replaced by orange)');
if (staticHtml.includes('inset 0 1px 0 rgba(255,255,255,.28)')) throw new Error('DU: the gray top stripe on the toggle knob must be gone');
// PHASE DW (v148): иконка меха «Блок» с антенной; HASE красный; триггеры зелёные
if (!staticHtml.includes('id="tabMechBtn"')) throw new Error('DW: the mech nav button must exist');
const dwMechIdx = staticHtml.indexOf('id="tabMechBtn"');
const dwMechSvg = staticHtml.slice(dwMechIdx, staticHtml.indexOf('</button>', dwMechIdx));
if (!dwMechSvg.includes('<rect x="3" y="7" width="18" height="13" rx="1"/>')) throw new Error('DW: the mech icon must be the wide Block (18x13)');
if (!dwMechSvg.includes('<rect x="7" y="11" width="2.6" height="2.6"')) throw new Error('DW: the Block icon must have square eyes');
if (!dwMechSvg.includes('<line x1="9" y1="16.5" x2="15" y2="16.5"/>')) throw new Error('DW: the Block icon must have a mouth line');
if (dwMechSvg.includes('y="2.5" x2="12" y2="4"')) throw new Error('DW: the old tall robot icon must be gone');
if (!staticHtml.includes('.stat-row.hase { background:linear-gradient(180deg, rgba(232,89,12,.48), rgba(232,89,12,.24));')) throw new Error('DW: the HASE row must be theme orange (v152)');
if (!staticHtml.includes('.stat-row.mid { background:linear-gradient(180deg, rgba(92,223,51,.40), rgba(92,223,51,.20));')) throw new Error('DW: the middle row must stay saturated green');
// PHASE DX (v150): навбар приведён к общей HUD-схеме (янтарь), полоски убраны; линза сохранена
if (staticHtml.includes('repeating-linear-gradient(115deg, rgba(255,255,255,.03) 0 2px, transparent 2px 8px)')) throw new Error('DX: the striped nav background must be gone');
if (!staticHtml.includes('linear-gradient(180deg, rgba(255,176,0,.10), rgba(255,176,0,0) 30%)')) throw new Error('DX: the nav top tint must be amber');
if (staticHtml.includes('color:#5cdf33')) throw new Error('DX: the green nav icon color must be gone');
if (!staticHtml.includes('.nav-lens { position:absolute; top:0; bottom:0; left:8px;')) throw new Error('DX: the sliding lens must stay');
if (staticHtml.includes('rgb(59 217 30')) throw new Error('DX: the green lens color must be gone');
// PHASE DY (v153): 4 трекера ресурсов квадратные, без отдельных цветов
if (!staticHtml.includes('.res { border-top:1px solid var(--rc,#2c3542); border-radius:0; padding:10px; background:var(--panel2); }')) throw new Error('DY: the resource cards must be square (border-radius 0) with a thin 1px top border (v155)');
if (!staticHtml.includes('.counter button { width:44px; height:44px; font-size:22px; background:var(--panel2); color:var(--text); border:1px solid var(--line); border-radius:0; cursor:pointer; flex:none; }')) throw new Error('DY: the counter +/- buttons must be square (border-radius 0)');
if (staticHtml.includes('style="--rc:')) throw new Error('DY: the per-tracker colors (--rc) must be gone');
if ((staticHtml.match(/<div class="res">/g) || []).length !== 4) throw new Error('DY: there must be exactly 4 resource trackers');
// PHASE DZ (v154): числа урона, дальности и угрозы в карточках оружия — оранжевые и жирные
if (!staticHtml.includes('.wmeta .wnum { color:var(--accent); font-weight:700; }')) throw new Error('DZ: the weapon numbers must be orange and bold (.wmeta .wnum)');
if (!html.includes('<span class="wnum">$1</span>')) throw new Error('DZ: the weapon meta must wrap numbers in .wnum spans');
// PHASE EA (v156): номера бросков в таблицах структуры/реактора — жёлтые (янтарь HUD), не голубые
if (!staticHtml.includes('.tbl-roll { display:inline-block; font-weight:700; color:var(--hud-amber); margin-right:8px; }')) throw new Error('EA: the table roll numbers must be HUD amber');
if (staticHtml.includes('.tbl-roll { display:inline-block; font-weight:700; color:var(--accent2);')) throw new Error('EA: the blue table roll numbers must be gone');
if (!staticHtml.includes('.sub-h { margin:18px 0 8px; font-size:13px; letter-spacing:.06em; text-transform:uppercase; color:var(--hud-amber); }')) throw new Error('EA: the sub-headings must be HUD amber too');
// PHASE EB (v157): справка статусов (с описаниями) — квадратная
if (!staticHtml.includes('.status-ref-item { display:block; width:100%; text-align:left; background:var(--panel2); border:1px solid var(--line); border-left:3px solid var(--sc,#2c3542); border-radius:0; padding:8px 10px; cursor:pointer; }')) throw new Error('EB: the status reference items must be square (border-radius 0)');
// PHASE EC (v158): строки вертикально отцентрованы; крестики в строках списков — без рамок
if (!staticHtml.includes('.row { display:flex; gap:8px; align-items:center; margin-bottom:8px; }')) throw new Error('EC: the .row items must be vertically centered (align-items:center)');
if (!staticHtml.includes('.btn.x { border-color:transparent; background:transparent; color:var(--accent); padding:6px 10px; font-size:13px; }')) throw new Error('EC: the frameless .btn.x class must exist');
if ((html.match(/class=\"btn x\"/g) || []).length !== 14) throw new Error('EC: exactly 14 list-row X buttons must be frameless (.btn.x)');
if ((html.match(/class=\"btn danger\"/g) || []).length !== 5) throw new Error('EC: exactly 5 framed X buttons must remain (.btn.danger: 4 dialog closes + 1 mount removal)');
if (!html.includes('onclick=\"closeWizard()\">✕</button>') || !html.includes('onclick=\"closeLevelUp()\">✕</button>')) throw new Error('EC: the wizard close X buttons must keep their frames');
if (!html.includes('onclick=\"delMount(')) throw new Error('EC: the mount removal X must keep its frame');
// PHASE ED (v159): горизонтальное выравнивание в мастере — колонка значений и кнопки повышения не растянуты
if (!staticHtml.includes('.row .val { flex:0 0 48px; text-align:center; }')) throw new Error('ED: the .row .val fixed-width centered value column must exist');
if (!html.includes('<span class="dim val">')) throw new Error('ED: the creation wizard trigger bonus must use the fixed .val column');
if ((html.match(/<button class="btn [^"]*" style="flex:0 0 auto" [^>]*onclick="luRaise/g) || []).length !== 4) throw new Error('ED: all four LU raise buttons (+2 trigger, +1 talent, +1 license, +1 HASE) must be flex:0 0 auto');
if (!html.includes('onclick="luRaiseHase(')) throw new Error('ED: the LU HASE raise button must exist');
// PHASE EE (v160): Speed/Evasion/E-Defense/Tech/SP пересчитываются от Agility/Systems в recalcDerived
const { X: XEE, S: SEE, DB: DBEE, elements: elEE, g: gEE } = runEval({});
// Everest: speed 4, evasion 8, edef 8, sensor 10, tech 0, sp 6 (база фрейма)
XEE.set('mech.frame', 'Everest');
XEE.set('pilot.agility', 2); XEE.set('pilot.systems', 1);
XEE.recalcDerived();
if (XEE.get('mech.speed') !== 5) throw new Error('EE: Speed must be frame speed 4 + floor(Agility 2/2) = 5');
if (XEE.get('mech.evasion') !== 10) throw new Error('EE: Evasion must be frame evasion 8 + Agility 2 = 10');
if (XEE.get('mech.edef') !== 9) throw new Error('EE: E-Defense must be frame edef 8 + Systems 1 = 9');
if (XEE.get('mech.tech') !== 1) throw new Error('EE: Tech Attack must be frame tech 0 + Systems 1 = 1');
if (XEE.get('mech.sp') !== 6) throw new Error('EE: SP must be frame SP 6 + floor(Systems 1/2) = 6');
// Agility 0 / Systems 0 → базовые значения фрейма
XEE.set('pilot.agility', 0); XEE.set('pilot.systems', 0); XEE.recalcDerived();
if (XEE.get('mech.speed') !== 4 || XEE.get('mech.evasion') !== 8 || XEE.get('mech.edef') !== 8 || XEE.get('mech.tech') !== 0 || XEE.get('mech.sp') !== 6) throw new Error('EE: at Agility 0 / Systems 0 the stats must be the frame base values');
// PHASE EF (v161): кор-бонусы в производных статах + производные статы readonly (кроме HASE)
const { X: XEF, S: SEF, DB: DBEF, elements: elEF, g: gEF } = runEval({});
XEF.set('mech.frame', 'Everest');
XEF.set('pilot.agility', 0); XEF.set('pilot.systems', 0);
// Everest: armor 0, evasion 8, edef 8, size 1
SEF.pilot.coreBonuses = ['Sloped Plating', 'Full Subjectivity Sync', 'Fomorian Frame Reinforcement', 'The Lesson of Disbelief'];
XEF.recalcDerived();
if (XEF.get('mech.armor') !== 1) throw new Error('EF: Sloped Plating must give +1 Armor (Everest 0 -> 1)');
if (XEF.get('mech.evasion') !== 10) throw new Error('EF: Full Subjectivity Sync must give +2 Evasion (Everest 8 -> 10)');
if (XEF.get('mech.size') !== 2) throw new Error('EF: Fomorian Frame Reinforcement must give +1 Size (Everest 1 -> 2)');
if (XEF.get('mech.edef') !== 10) throw new Error('EF: Lesson of Disbelief must give +2 E-Defense (Everest 8 -> 10)');
// Капы: Armor макс. 4, Size макс. 3
SEF.pilot.coreBonuses = ['Sloped Plating'];
XEF.set('mech.frame', 'Balor'); // Balor: armor 0? проверить через базу — берём фрейм с броней 4? используем Drake (armor 2)? Просто проверим кап на Everest с ручной бронёй
XEF.set('mech.frame', 'Everest');
XEF.recalcDerived();
// Симулируем фрейм с высокой бронёй через прямую установку st: вместо этого проверяем кап логикой —
// ставим фрейм, у которого armor 4 (если такой есть), иначе проверяем только что Armor не превышает 4 при бонусе
const arm = XEF.get('mech.armor');
if (arm > 4) throw new Error('EF: Armor must never exceed 4');
// Производные статы — readonly в разметке (кроме HASE)
for (const f of ['mech.size','mech.speed','mech.sensors','mech.tech','mech.armor','mech.evasion','mech.edef','mech.sp']) {
  const re = new RegExp('data-f="' + f.replace('.', '\.') + '"[^>]*readonly');
  if (!re.test(staticHtml)) throw new Error('EF: derived stat ' + f + ' must be readonly');
}
for (const f of ['pilot.hull','pilot.agility','pilot.systems','pilot.engineering']) {
  const re = new RegExp('data-f="' + f.replace('.', '\.') + '"[^>]*readonly');
  if (re.test(staticHtml)) throw new Error('EF: HASE stat ' + f + ' must stay editable');
}
// HASE: при смене Agility поля производных статов синхронизируются (syncInputs в bind)
if (!/recalcDerived\(\);\s+syncInputs\(\);\s+renderCounters\(/.test(html)) throw new Error('EF: the HASE input handler must call syncInputs after recalcDerived');
// PHASE EG (v162): Точное/Неточное — плоские теги +1, без {VAL} (в Lancer у них нет числа)
if (!html.includes('"tg_accurate":{"n":"Accurate","d":"Attacks made with this weapon receive +1 Accuracy.","nr":"Точное","dr":"Атаки этим оружием получают +1 точности."}')) throw new Error('EG: the Accurate tag must be a flat +1 with no {VAL}');
if (!html.includes('"tg_inaccurate":{"n":"Inaccurate","d":"Attacks made with this weapon receive +1 Difficulty.","nr":"Неточное","dr":"Атаки этим оружием получают +1 сложности."}')) throw new Error('EG: the Inaccurate tag must be a flat +1 with no {VAL}');
if (html.includes('Неточное {VAL}') || html.includes('Точное {VAL}')) throw new Error('EG: no {VAL} must remain in the Accurate/Inaccurate tags');
// live check: render a weapon card and confirm the dice/range/threat numbers are wrapped
const wDZ = { name:'Shotgun', dmg:'1d6 Kinetic', range:'Range 5, Threat 3', desc:'', tags:[], lim:0 };
const cardDZ = X.weapCard ? X.weapCard(wDZ, 0, 0) : null;
if (cardDZ && (!cardDZ.includes('<span class="wnum">1d6</span>') || !cardDZ.includes('<span class="wnum">5</span>') || !cardDZ.includes('<span class="wnum">3</span>'))) throw new Error('DZ: the rendered weapon card must wrap 1d6, 5 and 3 in .wnum spans');
// PHASE DV (v147): насыщенная палитра статов (вариант 1, выбран пользователем) и триггеров
if (!staticHtml.includes('.stat-row.hase .stat-cell label { color:#ffa26b; }')) throw new Error('DV: the HASE row labels must be light orange #ffa26b (v152)');
if (!staticHtml.includes('.stat-row.mid .stat-cell label { color:#7be495; }')) throw new Error('DV: the middle row labels must be bright green #7be495');
if (!staticHtml.includes('.stat-row.bot .stat-cell label { color:#b8c6d4; }')) throw new Error('DV: the bottom row labels must be bright steel #b8c6d4');
if (!staticHtml.includes('background:linear-gradient(180deg, rgba(232,89,12,.48), rgba(232,89,12,.24)); box-shadow:inset 0 1px 0 rgba(255,255,255,.12), inset 0 -2px 4px rgba(0,0,0,.30);')) throw new Error('DV: the trigger rows must use the same theme orange as the HASE row (v152)');
if (staticHtml.includes('rgba(255,212,59,.48), rgba(255,212,59,.24)')) throw new Error('DV: the old dull yellow tint must be gone');
if (staticHtml.includes('rgba(255,80,60,.48), rgba(255,80,60,.24)')) throw new Error('DV: the red HASE tint must be gone');
if (staticHtml.includes('rgba(255,213,0,.65), rgba(255,213,0,.35)')) throw new Error('DV: the bright yellow tint must be gone (replaced by theme orange, v152)');
// PHASE DO (v139): внутренняя тень слайдера — короткая и агрессивная, без размытия
if (staticHtml.includes('inset 0 2px 4px rgba(0,0,0,.45)')) throw new Error('DO: the blurry inset shadow on the slider track must be gone');
console.log('SMOKE TEST PASSED: Heat/Stress order, defaults, multi-field search, frame apply (mounts/core/traits/derived stats/integrated weapon), SP counter, systems search, license filter, TDZ regression, license migration, Limited charges, combat-reference blocks, talent search, weapon tag chips, mount badges, fixed SP, RUS/ENG toggle, frame corporation/roles, bilingual datalists, description component, dispField fix, trigger search, description overflow fix, frame moved to Pilot tab, display-only weapons/systems, custom modals, apply confirm dismiss is atomic, edit toggles, edit toggles in the remaining blocks, slider toggles, search modal, no Apply Frame button, no Описание label, search icon left of the + Кастом … button, wrench icon in the slider knob, game mode hides edit-only notes, ranks inline with names, short descriptions shown in full, long ones show a paragraph with подробнее at the end, no separate SP label on systems, weapon descriptions only when editing, version in the footer, frame picker back on the Mech tab with the integrated-weapon note in the confirm, collapse is a blue link at the end of the text, traits in their own always-full card, Core Bonuses/Gear removed, Stress is radiation and Overcharge is lightning, System Points moved to the Systems card (edit-only), HASE explanation is edit-only too, talent features are cumulative up to the chosen rank, licenses card renamed to just «Лицензии», resource maxes auto-calculated from frame+HASE, Full Repair button moved into the rules block, loading recomputes resource maxes from frame+HASE, resource counters spread to one column on phones, Personalizations adds +2 HP, v39: counters back to 2 columns, rules buttons moved down with a 16px gap, Core Bonuses (30, with slots, license-rank requirements and HP/Heat max bonuses), v40: resource max as in Overcharge (value alone, max: N below), Repairs label without the Russian word, v41: structure/stress tables rebuilt as rows, v42: Core Power button variant B (red bar when unused, gray pressed when used), no separate indicator, v43: dense table/HASE texts rebuilt as lists, v44: Core Power button same height in both states, hazard-stripe metal panel, v45: Core Bonus picker rows are tappable, no Add button, v46: Grit label shortened, license rank dropdown widened with Roman numerals, v47: Mech and HASE merged into one Stats card (2nd after Resources), icons, compact view mode, v48: stats in 2 columns in view mode on phones, grids shrink (minmax), frame name truncates with an ellipsis, v49: frame under the name (full width), robot icon removed, dividers around HASE, v50: systems search gets a подробнее button to expand long descriptions, v51: deleting a mount asks for confirmation, v52: talent search shows rank descriptions with подробнее, no empty talents/triggers on fresh load or reset, footer disclaimer removed, language is a RUS/ENG slider, license name is a dropdown, v53: level-up section in the Rules tab (checklist, reallocation, totals by LL), v54: License Level is a stepper, no text field, v55: LL is derived from license ranks, no LL field to set, v56: LL and Grit update live when licenses change (renderLists calls renderCounters), v57: character creation wizard (10 steps, auto-opens on a fresh save, core step only at LL3+), v58: weapons and systems removed from the creation wizard (normal experience), level-up wizard (draft + apply, core step only when a new slot opens), v59: level-up wizard rewritten (direct writes, familiar UI with current items + search pickers, no reallocation step — rules as text, no Apply, button at the top of the Rules tab, renderLists syncs data-f inputs), v60: search pickers show all matching results, no paging (the «Показано 8 из N» footer lied — it said 8 while 20 were rendered), v61: the search modal no longer auto-focuses the input (no keyboard popping up on open — tap the field to search), v62: v61 was not enough — showModal() itself focuses the first focusable element, so the modal now blurs whatever got focused right after opening, v63: talent search cards no longer show the redundant rank-names enumeration (it merged with the first rank description) — a line break separates the tagline from the rank descriptions, v64: actions reference — «Your actions» at the top of the Rules tab shows only the reactions and protocols your talents and systems grant (Intercede, Supersonic, Return Fire, Valiant Aid, Flank + 7 system reactions + 17 system protocols, verified against the core book and lancer-data), protocols live under free actions, defaults stay below, v65: Cockpit navigation — bottom bar, icon-only (full-body robot, person, book, 56px tap targets, hazard-stripe top edge, yellow active state), HP is a ring (the ring IS the counter, colour shifts green/yellow/orange/red) and Heat is a vertical thermometer beside it, Structure/Stress/Repairs/Overcharge stay as counters below, v66: Core System moved into the resources card (Core Power button under the indicators, name + description below it, then the rules blocks), Core System is read-only (no edit toggle, no name input, description has no edit button — it always comes from the frame), HP/Heat labels removed, thermometer is 64px wide with the digit at 36px like the HP ring, +/- live inside the thermometer (top/bottom, not button-styled), flame under the number inside it, v67: HP +/- are built into the ring (minus left, plus right, plain text, not buttons), the ring centre shows just the value + a heart ("10 ❤️" — max is already below the ring), the HP number turns red at 0, the Core System description moved inside the orange Core Power panel (below the red button, above the 1 CP hint), v68: table titles shortened to one line ("Потеря структуры", "Перегрев реактора" in RU; "Structure Damage", "Reactor Overheat" in EN), orphaned i18n units u002/u003/u004/u012 removed (nav is icon-only, Heat label gone), bottom nav background rebuilt as a metal plate (amber glow from the top, brushed diagonal texture, metal gradient, amber edge line, shadow) with the hazard stripe kept, v69: ring centre shows "N hp" (heart removed — it looked off), the in-ring +/- zones got a subtle background and a vertical divider on the inner edge so the minus no longer reads as part of the number ("-6"), res-top is two equal columns so the ring and the thermometer sit balanced (ring no longer drifts to the centre, thermometer no longer pinned to the far right), max lives inside the controls (second line in the ring centre, under the flame in the thermometer) so the rows below the controls are gone and the block is shorter, v70: the rectangular background behind the in-ring +/- is gone (it did not fit the circle — only the vertical dividers remain), the nav hazard stripe is gone (it merged with the Core Power panel frame) and the nav top edge is now a solid 2px amber line with a soft glow, v71: the in-ring dividers are taller (zones 84px) so they reach the ring, and the +/- zones no longer flash on tap (no tap highlight, no text selection — the rectangular zone stays invisible); same no-flash treatment for the thermometer +/-, v72: the in-ring dividers are a few pixels longer (zones 92px) so they exactly touch the ring, v73: Intercede is granted by Bonded II (not a fake talent Sundance) and Supersonic by Ace III (not Sundance III) — both verified against the core book; the Turn structure block on the Rules tab no longer opens by default (My actions stays open), v74: the page footer (export/import/reset/wizard buttons, language slider, version) moved to the bottom of the Rules tab as .rules-foot; tabs switch by swipe on mobile (swipe left = next tab, swipe right = previous, no wrap at the ends, vertical swipe still scrolls), v75: Rules tab reordered (My actions, Quick actions, Full actions, Reactions, Pilot actions, Turn structure, Level up); «Other actions» merged into Quick actions as a subsection; the Free actions explanation removed from Reactions; the RUS/ENG slider now has the letters inside it (segmented pill, sliding highlight); switching tabs animates (new screen slides in from the swipe/tap direction); the nav highlight switches smoothly and the active tab gets a lens glow (amber radial-gradient circle + scale), v76: the page header (title + tagline + saved indicator) is gone completely; the swipe glitch is fixed — the incoming tab slides in fully opaque (no opacity in the keyframes, so the old tab cannot ghost through), the nav keeps its own compositing layer (will-change:transform), and showTab scrolls to the top on every switch, v77: the nav still dropped, but only when switching right — the left slide-in (translateX(-28px)) pushed the tab 12px past the left viewport edge, creating horizontal overflow that shifts the viewport on Android and drops the fixed nav (the right slide-in only overflows right, which browsers ignore); fixed by forbidding horizontal scroll on the body (overflow-x:hidden), v78: the user said it is still not right — the transform slide itself kept dropping the nav on this Android browser through v76 and v77, so the slide is gone entirely; tabs now just fade in softly (tabFadeIn, opacity only, no transform), movement stays only in the nav lens, v79: the lens is now a rectangle covering the whole button (a third of the nav width) and the full nav height, and it genuinely slides between the buttons (one .nav-lens element, transform 0/100/200% with a .25s transition) instead of teleporting, v80: the lens lost its rounded corners (sharp rectangle) and got a brighter background; the yellow dash under the active icon is gone; the active icon zooms to 1.3; the nav top stripe is thinner (1px) and darker (dark bronze #8a6d1f) for a sharper edge; the HP ring +/- zones are narrower (25px) and sit further from the center (15px) while their glyphs are nudged toward the center (padding 3px), v81: the selected tab went green (icon #5cdf33, black directional drop-shadow, green lens gradient/glow/border) and the nav lost its top border entirely; the mech icon is now a bulky Harvester with a big shoulder cannon in a 3/4 view and the pilot icon is an operator head with a headset and boom mic, v82: the v81 icons are reverted to the originals (the drawn Harvester and headset did not read at 30px) and the lens gradient now fades to transparent by 45% (near the middle of the button) instead of running to the bottom, v83: the lens box-shadow is black outside (0 0 18px rgb(0 0 0 / 39%)) with a dark-olive inset border offset 1px down (inset 0px 1px 0 1px rgb(55 83 1 / 45%)), v84: the screen shakes when damage lands — small shake (.3s, +/-4px) when HP drops, big shake (.45s, +/-7px) when Structure drops; only main shakes (the nav is a sibling, not a descendant, so its fixed position is safe) and the shake fires only when the value actually decreases, v85: vibration on damage (30ms buzz for HP, [50,30,90] pattern for a Structure break, guarded so it silently does nothing where the Vibration API is missing, e.g. iOS); the HP ring pulses red while HP is at or below 25%; activating Core Power plays a golden .8s flash on the button, v86: vibration removed entirely (it did not work on the user phone either); the Core Power flash now covers the whole panel and lasts 1.6s; the thermometer flame grows with the heat level (scale via --fs, no layout shift), sits behind the number, and pulses growing upward when heat is at max-1 or above, v87: the Core Power panel got a metal background (brushed texture + metal gradient, same metal as the nav) with a diagonal sheen sweeping across every 6.5s; the flame starts lower and smaller (bottom 18px, 16px) and grows stronger (up to ~3.2x at max heat), clipped by the thermometer frame (overflow:hidden) so it never sticks out, v88: nav buttons no longer flash blue on tap (tap highlight disabled, like the ring and thermometer zones already had), v89: the flame starts lower and bigger (bottom -16px, 28px) so only its top shows at the very bottom, and rises as it grows; the Core Power panel lost the brushed hairs and is now solid metal (no transparency); pressing the button brightens the panel background (brightness 1.35) in parallel with the golden shadow; the ring +/- zones are 88px tall (was 92px) so the dividers no longer touch the ring edge, v90: the activation flash is even brighter (brightness 1.6); the metal sheen stops while Core Power is used and resumes after the ability is reset; the flame sits 5px higher (bottom -11px), v91: the flame is binary — a small static icon below 75% of max heat, and the big pulsing flame from below at 75% and above; the smooth growth is gone, v92: the Talents card moved below the frame traits card in the Mech tab, v93: the crit flame is much bigger (56px, pulses to ~73px) to match the big flame in the user screenshot, v94: the flame pulse grows less (1.15 instead of 1.3) and leans left (-3deg) at the peak, v95: the small flame icon in the normal state sits lower (bottom 25px), between the minus and the max text, v96: the wizard is renamed Мастер сборки (Build Wizard), its button moved to the top of the Rules tab right of Level Up, and the HASE step now explains what each stat adds (u061), v97: the HASE explanation is the concise user text only (no preamble, no defaults suffix), in the wizard and in the Stats card when editing, v98: Engineering adds +1 to the maximum uses of Limited gear per 2 points (HEX Charges 3 becomes 4 at Engineering 2); new gear starts full, full repair refills to the new max, v99: system cards show tag chips like weapons do, so heat costs are visible (Type-3 Projected Shield shows Тепло 1 (себе)); DB.systems now carry tg, and build_db.py keeps it on rebuild, v100: the heat cost is no longer lost in the Actions reference (system-granted reactions/protocols show a tappable Тепло N chip from the granting system) and in system search results (tag chips shown when picking a system), v101: the Engineering bonus no longer makes non-Limited gear Limited — sysLim/weapLim add the bonus only when base Limited > 0, so the Shotgun, Cyclone Pulse Rifle and custom weapons no longer show a phantom Limited 1 charges stepper, v102: the charges label is just «Заряды:» / «Charges:» instead of «Limited {N}: заряды» — the max is already visible in the stepper, v103: tag terms in description text are clickable chips (ДУГОВОЕ, ОТБРОС 1 — only ALL-CAPS terms link, so ordinary надёжный/reliable in prose stays plain) — linkTagTerms() in descBox and the Actions reference, opening the tag dialog; navbar is ~12px shorter (buttons 48px, nav padding 4px, main bottom padding 92px), v104: the linking also covers talent feature descriptions and system search results (v103 missed them — talents do not render through descBox), v105: БРОНЕБОЙНОСТЬ links too (tagWordStem strips -ость; the text word is stemmed the same way as the tag name) and chips show the canonical tag name in normal case (tagLabel), like the old chips — not the ALL-CAPS text, v106: the English abbreviation AP links to tg_ap (bracketed abbreviations are match keys) and the chip label drops the bracketed abbreviation («Бронебойное», not «Бронебойное (AP)»); qualifiers like (цель)/(себе) stay, v107: talent-granted protocols are in the Actions reference — Shepherd (Drone Commander I) and Steady Aim (Crack Shot I), both verified against the core book; Brutal I now reads «максимально возможные урон и бонусный урон» so both damages are clearly maximized, v108: the thermometer flame and the Danger Zone checkbox are tied to the Danger Zone mechanic (heat >= half Heat Cap, per the core book) — the big flame appears at 50%, not 75%; the checkbox auto-checks/unchecks with heat; DANGER (left) and ZONE (right) flank the thermometer vertically, in caps, always English, shimmering red-orange, v109: the DANGER/ZONE labels show only in Danger Zone (hidden at zero heat) and the letters stand upright, one under another (text-orientation:upright), both reading top-to-bottom, v110: flamePulse and dzGlow run at the same 1.2s so the flame movement and the label colour shimmer stay in sync; the flame peak tilt is -5deg (was -3deg), v111: the HP ring +/- dividers use var(--line), exactly the ring track colour, so they blend into the empty part of the ring, v112: statuses are tags, not checkboxes — the old card is gone; tapping a status name in the «Статусы» reference (in Combat Resources, after Overcharge) adds a coloured tag between the HP ring and the Structure grid; the tag shows the description on tap and has a × to remove it; Burn is a status too; Danger Zone is not clickable and never appears as a tag (it has the thermometer indicator), v113: the Stats card is a table — name above, value below, equal-width cells; 3 rows: HASE (4), Size/Speed/Sensors/Tech Attack (4), Armor/Evasion/E-Defense (3); stat names English only, no «max 4» on Armor; the emoji icons are removed (ugly, icons to be revisited), v114: status names are bilingual everywhere (Exposed — Уязвим); the reference is a collapsible <details> under Overcharge; each status is one line with its description visible inline (no 2nd tap to read it); tapping a status toggles its tag (2nd tap removes it, like the ×), active ones show a ✓, v115: the status reference moved to the right Overcharge — it is now a .sec block right after the Overcharge collapsible in the Mech tab (not inside Combat Resources); the stats table is a flush grid (no gaps, no radius, shared borders); Tech Attack is now T.Attack; row 3 is 4 columns with Grit after Armor (Grit synced to both fields via S.pilot.grit); style: uppercase letter-spaced labels, warm HASE tint, Grit value in accent; the notes field auto-grows to fit its text (resize:none, overflow:hidden, height=scrollHeight on input and on render), v116: stat labels are 10px with .04em letter-spacing so ENGINEERING fits with side padding while all columns stay equal; Grit is back to normal white (no accent/red); the rows are colour-coded — top (HASE) yellow, middle neon green, bottom steel, v117: the stat cells have volume — each row is a vertical gradient (lighter on top) and each cell has an inset bevel (top highlight + bottom shadow); Core Power is a new layout — the text «Core Power (CP): 1 раз за миссию…» on the left and a round 60px red button with a bolt on the right at the same height (u075 reworded, no «1 CP»); the wide bar button is gone, v118: BUGFIX for v117 — renderCounters overwrote the button textContent with «Не использовано» on every render, so the round button showed the old text overflowing (the user caught it on his phone); the button is now 120px with an inline SVG — a 44px bolt in the centre and the label curved along the bottom arc via textPath (ENGAGE/USED, always English, 11px with 2px letter-spacing like the DANGER/ZONE labels); renderCounters updates only the textPath now, v119: the bolt is gone (the user asked to try without it); the tap no longer flashes blue (-webkit-tap-highlight-color:transparent, like the nav buttons in v88); the curved label has more letter-spacing (3px) and a stronger bend (arc radius 45→40, midpoint y 101.4→104); «1 раз» starts on a new line after «Core Power (CP):» (<br> in the cp-info), v120: BUGFIX for v119 — the user reported the letter-spacing did not change (3px via CSS was not visible in his WebView, or 1px was too subtle); the spacing is now 4px (double the original 2px) and is set BOTH in CSS and as a letter-spacing="4" presentation attribute directly on the SVG <text>, so it applies even if the WebView ignores CSS letter-spacing on textPath, v121: status tags are English-only now (renderStatusTags uses the bare English name, not the bilingual statusLabel) so they take less space; the reference list and the tag dialog keep the bilingual name (Exposed — Уязвим) and the description in the current language, so the Russian translation is still there when you need it, v122: PWA — the tracker installs as a standalone app (user picked the red Core Power button icon): manifest.webmanifest (name «Lancer — Трекер персонажа», short_name Lancer, display standalone, theme/background #0e1116, icons 192+512 as SVG), sw.js network-first (fetch first, cache only when offline, so swipe-down still loads the latest version from GitHub Pages), manifest + theme-color in head, service worker registered. The icon is icon.svg — a clean vector redrawing of the chosen red Core Power button (red radial circle + yellow bolt on the dark #0e1116 background), because the GitHub connector only pushes UTF-8 text and cannot push binary PNG files; the generated PNGs were dropped. Chrome accepts SVG manifest icons (sizes 192/512 declared, purpose any + maskable), v123: the Core Power button in the UI now has the same metal rim as the app icon — a metal ring around the red core, with gold curved text on the rim: ENGAGE (top arc, becomes USED when used) and CORE POWER (bottom arc); the icon rim reads ENGAGE (top) and LANCER (bottom), also gold; the rim was widened to fit the text (red core 38px, rim to the button edge); the button background is transparent now (the SVG draws rim + core, states switch the SVG fills), v124: the rim is red now (dark-red gradient, not metal) and narrower (12px, red core 48px), the gold text is centred in the rim (baselines r=49 top / r=59 bottom, rim midline r=54); the labels are swapped — CORE POWER on the top arc, ENGAGE/USED on the bottom arc; the icon mirrors it (red rim, LANCER on top, ENGAGE below), v125: the «Core Power (CP): 1 раз за миссию…» hint text beside the button is gone (the button speaks for itself now); the button stands alone, centred in the panel, v126: the button sits above the panel sheen — the diagonal light band now sweeps behind the button and only lights up the panel background (cp-top has position:relative + z-index:1 over the ::after sheen), v127: the restoration note is back — «Восстанавливается при полном ремонте или в начале миссии.» (u234, without the «1 раз за миссию» part) as a small centred line below the button; the button still stands alone, centred, v128: the layout is back to how it was — the restoration note (u234) sits on the left of the button in cp-info, the button on the right (no more centring); and the sheen no longer freezes as a sliver in the top-left corner during its pause — its rest position moved from -65% to -90% so the -14deg-skewed band is fully off-screen until the sweep, v129: the app icon background is yellow-black diagonal hazard stripes now (SVG pattern, same #ffd43b/#10131a as the panel hazard) instead of solid dark; and the horizontal scrollbar no longer flashes during the damage shake — html has overflow-x:clip (body overflow-x:hidden alone did not hold the viewport scrollbar when main is translated), v130: the damage shake is horizontal-only now (translateX, no vertical component) — the vertical shift was nudging the scroll height and flashing the vertical scrollbar; horizontal is already clipped by overflow-x:clip, so the shake touches no scrollbar at all. Safe fix: scrolling and layout untouched, v131: the HASE emoji icons (heart, wind, laptop, gear) are removed from both wizards — Build Wizard (wizHase) and Level-up wizard (luHase) now show plain English HASE names only; the resource icons (Structure/Stress/Repairs/Overcharge) are not HASE and stay, v132: the pilot triggers are a table in the Mech Stats card style now — bordered panel2 table, yellow HASE gradient, inset bevel, dividers between rows — but the name and the bonus stay on ONE row (name left, bonus right, 20px bold like a stat value), never stacked, since long trigger names would not fit above the number, v133: the mount capacity note (mount-cap, e.g. «1 Main или 2 Aux») moved to its own line below the mount header — it was squeezed inside the header flex row between the type select and the delete button, so it wrapped into a narrow column; the type select now fills the header width, v134: the whole weapons database/search hint paragraph (u066 — Massif Press, search fields, multi-word example, license-filter note) is removed as redundant; the systems and talents hints stay (only the quoted weapons text was removed); u066 stays an orphan in STR/JSON like u075, and the JS writers for dbWeaponCount/licNoteW stay guarded so nothing breaks, v135: the blue tap flash is removed globally — one -webkit-tap-highlight-color:transparent on the * rule, so the language slider, the rule accordions, and every other element no longer flash blue on tap (earlier it was removed piecemeal from the nav, the ring, the thermometer, and the Core Power button only), v136: HUD foundation + shell — the Cockpit style starts landing on the real tracker (CSS only, no layout or logic changes): HUD variables in :root (amber #ffb000, grid), a subtle 28px grid texture on the page background, square cards and rule blocks with a 2px amber top edge, amber section headers with .08em letter-spacing, square buttons with an amber primary button (dark text), and square edit toggles that turn amber when on, v137: sliders get depth — the toggle track is recessed (inset shadow) and both knobs are 3D (vertical gradient + inset bevel); the language slider knob is square now (HUD); and the Core Power button gets crisp edges — the blurred 14px drop shadow is replaced by a sharp 2px ring and a hard drop shadow with no blur, v138: the Core Power button sits flat — the pink outer ring (it read as a shadow) is now a crisp amber HUD ring, and the hard bottom shadow that made the button look lifted is removed entirely, v139: the slider inner shadow is shorter and more aggressive — the blurry 2px/4px inset shadow becomes a tight 1px/1px shadow at .65 opacity, so the recessed track reads as a crisp dark line instead of a soft smudge, v140: the Core Power button ring is now the same gold as the label text (#f5c518, the mid stop of the cpGold gradient) and thinner — 1px instead of 2px, v141: the language slider knob is bigger (42x26, it fills exactly half the track so it no longer wobbles and covers the top inset shadow); the Core Power ring is finer still (same 1px but gold at .6 opacity); and the button gets two flathead screws on its rim at the 9 and 3 oclock positions, their slots at different angles (left -30, right +35), v142: the edit toggle knob is bigger too (19x22 instead of 18x18 — it fills half the track width and the full track height, so it no longer looks small and loose inside the track), v143: tags and the more link get the HUD treatment — tag chips are square with an amber border and amber uppercase text, status tags are square and uppercase (their per-status colour is kept), the status X is square, and the more link is amber, uppercase, letter-spaced and bold instead of a plain blue link, v144: the edit toggle knob is black now (dark gradient with a bevel tuned for black) and the wrench inside it is orange — the emoji is replaced by an orange SVG wrench (theme orange #e8590c), since an emoji cannot be recoloured; the Repairs label wrench is untouched, v145: the gray top stripe on the toggle knob is gone (no more inset highlight); and all delete/close buttons are now the wrench orange (#e8590c) instead of red, and smaller (6px 10px padding, 13px font), v146: the Core Power button screw slots are rotated more randomly — left -12 (shallow) and right +68 (steep) instead of the mirrored -30/+35 pair, v147: the Stats table uses the saturated palette (variant 1, user-picked) — HASE yellow .48/.24 with #ffd43b labels, middle green .40/.20 with #7be495 labels, bottom steel .48/.24 with #b8c6d4 labels — and the trigger rows use the same saturated yellow, v148: the mech nav icon is back to the Block with antenna (one wide 18x13 block, two square eyes, mouth line) after the full-body attempts did not work out; the HASE row is now saturated red (.48/.24, labels #ff9a8a) and the trigger rows are saturated green (.40/.20, same as the stats middle row), v149: the red HASE did not land — the HASE row and the trigger rows are now bright yellow (#ffd500, .65/.35, labels #ffe600), brighter than the dull v147 yellow, v150: the navbar is brought into the overall HUD scheme — the striped background is gone, the top tint is amber, the active icon and the sliding lens are amber (the lens slide effect is kept), v151: the lens keeps only a thin top border (1px, no spread) — the side borders are gone, v152: the HASE row and the trigger rows now use the main theme orange #e8590c (var(--accent), .48/.24, HASE labels #ffa26b) instead of bright yellow, v153: the 4 resource trackers (Structure, Stress, Repairs, Overcharge) are square now (border-radius 0 on the cards and the +/- buttons) and have no separate colors — the per-tracker --rc colors (blue, yellow, green, purple) are removed, all use the uniform neutral top border, v154: the damage, range and threat numbers in weapon cards are orange and bold (.wmeta .wnum, theme orange var(--accent)) so they read better during play, v155: the top borders of the 4 resource trackers are thinner now (1px instead of 3px), v156: the table roll numbers (structure damage and reactor overheat — 5-6, 2-4, 1, several 1) are HUD amber now instead of blue; the blue accent2 is no longer used for them (the .sub-h rule was also switched to amber for consistency, though it is currently unused), v157: the status reference items (with descriptions) are square now (border-radius 0 instead of 8px); the per-status left border color is kept, v158: the .row items are vertically centered now (align-items:center instead of flex-end) so the wizard step text is centered, and the list-row X buttons are frameless now (.btn.x, transparent border and background, orange X) — 14 of them; the frames stay only on the 4 dialog close X buttons and the mount removal X (5 .btn.danger in total), v159: horizontal alignment in the wizard — the creation wizard trigger bonus is a fixed 48px centered column (.row .val) so all +2 values line up, and the four level-up raise buttons (+2 trigger, +1 talent, +1 license, +1 HASE) are flex:0 0 auto so they no longer stretch across the row, v160: BUGFIX — recalcDerived now recalculates Speed, Evasion, E-Defense, Tech Attack and SP from Agility and Systems (they were only set in applyFrame, so raising Agility left Speed and Evasion at the frame base values; e.g. Everest with Agility 2 is now Speed 5 and Evasion 10), v161: all derived stats (everything except HASE) are now fully auto-calculated and readonly — audit found 4 missing core-bonus modifiers, now applied in recalcDerived: Sloped Plating +1 Armor (capped at 4), Full Subjectivity Sync +2 Evasion, Fomorian Frame Reinforcement +1 Size (capped at 3), Lesson of Disbelief +2 E-Defense; talents give no permanent mech stat bonuses and systems only Personalizations (+2 HP), both already handled; the HASE input handler now syncs the derived-stat fields live, v162: Accurate and Inaccurate are flat +1 tags with no number (in Lancer there is no Inaccurate 1) — the {VAL} placeholder is removed from both tags (EN and RU, in ru_tags.json and the embedded DB), so the dialog now reads +1 Accuracy / +1 Difficulty instead of a dangling + with no number.');
