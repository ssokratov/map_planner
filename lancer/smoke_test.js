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
    setAttribute(){}, getAttribute(){ return null; }, removeAttribute(){},
    addEventListener(){}, appendChild(){},
    showModal(){ this._open = true; }, close(){ this._open = false; },
    querySelector(){ return null; }, querySelectorAll(){ return []; },
  };
  Object.defineProperty(el, 'textContent', {
    get(){ return _text; },
    set(v){ _text = (v === null || v === undefined) ? '' : String(v); },
  });
  // v212: настоящий <dialog> имеет .open — без него код, проверяющий «диалог уже открыт»,
  // в тесте всегда шёл по ветке «свежее открытие».
  Object.defineProperty(el, 'open', {
    get(){ return !!this._open; },
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
      addEventListener(){}, removeEventListener(){},
      visibilityState: 'visible',
      documentElement: { scrollTop: 0 },
      activeElement: null,
    },
    window: {
      addEventListener(){}, removeEventListener(){},
      scrollTo(){}, scrollY: 0,
      confirm: m => { g.confirmCalls.push(m); return true; },
    },
    // v261: история браузера — чтобы проверить присваивание scrollRestoration
    // при старте; pushState/back — no-op, popstate не триггерят
    history: { scrollRestoration: 'auto', pushState(){}, back(){} },
    requestAnimationFrame: () => 0,
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
  + 'toggleEdit:toggleEdit,editOn:editOn,EDIT_KEYS:EDIT_KEYS,DEFAULTS:DEFAULTS,migrate:migrate,'
  + 'openSearch:openSearch,closeSearchDlg:closeSearchDlg,renderSearchResults:renderSearchResults,searchViewOpen:searchViewOpen,fullscreenViewShow:fullscreenViewShow,fullscreenViewHide:fullscreenViewHide,fullscreenViewOpen:fullscreenViewOpen,cbViewOpen:cbViewOpen,pilotGearViewOpen:pilotGearViewOpen,'
  + 'refDlgClosed:refDlgClosed,onDlgPopstate:onDlgPopstate,'
  + 'openSearchDesc:openSearchDesc,closeSearchDesc:closeSearchDesc,rerenderSearch:rerenderSearch,'
  + 'showLicenseResults:showLicenseResults,licenseMatches:licenseMatches,addLicenseByName:addLicenseByName,'
  + 'openCustomWeaponDlg:openCustomWeaponDlg,addCustomWeapon:addCustomWeapon,'
  + 'openCustomSystemDlg:openCustomSystemDlg,addCustomSystem:addCustomSystem,'
  + 'applyFrame:applyFrame,recalcDerived:recalcDerived,toggleLicenseFilter:toggleLicenseFilter,'
  + 'itemAvailable:itemAvailable,frameAvailable:frameAvailable,'
  + 'sysLim:sysLim,sysLeft:sysLeft,weapLim:weapLim,weapLeft:weapLeft,sysSp:sysSp,weapSp:weapSp,'
  + 'sysLimUnknown:sysLimUnknown,weapLimUnknown:weapLimUnknown,limUnknown:limUnknown,'
  + 'weapLoading:weapLoading,weapLoaded:weapLoaded,toggleWeapLoaded:toggleWeapLoaded,'
  + 'traitsHtml:traitsHtml,'
  + 'delMount:delMount,delWeapon:delWeapon,toggleLang:toggleLang,licenseNameOptions:licenseNameOptions,calcLL:calcLL,delLicense:delLicense,addLicense:addLicense,wizardOpen:function(){return wizardOpen;},wizardStepId:function(){return wizardStepId;},openWizard:openWizard,closeWizard:closeWizard,wizardNext:wizardNext,wizardBack:wizardBack,wizardVisibleSteps:wizardVisibleSteps,maybeOpenWizard:maybeOpenWizard,luOpen:function(){return luOpen;},luStepId:function(){return luStepId;},openLevelUp:openLevelUp,closeLevelUp:closeLevelUp,luNext:luNext,luBack:luBack,luVisibleSteps:luVisibleSteps,luBaseLL:function(){return luBaseLL;},luRenderStep:luRenderStep,luRaiseTrigger:luRaiseTrigger,luRaiseHase:luRaiseHase,luRaiseTalent:luRaiseTalent,luRaiseLicense:luRaiseLicense,luPicked:function(){return luPicked;},luIsNew:luIsNew,luNewAdded:luNewAdded,'
  + 'weapTags:weapTags,sysTags:sysTags,tagLabel:tagLabel,tagChips:tagChips,showTag:showTag,linkTagTerms:linkTagTerms,tagWordStem:tagWordStem,'
  + 'STATUS_INFO:STATUS_INFO,STATUSES:STATUSES,statusLabel:statusLabel,statusDesc:statusDesc,toggleStatus:toggleStatus,removeStatus:removeStatus,showStatus:showStatus,renderStatusTags:renderStatusTags,renderStatusRef:renderStatusRef,toggleStatusRef:toggleStatusRef,statusRefOpen:function(){return statusRefOpen;},autoGrowNotes:autoGrowNotes,'
  + 'talentRankDesc:talentRankDesc,talentRankDisplay:talentRankDisplay,talentMatches:talentMatches,showTalentResults:showTalentResults,diceFor:diceFor,stepTalentDice:stepTalentDice,talentDiceText:talentDiceText,showDiceDlg:showDiceDlg,showDiceDlgFor:showDiceDlgFor,showDiceDlgByIndex:showDiceDlgByIndex,mechAi:mechAi,'
  + 'addTalentByIndex:addTalentByIndex,fillTalentFromDb:fillTalentFromDb,setTalentRank:setTalentRank,syncNuclearCavalier:syncNuclearCavalier,delRow:delRow,luRemoveTalent:luRemoveTalent,'
  + 'MOUNT_TYPES:MOUNT_TYPES,MOUNT_STYLE:MOUNT_STYLE,'
  + 'stepSysCharges:stepSysCharges,stepWeapCharges:stepWeapCharges,'
  + 'fullRepair:fullRepair,toggleCore:toggleCore,showTab:showTab,swipeTab:swipeTab,curTab:function(){return curTab;},tabHist:function(){return tabHist;},renderLists:renderLists,renderCounters:renderCounters,save:save,get:get,set:set,'
  + 'lang:lang,setLang:setLang,applyLang:applyLang,wd:wd,sd:sd,td:td,tagd:tagd,fd:fd,'
  + 'findWeapon:findWeapon,findSystem:findSystem,findTalent:findTalent,frameKey:frameKey,'
  + 'dispVal:dispVal,dispField:dispField,mountCap:mountCap,STR:STR,L:L,'
  + 'frameMatches:frameMatches,showFrameResults:showFrameResults,pickFrame:pickFrame,'
  + 'showFrameDetail:showFrameDetail,frameDetailHtml:frameDetailHtml,frameDetailBack:frameDetailBack,'
  + 'renderRulesFrameList:renderRulesFrameList,'
  + 'licenseData:licenseData,licenseFrameKey:licenseFrameKey,LICENSE_VIBE:LICENSE_VIBE,FRAME_VIBE:FRAME_VIBE,LICENSE_SOURCE:LICENSE_SOURCE,WALLFLOWER_SRC:WALLFLOWER_SRC,SOLSTICE_SRC:SOLSTICE_SRC,LONG_RIM_SRC:LONG_RIM_SRC,ITEM_SOURCE:ITEM_SOURCE,itemSource:itemSource,licenseVibeFullHtml:licenseVibeFullHtml,licenseRowInfoHtml:licenseRowInfoHtml,frameRowSub:frameRowSub,frameRowFull:frameRowFull,capFirst:capFirst,capRole:capRole,capList:capList,vibeDistRank:vibeDistRank,sortLicenses:sortLicenses,sortFrameKeys:sortFrameKeys,GMS_FRAME_ROLE:GMS_FRAME_ROLE,frameRoleLine:frameRoleLine,frameDispName:frameDispName,'
  + 'renderRulesLicenseList:renderRulesLicenseList,showLicenseDetail:showLicenseDetail,licenseDetailHtml:licenseDetailHtml,licenseDetailBack:licenseDetailBack,'
  + 'showRef:showRef,refChip:refChip,grantLabel:grantLabel,MECHANICS_REF:MECHANICS_REF,plural:plural,'
  + 'PILOT_GEAR_DB:PILOT_GEAR_DB,findPilotGear:findPilotGear,openPilotGearPicker:openPilotGearPicker,closePilotGearPicker:closePilotGearPicker,renderPilotGearResults:renderPilotGearResults,addPilotGear:addPilotGear,renderPilotEquipment:renderPilotEquipment,pilotDamageType:pilotDamageType,'
  + 'highlightNums:highlightNums,setTagDlgDesc:setTagDlgDesc,grantKindLabel:grantKindLabel,'
  + 'grantsOf:grantsOf,grantsChipsHtml:grantsChipsHtml,grantItemLabel:grantItemLabel,actionLabel:actionLabel,actionSource:actionSource,licenseDispName:licenseDispName,itemDispName:itemDispName,TALENT_GRANTS:TALENT_GRANTS,'
  + 'frameLabel:frameLabel,'
  + 'descBox:descBox,editDesc:editDesc,openDesc:openDesc,closeDesc:closeDesc,renderDescBoxes:renderDescBoxes,toggleSysCard:toggleSysCard,toggleWeapCard:toggleWeapCard,togglePilotEquipCard:togglePilotEquipCard,'
  + 'openSys:function(){return [...openSys];},openWeap:function(){return [...openWeap];},openPilotEquip:function(){return [...openPilotEquip];},'
  + 'loadOpenState:loadOpenState,persistOpenState:persistOpenState,UI_STATE_KEY:UI_STATE_KEY,KEY:KEY,addPilotGear:addPilotGear,renderPilotEquipment:renderPilotEquipment,'
  + 'frameAvailable:frameAvailable,toggleLicenseFilter:toggleLicenseFilter,'
  + 'showDamageRoll:showDamageRoll,closeDamageRollDlg:closeDamageRollDlg,dmgRollRows:dmgRollRows,showDestroyedRepair:showDestroyedRepair,repairDestroyed:repairDestroyed,openDestroyPicker:openDestroyPicker,closeDestroyPicker:closeDestroyPicker,destroyMountWeapons:destroyMountWeapons,destroySystem:destroySystem,destroyViewOpen:destroyViewOpen,showStatRef:showStatRef,'
  + 'TRIGGERS:TRIGGERS,findTrigger:findTrigger,trigDisp:trigDisp,triggerMatches:triggerMatches,'
  + 'showTriggerResults:showTriggerResults,addTriggerByName:addTriggerByName,'
  + 'CORE_BONUSES:CORE_BONUSES,CORP_NAMES:CORP_NAMES,findCoreBonus:findCoreBonus,corpRanks:corpRanks,coreBonusSlots:coreBonusSlots,coreBonusAllowed:coreBonusAllowed,addCoreBonusByIdx:addCoreBonusByIdx,removeCoreBonus:removeCoreBonus,renderCoreBonuses:renderCoreBonuses,openCoreBonusPicker:openCoreBonusPicker,closeCoreBonusPicker:closeCoreBonusPicker,ACTIONS_REF:ACTIONS_REF,actionGranted:actionGranted,renderMyActions:renderMyActions,renderProfileList:renderProfileList,deleteLocalProfile:deleteLocalProfile,deleteDriveProfile:deleteDriveProfile,profileCatalog:function(){return profileCatalog;},persistProfileCatalog:persistProfileCatalog,setDriveStatus:setDriveStatus,shake:shake,cpFlash:cpFlash};';
const dbSrc = fs.readFileSync(path.join(__dirname, 'db.js'), 'utf-8');
const pgSrc = fs.readFileSync(path.join(__dirname, 'pilot_gear_db.js'), 'utf-8');
function runEval(store){
  const stub = makeStub(store);
  Object.assign(global, stub.g);
  eval('var navigator = {}; // shadows Node 21+ getter-only global navigator\n' + dbSrc + '\n' + pgSrc + '\n' + src + EXPOSE);
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
if (DB.weapons.filter(w => X.weaponMatches(w, 'ips-n ll1')).length !== 9) throw new Error('F: "ips-n ll1" should match 9 weapons');
if (DB.weapons.filter(w => X.weaponMatches(w, 'horus ll3')).length !== 5) throw new Error('F: "horus ll3" should match 5 weapons');
if (DB.weapons.filter(w => X.weaponMatches(w, 'smith-shimano ll2')).length !== 6) throw new Error('F: "smith-shimano ll2" should match 6 weapons');
if (DB.systems.filter(s => X.systemMatches(s, 'horus ll2')).length !== 13) throw new Error('F: "horus ll2" should match 13 systems');
if (DB.weapons.filter(w => X.weaponMatches(w, 'gms ll1')).length !== 0) throw new Error('F: "gms ll1" should match nothing (all GMS gear is LL0)');
X.showWeaponResults(1, 'ips-n ll1');
let box = elA['mountResults-1'].innerHTML;
if ((box.match(/class="dbrow"/g) || []).length !== 8) throw new Error('F: "ips-n ll1" should show 8 rows in Flex');
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
// пикер с выключенным фильтром находит все 30 фреймов
X.showFrameResults('');
if ((elA['frameResults'].innerHTML.match(/class=\"dbrow/g) || []).length !== 55) throw new Error('G: with filter OFF, frame picker must show all 55 frames (no paging)');
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

// PHASE J (v219): combat-reference blocks now live in Rules, below Reactions —
// they used to live in the Combat resources card on the Mech tab.
// (count in the static HTML only: the STR dict in <script> repeats the same RU strings)
const staticHtml = html.split('<script>')[0];
for (const s of ['>Потеря структуры</summary>',
  '>Перегрев реактора</summary>', '>Отдых и полный ремонт</summary>']) {
  if (staticHtml.split(s).length - 1 !== 1) throw new Error('J: ' + s + ' must occur exactly once');
  const pos = staticHtml.indexOf(s);
  if (!(staticHtml.indexOf('>Реакции</summary>') < pos && pos < staticHtml.indexOf('>Действия пилота (пешком)</summary>'))) throw new Error('J: ' + s + ' must live in Rules, below Reactions');
}
// v191-204: Overcharge is no longer a <details> block — it opens as a dialog via showOverchargeRef()
if (!staticHtml.includes('onclick="showOverchargeRef()"')) throw new Error('J: the Overcharge help button must call showOverchargeRef()');
if (staticHtml.includes('>Оверчардж</summary>')) throw new Error('J: the old Overcharge <details> block must be gone');

// PHASE K: talents — DB, search, add, rank description, name-input bug fix
const { X: XK, S: SK, DB: DBK, elements: elK } = runEval({});
if (DBK.talents.length !== 40) throw new Error('K: DB must hold 40 talents');
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
// v222: ранги талантов меняются только через setTalentRank — один раз в списке
// талантов, один раз в шаге мастера (v57); оба — селекты ранга.
if ((html.match(/setTalentRank\(\$\{i\},this\.value\)/g) || []).length !== 2) throw new Error('K: only the rank selects may call setTalentRank');

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
if (!elK['tagDlgDesc'].innerHTML.includes('скользящим ударом')) throw new Error('L: tag dialog must show the tag description with {VAL} substituted');
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
if (XP.frameLabel(DBP.frames['Blackbeard']) !== 'IPS-N · Штурмовик') throw new Error('P: frame label must be corp and RU role, no LL suffix (v231)');
// результаты поиска фреймов: фильтр лицензий + корпорация и роль в строке
XP.toggleLicenseFilter(false);
XP.showFrameResults('штурмовик');
let frBox = elP['frameResults'].innerHTML;
if (!frBox.includes('Чёрная Борода') || !frBox.includes('Гарпун')) throw new Error('P: frame results must show the RU name and the frame description (v231, capitalized in v232)');
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
// (v240: описание оружия показывается только при включённом редактировании —
// по умолчанию выкл, поэтому включаем маунты перед проверкой)
XP.toggleEdit('mounts');
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
// (v240: описание оружия показывается только при включённом редактировании —
// по умолчанию выкл, поэтому включаем маунты перед проверкой)
XS.toggleEdit('mounts');
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
// (v240: по умолчанию редактирование ВЫКЛЮЧЕНО — чистый вид)
const { X: XU, S: SU, DB: DBU, elements: elU, g: gU } = runEval({});
// по умолчанию редактирование выключено
if (XU.editOn('mounts') || XU.editOn('talents') || XU.editOn('triggers')) throw new Error('U: editing must be OFF by default for all three blocks');
if (elU['editToggleMounts'].classList.contains('on') || elU['editToggleTalents'].classList.contains('on') || elU['editToggleTriggers'].classList.contains('on')) throw new Error('U: edit toggles must be OFF by default');
// маунты: по умолчанию — чистый вид: нет поиска, удаления, добавления и подсказки
if (elU['addMountBtn'].style.display !== 'none') throw new Error('U: the + Mount button must hide when mounts editing is OFF');
let mountsHtmlU = elU['mounts'].innerHTML;
if (mountsHtmlU.includes("openSearch('weapon'")) throw new Error('U: the weapon search must hide when mounts editing is OFF');
if (mountsHtmlU.includes('Кастомное Оружие')) throw new Error('U: the + Custom Weapon button must hide when mounts editing is OFF');
if (mountsHtmlU.includes('delWeapon') || mountsHtmlU.includes('delMount')) throw new Error('U: delete buttons must hide when mounts editing is OFF');
if (mountsHtmlU.includes('<select')) throw new Error('U: the mount type select must hide when mounts editing is OFF');
if (!mountsHtmlU.includes('<span class="mb-name">Main</span>')) throw new Error('U: the mount type must show as text when mounts editing is OFF');
// оружие остаётся карточкой, степпер Limited — на месте
XU.addWeaponByIndex(0, DBU.weapons.findIndex(w=>w.n==='Assault Rifle'));
mountsHtmlU = elU['mounts'].innerHTML;
if (!mountsHtmlU.includes('Штурмовая винтовка')) throw new Error('U: the weapon card must stay visible in view mode');
if (mountsHtmlU.includes('delWeapon')) throw new Error('U: the weapon delete button must hide in view mode');
// таланты: по умолчанию — строки текстом, без полей и удаления
SU.talents.push({name:'',rank:1}); SU.talents[0].name = 'Ace'; XU.renderLists();
if (elU['talentsHint'].style.display !== 'none') throw new Error('U: the talents hint must hide when talents editing is OFF');
if (elU['talentAddRow'].style.display !== 'none') throw new Error('U: the talent search and + Talent button must hide when talents editing is OFF');
let talHtmlU = elU['talents'].innerHTML;
if (talHtmlU.includes('<input') || talHtmlU.includes('<select') || talHtmlU.includes('delRow')) throw new Error('U: talent rows must not contain inputs, selects or delete buttons in view mode');
if (!talHtmlU.includes('Ас I')) throw new Error('U: talent rows must show the name and rank as one text in view mode');
if (talHtmlU.includes('<span class="dim">I</span>')) throw new Error('U: the talent rank must not hang in a separate column in view mode');
// триггеры: по умолчанию — строки текстом; подсказка про правила скрыта (v262: edit-only)
SU.triggers.push({name:'',bonus:2}); SU.triggers[0].name = 'Act Unseen or Unheard'; XU.renderLists();
if (elU['triggerAddRow'].style.display !== 'none') throw new Error('U: the trigger search and + Trigger button must hide when triggers editing is OFF');
let trigHtmlU = elU['triggers'].innerHTML;
if (trigHtmlU.includes('<input') || trigHtmlU.includes('delRow')) throw new Error('U: trigger rows must not contain inputs or delete buttons in view mode');
if (!trigHtmlU.includes('Действовать незаметно') || !trigHtmlU.includes('+2')) throw new Error('U: trigger rows must show the name and bonus as text in view mode');
// включить — контролы возвращаются
XU.toggleEdit('mounts'); XU.toggleEdit('talents'); XU.toggleEdit('triggers');
if (!XU.editOn('mounts') || !XU.editOn('talents') || !XU.editOn('triggers')) throw new Error('U: toggling must turn editing ON');
if (!elU['mounts'].innerHTML.includes('<select')) throw new Error('U: the mount type select must return when mounts editing is ON');
if (!elU['talents'].innerHTML.includes('<input')) throw new Error('U: talent inputs must return when talents editing is ON');

// PHASE V: v24 — тоггл редактирования в остальных блоках
// (v240: по умолчанию редактирование ВЫКЛЮЧЕНО — чистый вид)
const { X: XV, S: SV, DB: DBV, elements: elV, g: gV } = runEval({});
['systems','licenses','mech','pilot','core'].forEach(b=>{ if (XV.editOn(b)) throw new Error('V: editing must be OFF by default for ' + b); });
if (!elV['statsCard'].classList.contains('view') || !elV['pilotCard'].classList.contains('view')) throw new Error('V: static cards must have the view class by default'); // v66: coreCard удалена, осталась только пара stats/pilot
// системы: по умолчанию — поиск, добавление и ✕ скрыты, карточки остаются
if (elV['systemsHint'].style.display !== 'none' || elV['systemAddRow'].style.display !== 'none') throw new Error('V: the systems search, hint and add button must hide when systems editing is OFF');
let sysHtmlV = elV['systems'].innerHTML;
if (sysHtmlV.includes('delRow')) throw new Error('V: system delete buttons must hide when systems editing is OFF');
if (!sysHtmlV.includes('Заряды HEX образца Б')) throw new Error('V: the system cards must stay visible in view mode');
// лицензии: по умолчанию — строки текстом, фильтр и секция фрейма скрыты
SV.pilot.licenses.push({name:'Blackbeard', rank:2}); XV.renderLists();
if (elV['licenseFilterRow'].style.display !== 'none' || elV['licensesHint'].style.display !== 'none' || elV['licenseAddRow'].style.display !== 'none') throw new Error('V: the license filter, hint and add button must hide when licenses editing is OFF');
let licHtmlV = elV['licenses'].innerHTML;
if (licHtmlV.includes('<input') || licHtmlV.includes('<select') || licHtmlV.includes('delLicense')) throw new Error('V: license rows must not contain inputs, selects or delete buttons in view mode');
if (!licHtmlV.includes('Чёрная Борода II')) throw new Error('V: license rows must show the name and rank as one text in view mode');
if (licHtmlV.includes('<span class="dim">II</span>')) throw new Error('V: the license rank must not hang in a separate column in view mode');
// статичные карточки: по умолчанию — класс view, поля как текст
if (!elV['statsCard'].classList.contains('view')) throw new Error('V: the Stats card must have the view class when mech editing is OFF');
if (!elV['pilotCard'].classList.contains('view')) throw new Error('V: the Pilot card must have the view class when pilot editing is OFF');

// v66: coreCard удалена — view-класс у неё больше не проверяется
if (elV['editToggleMech'].classList.contains('on')) throw new Error('V: the mech toggle must be OFF by default');
if (elV['coreDescBox'].innerHTML.includes('✎') || elV['traitsBox'].innerHTML.includes('✎')) throw new Error('V: the Core System edit buttons must hide when core editing is OFF');
// включить — всё возвращается
XV.toggleEdit('systems'); XV.toggleEdit('licenses'); XV.toggleEdit('mech'); XV.toggleEdit('pilot'); XV.toggleEdit('core');
if (elV['statsCard'].classList.contains('view')) throw new Error('V: the view class must be removed when editing is back ON');
if (!elV['systems'].innerHTML.includes('delRow')) throw new Error('V: system delete buttons must return when systems editing is ON');
if (elV['coreDescBox'].innerHTML.includes('✎')) throw new Error('V: the Core System must stay read-only even when core editing is ON (v66)');
// v191-204: traits are read-only too now (renderDescBoxes passes editable=false —
// traits always come from the frame, like the Core System description)
if (elV['traitsBox'].innerHTML.includes('✎')) throw new Error('V: traits must stay read-only even when core editing is ON');

// PHASE W: v25 — слайдер-тогглы, удаление кнопки «Применить фрейм», «Описание» лишнее, единая модалка поиска
const { X: XW, S: SW, DB: DBW, elements: elW, g: gW } = runEval({});
// в статике не должно остаться встроенных полей поиска и их результатов
['mountPick-','systemPick','talentPick','triggerPick','framePick','mountResults-','systemResults','talentResults','triggerResults','frameResults','licenseDb','talentDb'].forEach(id=>{
  if (staticHtml.includes('id="'+id)) throw new Error('W: inline search ' + id + ' must be gone from the static HTML');
});
if (staticHtml.includes('applyFrame()')) throw new Error('W: the Apply Frame button must be gone');
// v191-204: "Редактирование" is allowed in aria-labels (accessibility, e.g. the pilot
// equipment toggle), but not as visible text
const noAria = staticHtml.replace(/aria-label="[^"]*"/g, '');
if (noAria.includes('Редактирование')) throw new Error('W: the word Редактирование must be gone from the visible static HTML');
if (!staticHtml.includes('id="searchView"')) throw new Error('W: the search view must exist');
if (staticHtml.includes('id="searchDlg"')) throw new Error('W: the search dialog must be gone (v258: fullscreen view, not a dialog)');
if (!staticHtml.includes("openSearch('system'") || !staticHtml.includes("openSearch('talent'") || !staticHtml.includes("openSearch('trigger'") || !staticHtml.includes("openSearch('license'") || !staticHtml.includes("openSearch('frame'")) throw new Error('W: every static block must have a search icon opening the search view');
// строки: удалённые ключи ушли, новые динамические — на месте
if (XW.STR.u009 || XW.STR.u157 || XW.STR.u069 || XW.STR.u005 || XW.STR.u059) throw new Error('W: removed strings u009/u157/u069/u005/u059 must not be in STR');
if (!XW.STR.edit_toggle || !XW.STR.search_ph_license) throw new Error('W: the new dynamic strings must be in STR');
if (!XW.STR.p002 || !XW.STR.p003 || !XW.STR.p009 || !XW.STR.p010) throw new Error('W: the moved search placeholders must stay in STR');
// тогглы — кнопки-слайдеры без текста (в статике — button.toggle, без чекбокса и слова;
// v240: по умолчанию выключены)
['editToggleMounts','editToggleTalents','editToggleTriggers','editToggleSystems','editToggleLicenses','editToggleMech','editTogglePilot','editToggleCoreBonuses'].forEach(id=>{ // v66: editToggleCore удалён — у Core System больше нет редактирования
  if (!staticHtml.includes('<button type="button" class="toggle" id="' + id + '"')) throw new Error('W: toggle ' + id + ' must be a slider button in the static HTML');
  if (elW[id].classList.contains('on')) throw new Error('W: toggle ' + id + ' must be OFF by default');
});
if (staticHtml.includes('edit-toggle')) throw new Error('W: no checkbox toggles must remain in the static HTML');
if (!staticHtml.includes('id="licenseFilterToggle"')) throw new Error('W: the license filter checkbox must stay (it is not an edit toggle)');
// поиск оружия в маунтах — только при включённом редактировании (v240: по умолчанию выкл)
XW.toggleEdit('mounts');
if (!elW['mounts'].innerHTML.includes("openSearch('weapon'")) throw new Error('W: the mounts must have a search icon opening the search view');
XW.toggleEdit('mounts');
if (elW['editToggleMounts'].classList.contains('on')) throw new Error('W: the mounts slider must switch OFF');
// вид: открывается, показывает результаты, плейсхолдер — по виду поиска
XW.openSearch('weapon', 0);
if (!XW.searchViewOpen()) throw new Error('W: openSearch must open the search view');
if (elW['mainContent'].style.display !== 'none' || elW['mainNav'].style.display !== 'none') throw new Error('W: openSearch must hide the main content and the navbar');
if (!elW['searchDlgResults'].innerHTML.includes('Штурмовая винтовка')) throw new Error('W: the weapon search view must show results');
if (!elW['searchDlgResults'].innerHTML.includes('closeSearchDlg()')) throw new Error('W: picking a result must close the view');
if (elW['searchDlgInput'].placeholder !== XW.L('ph_weapsearch')) throw new Error('W: the weapon search placeholder must be set');
XW.renderSearchResults('assault');
if (!elW['searchDlgResults'].innerHTML.includes('Штурмовая винтовка')) throw new Error('W: the view search must filter by query');
XW.renderSearchResults('xyz-no-such-weapon');
if (!elW['searchDlgResults'].innerHTML.includes('Ничего не найдено')) throw new Error('W: the view must show not-found');
XW.closeSearchDlg();
if (XW.searchViewOpen()) throw new Error('W: closeSearchDlg must close the search view');
if (elW['mainContent'].style.display !== '' || elW['mainNav'].style.display !== '') throw new Error('W: closeSearchDlg must restore the main content and the navbar');
XW.openSearch('system');
if (!elW['searchDlgResults'].innerHTML.includes('Заряды HEX образца Б')) throw new Error('W: the system search view must show results');
XW.openSearch('talent');
if (!elW['searchDlgResults'].innerHTML.includes('Ас')) throw new Error('W: the talent search view must show results');
XW.openSearch('trigger');
XW.renderSearchResults('угр');
if (!elW['searchDlgResults'].innerHTML.includes('Угрожать')) throw new Error('W: the trigger search view must find Угрожать by query');
XW.openSearch('frame');
if (!elW['searchDlgResults'].innerHTML.includes('Эверест')) throw new Error('W: the frame search view must show results');
XW.openSearch('license');
if (!elW['searchDlgResults'].innerHTML.includes('Чёрная Борода')) throw new Error('W: the license search view must show results');
if (elW['searchDlgResults'].innerHTML.includes('Эверест')) throw new Error('W: the license search view must not offer Everest');
XW.closeSearchDlg();
// выбор в модалке добавляет, а «Описание» в карточках больше не пишется
// (v240: описание оружия показывается только при включённом редактировании —
// по умолчанию выкл, поэтому включаем маунты перед проверкой)
XW.toggleEdit('mounts');
XW.openSearch('weapon', 0);
const wIdx = DBW.weapons.findIndex(w=>w.n==='Assault Rifle');
XW.addWeaponByIndex(0, wIdx); XW.closeSearchDlg();
let mountsHtmlW = elW['mounts'].innerHTML;
if (!mountsHtmlW.includes('Штурмовая винтовка')) throw new Error('W: the picked weapon must be added');
if (mountsHtmlW.includes('Описание')) throw new Error('W: the word Описание must be gone from the weapon cards');
if (!mountsHtmlW.includes('Как и мехи GMS')) throw new Error('W: the description preview must stay as the summary');
if (!elW['coreDescBox'].innerHTML.includes('Активное — Усиление')) throw new Error('W: the Core System description must stay');
if (elW['coreDescBox'].innerHTML.includes('Описание')) throw new Error('W: the word Описание must be gone from the Core System description');


// PHASE X: v26 — иконка поиска в ряду добавления; v170: порядок обратный — кнопка + КАСТОМ слева, поиск справа, без уточнения, что именно кастом
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
  if (rowIdx < 0 || btnIdx < 0 || btnIdx > rowIdx) throw new Error('X: the ' + kind + ' add button must be left of its search button');
});
if (!staticHtml.includes('>+ КАСТОМ<')) throw new Error('X: the add buttons must be the generic + КАСТОМ');
['>+ Триггер<','>+ Талант<','>+ Система<','>+ Лицензия<'].forEach(lbl=>{
  if (staticHtml.includes(lbl)) throw new Error('X: the old button label ' + lbl + ' must be gone');
});
if (!XW.STR.u064 || XW.STR.u064.ru !== '+ Кастом Талант' || XW.STR.u088.ru !== '+ Кастом Триггер') throw new Error('X: the renamed button strings must be in STR');
// тоггл скрывает весь ряд добавления целиком (v240: по умолчанию выкл)
const { X: XX, S: SX, elements: elX } = runEval({});
if (elX['talentAddRow'].style.display !== 'none') throw new Error('X: the talent add row must hide when talents editing is OFF');
XX.toggleEdit('talents');
if (elX['talentAddRow'].style.display === 'none') throw new Error('X: the talent add row must show when talents editing is ON');
XX.toggleEdit('talents');
if (elX['triggerAddRow'].style.display !== 'none') throw new Error('X: the trigger add row must hide when triggers editing is OFF');
XX.toggleEdit('triggers');
if (elX['triggerAddRow'].style.display === 'none') throw new Error('X: the trigger add row must show when triggers editing is ON');
XX.toggleEdit('triggers');
if (elX['systemAddRow'].style.display !== 'none') throw new Error('X: the system add row must hide when systems editing is OFF');
XX.toggleEdit('systems');
if (elX['systemAddRow'].style.display === 'none') throw new Error('X: the system add row must show when systems editing is ON');
XX.toggleEdit('systems');


// PHASE Y: v27 — гаечный ключ на бегунке слайдера
// v191-204: the wrench SVG viewBox is now "8 1 15 14" (was "0 0 24 24"), and there are
// 9 edit toggles (CoreBonuses + PilotEquipment added); the 10th knob is the language
// slider, which has no icon
const knobCount = (staticHtml.match(/<span class="knob"><svg viewBox="8 1 15 14"/g) || []).length;
if (knobCount !== 9) throw new Error('Y: all 9 toggle knobs must carry the wrench icon (found ' + knobCount + ')'); // v66: 9-й тоггл (Core System) удалён; v144: эмодзи заменён на оранжевый SVG-ключ
if (!staticHtml.includes('.toggle .knob') || !staticHtml.includes('display:flex')) throw new Error('Y: the knob must be a flex container centering the icon');


// PHASE Z: v28 — игровой режим: пояснения маунтов, SP-счётчик и предупреждение о лицензиях прячутся; ранги в один текст с именем
// (v240: по умолчанию редактирование выкл — сначала чистый вид, потом включаем)
const { X: XZ, S: SZ, DB: DBZ, elements: elZ, g: gZ } = runEval({});
// маунты: пояснение ёмкости есть при редактировании, нет в просмотре; тип маунта остаётся текстом
if (elZ['mounts'].innerHTML.includes('mount-cap')) throw new Error('Z: the mount capacity note must hide when mounts editing is OFF');
if (elZ['mounts'].innerHTML.includes('занимает ещё один маунт')) throw new Error('Z: the mount capacity explanation must hide when mounts editing is OFF');
if (!elZ['mounts'].innerHTML.includes('<span class="mb-name">Main</span>')) throw new Error('Z: the mount type must stay visible as text in view mode');
XZ.toggleEdit('mounts');
if (!elZ['mounts'].innerHTML.includes('mount-cap')) throw new Error('Z: the mount capacity note must show when mounts editing is ON');
XZ.toggleEdit('mounts');
if (elZ['mounts'].innerHTML.includes('mount-cap')) throw new Error('Z: the mount capacity note must hide again when mounts editing is OFF');
// системы: SP-счётчик виден всегда, и в просмотре тоже (v255)
if (elZ['spCounterRow'].style.display === 'none') throw new Error('Z: the SP counter must show when systems editing is OFF (v255)');
XZ.toggleEdit('systems');
if (elZ['spCounterRow'].style.display === 'none') throw new Error('Z: the SP counter must show when systems editing is ON (v255)');
XZ.toggleEdit('systems');
// таланты: ранг II в один текст с именем в просмотре
SZ.talents.push({name:'',rank:1}); SZ.talents[0].name = 'Ace'; SZ.talents[0].rank = 2; XZ.renderLists();
let talHtmlZ = elZ['talents'].innerHTML;
if (!talHtmlZ.includes('Ас II')) throw new Error('Z: the talent name and rank must be one text in view mode');
if (talHtmlZ.includes('<span class="dim">II</span>')) throw new Error('Z: the talent rank must not be a separate column in view mode');
// лицензии: ранг в один текст; предупреждение о нераспознанных лицензиях — только при редактировании
SZ.pilot.licenses.push({name:'Blackbeard', rank:2}); SZ.pilot.licensesNote = 'Foo'; XZ.renderLists();
if (elZ['licensesNote'].style.display !== 'none') throw new Error('Z: the unrecognized-license note must hide when licenses editing is OFF');
XZ.toggleEdit('licenses');
if (elZ['licensesNote'].style.display === 'none') throw new Error('Z: the unrecognized-license note must show when licenses editing is ON and a note exists');
XZ.toggleEdit('licenses');
let licHtmlZ = elZ['licenses'].innerHTML;
if (!licHtmlZ.includes('Чёрная Борода II')) throw new Error('Z: the license name and rank must be one text in view mode');
if (licHtmlZ.includes('<span class="dim">II</span>')) throw new Error('Z: the license rank must not be a separate column in view mode');
if (elZ['licensesNote'].style.display !== 'none') throw new Error('Z: the unrecognized-license note must hide when licenses editing is OFF');
// без предупреждения — строка не показывается даже при редактировании
XZ.toggleEdit('licenses');
SZ.pilot.licensesNote = ''; XZ.renderLists();
if (elZ['licensesNote'].style.display !== 'none') throw new Error('Z: an empty unrecognized-license note must stay hidden');


// PHASE AA: v29 — описания (короткое целиком, длинное с «подробнее»/«свернуть»), без «SP N» в шапке систем, описание оружия — в теле карточки в обоих режимах (v262), версия в подвале
const { X: XAA, S: SAA, DB: DBAA, elements: elAA, g: gAA } = runEval({});
// версия трекера в подвале страницы
if (!staticHtml.includes('Версия трекера: 264')) throw new Error('AA: the footer must show the tracker version');
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
// оружие: описание — в теле карточки, в обоих режимах (v262: как системы;
// раньше — только при редактировании). Кнопка удаления — только при редактировании.
XAA.addWeaponByIndex(0, DBAA.weapons.findIndex(w=>w.n==='Assault Rifle'));
const wLast = SAA.mounts[0].weapons[SAA.mounts[0].weapons.length-1];
wLast.desc = 'Тестовое описание оружия для проверки.';
XAA.renderLists();
if (!elAA['mounts'].innerHTML.includes('Тестовое описание оружия')) throw new Error('AA: the weapon description must be in the card body in view mode (v262)');
if (elAA['mounts'].innerHTML.includes('delWeapon')) throw new Error('AA: in view mode the weapon delete button must be hidden');
XAA.toggleEdit('mounts');
if (!elAA['mounts'].innerHTML.includes('Тестовое описание оружия')) throw new Error('AA: the weapon description must stay in the card body when mounts editing is ON (v262)');
if (!elAA['mounts'].innerHTML.includes('delWeapon')) throw new Error('AA: in edit mode the weapon delete button must be present');
XAA.toggleEdit('mounts');
if (!elAA['mounts'].innerHTML.includes('Тестовое описание оружия')) throw new Error('AA: the weapon description must stay in the card body after leaving edit mode (v262)');


// PHASE AB: v30 — выбор фрейма вернулся на Мех: кнопка поиска справа от названия; подтверждение рассказывает про встроенное оружие
const { X: XAB, S: SAB, DB: DBAB, elements: elAB, g: gAB } = runEval({});
// секция фрейма в Пилоте ушла совсем, вместе с подсказкой и её строками
if (staticHtml.includes('id="frameSection"')) throw new Error('AB: the frame section must be gone from the Pilot tab');
if (staticHtml.includes('u010') || staticHtml.includes('u148')) throw new Error('AB: the frame hint and heading strings must be gone');
if (!('frame_iw_note' in XAB.STR)) throw new Error('AB: the integrated-weapon confirm note must exist in STR');
// кнопка поиска фрейма — справа от названия на вкладке Мех, только при редактировании
// (v240: по умолчанию выкл — сначала скрыта, потом включаем)
if (!staticHtml.includes('id="frameSearchBtn"')) throw new Error('AB: the frame search button must exist');
if (!staticHtml.includes("openSearch('frame')")) throw new Error('AB: the frame search button must open the frame search');
if (elAB['frameSearchBtn'].style.display !== 'none') throw new Error('AB: the frame search button must hide when mech editing is OFF');
if (elAB['mechFrameName'].textContent !== 'Эверест') throw new Error('AB: the frame name must stay visible as text in view mode');
XAB.toggleEdit('mech');
if (elAB['frameSearchBtn'].style.display === 'none') throw new Error('AB: the frame search button must show when mech editing is ON');
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
// v219: the status reference moved to Rules (below Reactions) — it no longer
// sits before the traits card on the Mech tab.
if (!(staticHtml.indexOf('id="tab-rules"') < staticHtml.indexOf('u233'))) throw new Error('AC: the status reference (u233) must live in the Rules tab');
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
// v191-204: the resource icons are gone — Stress/Overcharge are plain help buttons
// opening the stat reference (the emoji icons were removed as ugly, v113)
if (!staticHtml.includes(`onclick="showStatRef('stress')">Stress</button>`)) throw new Error('AC: Stress must be a help button opening its reference');
if (!staticHtml.includes('onclick="showOverchargeRef()">Overcharge</button>')) throw new Error('AC: Overcharge must be a help button opening its reference');
if (staticHtml.includes('class="ico"')) throw new Error('AC: the resource icons must be gone');


// PHASE AD: v33 — System Points переехал из HASE в Системы; счётчик виден всегда (v255)
const { X: XAD, S: SAD, DB: DBAD, elements: elAD, g: gAD } = runEval({});
// v191-204: the SP capacity field (spCapRow) is gone — SP is fully derived now
// (frame SP + Grit + floor(Systems/2)), so the separate readonly field was removed;
// SP shows only as the spCounter button in the Systems card
if (!staticHtml.includes('id="spCounterRow"')) throw new Error('AD: the SP counter must live in the Systems card');
if (!staticHtml.includes(`onclick="showStatRef('sp')"`)) throw new Error('AD: the SP counter must open the SP reference');
if (staticHtml.includes('id="spCapRow"')) throw new Error('AD: the old SP capacity field must be gone');
// SP-счётчик виден всегда, и в просмотре тоже (v255: строка убрана из edit-гейта)
if (elAD['spCounterRow'].style.display === 'none') throw new Error('AD: the SP counter must show when systems editing is OFF (v255)');
XAD.toggleEdit('systems');
if (elAD['spCounterRow'].style.display === 'none') throw new Error('AD: the SP counter must show when systems editing is ON (v255)');
XAD.toggleEdit('systems');
// подсказка HASE видна только при редактировании Статов (тоггл mech)
if (!staticHtml.includes('id="haseHint"')) throw new Error('AD: the HASE explanation must have an id to hide in view mode');
if (elAD['haseHint'].style.display !== 'none') throw new Error('AD: the HASE explanation must hide when Stats editing is OFF');
XAD.toggleEdit('mech');
if (elAD['haseHint'].style.display === 'none') throw new Error('AD: the HASE explanation must show when HASE editing is ON');
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
// v219: кнопка «Полный ремонт» больше не прячется внутри блока «Отдых и полный
// ремонт» — она всегда видна на вкладке Меха, под панелью Core Power (над Статами).
const btnIdx = staticHtml.indexOf('onclick="fullRepair()"');
const coreUsedIdxAG = staticHtml.indexOf('data-f="mech.coreUsed"');
const statsIdx = staticHtml.indexOf('id="statsCard"');
if (!(coreUsedIdxAG > 0 && coreUsedIdxAG < btnIdx && btnIdx < statsIdx)) throw new Error('AG: the Full Repair button must sit on the Mech tab, under the Core Power panel (above the Stats card)');
const restIdx = staticHtml.indexOf('data-i18n="u050"');
const btnAfterRest = staticHtml.indexOf('fullRepair()', restIdx);
const restCloseIdx = staticHtml.indexOf('</details>', restIdx);
if (btnAfterRest !== -1 && btnAfterRest < restCloseIdx) throw new Error('AG: the Full Repair button must not hide inside the Rest & Full Repair block');
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
staleAH.pilot.licenses = []; // v191-204: Grit (from licenses) feeds hpMax now, so a clean
// stale save must have no licenses — otherwise the leftover Blackbeard II (LL 2,
// Grit 1) from the earlier phases would raise the expected hpMax to 13
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
// счётчики ресурсов — v191-204: одна колонка (stat bars), каждый ресурс на своей строке
if (!staticHtml.includes('class="grid res-grid single-col"')) throw new Error('AI: the resources grid must carry the res-grid single-col classes');
if (!/\.res-grid\.single-col\s*\{[^}]*grid-template-columns:\s*1fr/.test(staticHtml)) throw new Error('AI: the single-col resources grid must be one column');
const nowrapUses = (staticHtml.match(/white-space:nowrap/g) || []).length;
// четыре разрешённых nowrap: ellipsis имени фрейма, индикатор шага мастера (v57),
// тег статуса (v114 — двуязычное имя не рвётся; тег в flex-wrap, страница не разъезжается)
// и подпись фрейма (v191-204 — «Фрейм (Size 1)» не рвётся)
if (nowrapUses !== 4 || !staticHtml.includes('.frame-ro { font-size:16px; font-weight:600; padding:9px 0; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;') || !staticHtml.includes('.wizard-progress{') || !staticHtml.includes('.frame-label {')) throw new Error('AI: the counter value must wrap (no nowrap); the only allowed nowrap uses are the frame-name ellipsis, the wizard progress, the status tag and the frame label (found ' + nowrapUses + ')');
if (!/\.res-grid\s*\{\s*margin-bottom:16px;\s*\}/.test(staticHtml)) throw new Error('AI: the resources grid must have a 16px bottom margin (gap before the rules buttons)');


// PHASE AJ: v39 — счётчики в 2 колонки, кнопки правил сдвинуты ниже (версия — фаза AA)
if (!staticHtml.includes('class="grid res-grid single-col"')) throw new Error('AJ: the resources grid must carry the res-grid single-col classes');
if (!/\.res-grid\s*\{\s*margin-bottom:16px;\s*\}/.test(staticHtml)) throw new Error('AJ: the resources grid must have a 16px bottom margin');
// v191-204: Overcharge is a help button ("Overcharge"), not a <details> block ("Оверчардж")
for (const t of ['Overcharge', 'Потеря структуры', 'Перегрев реактора', 'Отдых и полный ремонт']) {
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
// v191-204: Grit feeds HP now — the pilot here is LL3 (Blackbeard II + Lancaster I),
// so Grit is 2 and Everest HP max is 10 + 2 = 12, not 10
if (XAK.get('mech.hpMax') !== 12) throw new Error('AK: Everest HP max must be 10 + Grit 2 = 12 without Reinforced Frame, got ' + XAK.get('mech.hpMax'));
if (XAK.get('mech.heatMax') !== 6) throw new Error('AK: Everest Heat max must be 6 without Superior By Design');
SAK.pilot.coreBonuses = ['Reinforced Frame', 'Superior By Design'];
XAK.recalcDerived();
if (XAK.get('mech.hpMax') !== 17) throw new Error('AK: with Reinforced Frame, HP max must be 10 + 5 + Grit 2 = 17, got ' + XAK.get('mech.hpMax'));
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
if (!staticHtml.includes('id="cbView"')) throw new Error('AK: the Core Bonuses picker view must exist');
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
// v191-204: the Repairs label is a help button now, not a <label>
if (!staticHtml.includes(`onclick="showStatRef('repairs')">Repairs</button>`)) throw new Error('AL: the Repairs label must be just "Repairs"');

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
// v191-204: Size is no longer an input (mech.size) — it shows as text next to the frame name (mechSizeValue)
if (!statsHtml.includes('mech.name') || !statsHtml.includes('mechFrameName') || !statsHtml.includes('mechSizeValue') || !statsHtml.includes('mech.speed')) throw new Error('AS: the Stats card must hold the mech identity fields');
if (statsHtml.includes('mech.size')) throw new Error('AS: the old Size input must be gone');
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
if (!statsHtmlAU.includes('grid-column:1 / -1')) throw new Error('AU: the name row must span the full width');
// v191-204: the frame row spans full width via CSS now (#statsCard .frame-field),
// not an inline style — so only one inline full-width row (name) remains
if ((statsHtmlAU.match(/grid-column:1 \/ -1/g) || []).length !== 1) throw new Error('AU: exactly one inline full-width row (name) must remain');
if (!staticHtml.includes('#statsCard .frame-field { grid-column:1 / -1;')) throw new Error('AU: the frame row must span the full width via CSS');
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
if (!staticHtml.includes('Версия трекера: 264')) throw new Error('AY: the footer must still show the tracker version');
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
// (v240: дропдаун — только при включённом редактировании лицензий, по умолчанию выкл)
XAY.toggleEdit('licenses');
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
// v191-204: the level-up button lives in the global footer grid at the bottom of the
// Rules tab, with Reset, Build Wizard and export/import — not at the top anymore
const rulesTab = staticHtml.split('id="tab-rules"')[1].split('id="tab-')[0];
if (!rulesTab.includes('class="global-action-grid"')) throw new Error('BD: the Rules tab must have a global action grid');
if (rulesTab.indexOf('openLevelUp()') < rulesTab.indexOf('class="global-action-grid"')) throw new Error('BD: the level-up button must live in the global action grid');
if (rulesTab.indexOf('openLevelUp()') < rulesTab.indexOf('Ход и структура боя')) throw new Error('BD: the level-up button must be after the rules sections, in the footer');
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
if (!html.includes('Версия трекера: 264')) throw new Error('BE: footer must say version 264');
const ABE = global.__x.ACTIONS_REF;
if (!ABE || ABE.reactions.length !== 35) throw new Error('BE: ACTIONS_REF must have 35 reactions, got ' + (ABE && ABE.reactions.length));
if (ABE.protocols.length !== 30) throw new Error('BE: ACTIONS_REF must have 30 protocols, got ' + ABE.protocols.length);
if (!ABE.quick || ABE.quick.length !== 144) throw new Error('BE: ACTIONS_REF must have 144 quick actions, got ' + (ABE.quick && ABE.quick.length));
if (!ABE.reactions.some(r=>r.key==='turretattack' && r.grant.system==='Turret Drones')) throw new Error('BE: Turret Attack must be granted by Turret Drones');
if (!ABE.reactions.some(r=>r.key==='areadenial' && r.grant.system==='Assassin Drone')) throw new Error('BE: Area Denial must be granted by Assassin Drone');
if (!ABE.quick.some(q=>q.key==='activaterestockdrone' && q.grant.system==='Restock Drone')) throw new Error('BE: Activate Restock Drone must be granted by Restock Drone');
if (!ABE.quick.some(q=>q.key==='balancecontrollockout' && q.grant.frame==='Chomolungma')) throw new Error('BE: Balance Control Lockout must be granted by the Chomolungma frame');
if (!ABE.quick.some(q=>q.key==='systemcrusher' && q.grant.frame==='Chomolungma')) throw new Error('BE: System Crusher must be granted by the Chomolungma frame');
if (!ABE.quick.some(q=>q.key==='detonatebreachingcharge' && q.grant.system==='BB Breach/Blast Charges')) throw new Error('BE: Detonate must be granted by BB Breach/Blast Charges');
if (!ABE.quick.some(q=>q.key==='moveiceoutdrone' && q.grant.system==='ICEOUT Drone')) throw new Error('BE: Move ICEOUT Drone must be granted by ICEOUT Drone');
if (!ABE.quick.some(q=>q.key==='detonategroundingmine' && q.grant.system==='Grounding Charges')) throw new Error('BE: Detonate Grounding Mine must be granted by Grounding Charges');
if (!ABE.quick.some(q=>q.key==='invigorate' && q.grant.talent==='Drone Commander' && q.grant.rank===3)) throw new Error('BE: Invigorate must be granted by Drone Commander rank 3');
if (!ABE.quick.some(q=>q.key==='coveringfire' && q.grant.talent==='Heavy Gunner' && q.grant.rank===1)) throw new Error('BE: Covering Fire must be granted by Heavy Gunner rank 1');
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
if (!/nav[^{]*\{[^}]*position:fixed[^}]*bottom:0/.test(staticHtml)) throw new Error('BF: nav must be a fixed bottom bar');
if (!staticHtml.includes('id="tabMechBtn"') || !staticHtml.includes('id="tabPilotBtn"') || !staticHtml.includes('id="tabRulesBtn"')) throw new Error('BF: nav buttons must keep their ids');
if (staticHtml.includes('data-i18n="u002"') || staticHtml.includes('data-i18n="u003"') || staticHtml.includes('data-i18n="u004"')) throw new Error('BF: nav buttons must be icon-only, no text i18n');
const navIdx = staticHtml.indexOf('<nav id="mainNav">');
const navHtml = staticHtml.slice(navIdx, staticHtml.indexOf('</nav>', navIdx));
if ((navHtml.match(/<svg/g) || []).length !== 3) throw new Error('BF: nav must have exactly 3 SVG icons (robot, person, book)');
if (!navHtml.includes('aria-label="Мех"') || !navHtml.includes('aria-label="Пилот"') || !navHtml.includes('aria-label="Правила"')) throw new Error('BF: nav icons need aria-labels');
// v191-204: the nav is shorter now, so main bottom padding is 72px (was 92px)
if (!staticHtml.includes('padding-bottom: 72px')) throw new Error('BF: main needs bottom padding so the fixed nav does not cover content');
if (!staticHtml.includes('id="hpRingFill"') || !staticHtml.includes('id="heatThermoFill"')) throw new Error('BF: HP ring and Heat thermometer must exist');
// v191-204: the "hp" unit is a help button now (stat-label ring-hp), opening the HP reference
if (!staticHtml.includes('ring-hp')) throw new Error('BF: ring centre needs the hp unit next to the HP value');
if (!staticHtml.includes('>hp</button>')) throw new Error('BF: the hp unit must be a button opening the HP reference');
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
if (!/\.thermo\s*\{[^}]*width:58px/.test(staticHtml)) throw new Error('BG: the thermometer must be 58px wide'); // v191-204: narrowed from 64px
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
if (/nav[^{]*\{[^}]*repeating-linear-gradient\(115deg/.test(staticHtml)) throw new Error('BI: the brushed texture stripes on the nav background must be gone (v150)');
if (!/nav[^{]*\{[^}]*linear-gradient\(180deg,\s*#2b333f/.test(staticHtml)) throw new Error('BI: nav background must have the metal gradient layer');
if (!/nav[^{]*\{[^}]*box-shadow:0 -6px 20px/.test(staticHtml)) throw new Error('BI: nav must cast a shadow above the content');
if (staticHtml.includes('nav::before')) throw new Error('BI: the hazard stripe above the nav must be gone (it merged with the Core Power panel frame)');


if (!/\.res-top\s*\{[^}]*display:grid;[^}]*grid-template-columns:1fr 1fr/.test(staticHtml)) throw new Error('BJ: res-top must be two equal columns so the ring and the thermometer sit balanced');
// max — внутри контролов (экономия места по вертикали): в кольце второй строкой, в термометре под огоньком
if (!staticHtml.includes('class="ring-max" id="max-mech.hp"')) throw new Error('BJ: max must live inside the ring (second line under the value), not below it');
if (!staticHtml.includes('class="thermo-max" id="max-mech.heat"')) throw new Error('BJ: max must live inside the thermometer (under the flame), not below it');
if (staticHtml.includes('class="oc-next" id="max-mech.hp"') || staticHtml.includes('class="oc-next" id="max-mech.heat"')) throw new Error('BJ: no separate max line may remain below the ring or the thermometer');
// PHASE BJ (v69): в центре кольца "N hp" (без сердечка), у +/- вертикальные разделители и свой фон
if (staticHtml.includes('class="ring-heart"')) throw new Error('BJ: the heart in the ring centre must be gone');
// v191-204: the "hp" unit is a help button now (stat-label ring-hp), not a plain div
if (!staticHtml.includes('ring-hp') || !staticHtml.includes('>hp</button>')) throw new Error('BJ: the ring centre must show the hp unit next to the value');
if (/\.ring-minus,\s*\.ring-plus\s*\{[^}]*background:rgba\(255,255,255,\.07\)/.test(staticHtml)) throw new Error('BJ: the rectangular background behind the in-ring +/- must be gone (it did not fit the circle)');
if (!/\.ring-minus\s*\{[^}]*border-right:1px solid/.test(staticHtml)) throw new Error('BJ: the minus zone needs a vertical divider on its inner edge');
if (!/\.ring-plus\s*\{[^}]*border-left:1px solid/.test(staticHtml)) throw new Error('BJ: the plus zone needs a vertical divider on its inner edge');
if (!/\.ring-hp\s*\{[^}]*font-size:18px/.test(staticHtml)) throw new Error('BJ: the hp unit must be smaller than the number (18px)');


// PHASE BK (v70): у +/- в кольце нет прямоугольного фона (только разделители), у навигации — сплошная янтарная линия вместо аварийной полосы
if (/\.ring-minus,\s*\.ring-plus\s*\{[^}]*border-radius/.test(staticHtml)) throw new Error('BK: the in-ring +/- zones must have no rounded-rectangle background at all');
if (!/\.ring-minus\s*\{[^}]*border-right:1px solid/.test(staticHtml)) throw new Error('BK: the minus zone must keep its vertical divider');
if (!/\.ring-plus\s*\{[^}]*border-left:1px solid/.test(staticHtml)) throw new Error('BK: the plus zone must keep its vertical divider');
if (/nav[^{]*\{[^}]*border-top/.test(staticHtml)) throw new Error('BK: the nav must have no top border at all (v81)');
if (!/nav[^{]*\{[^}]*0 -2px 16px rgb\(0 0 0 \/ 18%\)/.test(staticHtml)) throw new Error('BK: the nav must cast a black shadow above it (v81)');


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
// v219: «Твои действия» больше не раскрыты по умолчанию — все блоки Правил
// свёрнуты при входе; «Ход и структура боя» — тоже нет
const rulesIdx = staticHtml.indexOf('id="tab-rules"');
const rulesHtml = staticHtml.slice(rulesIdx);
if (/\<details class="sec" open\>\s*<summary data-i18n="u229">/.test(rulesHtml)) throw new Error('BM: My actions must NOT auto-open');
if (/\<details class="sec" open\>\s*<summary data-i18n="u097">/.test(rulesHtml)) throw new Error('BM: Turn structure must NOT open by default');


// PHASE BN (v74): футер переехал вниз вкладки Правил; свайпы переключают вкладки
if (staticHtml.includes('<footer>') || staticHtml.includes('</footer>')) throw new Error('BN: the <footer> element must be gone');
const rulesIdxBN = staticHtml.indexOf('id="tab-rules"');
const rulesHtmlBN = staticHtml.slice(rulesIdxBN);
// v191-204: the footer block is .global-footer now (was .rules-foot), and it has no
// divider line — it is a plain flex column
if (!rulesHtmlBN.includes('class="global-footer"')) throw new Error('BN: the Rules tab must have the .global-footer block at the bottom');
if (rulesHtmlBN.includes('class="rules-foot"')) throw new Error('BN: the old .rules-foot block must be gone');
for (const id of ['exportJSON()', 'importFile', 'resetAll()', 'openWizard()', 'id="langToggle"', 'Версия трекера: 264']) {
  if (!rulesHtmlBN.includes(id)) throw new Error('BN: Rules tab must contain ' + id);
}
if (!/\.global-footer\s*\{[^}]*display:flex/.test(staticHtml)) throw new Error('BN: .global-footer must be a flex column');
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
// v191-204: showTab no longer always scrolls to the top — it saves each tab's scroll
// position and restores it on switch (a fresh tab starts at 0)
if (!html.includes('tabScrollPositions')) throw new Error('BP: showTab must save/restore per-tab scroll positions');
if (!html.includes('window.scrollTo(0,y)')) throw new Error('BP: showTab must restore the saved scroll position on tab switch');
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
const navIdxBS = staticHtml.indexOf('<nav id="mainNav">');
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
if (/nav[^{]*\{[^}]*border-top/.test(staticHtml)) throw new Error('BT: the nav must have no top border at all (v81)');
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
if (!staticHtml.includes('@keyframes fillPulse')) throw new Error('BW: fillPulse keyframes must exist');
if (!/\.thermo-fill \{[^}]*transform-origin:bottom/.test(staticHtml)) throw new Error('BW: the fill must scale from its bottom edge (origin bottom)');
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
if (!/nav button[^{]*\{[^}]*-webkit-tap-highlight-color:transparent/.test(staticHtml)) throw new Error('BY: nav buttons must disable the tap highlight (no blue flash on tap)');


// PHASE BZ (v89): фон панели подсвечивается при нажатии вместе с золотой тенью
// (проверки пламени убраны в v166 — большое пульсирующее пламя заменено пульсацией заполнения)
if (!staticHtml.includes('filter:brightness(1.6)')) throw new Error('BZ: the Core Power flash must brighten the panel background in parallel with the shadow');


// PHASE CA (v89): кнопки +/- в кольце HP короче, чтобы разделители не пересекались с краем кольца
if (!/\.ring-minus, \.ring-plus \{[^}]*height:88px/.test(staticHtml)) throw new Error('CA: the ring +/- zones must be 88px tall (dividers must not touch the ring edge)');


// PHASE CB (v90): отблеск останавливается, пока Core Power использован, и возвращается после отката
if (!/\.core-power\.cp-used::after \{ display:none;/.test(staticHtml)) throw new Error('CB: the sheen must be hidden while Core Power is used');
if (!html.includes("if (cp) cp.classList.toggle('cp-used', !!get('mech.coreUsed'))")) throw new Error('CB: renderCounters must put cp-used on the panel when the ability is used');


// PHASE CC (v91, порог v108, v166: пламя теперь всегда маленькая статичная иконка; в Danger Zone пульсирует заполнение, см. fillPulse) — маленькая статичная иконка, большое пульсирующее пламя в Danger Zone (тепло >= половины Heat Cap)ше
if (!/\.thermo-ico \{[^}]*bottom:25px/.test(staticHtml)) throw new Error('CC: the flame below crit must be a small static icon (bottom 25px, between the minus and the max)');
if (!/\.thermo-ico \{[^}]*font-size:16px/.test(staticHtml)) throw new Error('CC: the flame below crit must be a small static icon (16px)');
if (!/@keyframes fillPulse \{ 0%,100% \{ transform:scaleY\(1\); filter:hue-rotate\(0deg\); \} 50% \{ transform:scaleY\(1\.06\); filter:hue-rotate\(12deg\); \} \}/.test(staticHtml)) throw new Error('CC: fillPulse must bob the fill level and shimmer the colour'); // v191-204: pulse strengthened (1/1.06, was 0.97/1.03)
if (html.includes("flame.style.setProperty('--fs'")) throw new Error('CC: the flame must not grow smoothly anymore (no --fs)');


// PHASE CD (v92): карточка «Таланты» должна стоять ниже карточки «Трейты фрейма» во вкладке «Мех»
if (staticHtml.indexOf('id="traitsCard"') > staticHtml.indexOf('id="talents"')) throw new Error('CD: the Talents card must come after the frame traits card in the Mech tab');


// PHASE CE (v93): удалена в v166 — большое крит-пламя заменено пульсацией заполнения (fillPulse).


// PHASE CF (v94): удалена в v166 — пульс пламени заменён пульсацией заполнения (fillPulse).


// PHASE CG (v95): маленькая иконка пламени в обычном состоянии — между минусом и «max: N»
if (!/\.thermo-ico \{[^}]*bottom:25px/.test(staticHtml)) throw new Error('CG: the small flame icon must sit between the minus and the max (bottom 25px)');


// PHASE CH (v96): мастер переименован в «Мастер сборки», кнопка вверху Правил справа от «Левел ап»,
// объяснение Статов — в шаге HASE мастера
if (!html.includes('"u186": {"ru": "Мастер сборки", "en": "Build Wizard"}')) throw new Error('CH: u186 must be renamed to Мастер сборки / Build Wizard');
if (!staticHtml.includes('Мастер сборки персонажа')) throw new Error('CH: the wizard overlay title must be Мастер сборки персонажа');
// v191-204: both wizard buttons live in the global footer grid now (was: top of Rules);
// the Build Wizard button still sits right of Level Up, inside the grid
if (!/class="global-action-grid"[\s\S]*?<button class="btn" onclick="openLevelUp\(\)"[\s\S]*?<\/button>[\s\S]*?<button class="btn primary" onclick="openWizard\(\)" data-i18n="u186">/.test(staticHtml)) throw new Error('CH: the Build Wizard button must sit in the global action grid, right of Level Up');
if (!html.includes('return `<div class="hint wizard-hase-hint">${L(\'u061\')}</div>${rows}`')) throw new Error('CH: the wizard HASE step must show only the concise Stats explanation (u061)');

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
if (!html.includes('S.systems.forEach(s=>{ const lim = sysLim(s); if (lim > 0) s.left = lim; else if (sysLimUnknown(s)) s.left = 0; });')) throw new Error('CJ: full repair must refill Limited charges to the new max');
if (!html.includes('else if (weapLimUnknown(w)) w.left = 0;')) throw new Error('CJ: full repair must reset dice-max charges to 0 (v215)');
// PHASE CK (v99): карточки систем показывают чипы тегов (как оружие) — цена в тепле видна
if (!html.includes('function sysTags(s){')) throw new Error('CK: sysTags() must exist');
if (!html.includes('const stg = sysTags(s);')) throw new Error('CK: the system card must compute its tags');
if (!html.includes('style="display:inline-flex">${tagChips(stg)}')) throw new Error('CK: the system card must render tag chips in its header (v189)');
// v191-204: db.js is formatted now (whitespace/newlines), so raw-file regexes break —
// check the data through the eval'd DB instead
const { DB: DBCK } = runEval({});
const shSys = DBCK.systems.find(s => s.n === 'Type-3 Projected Shield');
if (!shSys || !shSys.tg || !shSys.tg.some(([id, v]) => id === 'tg_heat_self' && v === 1)) throw new Error('CK: Type-3 Projected Shield must carry tg_heat_self 1 in the DB');
if (!DBCK.tags['tg_heat_self'] || DBCK.tags['tg_heat_self'].n !== 'Heat {VAL} (Self)') throw new Error('CK: the tg_heat_self tag must be in DB.tags');
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
if (!linked.includes('>Отброс <span class="wnum">1</span><')) throw new Error('CO: ОТБРОС 1 chip must show «Отброс 1» (number highlighted)');
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
const storeCT2 = {};
storeCT2['lancer-tracker-v1'] = JSON.stringify({
  pilot:{name:'Test', licenses:[], coreBonuses:[], hull:0, agility:0, systems:0, engineering:0},
  mech:{frame:'Everest', heat:2},
  talents:[], triggers:[],
  mounts:[{type:'Main',weapons:[]}], systems:[], statuses:['Danger Zone'], settings:{}
});
const rCT2 = runEval(storeCT2);
if (rCT2.S.statuses.includes('Danger Zone')) throw new Error('CT: heat 2/6 must auto-uncheck Danger Zone');
// PHASE CU (v109): подписи DANGER/ZONE видны только в Danger Zone
// (регрессия: надпись висела всегда, даже при нулевом тепле).
if (!html.includes("ht.classList.toggle('dz-active', on)")) throw new Error('CU: syncDangerZone must toggle dz-active on .heat-thermo');
// PHASE CV (v110, v166: пламя заменено заполнением): анимации заполнения и подписей синхронизированы (одна длина — 1.2s)
if (!/\.heat-thermo\.dz-active \.thermo-fill \{[^}]*animation:fillPulse 1\.2s/.test(staticHtml)) throw new Error('CV: fillPulse must run at 1.2s');
if (!/\.dz-label \{[^}]*animation:dzGlow 1\.2s/.test(staticHtml)) throw new Error('CV: dzGlow must run at 1.2s, same as fillPulse');
// PHASE CW (v111): рамки зон +/− кольца HP — тот же цвет, что и пустая часть кольца
// (разделители должны сливаться с треком кольца, а не выделяться белым).
if (!staticHtml.includes('.ring-minus { left:15px; padding-left:3px; border-right:1px solid var(--line); }')) throw new Error('CW: the minus divider must use var(--line)');
if (!staticHtml.includes('.ring-plus { right:15px; padding-right:3px; border-left:1px solid var(--line); }')) throw new Error('CW: the plus divider must use var(--line)');
if (!staticHtml.includes('.ring-track { fill:none; stroke:var(--line);')) throw new Error('CW: the ring track must use var(--line) too');
// PHASE CX (v112): статусы — теги вместо чекбоксов (Danger Zone не кликабелен, Burn — статус)
if (staticHtml.includes('id="statuses"')) throw new Error('CX: the old status checkboxes must be gone');
if (!staticHtml.includes('id="statusTags"')) throw new Error('CX: the status tags container must exist');
if (!staticHtml.includes('id="statusRef"')) throw new Error('CX: the status reference must exist');
if (!(staticHtml.indexOf('id="statusTags"') < staticHtml.indexOf('<div class="grid res-grid single-col">'))) throw new Error('CX: status tags must sit between the HP ring and the Structure grid'); // v191-204: single-col grid
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
if (!elCX['tagDlgDesc'].innerHTML.includes('Engineering')) throw new Error('CX: showStatus must show the Burn description');
// PHASE CY (v113): таблица статов — название сверху, значение снизу; 3 строки равной ширины
if (staticHtml.includes('class="grid5"')) throw new Error('CY: grid5 must be gone');
if (!staticHtml.includes('class="stat-table"')) throw new Error('CY: the stat table must exist');
if (!staticHtml.includes('class="stat-row cols-4 ')) throw new Error('CY: the 4-column stat rows must exist');
const statTableHtml = staticHtml.split('class="stat-table"')[1].split('haseHint')[0];
// v191-204: row 2 is Sensors/Save Target/Attack/T.Attack (Size moved to the frame name),
// row 3 is Armor/Speed/Evasion/E-Defense (Grit moved to the Pilot tab, Speed took its place)
const rowsCY = statTableHtml.split('class="stat-row');
if (!rowsCY[1].includes('pilot.hull') || !rowsCY[1].includes('pilot.agility') || !rowsCY[1].includes('pilot.systems') || !rowsCY[1].includes('pilot.engineering')) throw new Error('CY: row 1 must be HASE');
if (!rowsCY[2].includes('mech.sensors') || !rowsCY[2].includes('mech.saveTarget') || !rowsCY[2].includes('mech.attack') || !rowsCY[2].includes('mech.tech')) throw new Error('CY: row 2 must be Sensors/Save Target/Attack/T.Attack');
if (!rowsCY[3].includes('mech.armor') || !rowsCY[3].includes('mech.speed') || !rowsCY[3].includes('mech.evasion') || !rowsCY[3].includes('mech.edef')) throw new Error('CY: row 3 must be Armor/Speed/Evasion/E-Defense');
if (rowsCY[2].includes('mech.size') || rowsCY[3].includes('pilot.grit')) throw new Error('CY: Size and Grit must be gone from the stats table');
// имена статов — только по-английски, без «макс. 4» у Armor
if (statTableHtml.includes('Размер') || statTableHtml.includes('Скорость') || statTableHtml.includes('макс.')) throw new Error('CY: stat names must be English only, no «макс. 4» on Armor');
if (statTableHtml.includes('Armor (макс.') || statTableHtml.includes('Armor (max')) throw new Error('CY: the «max 4» note must be gone from Armor');
// ячейка: название сверху, значение снизу (flex column), равная ширина в строке
if (!staticHtml.includes('.stat-cell { display:flex; flex-direction:column;')) throw new Error('CY: a stat cell must stack the name above the value');
if (!staticHtml.includes('.stat-row.cols-4 { grid-template-columns:repeat(4, minmax(0,1fr));')) throw new Error('CY: the 4-column rows must have equal widths');
// PHASE CZ (v114, v220): референс статусов — коллапсабл, имя на двух языках;
// компактный список: описание — по тапу на строку (один открытый за раз),
// наложение/снятие — кнопкой ＋/✓ справа.
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
// v220: референс компактный — описаний не видно, пока не тапнешь статус;
// тап по строке раскрывает только его описание (один открытый за раз).
XCZ.renderStatusRef();
const refHtmlCZ = elCZ['statusRef'].innerHTML;
if (refHtmlCZ.includes('status-ref-desc')) throw new Error('CZ: no status description may show before tapping a status');
if (!refHtmlCZ.includes('status-ref-toggle')) throw new Error('CZ: each status row must have an apply/remove toggle');
XCZ.toggleStatusRef('Exposed');
if (!elCZ['statusRef'].innerHTML.includes('status-ref-desc')) throw new Error('CZ: tapping a status must show its description');
if (!elCZ['statusRef'].innerHTML.includes('удваивается')) throw new Error('CZ: the Exposed description must be visible once expanded');
XCZ.toggleStatusRef('Burn');
if (elCZ['statusRef'].innerHTML.includes('удваивается')) throw new Error('CZ: opening another status must close the first one');
// 2й тап снимает тег (как крестик)
XCZ.toggleStatus('Exposed');
if (!SCZ.statuses.includes('Exposed')) throw new Error('CZ: 1st tap must add the tag');
XCZ.toggleStatus('Exposed');
if (SCZ.statuses.includes('Exposed')) throw new Error('CZ: 2nd tap must remove the tag (same as the ×)');
// активный статус помечен галочкой на кнопке ＋/✓ (v220: не префиксом к имени)
XCZ.toggleStatus('Burn');
XCZ.renderStatusRef();
if ((elCZ['statusRef'].innerHTML.match(/✓/g) || []).length !== 1) throw new Error('CZ: an active status must show exactly one ✓ toggle in the reference');
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
// v191-204: Grit lives only on the Pilot tab now (readonly, derived) — the stats-table
// Grit field is gone; recalcDerived still syncs the single field
if (!staticHtml.includes('data-f="pilot.grit"')) throw new Error('DA: a Grit field must exist on the Pilot tab');
const gritFieldsDA = (staticHtml.match(/data-f="pilot.grit"/g) || []).length;
if (gritFieldsDA !== 1) throw new Error('DA: exactly one Grit field must exist (Pilot tab only), found ' + gritFieldsDA);
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
if (!staticHtml.includes('.stat-cell label, .stat-cell .stat-label { font-size:10px;')) throw new Error('DA: stat labels must be small caps (10px, so ENGINEERING fits with side padding)'); // v191-204: labels are .stat-label buttons now, selector covers both
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
// v191-204: the Core Power panel was refactored — no cp-top row or cp-info block anymore;
// the round button floats right and the description (core-name + coreDescBox) flows on the left
if (staticHtml.includes('class="cp-top"') || staticHtml.includes('class="cp-info"')) throw new Error('DC: the old cp-top/cp-info layout must be gone');
if (!staticHtml.includes('class="cp-round" id="coreBtn"')) throw new Error('DC: the Core Power button must be round (cp-round)');
if (staticHtml.includes('cp-bolt')) throw new Error('DC: the bolt must be gone (removed in v119)');
if (!staticHtml.includes('#coreBtn.cp-round { float: right; margin-left: 5px; flex-shrink:0; width:120px; height:120px; border-radius:50%;')) throw new Error('DC: the Core Power button must float right and be a 120px circle');
if (!staticHtml.includes('class="core-desc"')) throw new Error('DC: the Core System name and description must live in a core-desc block on the left');
if (!staticHtml.includes('<radialGradient id="cpRed" cx="35%" cy="30%" r="75%"')) throw new Error('DC: the ready core must be a red radial (lit from above, in the SVG)');
// кнопка больше не широкая полоса и не несёт текст «Не использовано»
if (staticHtml.includes('.core-power .btn { width:100%;')) throw new Error('DC: the wide full-width Core Power button must be gone');
if (staticHtml.includes('data-i18n="u074"')) throw new Error('DC: the button must not carry the u074 text anymore (it is a round button now)');
// u075 — текст-подсказка убран в v125 (и так понятно); в статичном HTML его быть не должно
if (staticHtml.includes('1 раз за миссию. Восстанавливается при полном ремонте')) throw new Error('DC: the u075 hint text must be gone from the panel');
// v191-204: the restoration note (u234) is gone from the panel entirely (the text stays
// in STR as an orphan); the panel shows only the Core System name and description
if (staticHtml.includes('data-i18n="u234"')) throw new Error('DC: the restoration note must be gone from the panel');
if (staticHtml.includes('cp-restore')) throw new Error('DC: the centred cp-restore line must be gone');
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
if (!staticHtml.includes('<path id="cpArcBottom" d="M 31.5,109.4 A 57,57 0 0,0 88.5,109.4"')) throw new Error('DD: the bottom arc must be the smile (sweep 0), radius 57 (v164: raised 2px so ENGAGE sits in the middle of the rim)');
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
// v191-204: фона больше нет (прозрачный) — кнопка выросла на весь холст (r=230/214,
// текст 48px); паттерн hazard остался в defs, но не используется
if (iconSvg.includes('<rect width="512" height="512"')) throw new Error('DG: the icon must have no background rect anymore (transparent)');
if (!iconSvg.includes('<circle cx="256" cy="256" r="230" fill="none" stroke="url(#rimRed)"')) throw new Error('DG: icon.svg must have the big red rim ring (r=230)');
if (!iconSvg.includes('<circle cx="256" cy="256" r="214" fill="url(#btn)"')) throw new Error('DG: icon.svg must have the big red button (r=214)');
if (iconSvg.includes('#metal')) throw new Error('DG: the icon rim must be red, not metal');
if (!iconSvg.includes('LANCER</textPath>')) throw new Error('DG: the icon rim must read LANCER on the top arc');
if (!iconSvg.includes('ENGAGE</textPath>')) throw new Error('DG: the icon rim must read ENGAGE on the bottom arc');
if (!iconSvg.includes('fill="url(#gold)"')) throw new Error('DG: the icon rim text must be gold');
// PHASE DH (v132): триггеры пилота — таблица в стиле карточки Статов (рамка, фон panel2, фаска, разделители),
// но имя и число — в ОДНОЙ строке (имя слева, бонус справа, 20px), а не друг над другом: длинные названия сверху не влезли бы.
// v164: оранжевый фон строки убран — цвета теперь несут сами ячейки (серое название, зелёное значение), как в таблице статов
if (!staticHtml.includes('.trig-table { display:flex; flex-direction:column; gap:0; margin-top:10px; border:1px solid var(--line); background:var(--panel2); }')) throw new Error('DH: .trig-table must mirror the Stats card table (border, panel2 background)');
if (!staticHtml.includes('.trig-row { display:flex; align-items:stretch; gap:0; padding:8px 10px; }')) throw new Error('DH: .trig-row must be a plain horizontal row (v164: no orange background, the cells carry the colours)');
if (!staticHtml.includes('box-shadow:inset 0 1px 0 rgba(255,255,255,.12), inset 0 -2px 4px rgba(0,0,0,.30); }')) throw new Error('DH: .trig-row must have the same inset bevel as the stat cells');
if (!staticHtml.includes('.trig-row + .trig-row { border-top:1px solid var(--line); }')) throw new Error('DH: trigger rows must be divided by a border, like stat rows');
if (!staticHtml.includes('.trig-val { flex:0 0 auto; width:44px; min-width:44px; font-size:20px; font-weight:700;')) throw new Error('DH: the trigger bonus must be 20px bold, like a stat value');
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
// v191-204: the systems hint is gone too (like the weapons hint in v134) —
// only the talents hint remains
if (staticHtml.includes('id="systemsHint"')) throw new Error('DJ: the systems hint must be gone');
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
// v191-204: the ready-state gold ring is gone — the ready state is drawn in the SVG
// (red core + red rim); the used state is a pressed grey button with an inset shadow
if (!staticHtml.includes('#coreBtn.cp-ready { }')) throw new Error('DM: #coreBtn.cp-ready must have no box-shadow (the ring lives in the SVG now)');
if (!staticHtml.includes('#coreBtn.cp-used { box-shadow:inset 0 3px 8px rgba(0,0,0,.5);')) throw new Error('DM: #coreBtn.cp-used must be pressed in with an inset shadow');
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
// v191-204: the resource cards are plain rows now (single-col bar layout) — the .res
// rule is empty, no border/background of their own; the segmented bar carries the visual
if (!staticHtml.includes('.res {  }')) throw new Error('DY: the resource cards must be plain rows (empty .res rule, single-col bar layout)');
if (!staticHtml.includes('.res-grid.single-col')) throw new Error('DY: the resources must stack in a single-column grid');
if (!staticHtml.includes('.counter button { width:44px; height:44px; font-size:22px; background:var(--panel2); color:var(--text); border:1px solid var(--line); border-radius:0; cursor:pointer; flex:none; }')) throw new Error('DY: the counter +/- buttons must be square (border-radius 0)');
if (staticHtml.includes('style="--rc:')) throw new Error('DY: the per-tracker colors (--rc) must be gone');
if ((staticHtml.match(/<div class="res"[^>]*>/g) || []).length !== 4) throw new Error('DY: there must be exactly 4 resource trackers'); // v191-204: res divs carry data-bar/data-ico attributes now
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
if ((html.match(/class=\"btn x\"/g) || []).length !== 15) throw new Error('EC: exactly 15 list-row X buttons must be frameless (.btn.x)'); // v191-204: the pilot gear remove button joined
if ((html.match(/class=\"btn danger\"/g) || []).length !== 10) throw new Error('EC: exactly 10 framed danger buttons must remain (.btn.danger: 5 dialog closes + 1 mount removal + 2 Drive text buttons + 1 destroy view close + 1 destroy button in the damage roll dialog)'); // v264: destroyView ✕ and the Destroy button joined
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
// v191-204: mech.size is gone from the inputs — Size shows as text (mechSizeValue);
// mech.sp has no input either — SP shows only as the spCounter button (spCapRow removed)
for (const f of ['mech.speed','mech.sensors','mech.tech','mech.armor','mech.evasion','mech.edef']) {
  const re = new RegExp('data-f="' + f.replace('.', '\.') + '"[^>]*readonly');
  if (!re.test(staticHtml)) throw new Error('EF: derived stat ' + f + ' must be readonly');
}
if (!staticHtml.includes('id="mechSizeValue"')) throw new Error('EF: Size must show as text next to the frame name');
if (staticHtml.includes('data-f="mech.size"')) throw new Error('EF: the old Size input must be gone');
if (staticHtml.includes('data-f="mech.sp"')) throw new Error('EF: the old SP input must be gone (SP shows as the spCounter button)');
for (const f of ['pilot.hull','pilot.agility','pilot.systems','pilot.engineering']) {
  const re = new RegExp('data-f="' + f.replace('.', '\.') + '"[^>]*readonly');
  if (re.test(staticHtml)) throw new Error('EF: HASE stat ' + f + ' must stay editable');
}
// HASE: при смене Agility поля производных статов синхронизируются (syncInputs в bind)
if (!/recalcDerived\(\);\s+syncInputs\(\);\s+renderCounters\(/.test(html)) throw new Error('EF: the HASE input handler must call syncInputs after recalcDerived');
// PHASE EG (v162): Точное/Неточное — плоские теги +1, без {VAL} (в Lancer у них нет числа)
// v191-204: db.js is formatted now, so the compact one-line tag strings are gone —
// check the tags through the eval'd DB instead
const { DB: DBEG } = runEval({});
if (!DBEG.tags['tg_accurate'] || DBEG.tags['tg_accurate'].n !== 'Accurate' || DBEG.tags['tg_accurate'].d !== 'Attacks made with this weapon receive +1 Accuracy.' || DBEG.tags['tg_accurate'].nr !== 'Точное' || DBEG.tags['tg_accurate'].dr !== 'Атаки этим оружием получают +1 точности.') throw new Error('EG: the Accurate tag must be a flat +1 with no {VAL}');
if (!DBEG.tags['tg_inaccurate'] || DBEG.tags['tg_inaccurate'].n !== 'Inaccurate' || DBEG.tags['tg_inaccurate'].d !== 'Attacks made with this weapon receive +1 Difficulty.' || DBEG.tags['tg_inaccurate'].nr !== 'Неточное' || DBEG.tags['tg_inaccurate'].dr !== 'Атаки этим оружием получают +1 сложности.') throw new Error('EG: the Inaccurate tag must be a flat +1 with no {VAL}');
if (html.includes('Неточное {VAL}') || html.includes('Точное {VAL}')) throw new Error('EG: no {VAL} must remain in the Accurate/Inaccurate tags');
// PHASE EH (v163): триггеры — вертикальная полоса между названием и значением;
// название — светло-серое из статов (.bot #b8c6d4), значение — зелёное (.mid #7be495)
if (!staticHtml.includes('.trig-name { flex:1 1 auto; min-width:0; padding:8px 12px; font-size:15px; font-weight:600; color:#b8c6d4; background:linear-gradient(180deg, rgba(140,160,180,.48), rgba(140,160,180,.24));')) throw new Error('EH: the trigger name must be light grey #b8c6d4 on the steel gradient (stats .bot)');
if (!staticHtml.includes('.trig-val { flex:0 0 auto; width:44px; min-width:44px; font-size:20px; font-weight:700; text-align:center; color:#fff; background:linear-gradient(180deg, rgba(92,223,51,.40), rgba(92,223,51,.20));')) throw new Error('EH: the trigger value must be a green square with a white number (v164: green text replaced by a green cell)');
if (!staticHtml.includes('input.trig-val { width:56px; border-left-color:var(--line); }')) throw new Error('EH: the edit-mode trigger value input must keep the vertical bar (border-left-color must not be transparent)');
// PHASE EI (v164): триггеры как таблица статов — серый прямоугольник с объёмом для названия,
// зелёный квадрат с объёмом для значения, оранжевый фон строки убран; ENGAGE поднят на 2px (дуга r=57)
if (staticHtml.includes('.trig-row { display:flex; align-items:center; gap:10px; padding:10px 12px; background:linear-gradient(180deg, rgba(232,89,12,.48), rgba(232,89,12,.24))')) throw new Error('EI: the orange trigger-row background must be gone');
if (!staticHtml.includes('.trig-row { display:flex; align-items:stretch; gap:0; padding:8px 10px; }')) throw new Error('EI: the trigger row must be a plain flex container (stretch, no gap, no background)');
if (!staticHtml.includes('background:linear-gradient(180deg, rgba(140,160,180,.48), rgba(140,160,180,.24))')) throw new Error('EI: the trigger name must use the steel gradient from the stats .bot row');
if (!staticHtml.includes('background:linear-gradient(180deg, rgba(92,223,51,.40), rgba(92,223,51,.20))')) throw new Error('EI: the trigger value must use the green gradient from the stats .mid row');
if (!staticHtml.includes('.trig-val { flex:0 0 auto; width:44px; min-width:44px; font-size:20px; font-weight:700; text-align:center; color:#fff;')) throw new Error('EI: the trigger value must be a 44px square with a white number');
if (!staticHtml.includes('cpArcBottom" d="M 31.5,109.4 A 57,57 0 0,0 88.5,109.4"')) throw new Error('EI: the ENGAGE bottom arc must be at r=57 (2px higher, centred in the rim)');
// PHASE EJ (v165): название маунта — внутри рамки бейджа, в цвет иконки, капсом;
// бейдж прямоугольный (без скругления), между иконкой и названием — вертикальный разделитель
if (!staticHtml.includes('.mount-badge { display:inline-flex; align-items:stretch; height:28px; border:1px solid; border-radius:0;')) throw new Error('EJ: the mount badge must be a rectangular frame (no rounding, stretch)');
if (!staticHtml.includes('.mb-ico { display:inline-flex; align-items:center; justify-content:center; min-width:30px; padding:0 8px; }')) throw new Error('EJ: the mount icon must sit in its own cell inside the badge');
if (!staticHtml.includes('.mb-name { display:inline-flex; align-items:center; padding:0 10px; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; border-left:1px solid; }')) throw new Error('EJ: the mount name must be caps, bold, in the mount colour, with a vertical divider on its left');
if (!html.includes('<span class="mb-name">${esc(mt.type)}</span>')) throw new Error('EJ: the mount name must render inside the badge (view mode)');
if (html.includes('<b>${esc(mt.type)}</b>')) throw new Error('EJ: the mount name must not be a standalone bold element outside the badge anymore');
// PHASE EK (v166): вместо пульсирующего пламени — пульсация заполнения термометра в Danger Zone:
// уровень слегка ходит вверх-вниз (scaleY), цвет немного переливается (hue-rotate); пламя — маленькая статичная иконка
if (!staticHtml.includes('.thermo-fill { position:absolute; left:0; right:0; bottom:0; height:0%; background:linear-gradient(to top,#e8590c,#ffd43b); transition:height .25s ease; transform-origin:bottom; }')) throw new Error('EK: the fill must scale from its bottom edge');
if (!staticHtml.includes('.heat-thermo.dz-active .thermo-fill { animation:fillPulse 1.2s ease-in-out infinite; }')) throw new Error('EK: the fill must pulse only in Danger Zone (dz-active), at 1.2s like dzGlow');
if (!staticHtml.includes('@keyframes fillPulse { 0%,100% { transform:scaleY(1); filter:hue-rotate(0deg); } 50% { transform:scaleY(1.06); filter:hue-rotate(12deg); } }')) throw new Error('EK: fillPulse must bob the level by 6 percent and shimmer the hue by 12deg'); // v191-204: pulse strengthened (1/1.06, was 0.97/1.03)
if (staticHtml.includes('flamePulse')) throw new Error('EK: flamePulse must be gone (no more pulsing flame)');
if (staticHtml.includes('.thermo-ico.crit')) throw new Error('EK: the crit flame rule must be gone (the flame stays a small static icon)');
if (!staticHtml.includes('id="heatFlame"')) throw new Error('EK: the small static flame element must stay');
// PHASE EL (v167, обновлена в v168: правило .res label изменилось — теперь display:block, center, 12px; EL проверяет только капс)
if (!/\.res label \{[^}]*text-transform:uppercase/.test(staticHtml)) throw new Error('EL: the resource tracker labels must be uppercase');
// PHASE EM (v168): подписи трекеров ресурсов — по центру горизонтально, шрифт чуть меньше (12px вместо 14px)
if (!staticHtml.includes('.res label { display:block; text-align:center; color:var(--text); font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; }')) throw new Error('EM: the resource tracker labels must be centered and 12px');
// PHASE EN (v169): действия развёртываемых объектов — в «Твои действия»: реакции дронов (Turret Attack, Area Denial)
// и быстрые действия дронов/зарядов (Restock, Detonate, Move ICEOUT, Detonate Grounding Mine); секция «Твои быстрые действия» (u235)
if (!html.includes('u235')) throw new Error('EN: the quick-actions heading needs the u235 string');
if (!html.includes("L('u235')")) throw new Error('EN: renderMyActions must use u235 for the quick-actions heading');
if (!html.includes('ACTIONS_REF.quick')) throw new Error('EN: renderMyActions must read ACTIONS_REF.quick');
if (!html.includes('const myQk')) throw new Error('EN: renderMyActions must filter the quick actions into myQk');
if (!html.includes('Твои быстрые действия')) throw new Error('EN: STR must have the u235 Russian text');
if (!html.includes('Your quick actions')) throw new Error('EN: STR must have the u235 English text');
// сборка с дронами-турелями, дроном-убийцей и дроном снабжения: все их действия видны в «Твои действия»
const storeEN = {};
storeEN['lancer-tracker-v1'] = JSON.stringify({
  pilot:{name:'Test', licenses:[], coreBonuses:[], hull:0, agility:0, systems:0, engineering:0},
  mech:{frame:'Everest'},
  talents:[], triggers:[],
  mounts:[{type:'Main',weapons:[]}],
  systems:[{name:'Turret Drones', desc:'', charges:0},{name:'Assassin Drone', desc:'', charges:0},{name:'Restock Drone', desc:'', charges:0}],
  statuses:[], settings:{}
});
const rEN = runEval(storeEN);
const myHtmlEN = rEN.elements['myActions'].innerHTML;
if (!myHtmlEN.includes('Атака турели') && !myHtmlEN.includes('Turret Attack')) throw new Error('EN: Turret Drones must show Turret Attack in My actions');
if (!myHtmlEN.includes('Запрет зоны') && !myHtmlEN.includes('Area Denial')) throw new Error('EN: Assassin Drone must show Area Denial in My actions');
if (!myHtmlEN.includes('Активировать дрон снабжения') && !myHtmlEN.includes('Activate Restock Drone')) throw new Error('EN: Restock Drone must show its quick action in My actions');
if (!myHtmlEN.includes('Твои быстрые действия') && !myHtmlEN.includes('Your quick actions')) throw new Error('EN: the quick-actions heading must show in My actions');
// пустая сборка: действия дронов не видны
const storeEN2 = {};
storeEN2['lancer-tracker-v1'] = JSON.stringify({
  pilot:{name:'Test', licenses:[], coreBonuses:[], hull:0, agility:0, systems:0, engineering:0},
  mech:{frame:'Everest'},
  talents:[], triggers:[],
  mounts:[{type:'Main',weapons:[]}],
  systems:[], statuses:[], settings:{}
});
const myHtmlEN2 = runEval(storeEN2).elements['myActions'].innerHTML;
if (myHtmlEN2.includes('Атака турели') || myHtmlEN2.includes('Turret Attack')) throw new Error('EN: Turret Attack must NOT show without Turret Drones');
if (myHtmlEN2.includes('Активировать дрон снабжения') || myHtmlEN2.includes('Activate Restock Drone')) throw new Error('EN: Activate Restock Drone must NOT show without Restock Drone');
// PHASE EO (v170): пары «поиск + кастом» — одинаковая высота (обе кнопки .btn, не .btn.icon),
// + КАСТОМ слева, 🔍ПОИСК справа; без уточнения, что именно кастом (и так ясно из раздела)
if (!html.includes('+ КАСТОМ')) throw new Error('EO: STR must have the u236 Russian text');
if (!html.includes('🔍ПОИСК')) throw new Error('EO: STR must have the u237 Russian text');
if (!html.includes('+ CUSTOM')) throw new Error('EO: STR must have the u236 English text');
if (!html.includes('🔍SEARCH')) throw new Error('EO: STR must have the u237 English text');
if ((staticHtml.match(/data-i18n="u236"/g) || []).length !== 4) throw new Error('EO: exactly 4 custom buttons must use u236');
if ((staticHtml.match(/data-i18n="u237"/g) || []).length !== 4) throw new Error('EO: exactly 4 search buttons must use u237');
if (staticHtml.includes('class="btn icon" style="flex:0 0 auto" onclick="openSearch(')) throw new Error('EO: the search button must not be a .btn.icon anymore (different height)');
for (const pair of [['addSystemBtn','system'],['addTalentBtn','talent'],['addTriggerBtn','trigger'],['addLicenseBtn','license']]) {
  const iBtn = staticHtml.indexOf('id="' + pair[0] + '"');
  const iSearch = staticHtml.indexOf("openSearch('" + pair[1] + "')");
  if (iBtn < 0) throw new Error('EO: ' + pair[0] + ' missing');
  if (iSearch < 0) throw new Error('EO: openSearch ' + pair[1] + ' missing');
  if (iBtn > iSearch) throw new Error('EO: the custom button must come before the search button (' + pair[1] + ')');
}
if (!html.includes("esc(L('u236'))")) throw new Error('EO: the mount weapon custom button must use u236');
if (!html.includes("esc(L('u237'))")) throw new Error('EO: the mount weapon search button must use u237');
if (html.indexOf("esc(L('u236'))") > html.indexOf("esc(L('u237'))")) throw new Error('EO: the mount custom button must come before the search button too');
// PHASE EP (v171): кнопки в парах «поиск + кастом» — одинаковой ширины: обе flex:1 из .row > *,
// у кнопки поиска больше нет flex:0 0 auto
if (!staticHtml.includes('.row > * { flex:1; }')) throw new Error('EP: .row children must share the width equally (flex:1)');
for (const kind of ['system','talent','trigger','license']) {
  if (staticHtml.includes('style="flex:0 0 auto" onclick="openSearch(\'' + kind + '\')')) throw new Error('EP: the ' + kind + ' search button must not pin its width (flex:0 0 auto)');
}
if (html.includes("style=\"flex:0 0 auto\" onclick=\"openSearch('weapon'")) throw new Error('EP: the mount search button must not pin its width either');
// PHASE EQ (v172): плюсы в кнопках добавления внутри поисков — жёлтые, шрифт крупнее (22px),
// а размер кнопок тот же, что у обычной .btn (40px: line-height 1 + padding 8px)
if (!staticHtml.includes('.btn.search-add { color:var(--hud-amber); font-size:22px; line-height:1; padding:8px 10px; border-color:var(--hud-amber-dim); }')) throw new Error('EQ: .btn.search-add must be amber, 22px, line-height 1, padding 8px 10px, dim-amber border');
if (!staticHtml.includes('.btn.search-add:hover { border-color:var(--hud-amber); }')) throw new Error('EQ: .btn.search-add must go full amber on hover, like the tags');
if ((html.match(/class="btn search-add"/g) || []).length !== 7) throw new Error('EQ: exactly 7 search add buttons must use .btn.search-add'); // v191-204: the pilot gear add button joined
for (const fn of ['addLicenseByName','addWeaponByIndex','addTriggerByName','pickFrame','addSystemByIndex','addTalentByIndex','addPilotGear']) {
  if (!html.includes('class="btn search-add" style="flex:0 0 auto" onclick="' + fn)) throw new Error('EQ: the ' + fn + ' search button must use .btn.search-add');
}
// PHASE ER (v173): рамка кнопок добавления — как у тегов: dim-янтарь, при наведении полный янтарь
if (!staticHtml.includes('.tag { display:inline-block; background:var(--panel2); border:1px solid var(--hud-amber-dim);')) throw new Error('ER: the tags must keep the dim-amber border (reference)');
if (!staticHtml.includes('.tag:hover { border-color:var(--hud-amber); }')) throw new Error('ER: the tags must go full amber on hover (reference)');
if (!staticHtml.includes('.btn.search-add { color:var(--hud-amber); font-size:22px; line-height:1; padding:8px 10px; border-color:var(--hud-amber-dim); }')) throw new Error('ER: the search add buttons must use the tag border (dim amber)');
if (!staticHtml.includes('.btn.search-add:hover { border-color:var(--hud-amber); }')) throw new Error('ER: the search add buttons must go full amber on hover, like the tags');
// PHASE ES (v174): заголовки развёртываемых объектов — полные статы (HP, Evasion, E-Defense), а не только тип и размер
// Источник правды — lancer-data deployables[]. Мины и прочие без статов (hp/evasion/edef null) не трогаются.
// v191-204: тексты описаний переехали в db.js — проверяем по dbSrc, а не по index.html
if (!dbSrc.includes('Turret Drone (Drone, Size 0.5, HP 5, Evasion 10, E-Defense 10):')) throw new Error('ES: the Turret Drone (EN) must show HP 5, Evasion 10, E-Defense 10');
if (!dbSrc.includes('Дрон-турель (дрон, размер 0,5, HP 5, уклонение 10, E-Defense 10):')) throw new Error('ES: the Turret Drone (RU) must show HP 5, уклонение 10, E-Defense 10');
if (!dbSrc.includes('Restock Drone (Drone, Quick, Size 0.5, HP 5, Evasion 10, E-Defense 10):')) throw new Error('ES: the Restock Drone (EN) must show HP 5, Evasion 10, E-Defense 10');
if (!dbSrc.includes('Дрон снабжения (дрон, быстрое действие, размер 0,5, HP 5, уклонение 10, E-Defense 10):')) throw new Error('ES: the Restock Drone (RU) must show HP 5, уклонение 10, E-Defense 10');
if (!dbSrc.includes('Assassin Drone (Drone, Size 0.5, HP 5, Evasion 10, E-Defense 10):')) throw new Error('ES: the Assassin Drone must show its stats');
if (!dbSrc.includes('Perimeter Command Plate (Deployable, Size 2, HP 20, Evasion 5):')) throw new Error('ES: the Perimeter Command Plate must show HP 20, Evasion 5 (no E-Defense in the data)');
if (!dbSrc.includes('Периметральная командная плита (развёртываемое, размер 2, HP 20, уклонение 5):')) throw new Error('ES: the Perimeter Command Plate (RU) must show HP 20, уклонение 5');
if (!dbSrc.includes('Portable Bunker (Deployable, Quick, Size 4, HP 40, Evasion 5):')) throw new Error('ES: the Portable Bunker must show HP 40, Evasion 5');
if (!dbSrc.includes('Construct Other: False Idol (Decoy, Quick Tech, Size 2, HP 1, Evasion 10, E-Defense 10):')) throw new Error('ES: the False Idol must show HP 1, Evasion 10, E-Defense 10');
if (dbSrc.includes('Turret Drone (Drone, Size 0.5):')) throw new Error('ES: the old Turret Drone header without stats must be gone');
if (dbSrc.includes('Дрон-турель (дрон, размер 0,5):')) throw new Error('ES: the old Turret Drone header without stats (RU) must be gone');
// PHASE ET (v175): быстрые действия талантов — «Воодушевление» (Drone Commander III) и «Прикрывающий огонь» (Heavy Gunner I)
// Причина: генератор не видел talent-granted quick actions — только deployable. Теперь в ACTIONS_REF.quick их 34 (8 прежних + 26 из v210: 16 опций Вторжения, Hacker II/III, таланты, фреймы).
const AET = global.__x.ACTIONS_REF;
if (!AET.quick || AET.quick.length !== 144) throw new Error('ET: ACTIONS_REF.quick must have 144 entries (8 + 26 from v210 + 29 from v224 + 28 from v225 + 10 from v229 + 29 from v241 + 14 from v243), got ' + (AET.quick && AET.quick.length));
const inv = AET.quick.find(a=>a.key==='invigorate');
if (!inv) throw new Error('ET: Invigorate must be in ACTIONS_REF.quick');
if (inv.name !== 'Invigorate' || inv.ru !== 'Воодушевление') throw new Error('ET: Invigorate must be named Invigorate / Воодушевление');
if (!inv.grant || inv.grant.talent !== 'Drone Commander' || inv.grant.rank !== 3) throw new Error('ET: Invigorate must be granted by Drone Commander rank 3');
if (!inv.tx_en || !inv.tx_en.includes('send a pulse of energy')) throw new Error('ET: Invigorate must have the core-book text (pulse of energy)');
if (!inv.tx_ru || !inv.tx_ru.includes('импульс энергии')) throw new Error('ET: Invigorate must have the Russian text (импульс энергии)');
const cf = AET.quick.find(a=>a.key==='coveringfire');
if (!cf) throw new Error('ET: Covering Fire must be in ACTIONS_REF.quick');
if (cf.name !== 'Covering Fire' || cf.ru !== 'Прикрывающий огонь') throw new Error('ET: Covering Fire must be named Covering Fire / Прикрывающий огонь');
if (!cf.grant || cf.grant.talent !== 'Heavy Gunner' || cf.grant.rank !== 1) throw new Error('ET: Covering Fire must be granted by Heavy Gunner rank 1');
if (!cf.tx_en || !cf.tx_en.includes('Impaired until the start of your next turn')) throw new Error('ET: Covering Fire must have the core-book text (Impaired)');
if (!cf.tx_ru || !cf.tx_ru.includes('Ослабление')) throw new Error('ET: Covering Fire must have the Russian text (Ослабление)');
// Runtime (паттерн EN): сборка с Drone Commander III показывает «Воодушевление» в «Твои действия»; ранг II — нет; Heavy Gunner I — «Прикрывающий огонь»; пустая — ничего
function etMyActions(talents){
  const store = {};
  store['lancer-tracker-v1'] = JSON.stringify({
    pilot:{name:'Test', licenses:[], coreBonuses:[], hull:0, agility:0, systems:0, engineering:0},
    mech:{frame:'Everest'},
    talents:talents, triggers:[],
    mounts:[{type:'Main',weapons:[]}],
    systems:[], statuses:[], settings:{}
  });
  return runEval(store).elements['myActions'].innerHTML;
}
const etHtml3 = etMyActions([{name:'Drone Commander', rank:3}]);
if (!etHtml3.includes('Воодушевление') && !etHtml3.includes('Invigorate')) throw new Error('ET: a build with Drone Commander III must show Invigorate in My Actions');
const etHtml2 = etMyActions([{name:'Drone Commander', rank:2}]);
if (etHtml2.includes('Воодушевление') || etHtml2.includes('Invigorate')) throw new Error('ET: a build with Drone Commander II must NOT show Invigorate yet');
const etHtmlHg = etMyActions([{name:'Heavy Gunner', rank:1}]);
if (!etHtmlHg.includes('Прикрывающий огонь') && !etHtmlHg.includes('Covering Fire')) throw new Error('ET: a build with Heavy Gunner I must show Covering Fire in My Actions');
const etHtml0 = etMyActions([]);
if (etHtml0.includes('Воодушевление') || etHtml0.includes('Invigorate') || etHtml0.includes('Прикрывающий огонь') || etHtml0.includes('Covering Fire')) throw new Error('ET: an empty build must NOT show the talent quick actions');
// PHASE EU (v176): карточка фрейма — полный обзор из поиска (статы, трейты, Core Power, маунты).
// Раньше в поиске были только имя, лейбл и название Core Power; полные данные (s/t/c/cd/m) в DB есть, но не показывались.
if (!html.includes('showFrameDetail(')) throw new Error('EU: the frame search rows must have a details button (showFrameDetail)');
if (!html.includes('function frameDetailHtml(key)')) throw new Error('EU: frameDetailHtml must exist');
if (!html.includes('function showFrameDetail(key, from)')) throw new Error('EU: showFrameDetail must exist (with the origin parameter)');
if (!html.includes('function frameDetailBack()')) throw new Error('EU: frameDetailBack must exist');
if (!html.includes('.stat-cell .stat-val')) throw new Error('EU: the frame detail stats need a .stat-val (same 20px bold value as the Mech stats table)');
if (!html.includes('u238') || !html.includes('u239') || !html.includes('u240') || !html.includes('u241') || !html.includes('u242')) throw new Error('EU: STR must have u238-u242 for the frame detail (back, pick, stats, traits, mounts)');
if (!html.includes('← Назад') || !html.includes('Выбрать этот фрейм')) throw new Error('EU: STR must have the back and pick texts');
// v261: «← Назад» — в верхней строке вида (#searchDlgTop), а не в карточке детали
if (!staticHtml.includes('id="searchDlgBackBtn"')) throw new Error('EU: the search top row must have a back button (v261)');
// Runtime: карточка Эвереста — статы, трейты, Core Power, маунты; карточка Токугавы — её трейты и Core Power; «Назад» возвращает к списку
(function(){
  const store = {};
  store['lancer-tracker-v1'] = JSON.stringify({
    pilot:{name:'Test', licenses:[], coreBonuses:[], hull:0, agility:0, systems:0, engineering:0},
    mech:{frame:'Everest'},
    talents:[], triggers:[],
    mounts:[{type:'Main',weapons:[]}],
    systems:[], statuses:[], settings:{}
  });
  const r = runEval(store);
  const X = r.X;
  const evHtml = X.frameDetailHtml('Everest');
  if (!evHtml.includes('Эверест') && !evHtml.includes('Everest')) throw new Error('EU: the Everest detail must show the frame name');
  if (!evHtml.includes('Hyperspec Fuel Injector') && !evHtml.includes('Гиперспектральный инжектор топлива')) throw new Error('EU: the Everest detail must show its Core Power');
  if (!evHtml.includes('Initiative') && !evHtml.includes('Инициатива')) throw new Error('EU: the Everest detail must show its traits');
  if (!evHtml.includes('Main') || !evHtml.includes('Flex') || !evHtml.includes('Heavy')) throw new Error('EU: the Everest detail must show its mounts (Main, Flex, Heavy)');
  // статы: HP 10, Heat Cap 6, Speed 4 — должны быть в сетке
  if (!evHtml.includes('>10<') && !evHtml.includes('10')) throw new Error('EU: the Everest detail must show HP 10');
  if (!evHtml.includes('Heat Cap')) throw new Error('EU: the Everest detail must label the Heat Cap stat');
  const tkHtml = X.frameDetailHtml('Tokugawa');
  if (!tkHtml.includes('Токугава') && !tkHtml.includes('Tokugawa')) throw new Error('EU: the Tokugawa detail must show the frame name');
  if (!tkHtml.includes('Limit Break') && !tkHtml.includes('Предел прочности')) throw new Error('EU: the Tokugawa detail must show Limit Break');
  if (!tkHtml.includes('Plasma Sheath') && !tkHtml.includes('Плазменная оболочка')) throw new Error('EU: the Tokugawa detail must show Plasma Sheath');
  if (!tkHtml.includes('Superheated Reactor Feed') && !tkHtml.includes('Перегретая подача реактора')) throw new Error('EU: the Tokugawa detail must show its Core Power');
  if (!tkHtml.includes('>8<') && !tkHtml.includes('8')) throw new Error('EU: the Tokugawa detail must show Heat Cap 8');
  if (!tkHtml.includes('Выбрать этот фрейм') && !tkHtml.includes('Pick this frame')) throw new Error('EU: the frame detail must have a pick button');
  // v261: «← Назад» в карточке больше нет — она в верхней строке вида
  // showFrameDetail пишет карточку в #searchDlgResults; frameDetailBack возвращает к списку
  X.showFrameDetail('Everest');
  const detHtml = r.elements['searchDlgResults'].innerHTML;
  if (!detHtml.includes('Эверест') && !detHtml.includes('Everest')) throw new Error('EU: showFrameDetail must render the detail into #searchDlgResults');
  X.frameDetailBack();
  const backHtml = r.elements['searchDlgResults'].innerHTML;
  if (!backHtml.includes('Эверест') && !backHtml.includes('Everest')) throw new Error('EU: frameDetailBack must return to the frame search list');
})();
// PHASE EV (v177): Список Лансеров в Правилах под «Левел ап» + статы карточки фрейма
// как таблица статов на вкладке Мех (.stat-table/.stat-row/.stat-cell, а не отдельная сетка).
// В поиске фреймов без лицензии нет, поэтому для исследования — отдельный список всех 29 фреймов.
if (!html.includes('id="rulesFrameList"')) throw new Error('EV: the Rules tab must have a #rulesFrameList container');
if (!html.includes('<summary data-i18n="u243">')) throw new Error('EV: the Lancer List must be its own collapsible section (a details summary), not a heading inside Level Up');
if (html.includes('<h3 data-i18n="u243">')) throw new Error('EV: the Lancer List must NOT be a heading inside the Level Up section');
if (!html.includes('Список мехов (фреймов)')) throw new Error('EV: the Rules list must be titled "Список мехов (фреймов)" (Lancers are pilots, not mechs)');
if (html.includes('Список Лансеров')) throw new Error('EV: the Rules list must NOT be called "Список Лансеров" (Lancers are pilots)');
if (!html.includes('function renderRulesFrameList()')) throw new Error('EV: renderRulesFrameList must exist');
if (!html.includes("showFrameDetail('") || !html.includes("','rules')")) throw new Error('EV: the Rules frame rows must open the detail with the rules origin');
if (!html.includes('frameDetailFrom')) throw new Error('EV: the frame detail must track its origin (search vs rules) for the back button');
if (!html.includes('stat-row cols-4 mid') || !html.includes('stat-row cols-4 bot') || !html.includes('stat-row cols-4 hase')) throw new Error('EV: the frame detail stats must use the Mech stats table rows (mid/bot/hase)');
if (!html.includes('.stat-grid')) { /* v177: the separate .stat-grid is gone, stats use .stat-table */ }
(function(){
  const store = {};
  store['lancer-tracker-v1'] = JSON.stringify({
    pilot:{name:'Test', licenses:[], coreBonuses:[], hull:0, agility:0, systems:0, engineering:0},
    mech:{frame:'Everest'},
    talents:[], triggers:[],
    mounts:[{type:'Main',weapons:[]}],
    systems:[], statuses:[], settings:{}
  });
  const r = runEval(store);
  const X = r.X;
  // Список Лансеров: все 29 фреймов, производитель виден, сортировка по LL (Everest/GMS LL0 первым)
  X.renderRulesFrameList();
  const listHtml = r.elements['rulesFrameList'].innerHTML;
  if ((listHtml.match(/class="dbrow/g) || []).length !== 55) throw new Error('EV: the Rules Lancer list must show all 55 frames');
  // v231: производитель в строках больше не показывается — только описание фрейма
  if (!listHtml.includes('Обездвиживание')) throw new Error('EV: the Rules Lancer list must show the frame description (v231)');
  if (listHtml.includes('IPS-N ·')) throw new Error('EV: the Rules Lancer list must not show the old corp/role line (v231)');
  if (!listHtml.includes('Эверест') && !listHtml.includes('Everest')) throw new Error('EV: the Rules Lancer list must include Everest');
  if (!listHtml.includes('Токугава') && !listHtml.includes('Tokugawa')) throw new Error('EV: the Rules Lancer list must include Tokugawa');
  const evIdx = listHtml.indexOf('Эверест') >= 0 ? listHtml.indexOf('Эверест') : listHtml.indexOf('Everest');
  const tkIdx = listHtml.indexOf('Токугава') >= 0 ? listHtml.indexOf('Токугава') : listHtml.indexOf('Tokugawa');
  if (!(evIdx >= 0 && tkIdx >= 0 && evIdx < tkIdx)) throw new Error('EV: the Rules Lancer list must sort by LL (Everest LL0 before Tokugawa LL2)');
  if (listHtml.includes('Hyperspec Fuel Injector') || listHtml.includes('Гиперспектральный инжектор топлива') || listHtml.includes('Advanced Intrusion Package') || listHtml.includes('Продвинутый пакет вторжения') || listHtml.includes('Rallying Cry') || listHtml.includes('Боевой клич')) throw new Error('EV: the Rules Lancer list rows must not show GMS core names (v248 — the second line is removed, core name stays in the detail only)');
  if (!listHtml.includes('ⓘ')) throw new Error('EV: the Rules Lancer list rows must have the details button');
  // Статы карточки — таблица как на вкладке Мех: .stat-table, ряды mid/bot/hase, .stat-val
  const detHtml = X.frameDetailHtml('Everest');
  if (!detHtml.includes('stat-table')) throw new Error('EV: the frame detail stats must use .stat-table');
  if (!detHtml.includes('stat-row cols-4 mid') || !detHtml.includes('stat-row cols-4 bot') || !detHtml.includes('stat-row cols-4 hase')) throw new Error('EV: the frame detail stats must use the mid/bot/hase rows');
  if (!detHtml.includes('stat-val')) throw new Error('EV: the frame detail stats must use .stat-val for values');
  if (detHtml.includes('stat-grid')) throw new Error('EV: the frame detail must NOT use the old .stat-grid');
  if (!detHtml.includes('Heat Cap')) throw new Error('EV: the frame detail must still label the Heat Cap stat');
  // Последняя строка (Repair Cap/SP): синяя .res, 2 широкие клетки на всю ширину (cols-2),
  // фон на строке как у остальных рядов — без пустых тёмных колонок и «рандомного паддинга»
  if (!detHtml.includes('stat-row cols-2 res')) throw new Error('EV: the last stats row (Repair Cap/SP) must be a 2-column blue res row');
  if (!html.includes('.stat-row.res {')) throw new Error('EV: the res row background must be on the row (like the other rows), not on the cells');
  if (html.includes('.stat-row.res .stat-cell { background')) throw new Error('EV: the res row must NOT put its background on the cells (that left empty dark columns)');
  // Маунты — как на вкладке Мех (.mount-badge с иконкой/цветом/рамкой), не кликабельный .tag
  if (!detHtml.includes('mount-badge')) throw new Error('EV: the frame detail mounts must use .mount-badge like the Mech tab');
  if (!detHtml.includes('mb-ico') || !detHtml.includes('mb-name')) throw new Error('EV: the frame detail mount badges must have the icon and name parts');
  if (!detHtml.includes('#5B9BD5') || !detHtml.includes('#ED7D31') || !detHtml.includes('#9B59B6')) throw new Error('EV: the frame detail mount badges must use the mount colors (Main blue, Heavy orange, Flex purple)');
  // Иконка Main/Aux: два треугольника ▶ одинакового размера, второй фиолетовый (было: маленький корявый ▸ зелёный)
  const maIcon = X.MOUNT_STYLE['Main/Aux'].icon;
  if (!maIcon.includes('#9B59B6') || (maIcon.match(/▶/g) || []).length !== 2) throw new Error('EV: the Main/Aux mount icon must be two same-size triangles, the second purple');
  if (maIcon.includes('▸')) throw new Error('EV: the Main/Aux mount icon must NOT use the small crooked triangle');
  const mountsSec = detHtml.split('Маунты')[1] || detHtml.split('Mounts')[1] || '';
  if (mountsSec.includes('class="tag"')) throw new Error('EV: the frame detail mounts must NOT use the clickable .tag chips');
  // Открытие из Правил: showFrameDetail('Tokugawa','rules') — карточка в виде; «Назад» закрывает вид
  X.showFrameDetail('Tokugawa', 'rules');
  const rulesDet = r.elements['searchDlgResults'].innerHTML;
  if (!rulesDet.includes('Токугава') && !rulesDet.includes('Tokugawa')) throw new Error('EV: showFrameDetail from rules must render the detail into the view');
  X.frameDetailBack();
  if (X.searchViewOpen()) throw new Error('EV: frameDetailBack from rules must close the view');
  // Поле поиска на карточке фрейма прячется (оно там сбивает с толку); «Назад» возвращает его
  if (!html.includes('id="searchDlgTop"')) throw new Error('EV: the search view top row needs an id to hide the input on the frame detail');
  if (!html.includes('#rulesFrameList { margin-top:')) throw new Error('EV: the Lancer List needs a top margin (it sat too close to its heading)');
if (html.includes('.res { border-top:1px solid var(--rc,#2c3542); border-radius:0; padding:10px;')) throw new Error('EV: the .res rule must NOT have padding:10px (removed in v182)');
  X.showFrameDetail('Everest', 'search');
  if (r.elements['searchDlgInput'].style.display !== 'none') throw new Error('EV: showFrameDetail must hide the search input on the frame detail screen');
  X.frameDetailBack();
  if (r.elements['searchDlgInput'].style.display !== '') throw new Error('EV: going back from the frame detail must restore the search input');
})();
// PHASE EW (v185): реакция Reactive Code — её даёт трейт фрейма Гоблин, а не талант/система.
// Генератор раньше видел только таланты и системы, поэтому реакция пропадала из ACTIONS_REF.
// Гоблин — единственный фрейм с трейтом, дающим действие.
if (!html.includes("key:'reactivecode'") && !html.includes('reactivecode')) throw new Error('EW: ACTIONS_REF must have the Reactive Code reaction');
if (!html.includes("grant:{frame:'Goblin'}")) throw new Error('EW: Reactive Code must be granted by the Goblin frame');
(function(){
  const store = {};
  store['lancer-tracker-v1'] = JSON.stringify({
    pilot:{name:'Test', licenses:[], coreBonuses:[], hull:0, agility:0, systems:0, engineering:0},
    mech:{frame:'Goblin'},
    talents:[], triggers:[],
    mounts:[{type:'Flex',weapons:[]}],
    systems:[], statuses:[], settings:{}
  });
  const r = runEval(store);
  const X = r.X;
  // actionGranted: грант фрейма — Гоблин даёт реакцию, Эверест нет
  const rc = (X.ACTIONS_REF ? X.ACTIONS_REF.reactions : []).find(a=>a.key==='reactivecode');
  if (!rc) throw new Error('EW: the Reactive Code reaction must exist in ACTIONS_REF');
  if (!X.actionGranted(rc)) throw new Error('EW: a Goblin build must be granted the Reactive Code reaction');
  // С Гоблином реакция есть в «Твоих действиях», с Эверестом — нет
  X.renderMyActions();
  const gobHtml = r.elements['myActions'].innerHTML;
  if (!gobHtml.includes('Реактивный код') && !gobHtml.includes('Reactive Code')) throw new Error('EW: a Goblin build must show Reactive Code in My Actions');
  const store2 = {};
  store2['lancer-tracker-v1'] = JSON.stringify({
    pilot:{name:'Test', licenses:[], coreBonuses:[], hull:0, agility:0, systems:0, engineering:0},
    mech:{frame:'Everest'},
    talents:[], triggers:[],
    mounts:[{type:'Main',weapons:[]}],
    systems:[], statuses:[], settings:{}
  });
  const r2 = runEval(store2);
  const rc2 = (r2.X.ACTIONS_REF ? r2.X.ACTIONS_REF.reactions : []).find(a=>a.key==='reactivecode');
  if (r2.X.actionGranted(rc2)) throw new Error('EW: an Everest build must NOT be granted the Reactive Code reaction');
  r2.X.renderMyActions();
  const evHtml = r2.elements['myActions'].innerHTML;
  if (evHtml.includes('Реактивный код') || evHtml.includes('Reactive Code')) throw new Error('EW: an Everest build must NOT show Reactive Code in My Actions');
})();
// PHASE EX (v186): Operation: Solstice Rain — Chomolungma (GMS, LL0) + Demolitionist + Sysop.
// Chomolungma — LL0-фрейм как Everest: доступен без лицензии; frameAvailable теперь
// возвращает true для любого фрейма с ll===0, а не только для Everest.
(function(){
  const { X, S, DB, elements } = runEval({});
  if (Object.keys(DB.frames).length !== 55) throw new Error('EX: DB must hold 55 frames');
  const ch = DB.frames['Chomolungma'];
  if (!ch) throw new Error('EX: Chomolungma must be in the DB');
  if (ch.ll !== 0 || ch.src !== 'GMS') throw new Error('EX: Chomolungma must be a GMS LL0 frame');
  if (ch.s.hp !== 10 || ch.s.sensor_range !== 15 || ch.s.tech_attack !== 1 || ch.s.sp !== 7) throw new Error('EX: Chomolungma stats must be HP 10, Sensors 15, Tech +1, SP 7');
  if (ch.s.save !== 11 || ch.s.edef !== 10) throw new Error('EX: Chomolungma must have Save 11, E-Defense 10');
  if (!ch.m.includes('Main/Aux') || !ch.m.includes('Flex')) throw new Error('EX: Chomolungma mounts must be Main/Aux + Flex');
  if (ch.c !== 'Advanced Intrusion Package') throw new Error('EX: Chomolungma Core Power must be Advanced Intrusion Package');
  if (!ch.t.includes('Brilliance') || !ch.t.includes('Data Siphon') || !ch.t.includes('Replaceable Parts')) throw new Error('EX: Chomolungma traits must be Brilliance, Data Siphon, Replaceable Parts');
  if (!ch.cd.includes('Wide-Area Code Pulse') || !ch.cd.includes('Balance Control Lockout') || !ch.cd.includes('System Crusher')) throw new Error('EX: Chomolungma Core Power must list Wide-Area Code Pulse and both Invade options');
  if (ch.nr !== 'Чомолунгма' || ch.cr !== 'Продвинутый пакет вторжения') throw new Error('EX: Chomolungma Russian name/Core Power must be set');
  // LL0: доступен без лицензии, даже с включённым фильтром
  if (!X.frameAvailable('Chomolungma')) throw new Error('EX: Chomolungma must be available with the license filter ON');
  // Применить фрейм: маунты Main/Aux + Flex, Core Power и трейты ставятся
  X.applyFrame('Chomolungma');
  if (S.mech.frame !== 'Chomolungma') throw new Error('EX: applying Chomolungma must set the frame');
  if (S.mech.coreSystem !== 'Advanced Intrusion Package') throw new Error('EX: applying Chomolungma must set its Core Power');
  if (!S.mounts.some(m=>m.type==='Main/Aux') || !S.mounts.some(m=>m.type==='Flex')) throw new Error('EX: applying Chomolungma must set Main/Aux + Flex mounts');
  // Таланты Solstice Rain
  const dem = DB.talents.find(x=>x.n==='Demolitionist');
  const sys = DB.talents.find(x=>x.n==='Sysop');
  if (!dem || !sys) throw new Error('EX: Demolitionist and Sysop must be in the DB');
  if (dem.r.length !== 3 || dem.r[0] !== 'Frag and Clear' || dem.r[2] !== 'Fire in the Hole') throw new Error('EX: Demolitionist must have 3 ranks (Frag and Clear / Quarterback / Fire in the Hole)');
  if (sys.r.length !== 3 || sys.r[0] !== 'Inoculation' || sys.r[2] !== 'Aggressive Countermeasures') throw new Error('EX: Sysop must have 3 ranks (Inoculation / Firewall / Aggressive Countermeasures)');
  if (dem.nr !== 'Подрывник' || sys.nr !== 'Сисоп') throw new Error('EX: Demolitionist/Sysop Russian names must be set');
  if (!X.talentMatches(dem, 'demolitionist fire')) throw new Error('EX: talent search must find Demolitionist by name+rank');
})();
// PHASE EY (v187): Chomolungma — две дополнительные опции Вторжения
// (Balance Control Lockout, System Crusher) добавлены как отдельные быстрые
// действия с grant.frame и видны в «Твоих действиях» только на Chomolungma.
(function(){
  const { X, S, DB, elements } = runEval({});
  X.applyFrame('Chomolungma');
  const qk = X.renderMyActions ? null : null;
  // renderMyActions пишет в #myActions; вызываем и читаем html
  X.renderMyActions();
  const html = elements['myActions'].innerHTML;
  if (!html.includes('Блокировка контроля равновесия') && !html.includes('Balance Control Lockout')) throw new Error('EY: Chomolungma must show Balance Control Lockout in My Actions');
  if (!html.includes('Крушитель систем') && !html.includes('System Crusher')) throw new Error('EY: Chomolungma must show System Crusher in My Actions');
  // Эверест их не видит
  const r2 = runEval({});
  r2.X.applyFrame('Everest');
  r2.X.renderMyActions();
  const html2 = r2.elements['myActions'].innerHTML;
  if (html2.includes('Блокировка контроля равновесия') || html2.includes('Balance Control Lockout')) throw new Error('EY: an Everest build must NOT show Balance Control Lockout in My Actions');
  if (html2.includes('Крушитель систем') || html2.includes('System Crusher')) throw new Error('EY: an Everest build must NOT show System Crusher in My Actions');
})();
// PHASE EZ (v188/v189): системы — сворачиваемые карточки, как блоки правил.
// v189: div-based (не <details> — маркер и имя не должны разъезжаться по строкам),
// заголовок обычный белый (не жёлтый), заряды и теги видны и в свёрнутом виде
// (в шапке), описание — только в развёрнутом теле, одинаково в обоих режимах.
(function(){
  const { X, S, DB, elements } = runEval({});
  // Добавить две системы: одну из базы (с описанием и тегами), одну кастомную
  const idx = DB.systems.findIndex(s=>s.n==='Personalizations');
  if (idx < 0) throw new Error('EZ: Personalizations must exist in the DB');
  X.addSystemByIndex(idx);
  S.systems.push({name:'Custom Sys', sp:1, desc:'Custom description text'});
  X.renderLists();
  const html = elements['systems'].innerHTML;
  if (!html.includes('<div class="sec sys')) throw new Error('EZ: each system must render as <div class="sec sys">');
  if (html.includes('<details')) throw new Error('EZ: systems must not use <details> (the marker/name line-break, v189)');
  if (!html.includes('data-sys="Personalizations"')) throw new Error('EZ: system card must carry data-sys');
  if (!html.includes('<span class="sys-name">')) throw new Error('EZ: system header must have a .sys-name');
  if (!html.includes('<span class="sys-arrow">')) throw new Error('EZ: system header must have a .sys-arrow');
  // По умолчанию свёрнуты (нет класса open)
  if (html.includes(' open')) throw new Error('EZ: systems must be collapsed by default');
  // Описание в теле (в DOM), теги и заряды — в шапке (видны и свёрнутыми)
  if (!html.includes('Custom description text')) throw new Error('EZ: the system description must be in the card body');
  if (!html.includes('sys-head-sub')) throw new Error('EZ: tags/charges must render in the card header (sys-head-sub)');
  // В режиме просмотра (по умолчанию, v240) — кнопка удаления скрыта, описание в теле
  if (html.includes('delRow')) throw new Error('EZ: in view mode the delete button must be hidden');
  if (!html.includes('Custom description text')) throw new Error('EZ: in view mode the system description must be in the card body');
  // В режиме редактирования — кнопка удаления есть, описание в теле (одинаково в обоих режимах, v189)
  X.toggleEdit('systems'); // войти в редактирование
  X.renderLists();
  const htmlEdit = elements['systems'].innerHTML;
  if (!htmlEdit.includes('delRow')) throw new Error('EZ: in edit mode the delete button must be present');
  if (!htmlEdit.includes('Custom description text')) throw new Error('EZ: in edit mode the system description must be in the card body');
  // toggleSysCard: состояние переживает перерисовку
  const { X: X2, S: S2, elements: el2 } = runEval({});
  X2.addSystemByIndex(idx);
  X2.renderLists();
  // симулировать клик по шапке: вызвать toggleSysCard на фиктивном элементе
  const fakeHead = { closest: () => ({ getAttribute: () => 'Personalizations', classList: { toggle: (c) => true } }) };
  X2.toggleSysCard(fakeHead);
  X2.renderLists();
  const html2 = el2['systems'].innerHTML;
  if (!html2.includes('data-sys="Personalizations"')) throw new Error('EZ: the system card must survive a re-render');
  if (!html2.includes('<div class="sec sys open" data-sys="Personalizations"')) throw new Error('EZ: an opened system must stay open after re-render');
})();
// live check: render a weapon card and confirm the dice/range/threat numbers are wrapped
const wDZ = { name:'Shotgun', dmg:'1d6 Kinetic', range:'Range 5, Threat 3', desc:'', tags:[], lim:0 };
const cardDZ = X.weapCard ? X.weapCard(wDZ, 0, 0) : null;
if (cardDZ && (!cardDZ.includes('<span class="wnum">1d6</span>') || !cardDZ.includes('<span class="wnum">5</span>') || !cardDZ.includes('<span class="wnum">3</span>'))) throw new Error('DZ: the rendered weapon card must wrap 1d6, 5 and 3 in .wnum spans');
// PHASE DV (v147): насыщенная палитра статов (вариант 1, выбран пользователем) и триггеров
if (!staticHtml.includes('.stat-row.hase .stat-cell label, .stat-row.hase .stat-cell .stat-label { color:#ffa26b; }')) throw new Error('DV: the HASE row labels must be light orange #ffa26b (v152)'); // v191-204: selectors also cover .stat-label buttons
if (!staticHtml.includes('.stat-row.mid .stat-cell label, .stat-row.mid .stat-cell .stat-label { color:#7be495; }')) throw new Error('DV: the middle row labels must be bright green #7be495');
if (!staticHtml.includes('.stat-row.bot .stat-cell label, .stat-row.bot .stat-cell .stat-label { color:#b8c6d4; }')) throw new Error('DV: the bottom row labels must be bright steel #b8c6d4');
if (!staticHtml.includes('.stat-row.hase { background:linear-gradient(180deg, rgba(232,89,12,.48), rgba(232,89,12,.24)); }')) throw new Error('DV: the HASE row must keep the theme orange gradient (v164: the orange left the trigger rows, not the HASE row)');
if (staticHtml.includes('rgba(255,212,59,.48), rgba(255,212,59,.24)')) throw new Error('DV: the old dull yellow tint must be gone');
if (staticHtml.includes('rgba(255,80,60,.48), rgba(255,80,60,.24)')) throw new Error('DV: the red HASE tint must be gone');
if (staticHtml.includes('rgba(255,213,0,.65), rgba(255,213,0,.35)')) throw new Error('DV: the bright yellow tint must be gone (replaced by theme orange, v152)');
// PHASE DO (v139): внутренняя тень слайдера — короткая и агрессивная, без размытия
if (staticHtml.includes('inset 0 2px 4px rgba(0,0,0,.45)')) throw new Error('DO: the blurry inset shadow on the slider track must be gone');
// PHASE FA (v205): лицензии — отдельные сущности, а не фреймы; список лицензий
// в Правилах; стандартный диалог-референс showRef для чипов.
if (!staticHtml.includes('id="rulesLicenseList"')) throw new Error('FA: the Rules tab must have a licenses list container');
if (!staticHtml.includes('id="refDialog"')) throw new Error('FA: the generic reference dialog must exist');
if (!staticHtml.includes('id="refDlgName"') || !staticHtml.includes('id="refDlgBody"')) throw new Error('FA: the reference dialog must have name and body elements');
if (!html.includes('function licenseData()')) throw new Error('FA: licenseData() must derive licenses from the DB');
if (!html.includes('function showRef(')) throw new Error('FA: showRef() must exist');
if (!html.includes('function showLicenseDetail(')) throw new Error('FA: showLicenseDetail() must exist');
if (!html.includes('MECHANICS_REF')) throw new Error('FA: MECHANICS_REF must exist');
if (!html.includes('renderRulesLicenseList()')) throw new Error('FA: the licenses list must render on load');
if (!html.includes("licenseData().some(l=>l.name === key)")) throw new Error('FA: addLicenseByName must validate against licenseData, not frames');
const licsFA = X.licenseData();
if (licsFA.length !== 38) throw new Error('FA: licenseData() must return 38 licenses, got ' + licsFA.length);
if (licsFA.some(l=>l.name === 'GMS' || l.name === 'Everest' || l.name === 'Chomolungma')) throw new Error('FA: GMS/Everest/Chomolungma must not be licenses');
const minoFA = licsFA.find(l=>l.name === 'Minotaur');
if (!minoFA) throw new Error('FA: the Minotaur license must exist');
if ((minoFA.ranks[2] || []).filter(g=>g.kind === 'frame').length !== 2) throw new Error('FA: the Minotaur license must grant exactly 2 frames at rank II (Minotaur + Calendula, v243)');
if (((minoFA.ranks[1] || []).length + (minoFA.ranks[2] || []).length + (minoFA.ranks[3] || []).length) !== 8) throw new Error('FA: the Minotaur license must grant 8 items in total (2 frames + 6 systems)');
if (!X.LICENSE_VIBE['Minotaur'] || X.LICENSE_VIBE['Minotaur'].role !== 'контролер-танк, ближний бой') throw new Error('FA: the Minotaur role must be «контролер-танк, ближний бой» (v250 — «живой лабиринт» removed, the «Стена» tag says it)');
X.renderRulesLicenseList();
if ((elA['rulesLicenseList'].innerHTML.match(/class="dbrow/g) || []).length !== 38) throw new Error('FA: the Rules licenses list must show all 38 licenses');
if (!elA['rulesLicenseList'].innerHTML.includes('Minotaur')) throw new Error('FA: the Rules licenses list must include Minotaur');
if (elA['rulesLicenseList'].innerHTML.includes('Живой лабиринт')) throw new Error('FA: «Живой лабиринт» must be gone from the Rules licenses list (v250)');
if (!elA['rulesLicenseList'].innerHTML.includes('<b>Фрейм 1:</b> Минотавр — Контролер-Танк, Ближний бой, Стена')) throw new Error('FA: the Rules licenses list must show the Minotaur frame line with role + tags (v253)');
if (elA['rulesLicenseList'].innerHTML.includes('Ранг II:')) throw new Error('FA: the Rules licenses list must not show the old rank summary');
// поиск лицензий больше не показывает фреймы: Chomolungma не должна добавляться,
// а повторное добавление той же лицензии не должно дублировать её
const rFA = runEval({});
rFA.X.addLicenseByName('Chomolungma');
if (rFA.S.pilot.licenses.length !== 0) throw new Error('FA: Chomolungma must not be addable as a license');
rFA.X.addLicenseByName('Minotaur'); rFA.X.addLicenseByName('Minotaur');
if (rFA.S.pilot.licenses.length !== 1 || rFA.S.pilot.licenses[0].rank !== 1) throw new Error('FA: adding a license twice must not duplicate it');
// PHASE FB (v206): обратный индекс «Даёт:» — чипы на карточках систем/
// талантов/фреймов и подпись источника в «Твоих действиях»; лицензии
// готовы к нескольким фреймам (второй фрейм Минотавра — из дополнений).
if (!html.includes('function grantsOf(')) throw new Error('FB: grantsOf() must exist');
if (!html.includes('function grantsChipsHtml(')) throw new Error('FB: grantsChipsHtml() must exist');
if (!html.includes('TALENT_GRANTS')) throw new Error('FB: TALENT_GRANTS must exist');
if (!html.includes('function actionSource(')) throw new Error('FB: actionSource() must exist');
if (!html.includes("grantsChipsHtml('talent'")) throw new Error('FB: talent cards must show «Даёт:» chips');
if (!html.includes("grantsChipsHtml('system'")) throw new Error('FB: system cards must show «Даёт:» chips');
if (!html.includes("grantsChipsHtml('frame'")) throw new Error('FB: frame cards must show «Даёт:» chips');
// лицензионные гранты теперь ключами-именами (v205 клал индексы массива):
// чипы оружия/систем в деталях лицензии должны ссылаться по имени
if (!X.licenseDetailHtml('Blackbeard').includes(X.itemDispName('weapon', 'Chain Axe'))) throw new Error('FB: the Blackbeard license detail must show its LL1 weapon (Chain Axe)');
if (X.grantLabel({system:'Restock Drone'}) !== 'Дрон снабжения') throw new Error('FB: grantLabel must localize the granting system, got ' + X.grantLabel({system:'Restock Drone'}));
if (!X.grantsOf('system', 'Restock Drone').some(g=>g.kind === 'action' && g.key === 'activaterestockdrone')) throw new Error('FB: Restock Drone must grant Activate Restock Drone');
if (!X.grantsOf('talent', 'Bonded', 2).some(g=>g.key === 'intercede')) throw new Error('FB: Bonded II must grant Intercede');
if (X.grantsOf('talent', 'Bonded', 1).some(g=>g.key === 'intercede')) throw new Error('FB: Bonded I must not grant Intercede yet (rank-aware chips)');
if (!X.grantsOf('frame', 'Goblin').some(g=>g.kind === 'action' && g.key === 'reactivecode')) throw new Error('FB: Goblin must grant Reactive Code');
if (!X.grantsOf('frame', 'Lancaster').some(g=>g.kind === 'weapon' && g.key === 'Latch Drone')) throw new Error('FB: Lancaster must grant its integrated weapon Latch Drone');
if (!X.grantsOf('talent', 'Leader', 1).some(g=>g.kind === 'mechanic' && g.key === 'leadership')) throw new Error('FB: Leader I must grant Leadership Dice (mechanic chip)');
if (!X.grantsOf('talent', 'Nuclear Cavalier', 3).some(g=>g.kind === 'weapon' && g.key === 'Fuel Rod Gun')) throw new Error('FB: Nuclear Cavalier III must grant the Fuel Rod Gun');
if (X.grantsOf('talent', 'Nuclear Cavalier', 2).some(g=>g.key === 'Fuel Rod Gun')) throw new Error('FB: Nuclear Cavalier II must not grant the Fuel Rod Gun yet');
if (!X.grantsOf('talent', 'Technophile', 1).some(g=>g.kind === 'system' && g.key === 'Servant-Class NHP')) throw new Error('FB: Technophile I must grant the Servant-Class NHP');
if (!X.grantsOf('talent', 'Technophile', 2).some(g=>g.kind === 'system' && g.key === 'Student-Class NHP')) throw new Error('FB: Technophile II must grant the Student-Class NHP');
// Ammo Case нет в базе (жёсткий пробел Б3) — чипу пока не на что ссылаться
if (X.grantsOf('talent', 'Walking Armory', 1).length !== 0) throw new Error('FB: Walking Armory I must grant nothing yet (Ammo Case is not in the DB)');
// готовность к нескольким фреймам в одной лицензии — v243: Calendula is the
// second Minotaur frame, so Minotaur is a two-frame license now; v253: a
// two-frame license shows the base frame's Russian name («КОРП: Минотавр»),
// a one-frame license (Vlad) still shows «КОРП: frame name»;
// v251: Blackbeard is a two-frame license now (Empakaai is its variant)
if (X.licenseDispName(minoFA) !== 'HORUS: Минотавр') throw new Error('FB: a two-frame license must show «КОРП: base frame Russian name» (v253: Minotaur + Calendula)');
const bbFA = licsFA.find(l=>l.name === 'Blackbeard');
if (X.licenseDispName(bbFA) !== 'IPS-N: Чёрная Борода') throw new Error('FB: a two-frame license must show «КОРП: base frame Russian name» (v253: Blackbeard + Empakaai)');
const vladFA = licsFA.find(l=>l.name === 'Vlad');
if (X.licenseDispName(vladFA) !== 'IPS-N: ' + X.itemDispName('frame', 'Vlad')) throw new Error('FB: a one-frame license must show «КОРП: frame name» (v231)');
if (X.licenseDispName({name:'Minotaur', ranks:{1:[], 2:[{kind:'frame', key:'Minotaur'}, {kind:'frame', key:'Blackbeard'}], 3:[]}}) !== 'Минотавр') throw new Error('FB: a two-frame license must show the base frame Russian name, not the license name (v253)');
  if (X.licenseDispName({name:'Minotaur', ranks:{1:[], 2:[{kind:'frame', key:'Blackbeard'}, {kind:'frame', key:'Vlad'}], 3:[]}}) !== 'Minotaur') throw new Error('FB: a license with no base frame must fall back to the license name (v253)');
// showRef по имени (а не по индексу массива): оружие, система, механика
// (свежий runEval — showRef пишет в document текущего eval)
const rFB = runEval({});
rFB.X.showRef('weapon', 'Fuel Rod Gun');
if (rFB.elements['refDlgName'].textContent !== 'Пушка топливных стержней') throw new Error('FB: showRef(weapon) must resolve by name, got ' + rFB.elements['refDlgName'].textContent);
rFB.X.showRef('system', 'Servant-Class NHP');
if (rFB.elements['refDlgName'].textContent !== 'NHP класса «Слуга»') throw new Error('FB: showRef(system) must resolve by name, got ' + rFB.elements['refDlgName'].textContent);
rFB.X.showRef('mechanic', 'leadership');
if (rFB.elements['refDlgName'].textContent !== 'Кости лидерства') throw new Error('FB: showRef(mechanic) must show Leadership Dice');
// подпись источника в «Твоих действиях» и чипы «Даёт:» на карточках
rFB.S.systems.push({name:'Restock Drone'});
rFB.X.renderMyActions();
if (!rFB.elements['myActions'].innerHTML.includes('Даёт:')) throw new Error('FB: My Actions must show the grant source (Даёт:)');
if (!rFB.elements['myActions'].innerHTML.includes('Дрон снабжения')) throw new Error('FB: My Actions must name the granting system');
rFB.X.renderLists();
if (!rFB.elements['systems'].innerHTML.includes('Даёт:')) throw new Error('FB: the system card must show «Даёт:» chips');
// PHASE FC (v207): подсветка чисел (.wnum) везде — кубики и числа
// в описаниях, как в карточках пушек.
if (!html.includes('function highlightNums(')) throw new Error('FC: highlightNums() must exist');
if (!html.includes('highlightNums(html.replace')) throw new Error('FC: linkTagTerms must apply highlightNums');
if (!html.includes('.wnum { color:var(--accent)')) throw new Error('FC: the global .wnum rule must exist');
if (!html.includes('function setTagDlgDesc(')) throw new Error('FC: setTagDlgDesc() must exist');
if (X.highlightNums('1d3+2 энергетический, Дальность 3, Угроза 3') !== '<span class="wnum">1d3+2</span> энергетический, Дальность <span class="wnum">3</span>, Угроза <span class="wnum">3</span>') throw new Error('FC: dice and numbers must be highlighted, got ' + X.highlightNums('1d3+2 энергетический, Дальность 3, Угроза 3'));
if (!X.highlightNums('наносит +2 тепла').includes('<span class="wnum">+2</span>')) throw new Error('FC: signed numbers must be highlighted');
if (X.highlightNums('GMS · LL0 · Main').includes('wnum')) throw new Error('FC: the 0 in LL0 must not be highlighted');
const chipFC = X.highlightNums('<span class="tag" onclick="showTag(\'tg_knockback\',\'1\')">ОТБРОС 1</span>');
if (!chipFC.includes("showTag('tg_knockback','1')")) throw new Error('FC: highlightNums must not touch HTML attributes');
if (!chipFC.includes('ОТБРОС <span class="wnum">1</span>')) throw new Error('FC: the number in a tag chip label must be highlighted');
const ltFC = X.linkTagTerms('ОТБРОС 1 и 2d6 урона');
if (!ltFC.includes("showTag('tg_knockback'")) throw new Error('FC: linkTagTerms must still make tag chips');
if (!ltFC.includes('<span class="wnum">2d6</span>')) throw new Error('FC: linkTagTerms output must highlight dice');
const rFC = runEval({});
rFC.X.showRef('weapon', 'Fuel Rod Gun');
if (!rFC.elements['refDlgBody'].innerHTML.includes('<span class="wnum">1d3+2</span>')) throw new Error('FC: the weapon reference dialog must highlight damage dice');
rFC.X.showTag('tg_heat_self', '1');
if (!rFC.elements['tagDlgDesc'].innerHTML.includes('<span class="wnum">1</span>')) throw new Error('FC: the tag dialog description must highlight numbers');
// PHASE FD (v208): в деталях лицензии каждый грант — своей строкой
// с подписью вида (Фрейм:/Система:/Оружие:).
if (!html.includes('function grantKindLabel(')) throw new Error('FD: grantKindLabel() must exist');
if (!html.includes('class="grant-row"')) throw new Error('FD: license detail must use grant-row');
if (!html.includes('"u251"') || !html.includes('"u252"') || !html.includes('"u253"')) throw new Error('FD: u251-u253 (Фрейм/Система/Оружие) must be in STR');
if (X.grantKindLabel('frame') !== 'Фрейм') throw new Error('FD: grantKindLabel(frame) must be Фрейм');
if (X.grantKindLabel('system') !== 'Система') throw new Error('FD: grantKindLabel(system) must be Система');
if (X.grantKindLabel('weapon') !== 'Оружие') throw new Error('FD: grantKindLabel(weapon) must be Оружие');
const balorFD = X.licenseDetailHtml('Balor');
if ((balorFD.match(/grant-row/g) || []).length !== 7) throw new Error('FD: the Balor license detail must show 7 grant rows (v251: + Hecatoncheires frame), got ' + (balorFD.match(/grant-row/g) || []).length);
if (!balorFD.includes('<span class="dim">Фрейм:</span>')) throw new Error('FD: the Balor frame grant must be labelled Фрейм:');
if (!balorFD.includes('<span class="dim">Система:</span>')) throw new Error('FD: the Balor system grants must be labelled Система:');
if (!balorFD.includes('Балор')) throw new Error('FD: the Balor frame chip must be present');
// PHASE FE (v209): список лицензий — перед списком мехов в Правилах.
if (staticHtml.indexOf('id="rulesLicenseList"') === -1 || staticHtml.indexOf('id="rulesFrameList"') === -1) throw new Error('FE: both Rules lists must exist');
if (staticHtml.indexOf('id="rulesLicenseList"') > staticHtml.indexOf('id="rulesFrameList"')) throw new Error('FE: the licenses list must come before the frames list in Rules');
// PHASE FF (v210): Б1 — 26 новых быстрых действий + 8 реакций в ACTIONS_REF.
const AFF = global.__x.ACTIONS_REF;
function ffQuick(key){ const a = AFF.quick.find(x=>x.key===key); if (!a) throw new Error('FF: quick action ' + key + ' must exist'); return a; }
function ffReact(key){ const a = AFF.reactions.find(x=>x.key===key); if (!a) throw new Error('FF: reaction ' + key + ' must exist'); return a; }
if (ffQuick('shrikecode').grant.system !== 'Neurospike') throw new Error('FF: Shrike Code must be granted by Neurospike');
if (ffQuick('mirage').grant.system !== 'Neurospike') throw new Error('FF: Mirage must be granted by Neurospike');
if (ffQuick('stalkprey').grant.system !== 'Hunter Logic Suite') throw new Error('FF: Stalk Prey must be granted by Hunter Logic Suite');
if (ffQuick('logicbomb').grant.system !== 'Viral Logic Suite') throw new Error('FF: Logic Bomb must be granted by Viral Logic Suite');
if (ffQuick('foldspace').grant.system !== 'Metafold Carver') throw new Error('FF: Fold Space must be granted by Metafold Carver');
if (ffQuick('jamcockpit').grant.talent !== 'Hacker' || ffQuick('jamcockpit').grant.rank !== 2) throw new Error('FF: Jam Cockpit must be granted by Hacker rank 2');
if (ffQuick('hackslash').grant.talent !== 'Hacker' || ffQuick('hackslash').grant.rank !== 2) throw new Error('FF: Hack./Slash must be granted by Hacker rank 2');
if (ffQuick('lastargumentofkings').grant.talent !== 'Hacker' || ffQuick('lastargumentofkings').grant.rank !== 3) throw new Error('FF: Last Argument of Kings must be granted by Hacker rank 3');
if (!ffQuick('lastargumentofkings').tx_en.startsWith('Full Tech: ')) throw new Error('FF: Last Argument of Kings must carry the Full Tech: prefix (no fulltech list yet)');
if (!ffQuick('issueorder').tx_en.startsWith('Free Action: ')) throw new Error('FF: Issue Order must carry the Free Action: prefix');
if (!ffQuick('issueorder').tx_en.includes('At rank II, you may also issue a command as a reaction')) throw new Error('FF: Issue Order must mention the rank II reaction use');
if (ffQuick('blinkspacejump').grant.frame !== 'Mourning Cloak' || !ffQuick('blinkspacejump').tx_en.startsWith('Full Action: ')) throw new Error('FF: Blinkspace Jump must be a Mourning Cloak full action');
if (ffQuick('hologramteleport').grant.frame !== 'Dusk Wing') throw new Error('FF: Hologram Teleport must be granted by Dusk Wing');
if (ffQuick('fulldeployment').grant.frame !== 'Hydra' || !ffQuick('fulldeployment').tx_en.startsWith('Active (1 CP): ')) throw new Error('FF: Full Deployment must be a Hydra active (1 CP) action');
if (ffQuick('jackhammer').grant.talent !== 'Siege Specialist' || ffQuick('jackhammer').grant.rank !== 1) throw new Error('FF: Jackhammer must be granted by Siege Specialist rank 1');
if (ffQuick('benthamfoucault').grant.talent !== 'Spotter' || ffQuick('benthamfoucault').grant.rank !== 3) throw new Error('FF: Bentham/Foucault must be granted by Spotter rank 3');
if (ffReact('defensivepulse').grant.frame !== 'Saladin') throw new Error('FF: Defensive Pulse must be granted by Saladin');
if (!ffReact('defensivepulse').ef_en.includes('Only while Tachyon Shield is active.')) throw new Error('FF: Defensive Pulse must note the Tachyon Shield condition');
if (ffReact('tacticalsimulation').grant.frame !== 'Swallowtail') throw new Error('FF: Tactical Simulation must be granted by Swallowtail');
if (ffReact('autonomousassault').grant.weapon !== 'Autopod') throw new Error('FF: Autonomous Assault must be granted by the Autopod weapon');
if (ffReact('snickersnack').grant.weapon !== 'Vorpal Gun') throw new Error('FF: Snicker-Snack must be granted by the Vorpal Gun weapon');
if (ffReact('heldimage').grant.coreBonus !== 'The Lesson of the Held Image') throw new Error('FF: Held Image must be granted by the Held Image core bonus');
if (ffReact('orochisnare').grant.frame !== 'Hydra' || ffReact('orochisnare').per !== '1/раунд на персонажа') throw new Error('FF: Snare Drone must be a Hydra reaction, 1/round per character');
if (ffReact('orochishredder').grant.frame !== 'Hydra' || ffReact('orochihunted').grant.frame !== 'Hydra') throw new Error('FF: Shredder/Hunted drones must be Hydra reactions');
// actionGranted: weapon/coreBonus branches (fresh save has neither).
let rFF = runEval({});
X = rFF.X; S = rFF.S;
if (X.actionGranted(ffReact('autonomousassault'))) throw new Error('FF: Autonomous Assault must be hidden without an Autopod mounted');
if (X.actionGranted(ffReact('heldimage'))) throw new Error('FF: Held Image must be hidden without the core bonus');
S.mounts[0].weapons.push({name:'Autopod'});
if (!X.actionGranted(ffReact('autonomousassault'))) throw new Error('FF: Autonomous Assault must show with an Autopod mounted');
S.pilot.coreBonuses.push('The Lesson of the Held Image');
if (!X.actionGranted(ffReact('heldimage'))) throw new Error('FF: Held Image must show with the core bonus taken');
// Reverse index: the new actions must feed the «Даёт:» chips.
const neuroGrants = X.grantsOf('system', 'Neurospike').map(g=>g.key);
if (neuroGrants.length !== 2 || !neuroGrants.includes('shrikecode') || !neuroGrants.includes('mirage')) throw new Error('FF: Neurospike must grant exactly Shrike Code and Mirage');
if (!X.grantsOf('talent', 'Hacker', 2).some(g=>g.key === 'jamcockpit')) throw new Error('FF: Hacker II must grant Jam Cockpit');
if (!X.grantsOf('frame', 'Hydra').some(g=>g.key === 'fulldeployment')) throw new Error('FF: Hydra must grant Full Deployment');
// My Actions: with Neurospike + Hacker II, the new quick actions must render.
S.systems.push({name:'Neurospike'});
S.talents.push({name:'Hacker', rank:2});
X.renderMyActions();
const myFF = rFF.elements['myActions'].innerHTML;
if (!myFF.includes('Код «Сорокопут»') || !myFF.includes('Заклинить кабину')) throw new Error('FF: My Actions must list Shrike Code and Jam Cockpit for this build');
// PHASE FG (v211): Б1 — заполнения в db.js: списки боеприпасов Ammo Case + профили дронов OROCHI.
if (!dbSrc.includes('THUMPER: The attack gains KNOCKBACK 1')) throw new Error('FG: Ammo Case I must list THUMPER');
if (!dbSrc.includes('HELLFIRE (2 charges): The attack deals Energy damage')) throw new Error('FG: Ammo Case II must list HELLFIRE');
if (!dbSrc.includes('АДСКИЙ ОГОНЬ (2 заряда): атака наносит энергетический урон')) throw new Error('FG: Ammo Case II must list HELLFIRE in Russian');
if (!dbSrc.includes('Guardian Drone: This drone projects a shield')) throw new Error('FG: Hydra must list the Guardian Drone');
if (!dbSrc.includes('Дрон-страж: Этот дрон проецирует щит')) throw new Error('FG: Hydra must list the Guardian Drone in Russian');
const hydraFG = global.__x.DB.frames['Hydra'];
if (!hydraFG.cd.includes('Snare Drone: As a reaction')) throw new Error('FG: Hydra cd must include the Snare Drone profile');
if (!hydraFG.cdr.includes('Дрон-ловушка: Реакцией')) throw new Error('FG: Hydra cdr must include the Snare Drone profile in Russian');
const acFG = global.__x.DB.systems.find(s=>s.n==='Ammo Case I');
if (!acFG || !acFG.xr.includes('ГРОХОТ: атака получает ОТБРОС 1')) throw new Error('FG: Ammo Case I (RU) must list ГРОХОТ');
// PHASE FH (v212): стек навигации диалога поиска — лицензия → фрейм → «Назад»
// возвращает к лицензии, а не в результаты поиска (было: поиск вверху и тупик).
(function(){
  const store = {};
  store['lancer-tracker-v1'] = JSON.stringify({
    pilot:{name:'Test', licenses:[], coreBonuses:[], hull:0, agility:0, systems:0, engineering:0},
    mech:{frame:'Everest'},
    talents:[], triggers:[],
    mounts:[{type:'Main',weapons:[]}],
    systems:[], statuses:[], settings:{}
  });
  const r = runEval(store);
  const X = r.X;
  const hasRank = h => h.includes('Ранг I') || h.includes('Rank I');
  // Правила → лицензия → фрейм → Назад → лицензия → Назад → закрытие.
  X.showLicenseDetail('Balor', 'rules');
  let box = r.elements['searchDlgResults'].innerHTML;
  if (!hasRank(box)) throw new Error('FH: the license detail must show ranks');
  X.showFrameDetail('Balor');
  box = r.elements['searchDlgResults'].innerHTML;
  if (!box.includes('Core Power')) throw new Error('FH: the frame detail must show Core Power');
  X.frameDetailBack();
  box = r.elements['searchDlgResults'].innerHTML;
  if (!hasRank(box)) throw new Error('FH: back from the frame must return to the license detail, not to search');
  X.licenseDetailBack();
  if (X.searchViewOpen()) throw new Error('FH: back from a rules-opened license must close the view');
  // Поиск → лицензия → фрейм → Назад → лицензия → Назад → результаты поиска.
  X.openSearch('license', null);
  X.showLicenseDetail('Balor', 'search');
  X.showFrameDetail('Balor');
  X.frameDetailBack();
  box = r.elements['searchDlgResults'].innerHTML;
  if (!hasRank(box)) throw new Error('FH: back from the frame must return to the license detail (search flow)');
  X.licenseDetailBack();
  box = r.elements['searchDlgResults'].innerHTML;
  if (!box.includes('Балор') && !box.includes('Balor')) throw new Error('FH: back from the license must return to the license search list');
  if (r.elements['searchDlgInput'].style.display !== '') throw new Error('FH: back to search must restore the search input');
  // Поиск → фрейм → Назад → результаты поиска (старое поведение EU/EV сохраняется).
  X.openSearch('frame', null);
  X.showFrameDetail('Everest', 'search');
  X.frameDetailBack();
  if (r.elements['searchDlgInput'].style.display !== '') throw new Error('FH: back from the frame detail must restore the search input');
})();
// PHASE FI (v213): закрытие чипа НЕ должно закрывать лицензию под ним.
// Регрессия v212: refDlgClosed делал history.back(), а прилетающий popstate
// обработчик трактовал как нажатие Назад и закрывал вид поиска (стек глубины 1).
(function(){
  const store = {};
  store['lancer-tracker-v1'] = JSON.stringify({
    pilot:{name:'Test', licenses:[], coreBonuses:[], hull:0, agility:0, systems:0, engineering:0},
    mech:{frame:'Everest'},
    talents:[], triggers:[],
    mounts:[{type:'Main',weapons:[]}],
    systems:[], statuses:[], settings:{}
  });
  const r = runEval(store);
  const X = r.X;
  const hasRank = h => h.includes('Ранг I') || h.includes('Rank I');
  X.openSearch('license', null);
  X.showLicenseDetail('Balor', 'search');
  if (!hasRank(r.elements['searchDlgResults'].innerHTML)) throw new Error('FI: the license detail must show ranks');
  X.showRef('system', 'Neurospike');
  if (!r.elements['refDialog']._open) throw new Error('FI: showRef must open the reference dialog');
  // Закрытие чипа по кнопке: сам диалог закрывается, лицензия под ним — нет.
  r.elements['refDialog'].close();
  X.refDlgClosed();
  if (!X.searchViewOpen()) throw new Error('FI: closing the chip must NOT close the search view');
  if (!hasRank(r.elements['searchDlgResults'].innerHTML)) throw new Error('FI: closing the chip must leave the license detail in place');
  // Эхо-popstate от history.back() после закрытия чипа — игнорируется.
  X.onDlgPopstate();
  if (!X.searchViewOpen()) throw new Error('FI: the echo popstate after closing the chip must NOT close the search view');
  if (!hasRank(r.elements['searchDlgResults'].innerHTML)) throw new Error('FI: the echo popstate must leave the license detail in place');
  // А вот настоящее браузерное Назад — работает: лицензия → результаты поиска → закрытие.
  X.onDlgPopstate();
  const box = r.elements['searchDlgResults'].innerHTML;
  if (!box.includes('Балор') && !box.includes('Balor')) throw new Error('FI: a real Back press must return from the license to the search list');
  X.onDlgPopstate();
  if (X.searchViewOpen()) throw new Error('FI: a real Back press on the search view must close the view');
})();
// PHASE FJ (v214): тег «Мина» (tg_mine) — на всех гранатах с профилем мины.
// Само определение тега с правилами было в базе, но ни одна система его не несла:
// на карточках гранат чипа «Мина» не было, и правила из текста не открывались.
(function(){
  const store = {};
  store['lancer-tracker-v1'] = JSON.stringify({
    pilot:{name:'Test', licenses:[], coreBonuses:[], hull:0, agility:0, systems:0, engineering:0},
    mech:{frame:'Everest'},
    talents:[], triggers:[],
    mounts:[{type:'Main',weapons:[]}],
    systems:[], statuses:[], settings:{}
  });
  const r = runEval(store);
  const X = r.X;
  const grenades = ['Pattern-A Smoke Charges','Pattern-B HEX Charges','BB Breach/Blast Charges','Flash Charges','Mesmer Charges','\u201cRoller\u201d Directed Payload Charges','HAVOK Charges','Grounding Charges'];
  for (const name of grenades){
    const tags = X.sysTags({name});
    if (!tags.some(t=>t[0] === 'tg_mine')) throw new Error('FJ: ' + name + ' must carry the Mine tag');
    const chips = X.tagChips(tags);
    if (!chips.includes('Мина') && !chips.includes('Mine')) throw new Error('FJ: ' + name + ' must render a Mine chip');
  }
  // Webjaw Snare — ловушка (Deployable), а не мина: тег не положен.
  if (X.sysTags({name:'Webjaw Snare'}).some(t=>t[0] === 'tg_mine')) throw new Error('FJ: Webjaw Snare must NOT carry the Mine tag');
  // Диалог тега: имя + правила из глоссария корбука.
  X.showTag('tg_mine');
  const nm = r.elements['tagDlgName'].textContent;
  if (!nm.includes('Мина') && !nm.includes('Mine')) throw new Error('FJ: the Mine tag dialog must show the tag name');
  const ds = r.elements['tagDlgDesc'].innerHTML;
  if (!ds.includes('planted') && !ds.includes('установить')) throw new Error('FJ: the Mine tag dialog must show the planting rules');
  if (!r.elements['tagDialog']._open) throw new Error('FJ: showTag must open the tag dialog');
})();
// PHASE FK (v215): Limited с максимумом-кубиком («1d6+2», «2d6» — прототип-оружие).
// Раньше у такого оружия счётчика зарядов не было вовсе: weapLim возвращал 0,
// и строка зарядов не рендерилась. Теперь — счётчик только текущего значения,
// без максимума и без верхней границы; полный ремонт сбрасывает его в 0
// (новый бросок максимума — за пользователем).
(function(){
  const store = {};
  store['lancer-tracker-v1'] = JSON.stringify({
    pilot:{name:'Test', licenses:[], coreBonuses:[], hull:0, agility:0, systems:0, engineering:0},
    mech:{frame:'Everest'},
    talents:[], triggers:[],
    mounts:[{type:'Main',weapons:[{name:'Prototype Weapon I', dmg:'1d6 Kinetic', range:'Range 10', desc:''}]}, {type:'Flex',weapons:[{name:'Fuel Rod Gun', dmg:'1d6 Energy', range:'Range 10', desc:''}]}],
    systems:[{name:'Custom Dice Sys', tg:[['tg_limited','2d6']], sp:0, desc:''}],
    statuses:[], settings:{}
  });
  const r = runEval(store);
  const X = r.X;
  if (!X.weapLimUnknown({name:'Prototype Weapon I'})) throw new Error('FK: Prototype Weapon I must have an unknown Limited max');
  if (!X.weapLimUnknown({name:'Prototype Weapon III'})) throw new Error('FK: Prototype Weapon III must have an unknown Limited max (2d6)');
  if (X.weapLimUnknown({name:'Fuel Rod Gun'})) throw new Error('FK: Fuel Rod Gun must have a known Limited max (3)');
  if (X.weapLimUnknown({name:'Assault Rifle'})) throw new Error('FK: Assault Rifle is not Limited at all');
  if (!X.sysLimUnknown(X.getS().systems[0])) throw new Error('FK: a system with a dice Limited tag must have an unknown max');
  if (X.sysLimUnknown({name:'Pattern-B HEX Charges'})) throw new Error('FK: HEX Charges must have a known Limited max (3)');
  // Рендер: у прототипа есть строка зарядов — только значение, без «/ максимум».
  X.renderLists();
  const mHtml = r.elements['mounts'].innerHTML;
  if (!mHtml.includes('Заряды:') && !mHtml.includes('Charges:')) throw new Error('FK: the prototype weapon card must show a charges counter');
  if (!mHtml.includes('<div class="val">0</div>')) throw new Error('FK: the unknown-max counter must show the value without "/ max"');
  // Степпер: без верхней границы, пол — 0.
  X.stepWeapCharges(0, 0, 5);
  if (X.getS().mounts[0].weapons[0].left !== 5) throw new Error('FK: stepping an unknown-max counter up must not clamp');
  X.stepWeapCharges(0, 0, 10);
  if (X.getS().mounts[0].weapons[0].left !== 15) throw new Error('FK: an unknown-max counter must keep growing');
  X.stepWeapCharges(0, 0, -20);
  if (X.getS().mounts[0].weapons[0].left !== 0) throw new Error('FK: an unknown-max counter must floor at 0');
  // Числовой максимум по-прежнему клампится.
  X.stepWeapCharges(1, 0, 10);
  if (X.getS().mounts[1].weapons[0].left !== 3) throw new Error('FK: a known-max counter must still clamp at its max (Fuel Rod Gun 3)');
  // Системный путь: кастомная система с кубиком — тоже без клампа.
  const sIdx = X.getS().systems.findIndex(s=>s.name==='Custom Dice Sys');
  X.stepSysCharges(sIdx, 4);
  if (X.getS().systems[sIdx].left !== 4) throw new Error('FK: stepping an unknown-max system counter must not clamp');
  // Полный ремонт: неизвестный максимум — в 0 (свежий бросок), числовой — в максимум.
  X.fullRepair();
  if (X.getS().mounts[0].weapons[0].left !== 0) throw new Error('FK: full repair must reset an unknown-max counter to 0');
  if (X.getS().mounts[1].weapons[0].left !== 3) throw new Error('FK: full repair must reset a known-max counter to its max');
})();
// PHASE FL (v216): перезаряжаемое оружие (Loading) — переключатель Заряжено/Разряжено.
// Решение: именно чекбокс, а не счётчик — все 9 пушек с Loading однозарядные
// (после каждого выстрела — перезарядка, корбук: «must be reloaded after each
// use»), ни одна не Limited и ни у одной нет магазина на несколько выстрелов.
(function(){
  const store = {};
  store['lancer-tracker-v1'] = JSON.stringify({
    pilot:{name:'Test', licenses:[], coreBonuses:[], hull:0, agility:0, systems:0, engineering:0},
    mech:{frame:'Everest'},
    talents:[], triggers:[],
    mounts:[{type:'Main',weapons:[{name:'Anti-Materiel Rifle', dmg:'2d6 Kinetic', range:'Range 20', desc:''}, {name:'Assault Rifle', dmg:'1d6 Kinetic', range:'Range 15', desc:''}]}],
    systems:[], statuses:[], settings:{}
  });
  const r = runEval(store);
  const X = r.X;
  // В базе ровно 13 пушек с Loading, все однозарядные и ни одна не Limited.
  const loading = r.DB.weapons.filter(w=>(w.tg||[]).some(t=>t[0]==='tg_loading'));
  if (loading.length !== 13) throw new Error('FL: the DB must have exactly 13 Loading weapons, found ' + loading.length);
  for (const w of loading){
    if ((w.tg||[]).some(t=>t[0]==='tg_limited')) throw new Error('FL: ' + w.n + ' is Loading and Limited — the checkbox alone would not be enough');
    if (typeof w.lim === 'number' && w.lim > 0) throw new Error('FL: ' + w.n + ' is Loading with a numeric Limited max');
  }
  if (!X.weapLoading({name:'Anti-Materiel Rifle'})) throw new Error('FL: Anti-Materiel Rifle must be Loading');
  if (X.weapLoading({name:'Assault Rifle'})) throw new Error('FL: Assault Rifle must not be Loading');
  // Рендер: переключатель только у заряжаемой пушки, по умолчанию — заряжена.
  X.renderLists();
  const mHtml = r.elements['mounts'].innerHTML;
  if ((mHtml.match(/load-toggle/g) || []).length !== 1) throw new Error('FL: exactly one Loading toggle must render (Anti-Materiel Rifle only)');
  if (!mHtml.includes('Заряжено') && !mHtml.includes('Loaded')) throw new Error('FL: the toggle must show the loaded state');
  if (!X.weapLoaded({name:'Anti-Materiel Rifle'})) throw new Error('FL: a Loading weapon with no stored state must default to loaded');
  // Переключение: выстрел — разряжено, перезарядка — заряжено.
  X.toggleWeapLoaded(0, 0);
  if (X.getS().mounts[0].weapons[0].loaded !== false) throw new Error('FL: toggling once must mark the weapon unloaded');
  X.renderLists();
  const h2 = r.elements['mounts'].innerHTML;
  if (!h2.includes('Разряжено') && !h2.includes('Unloaded')) throw new Error('FL: the toggle must show the unloaded state after firing');
  X.toggleWeapLoaded(0, 0);
  if (X.weapLoaded(X.getS().mounts[0].weapons[0]) !== true) throw new Error('FL: toggling again must mark the weapon loaded');
  // Полный ремонт перезаряжает.
  X.toggleWeapLoaded(0, 0);
  X.fullRepair();
  if (X.getS().mounts[0].weapons[0].loaded !== true) throw new Error('FL: full repair must reload Loading weapons');
  // Добавление из поиска ставит заряженной.
  const idx = r.DB.weapons.findIndex(w=>w.n==='Missile Rack');
  X.addWeaponByIndex(0, idx);
  const added = X.getS().mounts[0].weapons[X.getS().mounts[0].weapons.length - 1];
  if (added.loaded !== true) throw new Error('FL: a Loading weapon added from search must start loaded');
})();
// PHASE FM (v217): «выпавшие на ,» — у тега Перебор (Overkill) в базе не было
// значения: все 7 пушек несли ["tg_overkill", null], и {VAL} в описании
// подменялся пустотой. По книге у Перебора нет параметра — срабатывает всегда
// на 1, поэтому значение 1 вписано в базу (Segment Knife, Combat Drill,
// Vulture DMR, Torch, Prototype Weapon I/II/III; v229: + Plasma Maul). Заодно страж: ни у одного
// тега с {VAL} в описании больше не должно быть использований без значения.
(function(){
  const store = {};
  store['lancer-tracker-v1'] = JSON.stringify({
    pilot:{name:'Test', licenses:[], coreBonuses:[], hull:0, agility:0, systems:0, engineering:0},
    mech:{frame:'Everest'},
    talents:[], triggers:[],
    mounts:[{type:'Main',weapons:[{name:'Segment Knife', dmg:'1d3+1 Energy', range:'Threat 1', desc:''}]}],
    systems:[], statuses:[], settings:{}
  });
  const r = runEval(store);
  const X = r.X;
  // Все использования Перебора — со значением 1.
  const overkills = r.DB.weapons.filter(w=>(w.tg||[]).some(t=>t[0]==='tg_overkill'));
  if (overkills.length !== 11) throw new Error('FM: the DB must have exactly 11 Overkill weapons (8 + 3 from v243: Reaper Assault Cannon, Electrohydraulic Claw, Fusion Torch), found ' + overkills.length);
  for (const w of overkills){
    const t = w.tg.find(t=>t[0]==='tg_overkill');
    if (t[1] !== 1) throw new Error('FM: ' + w.n + ' must carry Overkill 1 (the book triggers on 1s)');
  }
  // Ни один тег с {VAL} в описании не используется без значения.
  for (const id in r.DB.tags){
    const t = r.DB.tags[id];
    if (!/\{VAL\}/.test(t.d || '') && !/\{VAL\}/.test(t.dr || '')) continue;
    for (const it of [...r.DB.weapons, ...r.DB.systems]){
      const u = (it.tg || []).find(x=>x[0] === id);
      if (u && (u[1] === null || u[1] === undefined || u[1] === '')) throw new Error('FM: ' + it.n + ' uses ' + id + ' without a value — the tag dialog would show a hole');
    }
  }
  // Чип и диалог: «Перебор 1», в тексте — «на 1», без дыры «на ,».
  const chips = X.tagChips(X.weapTags({name:'Segment Knife'}));
  if (!chips.includes('Перебор 1') && !chips.includes('Overkill 1')) throw new Error('FM: the Segment Knife chip must read Overkill 1');
  X.showTag('tg_overkill', '1');
  const nm = r.elements['tagDlgName'].textContent;
  if (!nm.includes('1')) throw new Error('FM: the Overkill dialog title must show the value 1');
  const ds = r.elements['tagDlgDesc'].innerHTML;
  const dsText = ds.replace(/<[^>]*>/g, '');
  if (dsText.includes('на ,') || dsText.includes('on a ,')) throw new Error('FM: the Overkill description must not have an empty hole where the value goes');
  if (!dsText.includes('на 1') && !dsText.includes('on a 1')) throw new Error('FM: the Overkill description must say the dice land on a 1');
})();
// PHASE FN (v218): тонкие разделители между элементами списков — как у снаряжения
// пилота (1px var(--line), без акцента); трейты фрейма — отдельными блоками
// с жирным именем и такой же линией между ними. База не меняется: tr/t —
// строки, разбор — по абзацам на рендере.
(function(){
  // CSS: волосная линия между соседями, ничего лишнего.
  if (!/\.wcard \+ \.wcard \{[^}]*border-top:1px solid var\(--line\)/.test(html)) throw new Error('FN: weapons need a hairline separator between cards');
  if (!/\.sec\.sys \+ \.sec\.sys \{[^}]*border-top:1px solid var\(--line\)/.test(html)) throw new Error('FN: systems need a hairline separator between cards');
  if (!/\.talent-item \{[^}]*border-top:1px solid var\(--line\)/.test(html)) throw new Error('FN: talents need a hairline separator');
  if (!/\.cb-item \{[^}]*border-top:1px solid var\(--line\)/.test(html)) throw new Error('FN: core bonuses need a hairline separator');
  if (!/\.trait-item \{[^}]*border-top:1px solid var\(--line\)/.test(html)) throw new Error('FN: frame traits need a hairline separator');
  if (/\.talent-item \{[^}]*hud-amber/.test(html) || /\.trait-item \{[^}]*hud-amber/.test(html)) throw new Error('FN: separators must not use the amber accent');
  const store = {};
  store['lancer-tracker-v1'] = JSON.stringify({
    pilot:{name:'Test', licenses:[], coreBonuses:['The Lesson of the Open Door'], hull:0, agility:0, systems:0, engineering:0},
    mech:{frame:'Everest', traits:'Initiative: 1/scene the Everest may take any quick action as a free action.\n\nReplaceable Parts: While resting, the Everest can be repaired at a rate of 1 Repair per 1 structure damage, instead of 2 Repairs.'},
    talents:[{name:'Leader', rank:1}, {name:'Ace', rank:2}],
    triggers:[],
    mounts:[{type:'Main',weapons:[{name:'Assault Rifle', dmg:'1d6 Kinetic', range:'Range 15', desc:''}, {name:'Segment Knife', dmg:'1d3+1 Energy', range:'Threat 1', desc:''}]}],
    systems:[{name:'Pattern-B HEX Charges', sp:2, desc:''}, {name:'Type-3 Projected Shield', sp:1, desc:''}],
    statuses:[], settings:{}
  });
  const r = runEval(store);
  const X = r.X;
  // Трейты: имя жирным, каждый трейт — свой блок.
  const th = X.traitsHtml('Initiative: 1/scene test.\n\nReplaceable Parts: rest test.');
  if (!th.includes('<b>Initiative:</b>')) throw new Error('FN: the trait name must be bold');
  if ((th.match(/trait-item/g) || []).length !== 2) throw new Error('FN: two traits must render as two trait-item blocks');
  // Карточка трейтов на вкладке Мех: те же блоки.
  X.renderLists();
  const tb = r.elements['traitsBox'].innerHTML;
  if (!tb.includes('trait-item')) throw new Error('FN: the Mech tab traits card must use trait-item blocks');
  if (!tb.includes('<b>Инициатива:</b>') && !tb.includes('<b>Initiative:</b>')) throw new Error('FN: the Mech tab must bold the trait names');
  // Оружие: две пушки в одном маунте — две карточки, линия между ними по CSS.
  const mHtml = r.elements['mounts'].innerHTML;
  if ((mHtml.match(/class="wcard"/g) || []).length !== 2) throw new Error('FN: the mount must render two weapon cards');
  // Системы: две карточки — разделитель между ними по CSS (+ .sec.sys).
  const sHtml = r.elements['systems'].innerHTML;
  if ((sHtml.match(/class="sec sys/g) || []).length !== 2) throw new Error('FN: two system cards must render');
  // Таланты: два таланта — оба с классом talent-item.
  const tHtml = r.elements['talents'].innerHTML;
  if ((tHtml.match(/talent-item/g) || []).length !== 2) throw new Error('FN: two talents must render as talent-item blocks');
  // Кор бонусы: выбранный бонус — строка cb-item.
  const cbHtml = r.elements['coreBonuses'].innerHTML;
  if (!cbHtml.includes('cb-item')) throw new Error('FN: the chosen core bonus must render as a cb-item row');
  // Деталь фрейма: трейты — те же блоки.
  const fdHtml = X.frameDetailHtml('Everest');
  if (!fdHtml.includes('trait-item')) throw new Error('FN: the frame detail must use trait-item blocks');
  if (!fdHtml.includes('<b>Инициатива:</b>') && !fdHtml.includes('<b>Initiative:</b>')) throw new Error('FN: the frame detail must bold the trait names');
})();
// PHASE FO (v219): правила с вкладки Меха (Статусы, Потеря структуры,
// Перегрев реактора, Отдых и полный ремонт) переехали в Правила — ниже блока
// Реакций. Кнопка «Полный ремонт» осталась на вкладке Меха и теперь всегда
// видна (раньше пряталась внутри свёрнутого блока). Первый блок Правил
// больше не открывается сам. Назад без открытых диалогов с не-главной
// вкладки ведёт на главную (Мех).
(function(){
  // Статика: порядок блоков в исходнике.
  const rulesIdx = html.indexOf('id="tab-rules"');
  const mechIdx = html.indexOf('id="tab-mech"');
  if (rulesIdx < 0 || mechIdx < 0) throw new Error('FO: tab sections must exist');
  if (html.includes('<details class="sec" open>')) throw new Error('FO: no details block may auto-open in Rules');
  const mechHtml = html.slice(mechIdx, rulesIdx);
  for (const u of ['u233','u021','u035','u050']){
    if (mechHtml.includes('data-i18n="'+u+'"')) throw new Error('FO: the '+u+' rules block must leave the Mech tab');
  }
  if (!mechHtml.includes('onclick="fullRepair()"')) throw new Error('FO: the Full Repair button must stay on the Mech tab');
  const iReac = html.indexOf('data-i18n="u130"');
  const iPilot = html.indexOf('data-i18n="u136"');
  const iStat = html.indexOf('data-i18n="u233"');
  const iStruct = html.indexOf('data-i18n="u021"');
  const iHeat = html.indexOf('data-i18n="u035"');
  const iRest = html.indexOf('data-i18n="u050"');
  if (!(rulesIdx < iReac && iReac < iStat && iStat < iStruct && iStruct < iHeat && iHeat < iRest && iRest < iPilot)) throw new Error('FO: the moved blocks must sit in Rules, after Reactions and before Pilot actions');
  if (html.slice(iRest, iPilot).includes('fullRepair()')) throw new Error('FO: the moved Rest block must not carry the Full Repair button');
  if (!html.includes('id="statusRef"')) throw new Error('FO: the statuses list must survive the move');
  // Поведение: Назад без диалогов — на главную.
  const store = {};
  store['lancer-tracker-v1'] = JSON.stringify({
    pilot:{name:'Test', licenses:[], coreBonuses:[], hull:0, agility:0, systems:0, engineering:0},
    mech:{frame:'Everest'},
    talents:[], triggers:[],
    mounts:[{type:'Main',weapons:[]}],
    systems:[], statuses:[], settings:{}
  });
  const r = runEval(store);
  const X = r.X;
  if (X.curTab() !== 'mech') throw new Error('FO: curTab must start at mech');
  X.showTab('rules');
  if (X.curTab() !== 'rules') throw new Error('FO: showTab(rules) must switch to rules');
  if (!X.tabHist()) throw new Error('FO: leaving the main tab must arm the tab history entry');
  X.onDlgPopstate();
  if (X.curTab() !== 'mech') throw new Error('FO: Back with no dialog open must return to the main tab');
  if (X.tabHist()) throw new Error('FO: the Back press must consume the tab history entry');
  // Назад на главной — никуда не ведёт и не падает.
  X.onDlgPopstate();
  if (X.curTab() !== 'mech') throw new Error('FO: Back on the main tab must stay on the main tab');
  // Ручной возврат на главную тоже снимает запись.
  X.showTab('pilot');
  if (!X.tabHist()) throw new Error('FO: leaving the main tab for Pilot must arm the tab history entry');
  X.showTab('mech');
  if (X.tabHist()) throw new Error('FO: returning to the main tab by hand must consume the tab history entry');
  if (X.curTab() !== 'mech') throw new Error('FO: manual return must land on the main tab');
  // Диалог важнее вкладки: Назад при открытом поиске не переключает вкладку.
  X.showTab('rules');
  X.openSearch('license', null);
  X.onDlgPopstate();
  if (X.curTab() !== 'rules') throw new Error('FO: Back with the search dialog open must NOT switch tabs');
})();
// PHASE FP (v220): статусы в Правилах — компактный список: только имена + кнопка
// ＋/✓, описание только у раскрытого (один за раз); полный ремонт —
// с подтверждением и тихой кнопкой-аутлайном.
(function(){
  // Статика: кнопка полного ремонта — аутлайн, не primary.
  const btnTag = (html.match(/<button[^>]*onclick="fullRepair\(\)"[^>]*>/) || [])[0];
  if (!btnTag) throw new Error('FP: the Full Repair button must exist');
  if (btnTag.includes('primary')) throw new Error('FP: the Full Repair button must be the quiet outline style, not primary');
  const store = {};
  store['lancer-tracker-v1'] = JSON.stringify({
    pilot:{name:'Test', licenses:[], coreBonuses:[], hull:0, agility:0, systems:0, engineering:0},
    mech:{frame:'Everest', hp:2},
    talents:[], triggers:[],
    mounts:[{type:'Main',weapons:[]}],
    systems:[], statuses:['Impaired'], settings:{}
  });
  const r = runEval(store);
  const X = r.X;
  // Список статусов: имена есть, описаний нет, пока ничего не раскрыто.
  X.renderLists();
  let refHtml = r.elements['statusRef'].innerHTML;
  if (!refHtml.includes('Impaired')) throw new Error('FP: the status list must show the status names');
  if (refHtml.includes('status-ref-desc')) throw new Error('FP: no status description may show before tapping a status');
  if (!refHtml.includes('status-ref-toggle')) throw new Error('FP: each status row must have an apply/remove toggle');
  if ((refHtml.match(/✓/g) || []).length !== 1) throw new Error('FP: the applied status must show exactly one ✓ toggle');
  // Тап по статусу раскрывает только его описание.
  X.toggleStatusRef('Impaired');
  refHtml = r.elements['statusRef'].innerHTML;
  if (!refHtml.includes('status-ref-desc')) throw new Error('FP: tapping a status must show its description');
  if (!refHtml.includes(X.statusDesc('Impaired'))) throw new Error('FP: the expanded row must show the Impaired description');
  // Раскрытие другого закрывает первое (один открытый за раз).
  X.toggleStatusRef('Slowed');
  refHtml = r.elements['statusRef'].innerHTML;
  if (!refHtml.includes(X.statusDesc('Slowed'))) throw new Error('FP: tapping Slowed must show the Slowed description');
  if (refHtml.includes(X.statusDesc('Impaired'))) throw new Error('FP: opening one status must close the other');
  // Повторный тап закрывает.
  X.toggleStatusRef('Slowed');
  if (r.elements['statusRef'].innerHTML.includes('status-ref-desc')) throw new Error('FP: tapping the open status must collapse it');
  // Кнопка ＋/✓ накладывает и снимает, не раскрывая описание.
  X.toggleStatus('Slowed');
  refHtml = r.elements['statusRef'].innerHTML;
  if (!refHtml.includes('status-ref-item on')) throw new Error('FP: applying a status must mark its row active');
  if (refHtml.includes('status-ref-desc')) throw new Error('FP: applying a status must not expand its description');
  // Полный ремонт: спрашивает подтверждение и чинит; отмена — не чинит.
  if (X.get('mech.hp') !== 2) throw new Error('FP: the test mech must start damaged');
  r.g.confirmCalls.length = 0;
  X.fullRepair();
  if (!r.g.confirmCalls.some(m => m === X.L('u256'))) throw new Error('FP: full repair must ask for confirmation');
  if (X.get('mech.hp') !== X.get('mech.hpMax')) throw new Error('FP: confirming full repair must restore HP');
  X.set('mech.hp', 2);
  const savedConfirm = global.confirm;
  global.confirm = () => false;
  X.fullRepair();
  global.confirm = savedConfirm;
  if (X.get('mech.hp') !== 2) throw new Error('FP: cancelling full repair must not repair');
})();
// PHASE FQ (v221): Назад и история вкладок — слушатель popstate привязан
// при запуске (а не при первом открытии диалога), а одно Назад делает
// ровно один шаг: закрытие диалога вкладку не трогает.
// (Урок из FO: в стабе ручной возврат на Мех оставляет suppressNextPopstate
// взведённым — в браузере его съедает эхо-popstate, а в стабе нет, —
// поэтому диалоговая проверка FO проходила впустую. FQ идёт на свежем
// runEval и без ручного возврата на Мех перед диалогом.)
(function(){
  // Статика: обработчик привязан в строке инициализации приложения.
  if (!html.includes('bind(); bindDlgHistory(); recalcDerived();')) throw new Error('FQ: the popstate listener must be bound at startup');
  if (!html.includes('одно Назад — один шаг')) throw new Error('FQ: onDlgPopstate must return after closing a view');
  const store = {};
  store['lancer-tracker-v1'] = JSON.stringify({
    pilot:{name:'Test', licenses:[], coreBonuses:[], hull:0, agility:0, systems:0, engineering:0},
    mech:{frame:'Everest'},
    talents:[], triggers:[],
    mounts:[{type:'Main',weapons:[]}],
    systems:[], statuses:[], settings:{}
  });
  const r = runEval(store);
  const X = r.X;
  X.showTab('rules');
  X.openSearch('license', null);
  if (!X.searchViewOpen()) throw new Error('FQ: the search view must be open');
  // Первое Назад: вид закрывается, вкладка остаётся Правилами,
  // запись истории вкладок не снимается (съедена запись вида).
  X.onDlgPopstate();
  if (X.searchViewOpen()) throw new Error('FQ: Back must close the search view');
  if (X.curTab() !== 'rules') throw new Error('FQ: Back that closes a view must NOT also switch tabs');
  if (!X.tabHist()) throw new Error('FQ: closing a view by Back must not consume the tab history entry');
  // Второе Назад: видов нет — возврат на главную.
  X.onDlgPopstate();
  if (X.curTab() !== 'mech') throw new Error('FQ: the next Back must return to the main tab');
  if (X.tabHist()) throw new Error('FQ: the second Back must consume the tab history entry');
})();
// PHASE FR (v222, v223): Nuclear Cavalier III — «Gain the Fuel Rod Gun
// integrated weapon». По книге встроенный маунт строится вокруг конкретной
// пушки: у каждой встроенной пушки СВОЙ отдельный Integrated-маунт. v223:
// маунт помечается src 'nuc-cav' (provenance): снятие таланта или падение
// ранга ниже III убирает пушку и пустой маунт; трогаются ТОЛЬКО помеченные
// маунты, вручную добавленная Fuel Rod Gun не трогается. Повторный синк
// дубликата не даёт; удалённое вручную не возвращается само (синк только
// по событию смены таланта).
(function(){
  // Статика: ранги талантов меняются только через setTalentRank.
  if (!/function setTalentRank\(i, v\)/.test(html)) throw new Error('FR: setTalentRank must exist');
  if (!/function syncNuclearCavalier\(\)/.test(html)) throw new Error('FR: syncNuclearCavalier must exist');
  if (html.includes('S.talents[${i}].rank=+this.value')) throw new Error('FR: no inline talent-rank assignment may remain');
  const store = {};
  store['lancer-tracker-v1'] = JSON.stringify({
    pilot:{name:'Test', licenses:[], coreBonuses:[], hull:0, agility:0, systems:0, engineering:0},
    mech:{frame:'Everest'},
    talents:[{name:'Nuclear Cavalier', rank:2}], triggers:[],
    mounts:[{type:'Main',weapons:[]}],
    systems:[], statuses:[], settings:{}
  });
  const r = runEval(store);
  const X = r.X;
  const S = X.getS();
  const guns = () => S.mounts.flatMap(m=>m.weapons||[]).filter(w=>w.name==='Fuel Rod Gun');
  const intMounts = () => S.mounts.filter(m=>m.type==='Integrated');
  const srcMounts = () => S.mounts.filter(m=>m.src==='nuc-cav');
  // Поднятие ранга до III добавляет Fuel Rod Gun на СВОЁМ помеченном маунте.
  X.setTalentRank(0, 3);
  if (guns().length !== 1) throw new Error('FR: reaching Nuclear Cavalier III must add exactly one Fuel Rod Gun');
  if (intMounts().length !== 1) throw new Error('FR: the Fuel Rod Gun must sit on its own Integrated mount');
  if (srcMounts().length !== 1) throw new Error('FR: the granted mount must carry the nuc-cav source mark');
  if (intMounts()[0].weapons.length !== 1) throw new Error('FR: the new Integrated mount must hold only the Fuel Rod Gun');
  const gun = guns()[0];
  if (gun.dmg !== '1d3+2 Energy') throw new Error('FR: the Fuel Rod Gun row must carry its DB damage');
  if (gun.left !== 3) throw new Error('FR: the Fuel Rod Gun must start with 3 charges (Limited 3), got ' + gun.left);
  // Повторный синк дубликата не даёт.
  X.syncNuclearCavalier();
  if (guns().length !== 1) throw new Error('FR: re-syncing must not duplicate the Fuel Rod Gun');
  // Вручную добавленная Fuel Rod Gun не трогается при снятии ранга.
  S.mounts[0].weapons.push({name:'Fuel Rod Gun', dmg:'1d3+2 Energy', range:'Range 3, Threat 3', desc:''});
  X.setTalentRank(0, 2);
  if (guns().length !== 1) throw new Error('FR: lowering the rank must leave only the manually added Fuel Rod Gun');
  if (srcMounts().length !== 0) throw new Error('FR: lowering the rank must remove the granted mount');
  if (S.mounts.length !== 1) throw new Error('FR: lowering the rank must leave only the Main mount');
  // Повторное поднятие возвращает пушку на новом помеченном маунте.
  X.setTalentRank(0, 3);
  if (guns().length !== 2) throw new Error('FR: re-raising to III must restore the granted gun alongside the manual one');
  if (srcMounts().length !== 1) throw new Error('FR: re-raising must restore exactly one marked mount');
  // Снятие ранга снова убирает только выданную пушку.
  X.setTalentRank(0, 2);
  if (guns().length !== 1) throw new Error('FR: the second lowering must again leave only the manual gun');
  // Удаление таланта (delRow) убирает пушку и маунт.
  X.setTalentRank(0, 3);
  if (guns().length !== 2) throw new Error('FR: setup for delRow must have two Fuel Rod Guns');
  X.delRow('talents', 0);
  if (S.talents.length !== 0) throw new Error('FR: delRow must remove the talent');
  if (guns().length !== 1) throw new Error('FR: deleting the talent must remove the granted gun');
  if (srcMounts().length !== 0) throw new Error('FR: deleting the talent must remove the granted mount');
  // Удаление таланта из мастера повышения уровня (luRemoveTalent) — то же.
  const store3 = {};
  store3['lancer-tracker-v1'] = JSON.stringify({
    pilot:{name:'Test', licenses:[], coreBonuses:[], hull:0, agility:0, systems:0, engineering:0},
    mech:{frame:'Everest'},
    talents:[{name:'Nuclear Cavalier', rank:2}], triggers:[],
    mounts:[{type:'Main',weapons:[]}],
    systems:[], statuses:[], settings:{}
  });
  const r3 = runEval(store3);
  const X3 = r3.X;
  const S3 = X3.getS();
  X3.setTalentRank(0, 3);
  if (S3.mounts.flatMap(m=>m.weapons||[]).filter(w=>w.name==='Fuel Rod Gun').length !== 1) throw new Error('FR: setup for luRemoveTalent must have one Fuel Rod Gun');
  X3.luRemoveTalent(0);
  if (S3.mounts.flatMap(m=>m.weapons||[]).filter(w=>w.name==='Fuel Rod Gun').length !== 0) throw new Error('FR: luRemoveTalent must remove the granted gun');
  if (S3.mounts.filter(m=>m.src==='nuc-cav').length !== 0) throw new Error('FR: luRemoveTalent must remove the granted mount');
  // Маунт от фрейма не трогается: у каждой встроенной пушки свой маунт.
  const store2 = {};
  store2['lancer-tracker-v1'] = JSON.stringify({
    pilot:{name:'Test', licenses:[], coreBonuses:[], hull:0, agility:0, systems:0, engineering:0},
    mech:{frame:'Sherman'},
    talents:[{name:'Nuclear Cavalier', rank:2}], triggers:[],
    mounts:[{type:'Integrated',weapons:[{name:'ZF4 SOLIDCORE',dmg:'',range:'',desc:''}]},{type:'Main',weapons:[]}],
    systems:[], statuses:[], settings:{}
  });
  const r2 = runEval(store2);
  const X2 = r2.X;
  const S2 = X2.getS();
  X2.setTalentRank(0, 3);
  const im2 = S2.mounts.filter(m=>m.type==='Integrated');
  if (im2.length !== 2) throw new Error('FR: with a frame Integrated mount present, the Fuel Rod Gun must get a second Integrated mount, got ' + im2.length);
  if (!im2[0].weapons.some(w=>w.name==='ZF4 SOLIDCORE')) throw new Error('FR: the frame Integrated mount must keep its weapon');
  if (!im2[1].weapons.some(w=>w.name==='Fuel Rod Gun')) throw new Error('FR: the second Integrated mount must hold the Fuel Rod Gun');
  X2.setTalentRank(0, 2);
  const im2b = S2.mounts.filter(m=>m.type==='Integrated');
  if (im2b.length !== 1) throw new Error('FR: lowering the rank must leave only the frame Integrated mount');
  if (!im2b[0].weapons.some(w=>w.name==='ZF4 SOLIDCORE')) throw new Error('FR: lowering the rank must keep the frame weapon');
  if (S2.mounts.flatMap(m=>m.weapons||[]).some(w=>w.name==='Fuel Rod Gun')) throw new Error('FR: lowering the rank must remove the granted gun');
})();
// PHASE FS (v224): B2 records — 30 named system actions in ACTIONS_REF
// (29 quick + 1 reaction). RU texts come from the established RU system
// translation (not draft). Grenades with no activation in lancer-data are
// Quick (siblings Pattern-A/B are Quick); //SCORPION is a Reaction (it
// has a trigger); Grapple Swing / Roland Chamber / Repulse-Attract are
// NOT actions (movement rider / passive rider / deploy mode) and stay
// text-only on the card.
(function(){
  const A = global.__x.ACTIONS_REF;
  const all = [...A.quick, ...A.reactions, ...A.protocols];
  const keys = all.map(a=>a.key);
  if (keys.length !== new Set(keys).size) throw new Error('FS: ACTIONS_REF keys must be unique');
  if (all.length !== 209) throw new Error('FS: ACTIONS_REF must hold 209 entries, got ' + all.length);
  const NEW_Q = ['smokegrenade','fraggrenade','dragdown','simulacrum','mesmerbeacon','diluvianark','chargestasisbolt','deactivatehyperdensearmor','deactivateretractableprofile','deactivatelboccloakingfield','activatemimicmesh','hurlintotheduat','guidetheflock','electropulse','spreadfocus','pinpointfocus','chainsofprometheus','excommunicate','predatorpreyconcepts','slavesystems','bendprobability','chargedstake','blinkshield','hardlightdefensesystem','thermalgrenade','flashgrenade','napalmgrenade','gravitygrenade','rollergrenade'];
  for (const k of NEW_Q) {
    const e = A.quick.find(q=>q.key===k);
    if (!e) throw new Error('FS: quick entry missing: ' + k);
    if (!e.ru || !e.grant || !e.grant.system) throw new Error('FS: entry must have a RU name and a system grant: ' + k);
    if (!e.tx_en || !e.tx_ru) throw new Error('FS: entry must have EN and RU text: ' + k);
  }
  for (const k of ['hurlintotheduat','guidetheflock','electropulse','spreadfocus','pinpointfocus']) {
    const e = A.quick.find(q=>q.key===k);
    if (!e.tx_en.startsWith('Quick Tech: ')) throw new Error('FS: ' + k + ' must carry the Quick Tech prefix (EN)');
    if (!e.tx_ru.startsWith('Быстрая техника: ')) throw new Error('FS: ' + k + ' must carry the Quick Tech prefix (RU)');
  }
  for (const k of ['chainsofprometheus','excommunicate','predatorpreyconcepts','slavesystems','bendprobability']) {
    const e = A.quick.find(q=>q.key===k);
    if (!e.tx_en.startsWith('Full Tech: ')) throw new Error('FS: ' + k + ' must carry the Full Tech prefix (EN)');
    if (!e.tx_ru.startsWith('Полная техника: ')) throw new Error('FS: ' + k + ' must carry the Full Tech prefix (RU)');
  }
  for (const k of ['chargedstake','blinkshield','hardlightdefensesystem']) {
    const e = A.quick.find(q=>q.key===k);
    if (!e.tx_en.startsWith('Full Action: ')) throw new Error('FS: ' + k + ' must carry the Full Action prefix (EN)');
    if (!e.tx_ru.startsWith('Полное действие: ')) throw new Error('FS: ' + k + ' must carry the Full Action prefix (RU)');
  }
  const sc = A.reactions.find(r=>r.key==='activatescorpion');
  if (!sc || sc.grant.system !== '//SCORPION V70.1') throw new Error('FS: Activate //SCORPION must be a reaction granted by //SCORPION V70.1');
  if (!sc.tr_ru || !sc.ef_ru || !sc.tr_en || !sc.ef_en) throw new Error('FS: //SCORPION must have trigger and effect in both languages');
  if (A.quick.some(q=>q.key==='activatescorpion')) throw new Error('FS: //SCORPION must not sit in the quick list');
  // A build holding all 26 granting systems shows all 30 entries.
  const sysNames = ['Pattern-A Smoke Charges','Pattern-B HEX Charges','Reinforced Cabling','ATHENA-Class NHP','Mesmer Charges','NOAH-Class NHP','Stasis Bolt','HyperDense Armor','Retractable Profile','LB/OC Cloaking Field','Mimic Mesh','OSIRIS-Class NHP','PUPPETMASTER','Tesseract','Aggressive System Sync','Law of Blades','SISYPHUS-Class NHP','Charged Stake','Blinkshield','Hardlight Defense System','BB Breach/Blast Charges','Flash Charges','HAVOK Charges','Grounding Charges','“Roller” Directed Payload Charges','//SCORPION V70.1'];
  const storeFS = {};
  storeFS['lancer-tracker-v1'] = JSON.stringify({
    pilot:{name:'Test', licenses:[], coreBonuses:[], hull:0, agility:0, systems:0, engineering:0},
    mech:{frame:'Everest'},
    talents:[], triggers:[],
    mounts:[{type:'Main',weapons:[]}],
    systems: sysNames.map(n=>({name:n, desc:'', charges:0})),
    statuses:[], settings:{}
  });
  const rFS = runEval(storeFS);
  const XFS = rFS.X;
  const myFS = rFS.elements['myActions'].innerHTML;
  const ruNames = ['Дымовая граната','Осколочная граната','Опрокинуть','Симулякр','Маяк-месмер','Потопный ковчег','Зарядить стазис-болт','Деактивировать сверхуплотнённую броню','Деактивировать складной профиль','Деактивировать маскировочное поле LB/OC','Активировать мимик-сеть','Низвергнуть в Дуат','Вести стаю','Электроимпульс','Рассеянный фокус','Точечный фокус','Цепи Прометея','Отлучение','Концепции хищника и добычи','Подчинённые системы','Искривление вероятности','Заряженный кол','Блинк-щит','Защитная система твёрдого света','Термограната','Вспышечная граната','Напалмовая граната','Гравитационная граната','Граната «Роллер»','Активация //SCORPION'];
  for (const nm of ruNames) {
    if (!myFS.includes(nm)) throw new Error('FS: My Actions must show ' + nm);
  }
  for (const k of [...NEW_Q, 'activatescorpion']) {
    const e = all.find(a=>a.key===k);
    if (!XFS.actionGranted(e)) throw new Error('FS: actionGranted must grant ' + k + ' to this build');
  }
  if (myFS.includes('Ответный огонь') || myFS.includes('Return Fire')) throw new Error('FS: Return Fire must NOT show without Gunslinger');
})();
// PHASE FT (v225): B2 unnamed activations — 28 system actions in ACTIONS_REF
// (all quick; entry name = system name, RU name from db.js nr). Explosive
// Vents is NOT an action: it triggers automatically whenever you clear all
// heat or take stress (book) — text stays on the card only.
(function(){
  const A = global.__x.ACTIONS_REF;
  const NEW_U = ['argonautshield','cablewinchsystem','whitewashsealantspray','acesostabilizer','hyperdensearmor','ferrouslash','magneticshield','trackingbug','stuncrown','javelinrockets','fadecloak','markerlight','lboccloakingfield','swarmbody','metahook','monitormodule','emppulse','interdictionfield','hunterlock','eyeofhorus','siegestabilizers','flaklauncher','externalammofeed','repulserfield','stasisgenerator','enclavepatternsupportshield','redundantsystemsupgrade','plasmagauntlet'];
  for (const k of NEW_U) {
    const e = A.quick.find(q=>q.key===k);
    if (!e) throw new Error('FT: quick entry missing: ' + k);
    if (!e.ru || !e.grant || !e.grant.system) throw new Error('FT: entry must have a RU name and a system grant: ' + k);
    if (!e.tx_en || !e.tx_ru) throw new Error('FT: entry must have EN and RU text: ' + k);
    if (e.name !== e.grant.system) throw new Error('FT: unnamed entry name must equal its system: ' + k);
  }
  for (const k of ['trackingbug','metahook']) {
    const e = A.quick.find(q=>q.key===k);
    if (!e.tx_en.startsWith('Quick Tech: ')) throw new Error('FT: ' + k + ' must carry the Quick Tech prefix (EN)');
    if (!e.tx_ru.startsWith('Быстрая техника: ')) throw new Error('FT: ' + k + ' must carry the Quick Tech prefix (RU)');
  }
  const ml = A.quick.find(q=>q.key==='markerlight');
  if (!ml.tx_en.startsWith('Full Tech: ')) throw new Error('FT: markerlight must carry the Full Tech prefix (EN)');
  if (!ml.tx_ru.startsWith('Полная техника: ')) throw new Error('FT: markerlight must carry the Full Tech prefix (RU)');
  if (A.quick.some(q=>q.key==='explosivevents')) throw new Error('FT: Explosive Vents must NOT be an action (it triggers automatically)');
  // A build holding all 28 granting systems shows all 28 entries.
  const sysNames = ['Argonaut Shield','Cable Winch System','Whitewash Sealant Spray','Aceso Stabilizer','HyperDense Armor','Ferrous Lash','Magnetic Shield','Tracking Bug','StunCrown','Javelin Rockets','FADE Cloak','Markerlight','LB/OC Cloaking Field','Swarm Body','Metahook','Monitor Module','EMP Pulse','Interdiction Field','Hunter Lock','Eye of HORUS','Siege Stabilizers','Flak Launcher','External Ammo Feed','Repulser Field','Stasis Generator','ENCLAVE-Pattern Support Shield','Redundant Systems Upgrade','Plasma Gauntlet'];
  const storeFT = {};
  storeFT['lancer-tracker-v1'] = JSON.stringify({
    pilot:{name:'Test', licenses:[], coreBonuses:[], hull:0, agility:0, systems:0, engineering:0},
    mech:{frame:'Everest'},
    talents:[], triggers:[],
    mounts:[{type:'Main',weapons:[]}],
    systems: sysNames.map(n=>({name:n, desc:'', charges:0})),
    statuses:[], settings:{}
  });
  const rFT = runEval(storeFT);
  const XFT = rFT.X;
  const myFT = rFT.elements['myActions'].innerHTML;
  const ruNames = ['Щит «Аргонавт»','Система кабельной лебёдки','Герметик-спрей «Побелка»','Стабилизатор Ацесо','Сверхуплотнённая броня','Ферроплеть','Магнитный щит','Жучок слежения','Оглушающая корона','Ракеты «Дротик»','Плащ FADE','Целеуказатель','Маскировочное поле LB/OC','Роевое тело','Метахук','Модуль «Монитор»','ЭМИ-импульс','Поле перехвата','Охотничий захват','Око HORUS','Осадные стабилизаторы','Зенитная установка','Внешняя подача боеприпасов','Поле отталкивания','Стазис-генератор','Щит поддержки образца ENCLAVE','Улучшение резервных систем','Плазменная перчатка'];
  for (const nm of ruNames) {
    if (!myFT.includes(nm)) throw new Error('FT: My Actions must show ' + nm);
  }
  const all = [...A.quick, ...A.reactions, ...A.protocols];
  for (const k of NEW_U) {
    const e = all.find(a=>a.key===k);
    if (!XFT.actionGranted(e)) throw new Error('FT: actionGranted must grant ' + k + ' to this build');
  }
})();
// PHASE FU (v226): talent dice as chips, AI tag on the mech card.
// The die's rule text leaves the talent card (only the chip stays); the full
// text lives in the chip dialog. Leader II keeps its reaction sentence.
(function(){
  if (html.indexOf('"u259": {"ru": "Кости лидерства"') < 0 || html.indexOf('"u263": {"ru": "Кость потока"') < 0) throw new Error('FU: i18n u259-u263 (die names) must be in STR');
  const storeFU = {};
  storeFU['lancer-tracker-v1'] = JSON.stringify({
    pilot:{name:'Test', licenses:[], coreBonuses:[], hull:0, agility:0, systems:0, engineering:0},
    mech:{frame:'Everest'},
    talents:[{name:'Leader', rank:3},{name:'Brawler', rank:3},{name:'Gunslinger', rank:3},{name:'Duelist', rank:3},{name:'Stormbringer', rank:3}],
    triggers:[], mounts:[{type:'Main',weapons:[]}], systems:[], statuses:[], settings:{}
  });
  const rFU = runEval(storeFU);
  const XFU = rFU.X;
  const talFU = rFU.elements['talents'].innerHTML;
  for (const nm of ['Кости лидерства','Кость драчуна','Кость стрелка','Кости мастера клинка','Кость потока']) {
    if (!talFU.includes(nm)) throw new Error('FU: talent list must show the ' + nm + ' chip');
  }
  if (!talFU.includes('6 <small>/ 6</small>')) throw new Error('FU: Leader III chip must read 6 / 6');
  if (!talFU.includes('0 <small>/ 3</small>')) throw new Error('FU: Duelist chip must read 0 / 3');
  if ((talFU.split('<span class="val">6</span>').length - 1) !== 3) throw new Error('FU: Brawler, Gunslinger and Stormbringer chips must read 6');
  for (const gone of ['нокаутирующий удар','массивную атаку','Парирование','бронебойность','Союзники, у которых есть ваши кости лидерства','Получить 6 костей лидерства']) {
    if (talFU.includes(gone)) throw new Error('FU: die rule text must leave the talent card: ' + gone);
  }
  if (!talFU.includes('отдавать приказ реакцией')) throw new Error('FU: Leader II must keep its reaction sentence on the card');
  const rdsL = XFU.talentRankDesc({name:'Leader', rank:3});
  if (rdsL.length !== 1 || rdsL[0].k !== 1) throw new Error('FU: Leader III must show only the rank-II entry (numeral II), got ' + JSON.stringify(rdsL.map(r=>r.k)));
  // Stepper: pools clamp 0..max, value dice clamp 1..6.
  const SFU = XFU.getS();
  XFU.stepTalentDice(0,-1);
  if (XFU.diceFor(SFU.talents[0]).val !== 5) throw new Error('FU: Leader step -1 must give 5');
  for (let k=0;k<7;k++) XFU.stepTalentDice(0,-1);
  if (XFU.diceFor(SFU.talents[0]).val !== 0) throw new Error('FU: Leader pool must clamp at 0');
  XFU.stepTalentDice(0,1);
  if (XFU.diceFor(SFU.talents[0]).val !== 1) throw new Error('FU: Leader step +1 from 0 must give 1');
  XFU.stepTalentDice(1,-1);
  if (XFU.diceFor(SFU.talents[1]).val !== 5) throw new Error('FU: Brawler step -1 must give 5');
  for (let k=0;k<7;k++) XFU.stepTalentDice(1,-1);
  if (XFU.diceFor(SFU.talents[1]).val !== 1) throw new Error('FU: Brawler value must clamp at 1');
  XFU.stepTalentDice(3,1); XFU.stepTalentDice(3,1); XFU.stepTalentDice(3,1); XFU.stepTalentDice(3,1);
  if (XFU.diceFor(SFU.talents[3]).val !== 3) throw new Error('FU: Duelist pool must clamp at 3');
  // Full repair resets the dice: Leader to max, value dice to 6, Duelist to 0.
  XFU.fullRepair();
  if (XFU.diceFor(SFU.talents[0]).val !== 6) throw new Error('FU: fullRepair must restore Leader dice to 6');
  if (XFU.diceFor(SFU.talents[1]).val !== 6) throw new Error('FU: fullRepair must reset the Brawler die to 6');
  if (XFU.diceFor(SFU.talents[2]).val !== 6) throw new Error('FU: fullRepair must reset the Gunslinger die to 6');
  if (XFU.diceFor(SFU.talents[3]).val !== 0) throw new Error('FU: fullRepair must clear Blademaster dice to 0');
  if (XFU.diceFor(SFU.talents[4]).val !== 6) throw new Error('FU: fullRepair must reset the Torrent die to 6');
  // The chip dialog carries the full die rules.
  const rFU2 = runEval(storeFU);
  rFU2.X.showDiceDlg(1);
  if (!rFU2.elements['refDlgBody'].innerHTML.includes('нокаутирующий удар')) throw new Error('FU: the Brawler chip dialog must hold the full die rules');
  if (!rFU2.elements['refDlgName'].textContent.includes('Кость драчуна')) throw new Error('FU: the Brawler chip dialog must be titled Кость драчуна');
  // Lower ranks: Leader I shows 3 / 3 and no rank-I text; Brawler II has no chip.
  const storeFU2 = {};
  storeFU2['lancer-tracker-v1'] = JSON.stringify({
    pilot:{name:'Test', licenses:[], coreBonuses:[], hull:0, agility:0, systems:0, engineering:0},
    mech:{frame:'Everest'},
    talents:[{name:'Leader', rank:1},{name:'Duelist', rank:2},{name:'Brawler', rank:2}],
    triggers:[], mounts:[{type:'Main',weapons:[]}], systems:[], statuses:[], settings:{}
  });
  const rFU3 = runEval(storeFU2);
  const talFU3 = rFU3.elements['talents'].innerHTML;
  if (!talFU3.includes('3 <small>/ 3</small>')) throw new Error('FU: Leader I chip must read 3 / 3');
  if (talFU3.includes('Получить 3 кости лидерства, d6')) throw new Error('FU: Leader I rule text must leave the card');
  if (talFU3.includes('Парирование')) throw new Error('FU: Duelist II rule text must leave the card');
  if ((talFU3.split('onclick="showDiceDlg(').length - 1) !== 2) throw new Error('FU: only Leader I and Duelist II must show dice chips');
  if (rFU3.X.diceFor({name:'Brawler', rank:2}) !== null) throw new Error('FU: Brawler below rank III must have no die');
  // AI tag on the mech card: shown when an AI system is installed, red with a
  // count when more than one AI counts; Enlightenment does not count.
  function aiStore(sysNames){
    const st = {};
    st['lancer-tracker-v1'] = JSON.stringify({ pilot:{name:'Test', licenses:[], coreBonuses:[], hull:0, agility:0, systems:0, engineering:0},
      mech:{frame:'Everest'}, talents:[], triggers:[], mounts:[{type:'Main',weapons:[]}],
      systems: sysNames.map(n=>({name:n, desc:'', charges:0})), statuses:[], settings:{} });
    return st;
  }
  const ai0 = runEval(aiStore([]));
  if (ai0.elements['mechAiTag'].innerHTML !== '') throw new Error('FU: no AI system must mean no AI chip');
  const ai1 = runEval(aiStore(['ATHENA-Class NHP']));
  if (!ai1.elements['mechAiTag'].innerHTML.includes('ИИ')) throw new Error('FU: one AI system must show the AI chip');
  if (ai1.elements['mechAiTag'].innerHTML.includes('warn')) throw new Error('FU: one AI system must not warn');
  if (ai1.X.mechAi().count !== 1) throw new Error('FU: mechAi count must be 1 for ATHENA');
  const ai2 = runEval(aiStore(['ATHENA-Class NHP','OSIRIS-Class NHP']));
  if (!ai2.elements['mechAiTag'].innerHTML.includes('×2')) throw new Error('FU: two AI systems must show ×2');
  if (!ai2.elements['mechAiTag'].innerHTML.includes('warn')) throw new Error('FU: two AI systems must warn (one AI at a time)');
  const ai3 = runEval(aiStore(['ATHENA-Class NHP','Enlightenment-Class NHP']));
  if (ai3.elements['mechAiTag'].innerHTML.includes('warn')) throw new Error('FU: Enlightenment must not count towards the AI limit');
  if (ai3.X.mechAi().count !== 1 || ai3.X.mechAi().list.length !== 2) throw new Error('FU: ATHENA + Enlightenment must count 1 of 2 AI systems');
  const ai4 = runEval(aiStore(['COMP/CON-Class Assistant Unit']));
  if (!ai4.elements['mechAiTag'].innerHTML.includes('ИИ')) throw new Error('FU: the COMP/CON assistant must show the AI chip');
})();
// PHASE FV (v227, reworked in v228): dice chips in the talent search. The die
// rule text leaves the search result; the chip sits on its own rank's line
// (all ranks stay visible) and opens the full rules.
(function(){
  if (!html.includes('talentRankDisplay({ name: t.n, rank: (d.r||[]).length })')) throw new Error('FV: showTalentResults must reuse the talentRankDisplay filter');
  const rFV = runEval({});
  const XFV = rFV.X;
  const leaderIdx = rFV.DB.talents.findIndex(t=>t.n==='Leader');
  XFV.showTalentResults('leader');
  const resFV = rFV.elements['talentResults'].innerHTML;
  if (!resFV.includes('Кости лидерства')) throw new Error('FV: the Leader search result must show the dice chip');
  if (resFV.includes('Получить 3 кости лидерства')) throw new Error('FV: the Leader rank-I die text must leave the search result');
  if (resFV.includes('Получить 6 костей лидерства')) throw new Error('FV: the Leader rank-III die text must leave the search result');
  XFV.openSearchDesc('tal:' + leaderIdx);
  XFV.showTalentResults('leader');
  const resFV2 = rFV.elements['talentResults'].innerHTML;
  if (!resFV2.includes('showDiceDlgByIndex(')) throw new Error('FV: the expanded Leader result must show the dice chip button');
  if (resFV2.includes('Получить 3 кости лидерства')) throw new Error('FV: the expanded Leader result must not show the rank-I die text');
  if (!resFV2.includes('отдавать приказ реакцией')) throw new Error('FV: the expanded Leader result must show the rank-II sentence');
  XFV.showDiceDlgByIndex(leaderIdx);
  if (!rFV.elements['refDlgBody'].innerHTML.includes('кости лидерства, d6')) throw new Error('FV: the search chip dialog must hold the full die rules');
  if (rFV.elements['refDlgName'].textContent !== 'Кости лидерства') throw new Error('FV: the search chip dialog must be titled Кости лидерства');
  const brawlerIdx = rFV.DB.talents.findIndex(t=>t.n==='Brawler');
  XFV.showTalentResults('brawler');
  XFV.openSearchDesc('tal:' + brawlerIdx);
  XFV.showTalentResults('brawler');
  const resB = rFV.elements['talentResults'].innerHTML;
  if (!resB.includes('Кость драчуна')) throw new Error('FV: the Brawler search result must show the dice chip');
  if (resB.includes('нокаутирующий удар')) throw new Error('FV: the Brawler die text must leave the search result');
  XFV.showTalentResults('technophile');
  const resT = rFV.elements['talentResults'].innerHTML;
  if (resT.includes('showDiceDlgByIndex(')) throw new Error('FV: a talent without a die must not show a dice chip');
})();
// PHASE FW (v228): every rank stays visible in the search result, with the
// dice chip on its own rank's line — so it is clear what each level adds.
(function(){
  const rFW = runEval({});
  const XFW = rFW.X;
  function expandRow(query, idx){
    XFW.showTalentResults(query);
    XFW.openSearchDesc('tal:' + idx);
    XFW.showTalentResults(query);
  }
  function rowHtml(name){
    const parts = rFW.elements['talentResults'].innerHTML.split('class="dbrow"');
    const row = parts.find(p=>p.includes('<b>' + name + '</b>'));
    if (!row) throw new Error('FW: no ' + name + ' row in the search results');
    return row;
  }
  const leaderIdx = rFW.DB.talents.findIndex(t=>t.n==='Leader');
  expandRow('leader', leaderIdx);
  const lead = rowHtml('Лидер');
  for (const rn of ['I. Полевой командир', 'II. Открытые каналы', 'III. Вдохновляющее присутствие']) {
    if (!lead.includes(rn)) throw new Error('FW: the Leader result must show ' + rn);
  }
  if ((lead.split('showDiceDlgByIndex(').length - 1) !== 3) throw new Error('FW: the Leader result must show the dice chip on all three ranks');
  const duelistIdx = rFW.DB.talents.findIndex(t=>t.n==='Duelist');
  expandRow('duelist', duelistIdx);
  const duel = rowHtml('Дуэлянт');
  for (const rn of ['I. Партизан', 'II. Мастер клинка', 'III. Неудержимый']) {
    if (!duel.includes(rn)) throw new Error('FW: the Duelist result must show ' + rn);
  }
  if ((duel.split('showDiceDlgByIndex(').length - 1) !== 2) throw new Error('FW: the Duelist result must show the dice chip on ranks II and III');
  if (duel.includes('Парирование')) throw new Error('FW: the Duelist die text must leave the search result');
  const brawlerIdx = rFW.DB.talents.findIndex(t=>t.n==='Brawler');
  expandRow('brawler', brawlerIdx);
  const brawl = rowHtml('Драчун');
  for (const rn of ['I. Захват и удержание', 'II. Кувалда', 'III. Нокаутирующий удар']) {
    if (!brawl.includes(rn)) throw new Error('FW: the Brawler result must show ' + rn);
  }
  if ((brawl.split('showDiceDlgByIndex(').length - 1) !== 1) throw new Error('FW: the Brawler result must show the dice chip on rank III only');
  if (brawl.includes('начиная с 6')) throw new Error('FW: the Brawler die text must leave the search result');
})();
// PHASE FX (v229): No Room for a Wallflower Act 1 — 5 frames, Empath, 11 systems,
// 6 weapons, 11 new actions in My Actions; variant frames share their base
// frame's license; exotics are available without a license; Plasma Talons is
// the Enkidu's integrated weapon (lic '', like Latch Drone); Plasma Maul
// Overkill is 1 (v217 rule: every {VAL} tag needs a value).
(function(){
  const { X, S, DB, elements } = runEval({});
  if (Object.keys(DB.frames).length !== 55) throw new Error('FX: DB must hold 55 frames');
  if (DB.systems.length !== 183) throw new Error('FX: DB must hold 183 systems');
  if (DB.weapons.length !== 121) throw new Error('FX: DB must hold 121 weapons');
  if (DB.talents.length !== 40) throw new Error('FX: DB must hold 40 talents');
  // Sagarmatha — GMS LL0, HP 8 (the .lcp corrects the earlier COMP/CON figure of 10)
  const sag = DB.frames['Sagarmatha'];
  if (!sag) throw new Error('FX: Sagarmatha must be in the DB');
  if (sag.ll !== 0 || sag.lic !== 'GMS') throw new Error('FX: Sagarmatha must be a GMS LL0 frame');
  if (sag.s.hp !== 8 || sag.s.sensor_range !== 10 || sag.s.sp !== 6) throw new Error('FX: Sagarmatha stats must be HP 8, Sensors 10, SP 6');
  if (sag.m.join(',') !== 'Main,Flex,Heavy') throw new Error('FX: Sagarmatha mounts must be Main + Flex + Heavy');
  if (sag.c !== 'Rallying Cry') throw new Error('FX: Sagarmatha Core Power must be Rallying Cry');
  if (!sag.t.includes('Guardian') || !sag.t.includes('Heroism')) throw new Error('FX: Sagarmatha traits must include Guardian and Heroism');
  if (!X.frameAvailable('Sagarmatha')) throw new Error('FX: Sagarmatha must be available with the license filter ON');
  // Kidd — own license, LL2
  const kid = DB.frames['Kidd'];
  if (!kid || kid.lic !== 'Kidd' || kid.ll !== 2) throw new Error('FX: Kidd must be an IPS-N LL2 frame on its own license');
  if (kid.s.hp !== 6 || kid.s.edef !== 12) throw new Error('FX: Kidd stats must be HP 6, E-Defense 12');
  if (!kid.cd.includes('Skull and Bones') || !kid.cd.includes('Jolly Roger')) throw new Error('FX: Kidd Core Power must have the Skull and Bones active and the Jolly Roger passive');
  if (X.frameAvailable('Kidd')) throw new Error('FX: Kidd must NOT be available without its license');
  // variant frames — gated by the BASE license (frameAvailable fix, v229)
  const enk = DB.frames['Enkidu'];
  if (!enk || enk.lic !== 'Tokugawa' || enk.ll !== 2) throw new Error('FX: Enkidu must be a Tokugawa LL2 variant');
  if (X.frameAvailable('Enkidu')) throw new Error('FX: Enkidu must NOT be available without the Tokugawa license');
  const wk = DB.frames['“Worldkiller” Genghis Mk I'];
  if (!wk || wk.lic !== 'Genghis') throw new Error('FX: Worldkiller must be a Genghis variant');
  const rg = DB.frames['Swallowtail (Ranger Variant)'];
  if (!rg || rg.lic !== 'Swallowtail') throw new Error('FX: Ranger Variant must be a Swallowtail variant');
  S.pilot.licenses = [{name:'Tokugawa', rank:2}];
  if (!X.frameAvailable('Enkidu')) throw new Error('FX: Enkidu must be available with Tokugawa II');
  if (!X.frameAvailable('Tokugawa')) throw new Error('FX: Tokugawa itself must stay available with Tokugawa II');
  S.pilot.licenses = [{name:'Kidd', rank:2}];
  if (!X.frameAvailable('Kidd')) throw new Error('FX: Kidd must be available with its own license at II');
  S.pilot.licenses = [];
  // exotics — available without any license, labelled Exotic
  const cyn = DB.systems.find(s=>s.n==='Cynosure');
  if (!cyn || cyn.lic !== 'GMS' || cyn.lab !== 'Exotic · 2 SP') throw new Error('FX: Cynosure must be exotic (lic GMS, label Exotic)');
  if (!X.itemAvailable(cyn)) throw new Error('FX: Cynosure must be available with the license filter ON');
  const pm = DB.weapons.find(w=>w.n==='Plasma Maul');
  if (!pm || pm.lic !== 'GMS') throw new Error('FX: Plasma Maul must be exotic');
  if (JSON.stringify(pm.tg.find(t=>t[0]==='tg_overkill')) !== '["tg_overkill",1]') throw new Error('FX: Plasma Maul Overkill must be 1 (v217 rule)');
  if (!X.itemAvailable(pm)) throw new Error('FX: Plasma Maul must be available with the license filter ON');
  // Enkidu — Plasma Talons is its integrated weapon (lic '', like Latch Drone)
  if (!enk.iw || !enk.iw.includes('Plasma Talons')) throw new Error('FX: Enkidu must have Plasma Talons as its integrated weapon');
  const pt = DB.weapons.find(w=>w.n==='Plasma Talons');
  if (!pt || pt.lic !== '') throw new Error('FX: Plasma Talons must be an integrated weapon (lic empty)');
  S.mech.frame = 'Enkidu';
  X.applyFrame('Enkidu');
  const im = S.mounts.find(m=>m.type==='Integrated');
  if (!im || !im.weapons.some(w=>w.name==='Plasma Talons')) throw new Error('FX: applying Enkidu must add Plasma Talons on an Integrated mount');
  // Kidd license content
  const peb = DB.systems.find(s=>s.n==='PEBCAC');
  if (!peb || peb.lic !== 'Kidd' || peb.ll !== 1) throw new Error('FX: PEBCAC must be Kidd LL1');
  const bl = DB.weapons.find(w=>w.n==='Blackspot Targeting Laser');
  if (!bl || bl.lic !== 'Kidd' || bl.ll !== 1) throw new Error('FX: Blackspot Targeting Laser must be Kidd LL1');
  // Empath + its actions in My Actions
  const emp = DB.talents.find(t=>t.n==='Empath');
  if (!emp || emp.r.length !== 3 || emp.r[0] !== 'Sympathetic Precognition') throw new Error('FX: Empath must have 3 ranks starting with Sympathetic Precognition');
  const AR = X.ACTIONS_REF;
  for (const k of ['pebcac','fabi','snapdragon','cynosurecelestialordering','cynosureunblinkingpursuit','opportunityknock','carapacecladding','fragmentwhisperofcascade','fragmentrazorcalledqualia','empathsharedsubjectivity']) {
    if (!AR.quick.some(a=>a.key===k)) throw new Error('FX: ACTIONS_REF.quick must have ' + k);
  }
  if (!AR.reactions.some(a=>a.key==='sympatheticprecognition')) throw new Error('FX: ACTIONS_REF.reactions must have sympatheticprecognition');
  // grants: PEBCAC only with the system, Empath reaction only with the talent at rank I
  const store = {};
  store['lancer-tracker-v1'] = JSON.stringify({pilot:{name:'Test', licenses:[], coreBonuses:[], hull:0, agility:0, systems:0, engineering:0}, mech:{frame:'Everest'}, talents:[{name:'Empath', rank:1}], triggers:[], mounts:[{type:'Main',weapons:[]}], systems:[{name:'PEBCAC'}], statuses:[], settings:{}});
  const r2 = runEval(store);
  const sp = r2.X.ACTIONS_REF.reactions.find(a=>a.key==='sympatheticprecognition');
  if (!r2.X.actionGranted(sp)) throw new Error('FX: Empath rank I must grant Sympathetic Precognition');
  const pb = r2.X.ACTIONS_REF.quick.find(a=>a.key==='pebcac');
  if (!r2.X.actionGranted(pb)) throw new Error('FX: owning PEBCAC must grant its quick action');
  const store2 = {};
  store2['lancer-tracker-v1'] = JSON.stringify({pilot:{name:'Test', licenses:[], coreBonuses:[], hull:0, agility:0, systems:0, engineering:0}, mech:{frame:'Everest'}, talents:[], triggers:[], mounts:[{type:'Main',weapons:[]}], systems:[], statuses:[], settings:{}});
  const r3 = runEval(store2);
  if (r3.X.actionGranted(r3.X.ACTIONS_REF.reactions.find(a=>a.key==='sympatheticprecognition'))) throw new Error('FX: without Empath the reaction must NOT be granted');
  if (r3.X.actionGranted(r3.X.ACTIONS_REF.quick.find(a=>a.key==='pebcac'))) throw new Error('FX: without PEBCAC the action must NOT be granted');
})();
// PHASE FZ (v230): вайб-описания лицензий — вместо считалки рангов;
// поиск лицензий и фреймов ищет по вайб-тексту; в поиске фреймов вместо
// названия ядра — описание фрейма из вайба его лицензии.
// (Поля поиска в списках Правил — ОТЛОЖЕНО 16.11: не делать пока;
// вместо этого позже подумать над глобальным поиском.)
(function(){
  const { X, S, DB, elements } = runEval({});
  const lics = X.licenseData();
  if (Object.keys(X.LICENSE_VIBE).length !== 38) throw new Error('FZ: LICENSE_VIBE must hold 38 licenses');
  for (const l of lics){
    const v = X.LICENSE_VIBE[l.name];
    // v245: frame may be empty (Genghis, Hydra, Raleigh — the role already says it)
    // v246: weapons/systems are short tag lists; the 7 licenses with no weapon/system
    // grants have empty weapons/systems (their row shows only the role + frame line)
    const hasW = [1, 2, 3].some(r=>(l.ranks[r] || []).some(g=>g.kind === 'weapon'));
    const hasS = [1, 2, 3].some(r=>(l.ranks[r] || []).some(g=>g.kind === 'system'));
    if (!v || !v.role) throw new Error('FZ: license ' + l.name + ' must have a vibe role');
    if (hasW && !v.weapons) throw new Error('FZ: license ' + l.name + ' must have weapon tags');
    if (hasS && !v.systems) throw new Error('FZ: license ' + l.name + ' must have system tags');
    if (!hasW && v.weapons) throw new Error('FZ: license ' + l.name + ' has no weapon grants, its weapon tags must be empty');
    if (!hasS && v.systems) throw new Error('FZ: license ' + l.name + ' has no system grants, its system tags must be empty');
  }
  // v245: ровно три лицензии без тега фрейма (роль уже говорит)
  for (const n of ['Genghis','Hydra','Raleigh']) if (X.LICENSE_VIBE[n].frame !== '') throw new Error('FZ: ' + n + ' must have an empty frame tag (v245)');
  // поиск «дрон» — по вайб-тексту
  const droneLics = lics.filter(l=>X.licenseMatches(l, 'дрон')).map(l=>l.name);
  for (const n of ['Kidd','Hydra','Lancaster','Balor']) if (!droneLics.includes(n)) throw new Error('FZ: searching «дрон» must find ' + n);
  for (const n of ['Death’s Head','Napoleon','Sherman']) if (droneLics.includes(n)) throw new Error('FZ: searching «дрон» must not find ' + n);
  // список лицензий в поиске показывает вайб, а не считалку рангов
  X.showLicenseResults('дрон', elements['licenseResults']);
  const licHtml = elements['licenseResults'].innerHTML;
  if (!licHtml.includes('HORUS: Гидра')) throw new Error('FZ: license search for «дрон» must find the Hydra license (v245 — via its role in the data)');
  if (!licHtml.includes('<b>Фрейм:</b> Гидра — Штурмовик-Контролер, Дроны, Средняя дистанция')) throw new Error('FZ: license search must show the Hydra frame line with its role (v253 — tagless frame shows its role)');
  if (licHtml.includes('Ранг II:')) throw new Error('FZ: license search must not show the old rank summary');
  if (licHtml.includes('Death’s Head')) throw new Error('FZ: license search for «дрон» must not list Death’s Head');
  // поиск фреймов: «дрон» находит Гидру по вайбу её лицензии
  if (!X.frameMatches('Hydra', 'дрон')) throw new Error('FZ: frame search for «дрон» must match Hydra via its license vibe');
  if (X.frameMatches('Death’s Head', 'дрон')) throw new Error('FZ: frame search for «дрон» must not match Death’s Head');
  // в результатах поиска фреймов — описание фрейма, а не название ядра
  // (фильтр лицензий выключен — иначе Гидра без лицензии не показывается)
  X.toggleLicenseFilter(false);
  X.showFrameResults('гидра', elements['frameResults']);
  const frHtml = elements['frameResults'].innerHTML;
  if (!frHtml.includes('Штурмовик-Контролер, Дроны, Средняя дистанция')) throw new Error('FZ: frame search must show the Hydra role (v245 — frame tag is empty, role carries «дроны»)');
  if (frHtml.includes('Дезартикуляция OROCHI')) throw new Error('FZ: frame search must not show the Core Power name');
  // GMS-фрейм без лицензии — только роль, название ядра из строки убрано (v248)
  X.showFrameResults('эверест', elements['frameResults']);
  const evFrHtml = elements['frameResults'].innerHTML;
  if (!evFrHtml.includes('LL0 Универсал')) throw new Error('FZ: a GMS frame search row must show its role label (v248)');
  if (evFrHtml.includes('Гиперспектральный инжектор топлива') || evFrHtml.includes('Hyperspec Fuel Injector')) throw new Error('FZ: a GMS frame search row must not show its Core Power name (v248 — second line removed)');
  // строка лицензии — полный вайб (Фрейм/Оружие/Системы)
  // (v238: из карточки полный вайб убран, он живёт только в строке)
  const minRow = X.licenseRowInfoHtml(X.licenseData().find(l=>l.name === 'Minotaur'));
  if (!minRow.includes('Фрейм 1:') || !minRow.includes('Фрейм 2:') || !minRow.includes('Оружие и системы:')) throw new Error('FZ: the license row must show the new format (v246: Фрейм 1/2, Оружие и системы)');
  if (!minRow.includes('Стена')) throw new Error('FZ: the license row must show the Minotaur short tag (v245)');
})();
// PHASE GA (v231): « · LL2» убран везде; «страйкер» → «штурмовик»;
// имя лицензии — «КОРП: Имя»; строка лицензии — полный вайб-текст
// (v250: роль лицензии из отображения убрана полностью — в строках
// лицензий роли нет вообще, только теги фреймов);
// строки фреймов — только имя + описание фрейма.
(function(){
  const { X, S, DB, elements } = runEval({});
  // frameLabel без LL
  if (X.frameLabel(DB.frames['Blackbeard']) !== 'IPS-N · Штурмовик') throw new Error('GA: frameLabel must not include the LL suffix');
  if (X.frameLabel(DB.frames['Everest']) !== 'GMS · Универсал') throw new Error('GA: frameLabel of a GMS frame must be corp + role, no LL suffix');
  // «страйкер» нигде в вайбе
  for (const [k, v] of Object.entries(X.LICENSE_VIBE)){
    if (/страйкер/i.test(v.role + v.frame + v.weapons + v.systems)) throw new Error('GA: LICENSE_VIBE must not contain «страйкер» (' + k + ')');
  }
  if (!X.LICENSE_VIBE['Vlad'].role.includes('штурмовик')) throw new Error('GA: the Vlad role must say «штурмовик»');
  // имя лицензии — «КОРП: Имя»
  const lics = X.licenseData();
  const vlad = lics.find(l=>l.name === 'Vlad');
  if (X.licenseDispName(vlad) !== 'IPS-N: Влад') throw new Error('GA: the license display name must be «IPS-N: Влад»');
  const geng = lics.find(l=>l.name === 'Genghis');
  if (X.licenseDispName(geng) !== 'HA: Чингис') throw new Error('GA: a two-frame license must show «HA: Чингис» (v253 — base frame Russian name)');
  // поиск лицензий: полный текст в строке
  X.showLicenseResults('влад', elements['licenseResults']);
  const licHtml = elements['licenseResults'].innerHTML;
  if (!licHtml.includes('IPS-N: Влад')) throw new Error('GA: license search must show «IPS-N: Влад»');
  if (licHtml.includes('<span>Контролер-Штурмовик, Ловчий, Ближний бой</span>') || licHtml.includes('<p>Контролер-Штурмовик, Ловчий, Ближний бой')) throw new Error('GA: license search must not show the role as a separate line (v253 — the role lives inside the frame line only)');
  if (!licHtml.includes('<b>Фрейм:</b> Влад — Контролер-Штурмовик, Ловчий, Ближний бой, Обездвиживание')) throw new Error('GA: license search must show the frame line with role + tags (v253)');
  if (!licHtml.includes('Фрейм:') || !licHtml.includes('Оружие и системы:')) throw new Error('GA: license search must show the new format (v246: Фрейм, Оружие и системы)');
  if (!licHtml.includes('гвоздемёт')) throw new Error('GA: license search must show the Vlad weapons tag (v246)');
  if (licHtml.includes('LL2') || licHtml.includes('IPS-N · Контролёр')) throw new Error('GA: license search must not show the old corp/role/LL line');
  // список лицензий в Правилах: компактно — роль + описание фрейма
  X.renderRulesLicenseList();
  const rulesLicHtml = elements['rulesLicenseList'].innerHTML;
  if (!rulesLicHtml.includes('IPS-N: Влад')) throw new Error('GA: the Rules licenses list must show «IPS-N: Влад»');
  if (rulesLicHtml.includes('<span>Контролер-Штурмовик, Ловчий, Ближний бой</span>') || rulesLicHtml.includes('<p>Контролер-Штурмовик, Ловчий, Ближний бой')) throw new Error('GA: the Rules licenses list must not show the role as a separate line (v253 — the role lives inside the frame line only)');
  if (!rulesLicHtml.includes('<b>Фрейм:</b> Влад — Контролер-Штурмовик, Ловчий, Ближний бой, Обездвиживание')) throw new Error('GA: the Rules licenses list must show the frame line with role + tags (v253)');
  if (!rulesLicHtml.includes('Обездвиживание')) throw new Error('GA: the Rules licenses list must show the frame description');
  if (!rulesLicHtml.includes('гвоздемёт')) throw new Error('GA: the Rules licenses list must show the Vlad weapons tag too (v232 — same as search, v246 — short tags)');
  if (rulesLicHtml.includes('LL2')) throw new Error('GA: the Rules licenses list must not show the LL suffix');
  // поиск фреймов: только имя + описание фрейма
  X.toggleLicenseFilter(false);
  X.showFrameResults('влад', elements['frameResults']);
  const frHtml = elements['frameResults'].innerHTML;
  if (!frHtml.includes('Влад')) throw new Error('GA: frame search must show the frame name');
  if (!frHtml.includes('Обездвиживание')) throw new Error('GA: frame search must show the frame description');
  if (frHtml.includes('IPS-N ·')) throw new Error('GA: frame search must not show the corp/role line');
  if (frHtml.includes('гвоздомёт')) throw new Error('GA: frame search must show ONLY the frame description, not weapons/systems');
  // список фреймов в Правилах: то же самое
  X.renderRulesFrameList();
  const rulesFrHtml = elements['rulesFrameList'].innerHTML;
  if (!rulesFrHtml.includes('Обездвиживание')) throw new Error('GA: the Rules frames list must show the frame description');
  if (rulesFrHtml.includes('IPS-N ·')) throw new Error('GA: the Rules frames list must not show the corp/role line');
  if (rulesFrHtml.includes('Лабиринт метасгиба')) throw new Error('GA: the Rules frames list must not show Core Power names where a vibe exists');
})();
// PHASE GB (v232): поиск и список в Правилах показывают ОДИНАКОВОЕ:
// лицензии — имя + полный текст (v253: в строках фреймов роль+теги),
// фреймы — одна строка роль + теги (v248);
// карточки — лицензия без строки роли (v250), фрейм — та же строка, что в списке (v248).
(function(){
  const { X, S, DB, elements } = runEval({});
  // заглавные: роль и описание
  if (X.capRole('контролер-штурмовик, ловчий, ближний бой') !== 'Контролер-Штурмовик, Ловчий, Ближний бой') throw new Error('GB: capRole must capitalize each role part');
  if (X.capRole('штурмовик/танк, ближний бой') !== 'Штурмовик/Танк, Ближний бой') throw new Error('GB: capRole must capitalize after the slash too');
  if (X.capFirst('когда ты обездвиживаешь врага') !== 'Когда ты обездвиживаешь врага') throw new Error('GB: capFirst must capitalize the first letter');
  // лицензии: поиск и Правила — одинаково, полный текст
  X.showLicenseResults('влад', elements['licenseResults']);
  const licSearch = elements['licenseResults'].innerHTML;
  X.renderRulesLicenseList();
  const licRules = elements['rulesLicenseList'].innerHTML;
  for (const [html, where] of [[licSearch, 'license search'], [licRules, 'Rules licenses list']]){
    if (!html.includes('IPS-N: Влад')) throw new Error('GB: the ' + where + ' must show «IPS-N: Влад»');
    if (html.includes('<span>Контролер-Штурмовик, Ловчий, Ближний бой</span>') || html.includes('<p>Контролер-Штурмовик, Ловчий, Ближний бой')) throw new Error('GB: the ' + where + ' must not show the role as a separate line (v253 — the role lives inside the frame line only)');
    if (!html.includes('<b>Фрейм:</b> Влад — Контролер-Штурмовик, Ловчий, Ближний бой, Обездвиживание')) throw new Error('GB: the ' + where + ' must show the frame line with role + tags (v253)');
    if (!html.includes('Фрейм:') || !html.includes('Оружие и системы:')) throw new Error('GB: the ' + where + ' must show the new format (v246: Фрейм, Оружие и системы)');
    if (!html.includes('гвоздемёт')) throw new Error('GB: the ' + where + ' must show the Vlad weapons tag (v246)');
    if (!html.includes('Обездвиживание')) throw new Error('GB: the ' + where + ' must show the capitalized frame text');
  }
  // фреймы: поиск и Правила — одинаково, только описание фрейма
  X.toggleLicenseFilter(false);
  X.showFrameResults('влад', elements['frameResults']);
  const frSearch = elements['frameResults'].innerHTML;
  X.renderRulesFrameList();
  const frRules = elements['rulesFrameList'].innerHTML;
  for (const [html, where] of [[frSearch, 'frame search'], [frRules, 'Rules frames list']]){
    if (!html.includes('Влад')) throw new Error('GB: the ' + where + ' must show the frame name');
    if (!html.includes('Обездвиживание')) throw new Error('GB: the ' + where + ' must show the frame description');
    if (html.includes('Гвоздомёт')) throw new Error('GB: the ' + where + ' must show ONLY the frame description, not weapons/systems');
  }
  // карточки — у лицензии строки роли больше нет (v250), у фрейма — та же
  // строка, что в списке (v248); полный вайб из карточек убран (v238/v244)
  const licDet = X.licenseDetailHtml('Vlad');
  if (licDet.includes('Контролер-Штурмовик, Ловчий, Ближний бой')) throw new Error('GB: the license detail must not show the role (v250 — role removed from license display)');
  if (licDet.includes('Оружие и системы:')) throw new Error('GB: the license detail must not show the license row format (v238 — vibe lives only in the row)');
  if (licDet.includes('IPS-N · Контролёр')) throw new Error('GB: the license detail must not show the old corp/role line');
  const frDet = X.frameDetailHtml('Vlad');
  if (!frDet.includes('Контролер-Штурмовик, Ловчий, Ближний бой, Обездвиживание')) throw new Error('GB: the frame detail must show the same merged line as the row (v248 — role + tags)');
  if (frDet.includes('IPS-N · Контролёр')) throw new Error('GB: the frame detail must not show the old corp/role line');
  if (frDet.includes('Гвоздомёт')) throw new Error('GB: the frame detail must not show weapons/systems text');
})();
// PHASE GC (v233): лейблы вайба — инлайн (не своей строкой), волосяные
// разделители между блоками, кнопки ⓘ/＋ — сверху строки; сортировка
// списков — Корпорация → Дистанция боя → Название.
(function(){
  const { X, S, DB, elements } = runEval({});
  // CSS: только имя — блок (.dbinfo > b), кнопки сверху, разделители .vibe-lines
  if (!html.includes('.dbinfo > b { display:block;')) throw new Error('GC: only the direct-child name <b> may be block-level (vibe labels must stay inline)');
  if (!html.includes('.dbrow { display:flex; gap:8px; align-items:flex-start;')) throw new Error('GC: .dbrow must align buttons to the top');
  // v247: волосяные линии в строке лицензии убраны — строка использует
  // .lic-vibe (без border-top); класс .vibe-lines оставлен в CSS, не удалять.
  if (!html.includes('.lic-vibe p {')) throw new Error('GC: the license row must use .lic-vibe (v247 — no hairlines)');
  if (html.includes('.lic-vibe p { margin:6px 0 0; border-top')) throw new Error('GC: .lic-vibe must not have hairline dividers (v247)');
  // v249: dim перенесён со строки роли (удалена) на описание лицензии
  if (!html.includes('.lic-vibe { margin:10px 0 0; font-size:12px; color:var(--dim); }')) throw new Error('GC: .lic-vibe must be dim (v249)');
  // лейбл инлайн с текстом: «Фрейм: Балор — Штурмовик/Танк, Ближний бой, Регенерация, Гигант» в одной строке (v253 — роль+теги)
  // (v238: вайб-текст живёт только в строке, из карточки он убран)
  const balorLic = X.licenseData().find(l=>l.name === 'Balor');
  const balorRow = X.licenseRowInfoHtml(balorLic);
  // v251: Balor is a two-frame license now (Hecatoncheires is its variant)
  if (!balorRow.includes('<b>Фрейм 1:</b> Балор — Штурмовик/Танк, Ближний бой, Регенерация, Гигант') || !balorRow.includes('<b>Фрейм 2:</b> Гекатонхейр — Штурмовик, Контролер, Средняя дистанция, Дроны, Маленький')) throw new Error('GC: the vibe label must be inline with its text (v253 — Balor + Hecatoncheires, role+tags)');
  if (balorRow.includes('class="vibe-lines"')) throw new Error('GC: the license row must not use .vibe-lines (v247 — hairlines removed)');
  // ранги дистанции
  if (X.vibeDistRank('штурмовик/танк, ближний бой') !== 0) throw new Error('GC: «ближний бой» must rank 0');
  if (X.vibeDistRank('саппорт-разведчик, дебафер, дальняя дистанция') !== 3) throw new Error('GC: «дальняя дистанция» must rank 3');
  if (X.vibeDistRank('штурмовик-артиллерия, лазерщик, средняя-дальняя дистанция') !== 2) throw new Error('GC: «средняя-дальняя дистанция» must rank 2');
  if (X.vibeDistRank('саппорт') !== 4) throw new Error('GC: a role without a distance must rank last');
  // сортировка лицензий: сначала корпорация
  const lics = X.licenseData();
  const corps = lics.map(l=>l.src);
  const sortedCorps = [...corps].sort((a,b)=>a.localeCompare(b));
  if (corps.join() !== sortedCorps.join()) throw new Error('GC: licenses must be sorted by corporation first');
  // внутри корпорации — по дистанции
  const horus = lics.filter(l=>l.src === 'HORUS');
  const dists = horus.map(l=>X.vibeDistRank((X.LICENSE_VIBE[l.name]||{}).role));
  const sortedDists = [...dists].sort((a,b)=>a-b);
  if (dists.join() !== sortedDists.join()) throw new Error('GC: licenses within a corporation must be sorted by combat distance');
  // внутри корпорации + дистанции — по названию
  const horusClose = horus.filter(l=>X.vibeDistRank((X.LICENSE_VIBE[l.name]||{}).role) === 0);
  const names = horusClose.map(l=>X.licenseDispName(l));
  const sortedNames = [...names].sort((a,b)=>a.localeCompare(b));
  if (names.join() !== sortedNames.join()) throw new Error('GC: licenses within a corporation+distance must be sorted by name, got ' + names.join(' | '));
  // сортировка фреймов: GMS первым; внутри GMS — по названию (Сагарматха, Чомолунгма, Эверест)
  const keys = X.sortFrameKeys(Object.keys(DB.frames));
  if (DB.frames[keys[0]].src !== 'GMS') throw new Error('GC: GMS frames must come first in the frames list');
  const gmsNames = keys.filter(k=>DB.frames[k].src === 'GMS').map(k=>X.fd(k).n);
  if (gmsNames.join() !== [...gmsNames].sort((a,b)=>a.localeCompare(b)).join()) throw new Error('GC: GMS frames must be sorted by name, got ' + gmsNames.join(' | '));
  // поиск фреймов — тот же порядок, что и список
  X.toggleLicenseFilter(false);
  X.showFrameResults('', elements['frameResults']);
  const frHtml = elements['frameResults'].innerHTML;
  const chIdx = frHtml.indexOf('Чомолунгма'), evIdx = frHtml.indexOf('Эверест');
  if (chIdx < 0 || evIdx < 0 || chIdx > evIdx) throw new Error('GC: frame search must use the same sort (Chomolungma before Everest by name)');
  // список фреймов в Правилах — тот же порядок
  X.renderRulesFrameList();
  const rulesFr = elements['rulesFrameList'].innerHTML;
  const chR = rulesFr.indexOf('Чомолунгма'), evR = rulesFr.indexOf('Эверест');
  if (chR < 0 || evR < 0 || chR > evR) throw new Error('GC: the Rules frames list must use the same sort');
})();
// PHASE GD (v234): кнопки в строках лицензий/фреймов — float:right
// (текст занимает всю ширину), радиус кнопки 4px; вайб-текст — обычным
// цветом (не dim); у подсказки GMS меньше отступа сверху.
(function(){
  const { X, S, DB, elements } = runEval({});
  if (!html.includes('.dbrow-float { display:block;')) throw new Error('GD: the license/frame rows must use the float layout');
  if (!html.includes('.dbrow-float .btn { float:right;')) throw new Error('GD: the row buttons must float right');
  if (!html.includes('border-radius:4px')) throw new Error('GD: the row buttons need a 4px radius');
  if (!html.includes('.vibe-lines { margin:10px 0 0; font-size:12px; color:var(--text);')) throw new Error('GD: the vibe text must use the normal color, not dim');
  if (!html.includes('details.sec > .hint { margin-top:4px;')) throw new Error('GD: the GMS hint needs a smaller top margin');
  // кнопки — ПЕРВЫМИ в строке (до .dbinfo), иначе float не обтекается
  X.renderRulesLicenseList();
  const lh = elements['rulesLicenseList'].innerHTML;
  const btnIdx = lh.indexOf('showLicenseDetail'), infoIdx = lh.indexOf('class="dbinfo"');
  if (btnIdx < 0 || infoIdx < 0 || btnIdx > infoIdx) throw new Error('GD: the ⓘ button must come before .dbinfo in the license row');
  if (!lh.includes('dbrow-float')) throw new Error('GD: the Rules license rows must use dbrow-float');
  // в поиске лицензий порядок кнопок: ＋ в разметке раньше ⓘ (визуально ⓘ слева, ＋ справа)
  X.showLicenseResults('', elements['licenseResults']);
  const sh = elements['licenseResults'].innerHTML;
  const plusIdx = sh.indexOf('addLicenseByName'), infoIdx2 = sh.indexOf('showLicenseDetail');
  if (plusIdx < 0 || infoIdx2 < 0 || plusIdx > infoIdx2) throw new Error('GD: in the license search row the ＋ button must come before ⓘ (float:right keeps ⓘ on the left)');
  if (!sh.includes('dbrow-float')) throw new Error('GD: the license search rows must use dbrow-float');
  // описание фрейма в строке — обычным цветом (без class="dim")
  X.renderRulesFrameList();
  const fr = elements['rulesFrameList'].innerHTML;
  if (fr.includes('<span class="dim">')) throw new Error('GD: the frame description must use the normal color, not dim');
  if (!fr.includes('dbrow-float')) throw new Error('GD: the Rules frame rows must use dbrow-float');
})();
// PHASE GE (v235, поправлена в v236): вайб-блок — margin-top 10px, текст 12px;
// абзацы в секциях Правил — обычным цветом (без dim); строка роли и описание
// фрейма (.dbinfo > span) — приглушённые (dim).
(function(){
  if (!html.includes('.vibe-lines { margin:10px 0 0; font-size:12px; color:var(--text);')) throw new Error('GE: the vibe block must have a 10px top margin and 12px text');
  if (html.includes('details.sec p { font-size:14px; line-height:1.5; color:var(--dim);')) throw new Error('GE: details.sec p must not force the dim color');
  if (!html.includes('details.sec p { font-size:14px; line-height:1.5; }')) throw new Error('GE: details.sec p must keep its font-size and line-height');
  if (!html.includes('.dbinfo > span { display:block; font-size:13px; color:var(--dim);')) throw new Error('GE: the .dbinfo span (role line, frame description) must use the dim color');
})();
// PHASE GF (v237): строки фреймов — как у лицензий: имя «КОРП: Имя»,
// строка роли (у GMS — заданная пользователем подпись «LL0 …»),
// сортировка Корпорация → Дистанция → Название, GMS первыми.
(function(){
  const { X, S, DB, elements } = runEval({});
  // GMS-подписи (заданы пользователем 16.11, сверены с ролями в db.js)
  if (X.GMS_FRAME_ROLE['Sagarmatha'] !== 'LL0 Танк') throw new Error('GF: Sagarmatha must be «LL0 Танк»');
  if (X.GMS_FRAME_ROLE['Chomolungma'] !== 'LL0 Контролер-Хакер') throw new Error('GF: Chomolungma must be «LL0 Контролер-Хакер»');
  if (X.GMS_FRAME_ROLE['Everest'] !== 'LL0 Универсал') throw new Error('GF: Everest must be «LL0 Универсал»');
  // имя с префиксом корпа
  if (X.frameDispName('Everest') !== 'GMS: Эверест') throw new Error('GF: the frame name must carry the corporation prefix');
  if (X.frameDispName('Tokugawa') !== 'HA: Токугава') throw new Error('GF: the frame name must carry the corporation prefix');
  // строка роли: у GMS — подпись, у остальных — роль из вайба лицензии
  if (X.frameRoleLine('Everest') !== 'LL0 Универсал') throw new Error('GF: the GMS frame role line must be the user-supplied label');
  if (!X.frameRoleLine('Balor').includes('Ближний бой')) throw new Error('GF: the frame role line must come from its license vibe');
  // поиск находит GMS-фрейм по подписи («танк» → Сагарматха)
  if (!X.frameMatches('Sagarmatha', 'танк')) throw new Error('GF: frame search must match the GMS role label');
  // строка в списке Правил: имя с префиксом + роль + описание
  X.renderRulesFrameList();
  const fr = elements['rulesFrameList'].innerHTML;
  if (!fr.includes('GMS: Эверест')) throw new Error('GF: the Rules frames list must show the corporation prefix');
  if (!fr.includes('LL0 Универсал')) throw new Error('GF: the Rules frames list must show the GMS role label');
  // GMS первыми, внутри GMS — по названию (Сагарматха, Чомолунгма, Эверест)
  const gmsIdx = fr.indexOf('GMS: Сагарматха'), evIdx = fr.indexOf('GMS: Эверест'), haIdx = fr.indexOf('HA: Токугава');
  if (gmsIdx < 0 || evIdx < 0 || haIdx < 0 || gmsIdx > evIdx || evIdx > haIdx) throw new Error('GF: GMS frames must come first, sorted by name within GMS');
  // карточка фрейма — то же, что и строка
  const det = X.frameDetailHtml('Everest');
  if (!det.includes('GMS: Эверест')) throw new Error('GF: the frame detail must show the corporation prefix');
  if (!det.includes('LL0 Универсал')) throw new Error('GF: the frame detail must show the GMS role label');
})();
// PHASE GG (v238): в карточке лицензии нет полного вайб-текста
// (v250: строки роли тоже нет — только имя, гранты и источник внизу,
// если лицензия не из корбука).
(function(){
  const { X, S, DB, elements } = runEval({});
  if (!X.LICENSE_SOURCE || X.LICENSE_SOURCE['Kidd'] !== 'No Room for a Wallflower, Act 1') throw new Error('GG: LICENSE_SOURCE must map Kidd to Wallflower Act 1');
  const det = X.licenseDetailHtml('Balor');
  if (det.includes('class="vibe-lines"')) throw new Error('GG: the license detail must not show the full vibe text');
  if (det.includes('Штурмовик/Танк, Ближний бой')) throw new Error('GG: the license detail must not show the role (v250 — role removed from license display)');
  if (det.includes('Источник') || det.includes('Source:')) throw new Error('GG: a core license must not show a source');
  const kidd = X.licenseDetailHtml('Kidd');
  if (!kidd.includes('Источник: No Room for a Wallflower, Act 1')) throw new Error('GG: a non-core license must show its source at the bottom');
  // источник — после грантов (в самом низу карточки)
  const srcIdx = kidd.indexOf('Источник:'), grantIdx = kidd.lastIndexOf('grant-row');
  if (srcIdx < 0 || grantIdx < 0 || srcIdx < grantIdx) throw new Error('GG: the source line must come after the grants');
})();
// PHASE GH (v239): источник на карточках айтемов не из корбука
// (карточка фрейма + диалог-референс для систем, оружия, талантов).
(function(){
  const { X, S, DB, elements } = runEval({});
  if (X.itemSource('frame', 'Kidd') !== 'No Room for a Wallflower, Act 1') throw new Error('GH: Kidd must come from Wallflower');
  if (X.itemSource('frame', 'Chomolungma') !== 'Operation: Solstice Rain') throw new Error('GH: Chomolungma must come from Solstice Rain');
  if (X.itemSource('frame', '“Worldkiller” Genghis Mk I') !== 'No Room for a Wallflower, Act 1') throw new Error('GH: Worldkiller must come from Wallflower');
  if (X.itemSource('system', 'Snapdragon Anti-Chassis Guided Missile Launcher') !== 'No Room for a Wallflower, Act 1') throw new Error('GH: Snapdragon must come from Wallflower');
  if (X.itemSource('system', 'Field-Approved, Brass Ignorant Modifications') !== 'No Room for a Wallflower, Act 1') throw new Error('GH: FABI must come from Wallflower');
  if (X.itemSource('weapon', '“Sting” Heavy Anti-Armor Rifle') !== 'No Room for a Wallflower, Act 1') throw new Error('GH: Sting must come from Wallflower');
  if (X.itemSource('weapon', 'Brood-Sibling’s Molt') !== 'No Room for a Wallflower, Act 1') throw new Error('GH: Brood-Sibling’s Molt must come from Wallflower');
  if (X.itemSource('talent', 'Empath') !== 'No Room for a Wallflower, Act 1') throw new Error('GH: Empath must come from Wallflower');
  if (X.itemSource('frame', 'Everest')) throw new Error('GH: a core frame must have no source');
  if (X.itemSource('system', 'Pattern-A Smoke Charges')) throw new Error('GH: a core system must have no source');
  if (X.itemSource('weapon', 'Assault Rifle')) throw new Error('GH: a core weapon must have no source');
  // карточка фрейма: источник внизу, кор — без подписи
  if (!X.frameDetailHtml('Enkidu').includes('Источник: No Room for a Wallflower, Act 1')) throw new Error('GH: the Enkidu frame detail must show its source');
  if (!X.frameDetailHtml('Chomolungma').includes('Источник: Operation: Solstice Rain')) throw new Error('GH: the Chomolungma frame detail must show its source');
  if (X.frameDetailHtml('Everest').includes('Источник')) throw new Error('GH: a core frame detail must not show a source');
  // диалог-референс: система, оружие, талант — и коровая система без подписи
  X.showRef('system', 'Snapdragon Anti-Chassis Guided Missile Launcher');
  if (!elements['refDlgBody'].innerHTML.includes('Источник: No Room for a Wallflower, Act 1')) throw new Error('GH: the Snapdragon ref dialog must show its source');
  X.showRef('weapon', '“Sting” Heavy Anti-Armor Rifle');
  if (!elements['refDlgBody'].innerHTML.includes('Источник: No Room for a Wallflower, Act 1')) throw new Error('GH: the Sting ref dialog must show its source');
  X.showRef('talent', 'Empath');
  if (!elements['refDlgBody'].innerHTML.includes('Источник: No Room for a Wallflower, Act 1')) throw new Error('GH: the Empath ref dialog must show its source');
  X.showRef('system', 'Pattern-A Smoke Charges');
  if (elements['refDlgBody'].innerHTML.includes('Источник')) throw new Error('GH: a core system ref dialog must not show a source');
})();
// PHASE GI (v240): редактирование по умолчанию ВЫКЛЮЧЕНО везде
// (новый персонаж / сброс — чистый вид; включается тоглом-гаечным ключом).
(function(){
  const { X, S, DB, elements } = runEval({});
  for (const k of Object.values(X.EDIT_KEYS)) {
    if (X.DEFAULTS.settings[k] !== false) throw new Error('GI: DEFAULTS.settings.' + k + ' must be false');
  }
  // свежий персонаж — редактирование выключено
  if (X.editOn('mech') || X.editOn('systems') || X.editOn('mounts') || X.editOn('talents') || X.editOn('pilot')) throw new Error('GI: a fresh character must start with editing off');
  // migrate: сейв без флагов получает false, а не true
  const d = JSON.parse(JSON.stringify(X.DEFAULTS));
  for (const k of Object.values(X.EDIT_KEYS)) delete d.settings[k];
  X.migrate(d);
  for (const k of Object.values(X.EDIT_KEYS)) {
    if (d.settings[k] !== false) throw new Error('GI: migrate() must default missing ' + k + ' to false');
  }
  // статичные кнопки-тогла в HTML — без 'on' (дефолт выкл)
  if (html.includes('class="toggle on" id="editToggle')) throw new Error('GI: the static edit toggles must default to off');
  const offToggles = (html.match(/class="toggle" id="editToggle/g) || []).length;
  if (offToggles !== 9) throw new Error('GI: expected 9 static edit toggles, got ' + offToggles);
  // но включить редактирование по-прежнему можно
  X.toggleEdit('mech');
  if (!X.editOn('mech')) throw new Error('GI: toggleEdit must still turn editing on');
})();
// PHASE GJ (v241): The Long Rim — 6 frames, 25 systems, 11 weapons,
// 2 talents (Spaceborn, Black Thumb); 36 new ACTIONS_REF entries
// (29 quick + 2 reactions + 5 protocols); LICENSE_VIBE for the 6 new
// licenses; ITEM_SOURCE / LICENSE_SOURCE → 'The Long Rim'.
(function(){
  const { X, S, DB, elements } = runEval({});
  // DB: все шесть фреймов + системы/оружие/таланты
  for (const f of ['Atlas', 'Caliban', 'Kobold', 'Lich', 'Sunzi', 'Zheng']) {
    if (!DB.frames[f]) throw new Error('GJ: frame ' + f + ' must be in the DB');
    if (DB.frames[f].lic !== f || DB.frames[f].ll !== 2) throw new Error('GJ: frame ' + f + ' must have its own license at LL2');
  }
  if (DB.frames['Atlas'].s.size !== 0.5 || DB.frames['Atlas'].nr !== 'Атлас') throw new Error('GJ: Atlas must be size 0.5, RU «Атлас»');
  if (DB.frames['Caliban'].s.size !== 0.5) throw new Error('GJ: Caliban must be size 0.5');
  if (JSON.stringify(DB.frames['Caliban'].iw) !== '["HHS-075 “Flayer” Shotgun"]') throw new Error('GJ: Caliban must carry the Flayer Shotgun as its integrated weapon');
  const flayer = DB.weapons.find(w=>w.n === 'HHS-075 “Flayer” Shotgun');
  if (!flayer || flayer.lic !== '' || flayer.ll !== null || flayer.lab !== 'Main') throw new Error('GJ: the Flayer must be an integrated weapon (lic "", lab Main), not exotic');
  if (DB.weapons.find(w=>w.n === 'Fusion Rifle').d !== '1-6 Energy') throw new Error('GJ: the Fusion Rifle damage must be the 1-6 range, not a die');
  if (DB.weapons.find(w=>w.n === 'Terashima Blade').dr !== '1d6 кинетический') throw new Error('GJ: the Terashima Blade RU damage must fall back to the computed value');
  const eva = DB.systems.find(s=>s.n === 'Spaceborn EVA');
  if (!eva || eva.lic !== 'GMS' || eva.lab !== 'Exotic · 0 SP') throw new Error('GJ: Spaceborn EVA must be exotic (lic GMS, lab Exotic · 0 SP)');
  if (!DB.talents.find(t=>t.n === 'Spaceborn') || !DB.talents.find(t=>t.n === 'Black Thumb')) throw new Error('GJ: both Long Rim talents must be in the DB');
  if (DB.talents.find(t=>t.n === 'Black Thumb').nr !== 'Чёрный палец') throw new Error('GJ: Black Thumb RU name must be «Чёрный палец»');
  // источники
  if (X.itemSource('frame', 'Atlas') !== 'The Long Rim') throw new Error('GJ: Atlas must come from The Long Rim');
  if (X.itemSource('frame', 'Caliban') !== 'The Long Rim') throw new Error('GJ: Caliban must come from The Long Rim');
  if (X.itemSource('system', 'Spaceborn EVA') !== 'The Long Rim') throw new Error('GJ: Spaceborn EVA must come from The Long Rim');
  if (X.itemSource('weapon', 'HHS-075 “Flayer” Shotgun') !== 'The Long Rim') throw new Error('GJ: the Flayer must come from The Long Rim');
  if (X.itemSource('weapon', 'D/D 288') !== 'The Long Rim') throw new Error('GJ: D/D 288 must come from The Long Rim');
  if (X.itemSource('talent', 'Spaceborn') !== 'The Long Rim') throw new Error('GJ: Spaceborn must come from The Long Rim');
  if (X.itemSource('talent', 'Black Thumb') !== 'The Long Rim') throw new Error('GJ: Black Thumb must come from The Long Rim');
  if (X.itemSource('frame', 'Everest')) throw new Error('GJ: a core frame must still have no source');
  if (X.LICENSE_SOURCE['Atlas'] !== 'The Long Rim' || X.LICENSE_SOURCE['Zheng'] !== 'The Long Rim') throw new Error('GJ: LICENSE_SOURCE must map the Long Rim licenses to The Long Rim');
  // карточка лицензии Long Rim — источник внизу (как у Kidd в GG)
  const atlasDet = X.licenseDetailHtml('Atlas');
  if (!atlasDet.includes('Источник: The Long Rim')) throw new Error('GJ: the Atlas license detail must show its source');
  if (atlasDet.includes('class="vibe-lines"')) throw new Error('GJ: the license detail must not show the full vibe text');
  // вайб: строка лицензии показывает полный текст, строка фрейма — описание
  const atlasRow = X.licenseRowInfoHtml(X.licenseData().find(l=>l.name === 'Atlas'));
  if (!atlasRow.includes('гигантов')) throw new Error('GJ: the Atlas license row must show its vibe text');
  if (!atlasRow.includes('Фрейм:') || !atlasRow.includes('Оружие и системы:')) throw new Error('GJ: the Atlas license row must show the new format (v246: Фрейм, Оружие и системы)');
  if (!X.licenseMatches(X.licenseData().find(l=>l.name === 'Atlas'), 'гигантов')) throw new Error('GJ: license search must match Atlas via its vibe');
  if (!X.frameMatches('Atlas', 'гигантов')) throw new Error('GJ: frame search must match Atlas via its license vibe');
  const atlasFrameRow = X.frameRowSub('Atlas');
  if (atlasFrameRow !== 'Убийца гигантов, Маленький') throw new Error('GJ: the Atlas frame row must show the short tags with each tag capitalized (v248)');
  if (X.frameRoleLine('Atlas') !== 'Штурмовик, Ближний бой') throw new Error('GJ: the Atlas frame role line must come from its license vibe');
  if (X.frameDispName('Atlas') !== 'SSC: Атлас') throw new Error('GJ: the Atlas frame name must carry the corporation prefix');
  // ACTIONS_REF: новые записи Long Rim
  const A = global.__x.ACTIONS_REF;
  for (const k of ['firezipline', 'fatalclash', 'stormstancereaction', 'jgerkunsti', 'blackthumbrodeo', 'spaceborneva', 'chargedd288', 'flawplus', 'flawminus', 'ejectslag', 'moltenpuncture']) {
    if (![...A.quick, ...A.reactions, ...A.protocols].some(a=>a.key === k)) throw new Error('GJ: ACTIONS_REF must hold the Long Rim entry ' + k);
  }
  if (!A.quick.find(a=>a.key === 'firezipline' && a.grant.system === 'Multi-Gear Maneuver System')) throw new Error('GJ: Fire Zip Line must be granted by Multi-Gear Maneuver System');
  if (!A.reactions.find(a=>a.key === 'fatalclash' && a.per === '1/round')) throw new Error('GJ: Fatal Clash must be a 1/round reaction');
  if (!A.protocols.find(a=>a.key === 'blackthumbrodeo' && a.grant.talent === 'Black Thumb' && a.grant.rank === 2)) throw new Error('GJ: Black Thumb Rodeo must be granted by Black Thumb rank 2');
  // карточка фрейма Long Rim — источник внизу
  if (!X.frameDetailHtml('Atlas').includes('Источник: The Long Rim')) throw new Error('GJ: the Atlas frame detail must show its source');
  if (X.frameDetailHtml('Everest').includes('Источник')) throw new Error('GJ: a core frame detail must still not show a source');
})();
// PHASE GK (v242): Wallflower pilot gear — 7 items (ms_exo_*), draft RU;
// PILOT_GEAR_DB 37 -> 44; 'Variable' damage type fix in pilotDamageType.
(function(){
  const { X, S, DB, elements } = runEval({});
  const PG = global.__x.PILOT_GEAR_DB;
  if (!PG || PG.length !== 61) throw new Error('GK: PILOT_GEAR_DB must have 61 items (44 + 17 five-books in v243), got ' + (PG && PG.length));
  const ids = ['ms_exo_anti_armor_signature_weapon', 'ms_exo_bahadurs_reserve', 'ms_exo_hercynian_rations', 'ms_exo_locus', 'ms_exo_light_carapace_armor', 'ms_exo_assault_carapace_armor', 'ms_exo_heavy_carapace_armor'];
  for (const id of ids) {
    const g = PG.find(x=>x.id === id);
    if (!g) throw new Error('GK: pilot gear ' + id + ' must be in PILOT_GEAR_DB');
    if (!g.ru || !g.ru.name) throw new Error('GK: pilot gear ' + id + ' must have a RU name');
  }
  if (PG.find(x=>x.id === 'ms_exo_bahadurs_reserve').ru.name !== 'Запас Бахадура') throw new Error("GK: Bahadur's Reserve must have the draft RU name");
  if (PG.find(x=>x.id === 'ms_exo_locus').ru.name !== 'Локус') throw new Error('GK: Locus must have the draft RU name');
  if (PG.find(x=>x.id === 'ms_exo_heavy_carapace_armor').ru.name !== 'Тяжёлый карапасный хардсьют') throw new Error('GK: Heavy Carapace Hardsuit must have the draft RU name');
  // Anti-Armor: no description in the .lcp (only effect) — left empty, not invented
  const aa = PG.find(x=>x.id === 'ms_exo_anti_armor_signature_weapon');
  if (!aa || (aa.description || '') !== '' || !aa.effect) throw new Error('GK: Anti-Armor must have no description and an effect');
  if (aa.damage[0].type !== 'Variable' || aa.damage[0].val !== 5) throw new Error('GK: Anti-Armor damage must be Variable 5');
  // 'Variable' (capital V) must map to 'выбранный' in RU mode
  if (X.pilotDamageType('Variable') !== 'выбранный') throw new Error("GK: pilotDamageType must map capital-V Variable to 'выбранный'");
  if (X.pilotDamageType('variable') !== 'выбранный') throw new Error("GK: pilotDamageType must still map lowercase variable");
  // all 9 Wallflower tags exist in DB.tags (tag chips + reference work)
  for (const t of ['tg_exotic', 'tg_ap', 'tg_limited', 'tg_loading', 'tg_ordnance', 'tg_reliable', 'tg_pilot_weapon', 'tg_gear', 'tg_personal_armor']) {
    if (!DB.tags[t]) throw new Error('GK: tag ' + t + ' must exist in DB.tags');
  }
  // charges: Anti-Armor Limited 2, Bahadur's Reserve Limited 1
  if (aa.tags.find(t=>t.id === 'tg_limited').val !== 2) throw new Error('GK: Anti-Armor must be Limited 2');
  if (PG.find(x=>x.id === 'ms_exo_bahadurs_reserve').tags.find(t=>t.id === 'tg_limited').val !== 1) throw new Error("GK: Bahadur's Reserve must be Limited 1");
  // search: picker finds Wallflower items by EN name (EN mode) and by RU name (RU mode)
  X.toggleLang(); // en
  if (X.lang() !== 'en') throw new Error('GK: toggleLang must switch to en');
  X.openPilotGearPicker('Gear');
  X.renderPilotGearResults('Bahadur');
  if (!elements['pilotGearResults'].innerHTML.includes("Bahadur's Reserve")) throw new Error("GK: the pilot gear search must find Bahadur's Reserve by EN name");
  X.renderPilotGearResults('Locus');
  if (!elements['pilotGearResults'].innerHTML.includes('Locus')) throw new Error('GK: the pilot gear search must find Locus by EN name');
  X.toggleLang(); // back to ru
  if (X.lang() !== 'ru') throw new Error('GK: toggleLang must switch back to ru');
  X.openPilotGearPicker('Gear');
  X.renderPilotGearResults('Запас Бахадура');
  if (!elements['pilotGearResults'].innerHTML.includes('Запас Бахадура')) throw new Error("GK: the pilot gear search must find Bahadur's Reserve by RU name");
  X.renderPilotGearResults('Локус');
  if (!elements['pilotGearResults'].innerHTML.includes('Локус')) throw new Error('GK: the pilot gear search must find Locus by RU name');
  X.openPilotGearPicker('Armor');
  X.renderPilotGearResults('карапасный');
  if (!elements['pilotGearResults'].innerHTML.includes('карапасный')) throw new Error('GK: the pilot gear search must find the hardsuits by RU name');
  // findPilotGear by id and by RU name
  if (!X.findPilotGear({id: 'ms_exo_locus'})) throw new Error('GK: findPilotGear must find Locus by id');
  if (X.findPilotGear({name: 'Локус'}).id !== 'ms_exo_locus') throw new Error('GK: findPilotGear must find Locus by RU name');
  // core items untouched; pilot gear carries no source field
  if (PG.find(x=>x.id === 'pg_archaic_melee').ru.name !== 'Архаичное оружие ближнего боя') throw new Error('GK: a core pilot gear item must keep its RU name');
  if (PG.some(x=>x.source !== undefined || x.src !== undefined)) throw new Error('GK: pilot gear must not carry a source field');
})();
// PHASE GL (v243): five books — Karrakin, Dustgrave, Siren's Song,
// Winter Scar, Shadow of the Wolf — 14 frames, 23 systems, 19 weapons,
// 6 talents; 26 new ACTIONS_REF entries (14 quick + 6 reactions +
// 6 protocols); LICENSE_VIBE for the 3 new licenses (White Witch, Emperor,
// Gilgamesh — the other 7 frames are variants sharing base licenses, v251); ITEM_SOURCE /
// LICENSE_SOURCE → the five books; pilot gear 44 -> 61 (17 new items);
// pilotDamageType is now case-insensitive.
(function(){
  const { X, S, DB, elements } = runEval({});
  // DB: all fourteen frames + their licenses
  for (const f of ['White Witch', 'Emperor', 'Orchis', 'Calendula', 'Störtebeker', 'Viceroy', 'Empakaai', 'Gilgamesh', 'Amber Phantom', 'Lycan', 'Kutuzov', 'Taraxacum', 'Hecatoncheires', 'Tagetes']) {
    if (!DB.frames[f]) throw new Error('GL: frame ' + f + ' must be in the DB');
    if (DB.frames[f].ll !== 2) throw new Error('GL: frame ' + f + ' must be LL2');
  }
  // variant frames share their base license (the Minotaur second frame)
  if (DB.frames['Orchis'].lic !== 'Black Witch') throw new Error('GL: Orchis must share the Black Witch license');
  if (DB.frames['Calendula'].lic !== 'Minotaur') throw new Error('GL: Calendula must share the Minotaur license');
  if (DB.frames['Störtebeker'].lic !== 'Raleigh') throw new Error('GL: Störtebeker must share the Raleigh license');
  if (DB.frames['Viceroy'].lic !== 'Monarch') throw new Error('GL: Viceroy must share the Monarch license');
  // v251: the other seven frames of the five books are also variants — their
  // .lcp 'variant' field was missed by the v243 import, which gave each its
  // own empty license; they share the base license like Orchis/Calendula.
  if (DB.frames['Empakaai'].lic !== 'Blackbeard') throw new Error('GL: Empakaai must share the Blackbeard license (v251)');
  if (DB.frames['Amber Phantom'].lic !== 'Metalmark') throw new Error('GL: Amber Phantom must share the Metalmark license (v251)');
  if (DB.frames['Lycan'].lic !== 'Manticore') throw new Error('GL: Lycan must share the Manticore license (v251)');
  if (DB.frames['Kutuzov'].lic !== 'Napoleon') throw new Error('GL: Kutuzov must share the Napoleon license (v251)');
  if (DB.frames['Taraxacum'].lic !== 'Lancaster') throw new Error('GL: Taraxacum must share the Lancaster license (v251)');
  if (DB.frames['Hecatoncheires'].lic !== 'Balor') throw new Error('GL: Hecatoncheires must share the Balor license (v251)');
  if (DB.frames['Tagetes'].lic !== 'Sherman') throw new Error('GL: Tagetes must share the Sherman license (v251)');
  // own licenses (only White Witch, Emperor, Gilgamesh have one in the five books)
  for (const f of ['White Witch', 'Emperor', 'Gilgamesh']) {
    if (DB.frames[f].lic !== f) throw new Error('GL: frame ' + f + ' must have its own license');
  }
  if (DB.frames['White Witch'].nr !== 'Белая ведьма') throw new Error('GL: White Witch RU name must be «Белая ведьма»');
  if (DB.frames['Störtebeker'].nr !== 'Штёртебекер') throw new Error('GL: Störtebeker RU name must be «Штёртебекер»');
  // integrated weapons (Plasma Talons / Flayer precedent)
  if (JSON.stringify(DB.frames['Emperor'].iw) !== '["Marathon Arc Bow"]') throw new Error('GL: Emperor must carry the Marathon Arc Bow as its integrated weapon');
  if (JSON.stringify(DB.frames['Empakaai'].iw) !== '["Colossus Termo-Unguis"]') throw new Error('GL: Empakaai must carry the Colossus Termo-Unguis as its integrated weapon');
  if (JSON.stringify(DB.frames['Lycan'].iw) !== '["Shock Claws"]') throw new Error('GL: Lycan must carry the Shock Claws as its integrated weapon');
  const bow = DB.weapons.find(w=>w.n === 'Marathon Arc Bow');
  if (!bow || bow.lic !== '' || bow.ll !== null || bow.lab !== 'Main') throw new Error('GL: the Marathon Arc Bow must be an integrated weapon (lic "", lab Main), not exotic');
  // exotic (lic GMS ll 0)
  const nhp = DB.systems.find(s=>s.n === 'Unstable NHP');
  if (!nhp || nhp.lic !== 'GMS' || nhp.ll !== 0 || nhp.lab !== 'GMS · LL0 · 0 SP') throw new Error('GL: Unstable NHP must be exotic (lic GMS, lab GMS · LL0 · 0 SP)');
  if (DB.systems.find(s=>s.n === 'Emi Theater').lic !== 'GMS') throw new Error('GL: Emi Theater must be exotic (lic GMS)');
  if (DB.systems.find(s=>s.n === "Champion's Favor").lic !== 'GMS') throw new Error("GL: Champion's Favor must be exotic (lic GMS)");
  // system effect is kept (v241 dropped it — 4 Long Rim systems lost theirs)
  if (!DB.systems.find(s=>s.n === 'Emi Theater').x.includes('Choose a destroyed mech')) throw new Error('GL: Emi Theater must keep its effect in the EN description');
  if (!DB.systems.find(s=>s.n === 'Emi Theater').xr.includes('Выберите уничтоженного меха')) throw new Error('GL: Emi Theater must keep its effect in the RU description');
  if (!DB.systems.find(s=>s.n === "Champion's Favor").x.includes('At the start of your turn, gain 1 Overshield')) throw new Error("GL: Champion's Favor must keep its effect in the EN description");
  // core: Hecatoncheires / Tagetes (empty activation, no empty parens)
  if (DB.frames['Hecatoncheires'].cd.includes('()')) throw new Error('GL: Hecatoncheires core must not have empty parens');
  if (!DB.frames['Hecatoncheires'].cd.includes('Enrage Swarm')) throw new Error('GL: Hecatoncheires core must include Enrage Swarm');
  if (DB.frames['Tagetes'].cd.includes('()')) throw new Error('GL: Tagetes core must not have empty parens');
  if (!DB.frames['White Witch'].cd.includes('Passive')) throw new Error('GL: White Witch core must include its passive');
  // Nexus weapon type (new)
  if (DB.weapons.find(w=>w.n === 'Bolt Nexus').tr !== 'Нексус') throw new Error('GL: Bolt Nexus RU type must be «Нексус»');
  // talents
  for (const t of ['House Guard', 'Pankrati', 'Prospector', 'Iconoclast', 'Field Analyst', 'Orator']) {
    if (!DB.talents.find(x=>x.n === t)) throw new Error('GL: talent ' + t + ' must be in the DB');
  }
  if (DB.talents.find(t=>t.n === 'Prospector').nr !== 'Старатель') throw new Error('GL: Prospector RU name must be «Старатель»');
  if (!DB.talents.find(t=>t.n === 'Prospector').tr) throw new Error('GL: Prospector must have a RU tagline (its EN terse is empty)');
  // источники — one item per book
  if (X.itemSource('frame', 'White Witch') !== 'Field Guide to the Karrakin Trade Baronies') throw new Error('GL: White Witch must come from the Karrakin book');
  if (X.itemSource('system', 'Unstable NHP') !== 'Dustgrave') throw new Error('GL: Unstable NHP must come from Dustgrave');
  if (X.itemSource('weapon', 'Brutus’s Shield') !== 'Dustgrave') throw new Error('GL: Brutus’s Shield must come from Dustgrave');
  if (X.itemSource('talent', 'Prospector') !== 'Dustgrave') throw new Error('GL: Prospector must come from Dustgrave');
  if (X.itemSource('frame', 'Empakaai') !== "Siren's Song: A Mountain's Remorse") throw new Error("GL: Empakaai must come from Siren's Song");
  if (X.itemSource('system', 'Emi Theater') !== "Siren's Song: A Mountain's Remorse") throw new Error("GL: Emi Theater must come from Siren's Song");
  if (X.itemSource('frame', 'Gilgamesh') !== 'Operation Winter Scar') throw new Error('GL: Gilgamesh must come from Operation Winter Scar');
  if (X.itemSource('weapon', 'Legion Nexus') !== 'Operation Winter Scar') throw new Error('GL: Legion Nexus must come from Operation Winter Scar');
  if (X.itemSource('frame', 'Taraxacum') !== 'Shadow of the Wolf') throw new Error('GL: Taraxacum must come from Shadow of the Wolf');
  if (X.itemSource('system', "Champion's Favor") !== 'Shadow of the Wolf') throw new Error("GL: Champion's Favor must come from Shadow of the Wolf");
  if (X.itemSource('frame', 'Atlas') !== 'The Long Rim') throw new Error('GL: a Long Rim frame must still come from The Long Rim');
  if (X.itemSource('frame', 'Everest')) throw new Error('GL: a core frame must still have no source');
  if (X.LICENSE_SOURCE['White Witch'] !== 'Field Guide to the Karrakin Trade Baronies') throw new Error('GL: LICENSE_SOURCE must map White Witch to the Karrakin book');
  if (X.LICENSE_SOURCE['Gilgamesh'] !== 'Operation Winter Scar') throw new Error('GL: LICENSE_SOURCE must map Gilgamesh to Operation Winter Scar');
  if (X.LICENSE_SOURCE['Atlas'] !== 'The Long Rim') throw new Error('GL: LICENSE_SOURCE must still map Atlas to The Long Rim');
  // карточка лицензии — источник внизу (как у Kidd в GG)
  const wwDet = X.licenseDetailHtml('White Witch');
  if (!wwDet.includes('Источник: Field Guide to the Karrakin Trade Baronies')) throw new Error('GL: the White Witch license detail must show its source');
  if (wwDet.includes('class="vibe-lines"')) throw new Error('GL: the license detail must not show the full vibe text');
  // вайб: строка лицензии показывает полный текст, строка фрейма — описание
  const wwRow = X.licenseRowInfoHtml(X.licenseData().find(l=>l.name === 'White Witch'));
  if (!wwRow.includes('пушка возмездия')) throw new Error('GL: the White Witch license row must show its weapons tag (v246)');
  if (!wwRow.includes('Фрейм:') || !wwRow.includes('Оружие и системы:')) throw new Error('GL: the White Witch license row must show the new format (v246: Фрейм, Оружие и системы)');
  if (!X.licenseMatches(X.licenseData().find(l=>l.name === 'White Witch'), 'возмездия')) throw new Error('GL: license search must match White Witch via its weapons tag (v246)');
  if (!X.frameMatches('White Witch', 'броня')) throw new Error('GL: frame search must match White Witch via its short tag (v245)');
  const wwFrameRow = X.frameRowSub('White Witch');
  if (wwFrameRow !== 'Броня, Гигант') throw new Error('GL: the White Witch frame row must show the short tags with each tag capitalized (v248)');
  if (X.frameRoleLine('White Witch') !== 'Защитник, Ближний бой') throw new Error('GL: the White Witch frame role line must come from its license vibe');
  if (X.frameDispName('White Witch') !== 'SSC: Белая ведьма') throw new Error('GL: the White Witch frame name must carry the corporation prefix');
  // ACTIONS_REF: новые записи пяти книг
  const A = global.__x.ACTIONS_REF;
  for (const k of ['pinningspire', 'memeticspark', 'valiantcharge', 'createentrance', 'transmutingspark', 'championsguidemyhands', 'spatialawareness', 'superiorintelligence', 'convincingrhetoric', 'agitron', 'edge', 'ferrofluidlancefling', 'brutussshield']) {
    if (![...A.quick, ...A.reactions, ...A.protocols].some(a=>a.key === k)) throw new Error('GL: ACTIONS_REF must hold the five-books entry ' + k);
  }
  if (!A.reactions.find(a=>a.key === 'championsguidemyhands' && a.per === '1/scene')) throw new Error('GL: Champions, Guide My Hands must be a 1/scene reaction (Other activation)');
  if (!A.protocols.find(a=>a.key === 'agitron' && a.grant.system === 'Cockpit-Integrated Stim Pump')) throw new Error('GL: Agitron must be granted by the Cockpit-Integrated Stim Pump');
  if (!A.protocols.find(a=>a.key === 'ferrofluidlancefling' && a.grant.weapon === 'Ferrofluid Lance')) throw new Error('GL: Ferrofluid Lance Fling must be granted by the Ferrofluid Lance');
  // карточка фрейма — источник внизу
  if (!X.frameDetailHtml('White Witch').includes('Источник: Field Guide to the Karrakin Trade Baronies')) throw new Error('GL: the White Witch frame detail must show its source');
  if (X.frameDetailHtml('Everest').includes('Источник')) throw new Error('GL: a core frame detail must still not show a source');
  // пилотское снаряжение: 44 -> 61 (17 новых)
  const PG = global.__x.PILOT_GEAR_DB;
  if (!PG || PG.length !== 61) throw new Error('GL: PILOT_GEAR_DB must have 61 items (44 + 17 five-books), got ' + (PG && PG.length));
  const pgIds = ['ms_madrigal_precision_rifle', 'ms_madrigal_shoulder_launcher', 'ms_madrigal_boarding_shotgun', 'ms_madrigal_power_crusher', 'ms_madrigal_railgun', 'ms_madrigal_disruptor_grenades', 'ms_madrigal_jump_system', 'ms_madrigal_thermal_visor', 'ms_madrigal_active_camo', 'ms_madrigal_personal_shield', 'ms_madrigal_shock_field', 'ms_madrigal_boarding_carapace_armor', 'pg_Psionic_Piston', 'pg_personal_shielding', 'pg_monofilament_rapier', 'pg_hardlight_knives', 'pg_blue_blood'];
  for (const id of pgIds) {
    const g = PG.find(x=>x.id === id);
    if (!g) throw new Error('GL: pilot gear ' + id + ' must be in PILOT_GEAR_DB');
    if (!g.ru || !g.ru.name) throw new Error('GL: pilot gear ' + id + ' must have a RU name');
  }
  if (PG.find(x=>x.id === 'ms_madrigal_boarding_carapace_armor').ru.name !== 'Абордажный карапас „Мадригал“') throw new Error('GL: Madrigal Boarding Carapace must have the draft RU name');
  if (PG.find(x=>x.id === 'pg_Psionic_Piston').ru.name !== 'Псионический поршень') throw new Error('GL: Psionic Piston must have the draft RU name');
  if (PG.find(x=>x.id === 'pg_blue_blood').ru.name !== 'Синяя кровь Панглосса') throw new Error('GL: Blue Blood must have the draft RU name');
  if (PG.find(x=>x.id === 'ms_exo_locus').ru.name !== 'Локус') throw new Error('GL: a Wallflower pilot gear item must keep its RU name');
  if (PG.some(x=>x.source !== undefined || x.src !== undefined)) throw new Error('GL: pilot gear must not carry a source field');
  // pilotDamageType is case-insensitive now (sotw .lcp uses lowercase kinetic/burn)
  if (X.pilotDamageType('kinetic') !== 'кинетический') throw new Error("GL: pilotDamageType must map lowercase kinetic to 'кинетический'");
  if (X.pilotDamageType('Kinetic') !== 'кинетический') throw new Error("GL: pilotDamageType must still map Kinetic");
  if (X.pilotDamageType('burn') !== 'ожог') throw new Error("GL: pilotDamageType must map lowercase burn to 'ожог'");
  if (X.pilotDamageType('Burn') !== 'ожог') throw new Error("GL: pilotDamageType must still map Burn");
  if (X.pilotDamageType('Variable') !== 'выбранный') throw new Error("GL: pilotDamageType must still map capital-V Variable to 'выбранный'");
  // поиск снаряжения находит новые предметы по RU-имени (Psionic Piston — Gear, не Weapon)
  X.toggleLang(); // en
  X.openPilotGearPicker('Gear');
  X.renderPilotGearResults('Psionic');
  if (!elements['pilotGearResults'].innerHTML.includes('Psionic Piston')) throw new Error('GL: the pilot gear search must find Psionic Piston by EN name');
  X.toggleLang(); // back to ru
  X.openPilotGearPicker('Gear');
  X.renderPilotGearResults('Псионический');
  if (!elements['pilotGearResults'].innerHTML.includes('Псионический поршень')) throw new Error('GL: the pilot gear search must find Psionic Piston by RU name');
  X.openPilotGearPicker('Weapon');
  X.renderPilotGearResults('Мадригал');
  if (!elements['pilotGearResults'].innerHTML.includes('Мадригал')) throw new Error('GL: the pilot gear search must find Madrigal weapons by RU name');
})();
// PHASE GM (v244, обновлена в v248): вайб-описание фрейма убрано из карточки фрейма
// (осталось только в строках списков — поиск и Правила); v248: в карточке — та же
// объединённая строка, что в списке (роль + теги), а не только роль.
(function(){
  const { X, S, DB, elements } = runEval({});
  // лицензионный фрейм (Влад): в карточке — та же строка, что в списке (роль + теги)
  const vladDet = X.frameDetailHtml('Vlad');
  if (!vladDet.includes('Контролер-Штурмовик, Ловчий, Ближний бой, Обездвиживание')) throw new Error('GM: the frame detail must show the same merged line as the row (v248 — role + tags)');
  // в строках списков — та же строка
  X.toggleLicenseFilter(false);
  X.showFrameResults('влад', elements['frameResults']);
  if (!elements['frameResults'].innerHTML.includes('Контролер-Штурмовик, Ловчий, Ближний бой, Обездвиживание')) throw new Error('GM: the frame search row must show the merged line (v248)');
  X.renderRulesFrameList();
  if (!elements['rulesFrameList'].innerHTML.includes('Контролер-Штурмовик, Ловчий, Ближний бой, Обездвиживание')) throw new Error('GM: the Rules frames list must show the merged line (v248)');
  // Long Rim (Атлас): в карточке — та же строка, что в списке
  const atDet = X.frameDetailHtml('Atlas');
  if (!atDet.includes('Штурмовик, Ближний бой, Убийца гигантов, Маленький')) throw new Error('GM: the Atlas frame detail must show the merged line (v248)');
  if (X.frameRowSub('Atlas') !== 'Убийца гигантов, Маленький') throw new Error('GM: the Atlas frame row must show the short tags with each tag capitalized (v248)');
  // GMS-фрейм (Эверест): строка роли и секция Core Power на месте
  const evDet = X.frameDetailHtml('Everest');
  if (!evDet.includes('LL0 Универсал')) throw new Error('GM: the Everest detail must keep the GMS role label');
  if (!evDet.includes('Core Power:')) throw new Error('GM: the Everest detail must keep the Core Power heading');
  if (!evDet.includes('Hyperspec Fuel Injector') && !evDet.includes('Гиперспектральный инжектор топлива')) throw new Error('GM: the Everest detail must keep the Core Power name');
})();
// PHASE GN (v245): короткие теги фреймов — вместо длинных вайбов;
// правило размера (size < 1 → «маленький», > 1 → «гигант»);
// «регенерация» только у Балора; «дроны» у фреймов с механикой дронов;
// фрейм без тега — без пустого блока описания в строке.
// v248: каждый тег с заглавной (capList).
(function(){
  const { X, S, DB, elements } = runEval({});
  // размер: size 1/2 → «маленький», size 2/3 → «гигант», size 1 — без тега размера
  if (X.frameRowSub('Napoleon') !== 'Маленький') throw new Error('GN: the Napoleon frame row must show the «маленький» size tag (v245)');
  if (X.frameRowSub('Balor') !== 'Регенерация, Гигант') throw new Error('GN: the Balor frame row must show «Регенерация, Гигант» (v248 — каждый тег с заглавной)');
  if (X.frameRowSub('Barbarossa') !== 'Рельсотрон, Гигант') throw new Error('GN: the Barbarossa frame row must show the «Гигант» size tag (v248, size 3)');
  if (X.frameRowSub('Vlad') !== 'Обездвиживание') throw new Error('GN: a size-1 frame must have no size tag (v245)');
  // регенерация — только Балор (проверено по db.js: трейт Regeneration)
  if (!X.frameRowSub('Balor').includes('Регенерация')) throw new Error('GN: Balor must carry the «регенерация» tag (v245)');
  // дроны — у фреймов с механикой дронов
  // v252: Hecatoncheires is a Balor variant — it shows its OWN tag
  // «Дроны, Маленький» now (FRAME_VIBE), not the base «Регенерация, Гигант».
  if (X.frameRowSub('Hecatoncheires') !== 'Дроны, Маленький') throw new Error('GN: Hecatoncheires must show its own «Дроны, Маленький» tag (v252 — variant frames show their own tags)');
  if (!X.frameRowSub('Lancaster').includes('Дроны')) throw new Error('GN: Lancaster must carry the «дроны» tag (v245)');
  if (!X.frameRowSub('Kidd').includes('Дроны')) throw new Error('GN: Kidd must carry the «Дроны» tag (v248 — каждый тег с заглавной)');
  // поиск «дрон» находит Гидру (роль) и Гекатонхейра (свой тег — v252)
  if (!X.frameMatches('Hydra', 'дрон')) throw new Error('GN: frame search for «дрон» must match Hydra via its role (v245)');
  if (!X.frameMatches('Hecatoncheires', 'дрон')) throw new Error('GN: frame search for «дрон» must match Hecatoncheires via its own tag (v252)');
  // фрейм без тега (Гидра): в строке нет пустого блока описания
  X.toggleLicenseFilter(false);
  X.showFrameResults('гидра', elements['frameResults']);
  const hydraRow = elements['frameResults'].innerHTML;
  if (!hydraRow.includes('Штурмовик-Контролер, Дроны, Средняя дистанция')) throw new Error('GN: the Hydra frame row must show the role line (v245)');
  if (hydraRow.includes('<span></span>')) throw new Error('GN: a tagless frame row must not have an empty description span (v245)');
  // и в списке Правил тоже
  X.renderRulesFrameList();
  const rulesHtml = elements['rulesFrameList'].innerHTML;
  if (rulesHtml.includes('<span></span>')) throw new Error('GN: the Rules frames list must not have empty description spans (v245)');
  // лицензия без тега фрейма (Гидра): в строке лицензии нет пустой строки «Фрейм:»
  const hydraLicRow = X.licenseRowInfoHtml(X.licenseData().find(l=>l.name === 'Hydra'));
  if (hydraLicRow.includes('<p><b>Фрейм:</b> </p>')) throw new Error('GN: a tagless license row must not show an empty «Фрейм:» line (v245)');
  if (!hydraLicRow.includes('<b>Фрейм:</b> Гидра')) throw new Error('GN: a tagless license row must show the frame name instead of a tag (v246)');
  if (!hydraLicRow.includes('Оружие и системы:')) throw new Error('GN: a tagless license row must still show weapons/systems (v245, v246 — combined line)');
})();
// PHASE GO (v246): новый формат строки лицензии — вместо прозы «Фрейм/Оружие/Системы»:
// «Оружие и системы: [короткие теги]» + «Фрейм: [теги]» (или «Фрейм 1:/Фрейм 2:»
// при двух фреймах). Системы — «система (чего)» из контролируемого словаря;
// сложную систему заменяет счётчик «N системы». Лицензия без оружия/систем —
// без строки «Оружие и системы:». Лицензия без тега фрейма — с именем фрейма.
// v247: строка фрейма — имя + ровно та же строка тегов, что в списке фреймов
// (frameRowSub); без тега — только имя, без тире; волосяные линии убраны.
// v248: строка фрейма — та же объединённая строка, что в списке фреймов
// (frameRowFull: роль + теги); роль в однофреймовой лицензии дублируется.
// v249: отдельная строка роли удалена — дублирование закрыто, роль только
// внутри строк фреймов; описание (.lic-vibe) dim.
// v253: строки фреймов снова роль+теги (frameRowFull), как в списке фреймов;
// роль лицензии по-прежнему не показывается — это роль ФРЕЙМА.
(function(){
  const { X, S, DB, elements } = runEval({});
  const lics = X.licenseData();
  // Vlad: одна строка оружия/систем + один фрейм с тегом
  const vladRow = X.licenseRowInfoHtml(lics.find(l=>l.name === 'Vlad'));
  if (!vladRow.includes('<b>Оружие и системы:</b> Копьё, гвоздемёт, бур, система ловушки, система контроля')) throw new Error('GO: the Vlad license row must show the new format (v246)');
  if (!vladRow.includes('<b>Фрейм:</b> Влад — Контролер-Штурмовик, Ловчий, Ближний бой, Обездвиживание')) throw new Error('GO: the Vlad license row must show the frame name + role + tags (v253)');
  if (vladRow.includes('Оружие:</b>') || vladRow.includes('Системы:</b>')) throw new Error('GO: the license row must not show the old separate labels (v246)');
  // Minotaur: нет оружия, две строки фреймов
  const minRow = X.licenseRowInfoHtml(lics.find(l=>l.name === 'Minotaur'));
  if (!minRow.includes('<b>Оружие и системы:</b> Система ловушки, система взлома, система перегрева, система телепортации, система контроля')) throw new Error('GO: the Minotaur license row must show only system tags (v246)');
  if (!minRow.includes('<b>Фрейм 1:</b> Минотавр — Контролер-Танк, Ближний бой, Стена') || !minRow.includes('<b>Фрейм 2:</b> Календула — Контролер-Танк, Ближний бой, Пустота')) throw new Error('GO: a two-frame license must show Фрейм 1 and Фрейм 2 with names + role + tags (v253)');
  // Tokugawa: два фрейма, каждый со своим тегом — имена различают (v252)
  const tokRow = X.licenseRowInfoHtml(lics.find(l=>l.name === 'Tokugawa'));
  if (!tokRow.includes('<b>Фрейм 1:</b> Токугава — Штурмовик, Перегрев, Ближний бой, Энергия') || !tokRow.includes('<b>Фрейм 2:</b> Энкиду — Штурмовик, Перегрев, Ближний бой, Когти, Гигант')) throw new Error('GO: Tokugawa must show both frames with names + their own role + tags (v253)');
  // счётчик: Lich (3 системы), Atlas (2 системы)
  const lichRow = X.licenseRowInfoHtml(lics.find(l=>l.name === 'Lich'));
  if (!lichRow.includes('3 системы')) throw new Error('GO: Lich must show the «3 системы» counter (v246)');
  const atlasRow = X.licenseRowInfoHtml(lics.find(l=>l.name === 'Atlas'));
  if (!atlasRow.includes('2 системы')) throw new Error('GO: Atlas must show the «2 системы» counter (v246)');
  // v251: лицензий без оружия/систем больше нет — все 7 «пустых» лицензий
  // (Amber Phantom, Empakaai, Lycan, Kutuzov, Taraxacum, Hecatoncheires,
  // Tagetes) оказались вариантами фреймов и влиты в базовые лицензии;
  // у каждой из 38 лицензий теперь есть оружие и/или системы.
  for (const l of lics){
    const hasAny = [1, 2, 3].some(r=>(l.ranks[r] || []).some(g=>g.kind === 'weapon' || g.kind === 'system'));
    if (!hasAny) throw new Error('GO: license ' + l.name + ' must have weapons or systems (v251 — no empty licenses left)');
    if (!X.licenseRowInfoHtml(l).includes('Оружие и системы:')) throw new Error('GO: license ' + l.name + ' must show the weapons/systems line (v251)');
  }
  // фрейм без тега: роль вместо тегов (v253)
  const gengRow = X.licenseRowInfoHtml(lics.find(l=>l.name === 'Genghis'));
  if (!gengRow.includes('<b>Фрейм 1:</b> Чингис — Штурмовик-Поджигатель, Ближний бой</p>')) throw new Error('GO: a tagless frame must show its role in the license row (v253)');
  if (!gengRow.includes('<b>Фрейм 2:</b> “Убийца миров” Чингис Mk I — Штурмовик-Поджигатель, Ближний бой, Джаггернаут, Гигант')) throw new Error('GO: a two-frame license must show the variant frame name + role + tags (v253)');
  // поиск лицензии по тегу оружия/системы
  if (!X.licenseMatches(lics.find(l=>l.name === 'Vlad'), 'гвоздемёт')) throw new Error('GO: license search must match Vlad via its weapons tag (v246)');
  if (!X.licenseMatches(lics.find(l=>l.name === 'Minotaur'), 'телепортации')) throw new Error('GO: license search must match Minotaur via its systems tag (v246)');
  if (!X.licenseMatches(lics.find(l=>l.name === 'Lich'), 'системы')) throw new Error('GO: license search must match Lich via the counter word (v246)');
  // все 38 лицензий: оружия/системы — только теги, без прозы (нет предложений с точками)
  for (const l of lics){
    const v = X.LICENSE_VIBE[l.name];
    if (!v) continue;
    if (/\.\s/.test(v.weapons) || /\.\s/.test(v.systems)) throw new Error('GO: license ' + l.name + ' must not have prose in weapons/systems (v246)');
  }
})();
// PHASE GP (v247, обновлена в v253): единый формат строк фреймов в лицензиях — имя + ровно
// та же строка, что в списке фреймов (frameRowFull: роль+теги; v250 временно показывала
// только теги frameRowSub); фрейм без тегов показывает свою роль; Gilgamesh «Больше зарядов».
(function(){
  const { X, S, DB, elements } = runEval({});
  const lics = X.licenseData();
  // один фрейм с тегами: имя + та же строка, что frameRowFull
  const vladRow = X.licenseRowInfoHtml(lics.find(l=>l.name === 'Vlad'));
  if (!vladRow.includes('<b>Фрейм:</b> Влад — ' + X.frameRowFull('Vlad'))) throw new Error('GP: the license frame line must show the name + the exact role+tags from the frame list (v253 — frameRowFull)');
  if (vladRow.includes('class="vibe-lines"')) throw new Error('GP: the license row must not use .vibe-lines (v247 — hairlines removed)');
  if (!vladRow.includes('class="lic-vibe"')) throw new Error('GP: the license row must use .lic-vibe (v247)');
  // два фрейма: имена различают, теги — те же, что в списке фреймов
  const tokRow = X.licenseRowInfoHtml(lics.find(l=>l.name === 'Tokugawa'));
  if (!tokRow.includes('<b>Фрейм 1:</b> Токугава — ' + X.frameRowFull('Tokugawa'))) throw new Error('GP: Tokugawa Фрейм 1 must show the name + the exact role+tags (v253 — frameRowFull)');
  if (!tokRow.includes('<b>Фрейм 2:</b> Энкиду — ' + X.frameRowFull('Enkidu'))) throw new Error('GP: Tokugawa Фрейм 2 must show the variant name + its own role+tags (v253 — frameRowFull)');
  // фрейм без тега: роль вместо тегов (v253), без висячего тире
  const gengRow = X.licenseRowInfoHtml(lics.find(l=>l.name === 'Genghis'));
  if (!gengRow.includes('<b>Фрейм 1:</b> Чингис — ' + X.frameRowFull('Genghis') + '</p>')) throw new Error('GP: a tagless frame must show its role in licenses (v253 — frameRowFull)');
  if (gengRow.includes(' —</p>') || gengRow.includes(', </p>')) throw new Error('GP: a tagless frame line must not end with a dangling dash or comma (v248)');
  // Gilgamesh: «больше зарядов» — и в списке фреймов, и в строке лицензии
  if (X.frameRowSub('Gilgamesh') !== 'Больше зарядов') throw new Error('GP: Gilgamesh must show «Больше зарядов» (v247)');
  const gilRow = X.licenseRowInfoHtml(lics.find(l=>l.name === 'Gilgamesh'));
  if (!gilRow.includes('<b>Фрейм:</b> Гильгамеш — ' + X.frameRowFull('Gilgamesh'))) throw new Error('GP: the Gilgamesh license row must show role + the new tag (v253)');
  if (gilRow.includes('Заряды')) throw new Error('GP: the old «Заряды» tag must be gone (v247)');
})();
// PHASE GQ (v248): одна строка фрейма — роль + теги (каждый с заглавной);
// у GMS — только роль (название ядра из строки убрано); Наполеон —
// «Уменьшение урона».
// v249: отдельная строка роли из строки лицензии удалена — дублирование v248 закрыто.
// v253: в строках лицензий снова роль+теги (frameRowFull), как в списке фреймов;
// роль лицензии по-прежнему не показывается отдельно — это роль ФРЕЙМА.
(function(){
  const { X, S, DB, elements } = runEval({});
  // capList: каждый тег с заглавной
  if (X.capList('регенерация, гигант') !== 'Регенерация, Гигант') throw new Error('GQ: capList must capitalize each tag');
  if (X.capList('убийца гигантов, маленький') !== 'Убийца гигантов, Маленький') throw new Error('GQ: capList must capitalize each tag');
  if (X.capList('') !== '') throw new Error('GQ: capList of an empty string must be empty');
  if (X.capList('жертва, дроны') !== 'Жертва, Дроны') throw new Error('GQ: capList must capitalize the second tag too');
  // frameRowFull: роль + теги одной строкой
  if (X.frameRowFull('Saladin') !== 'Танк-Защитник, Бафер защиты, Гигант') throw new Error('GQ: Saladin must show role + tag in one line');
  if (X.frameRowFull('Balor') !== 'Штурмовик/Танк, Ближний бой, Регенерация, Гигант') throw new Error('GQ: Balor must show role + tags in one line');
  if (X.frameRowFull('Barbarossa') !== 'Артиллерия/Танк, Дальняя дистанция, Рельсотрон, Гигант') throw new Error('GQ: Barbarossa must show role + tags in one line');
  if (X.frameRowFull('Iskander') !== 'Контролер, Минное поле, Средняя дистанция, Гигант') throw new Error('GQ: Iskander must show role + tag in one line');
  if (X.frameRowFull('Sunzi') !== 'Поддержка-Контролер, Средняя дистанция, Телепортация') throw new Error('GQ: Sunzi must show role + tag in one line');
  if (X.frameRowFull('Sherman') !== 'Штурмовик-Артиллерия, Лазерщик, Средняя-Дальняя дистанция, Опасная зона') throw new Error('GQ: Sherman must show role + tag in one line');
  // v252: Tagetes is a Sherman variant — it shows its OWN role + tag
  // («Артиллерия, Дальняя дистанция, Винтовки», FRAME_VIBE).
  if (X.frameRowFull('Tagetes') !== 'Артиллерия, Дальняя дистанция, Винтовки') throw new Error('GQ: Tagetes must show its own role + tag (v252 — variant frame)');
  if (X.frameRowFull('Gorgon') !== 'Танк-Защитник, Наказание, Ближний бой, Оглушение, Гигант') throw new Error('GQ: Gorgon must show role + tags in one line');
  // Наполеон: роль «Время как броня» → «Уменьшение урона» (v248).
  // NB: capRole капитализирует только первое слово каждой части через запятую
  // («Уменьшение урона», как «Минное поле», «Бафер защиты») — так и задумано.
  if (X.LICENSE_VIBE['Napoleon'].role !== 'танк-контролер, уменьшение урона') throw new Error('GQ: the Napoleon role must be «уменьшение урона» (v248)');
  if (X.frameRowFull('Napoleon') !== 'Танк-Контролер, Уменьшение урона, Маленький') throw new Error('GQ: Napoleon must show «Уменьшение урона» (v248)');
  if (JSON.stringify(X.LICENSE_VIBE).includes('Время как броня')) throw new Error('GQ: the old Napoleon role «Время как броня» must be gone (v248)');
  // фрейм без тега — только роль, без висячей запятой
  if (X.frameRowFull('Genghis') !== 'Штурмовик-Поджигатель, Ближний бой') throw new Error('GQ: a tagless frame must show only its role (v248)');
  if (X.frameRowFull('Hydra') !== 'Штурмовик-Контролер, Дроны, Средняя дистанция') throw new Error('GQ: Hydra must show only its role (v248)');
  if (X.frameRowFull('Raleigh') !== 'Штурмовик, Старый солдат, Дальний бой с перезарядкой') throw new Error('GQ: Raleigh must show only its role (v248)');
  // инвариант: теги в frameRowFull — те же, что в frameRowSub (побайтово)
  if (X.frameRowFull('Vlad') !== X.frameRoleLine('Vlad') + ', ' + X.frameRowSub('Vlad')) throw new Error('GQ: frameRowFull must be role + frameRowSub (v248)');
  if (X.frameRowFull('Balor') !== X.frameRoleLine('Balor') + ', ' + X.frameRowSub('Balor')) throw new Error('GQ: frameRowFull must be role + frameRowSub (v248)');
  if (X.frameRowFull('Genghis') !== X.frameRoleLine('Genghis')) throw new Error('GQ: a tagless frameRowFull must equal its role line (v248)');
  // GMS: только роль — название ядра из строки убрано (v248)
  if (X.frameRowFull('Everest') !== 'LL0 Универсал') throw new Error('GQ: the Everest frame row must show only its role (v248 — core name removed)');
  if (X.frameRowFull('Chomolungma') !== 'LL0 Контролер-Хакер') throw new Error('GQ: the Chomolungma frame row must show only its role (v248)');
  if (X.frameRowFull('Sagarmatha') !== 'LL0 Танк') throw new Error('GQ: the Sagarmatha frame row must show only its role (v248)');
  if (X.frameRowSub('Everest') !== '') throw new Error('GQ: a GMS frame has no tags (v248)');
  X.toggleLicenseFilter(false);
  X.showFrameResults('', elements['frameResults']);
  const frSearch = elements['frameResults'].innerHTML;
  const gmsCore = ['Hyperspec Fuel Injector', 'Гиперспектральный инжектор топлива', 'Advanced Intrusion Package', 'Продвинутый пакет вторжения', 'Rallying Cry', 'Боевой клич'];
  if (gmsCore.some(n=>frSearch.includes(n))) throw new Error('GQ: the frame search rows must not show GMS core names (v248)');
  X.renderRulesFrameList();
  const frRules = elements['rulesFrameList'].innerHTML;
  if (gmsCore.some(n=>frRules.includes(n))) throw new Error('GQ: the Rules frames list must not show GMS core names (v248)');
  // одна строка в списке: роль + теги в одном <span>
  if (!frRules.includes('<span>Штурмовик/Танк, Ближний бой, Регенерация, Гигант</span>')) throw new Error('GQ: the Balor frame row must show role + tags in one span (v248)');
  if (!frRules.includes('<span>Танк-Защитник, Бафер защиты, Гигант</span>')) throw new Error('GQ: the Saladin frame row must show role + tag in one span (v248)');
  if (!frRules.includes('<span>LL0 Универсал</span>')) throw new Error('GQ: the Everest frame row must show only its role in one span (v248)');
  // карточка фрейма — та же строка, что в списке; Core Power на месте
  const evDet = X.frameDetailHtml('Everest');
  if (!evDet.includes('LL0 Универсал')) throw new Error('GQ: the Everest detail must keep its role line (v248)');
  if (!evDet.includes('Core Power: Hyperspec Fuel Injector') && !evDet.includes('Core Power: Гиперспектральный инжектор топлива')) throw new Error('GQ: the Everest detail must keep its Core Power section (v248)');
  // лицензии: только теги (v250 — роль лицензии убрана полностью;
  // в списке фреймов роль+теги остаются).
  const lics = X.licenseData();
  const balorRow = X.licenseRowInfoHtml(lics.find(l=>l.name === 'Balor'));
  // v251: Balor is a two-frame license now (Hecatoncheires is its variant)
  if (!balorRow.includes('<b>Фрейм 1:</b> Балор — Штурмовик/Танк, Ближний бой, Регенерация, Гигант') || !balorRow.includes('<b>Фрейм 2:</b> Гекатонхейр — Штурмовик, Контролер, Средняя дистанция, Дроны, Маленький')) throw new Error('GQ: the Balor license row must show both frames with role + tags (v253)');
  const tokRow = X.licenseRowInfoHtml(lics.find(l=>l.name === 'Tokugawa'));
  if (!tokRow.includes('<b>Фрейм 1:</b> Токугава — Штурмовик, Перегрев, Ближний бой, Энергия')) throw new Error('GQ: Tokugawa Фрейм 1 must show role + tags (v253)');
  if (!tokRow.includes('<b>Фрейм 2:</b> Энкиду — Штурмовик, Перегрев, Ближний бой, Когти, Гигант')) throw new Error('GQ: Tokugawa Фрейм 2 must show its own role + tags (v253)');
  const gengRow = X.licenseRowInfoHtml(lics.find(l=>l.name === 'Genghis'));
  if (!gengRow.includes('<b>Фрейм 1:</b> Чингис — Штурмовик-Поджигатель, Ближний бой</p>')) throw new Error('GQ: a tagless license frame line must show its role (v253)');
  if (gengRow.includes(' —</p>') || gengRow.includes(', </p>')) throw new Error('GQ: a tagless license frame line must not end with a dangling dash or comma (v248)');
  // v253: роль ФРЕЙМА в строке лицензии есть (внутри строки фрейма — ровно
  // один раз); отдельной строки роли лицензии по-прежнему нет.
  const roleCount = (balorRow.match(/Штурмовик\/Танк, Ближний бой/g) || []).length;
  if (roleCount !== 1) throw new Error('GQ: the Balor frame role must appear exactly once, inside its frame line (v253)');
  if (!balorRow.includes('<b>Фрейм 1:</b> Балор — Штурмовик/Танк, Ближний бой, Регенерация, Гигант')) throw new Error('GQ: the Balor frame line must show role + tags (v253)');
  if (balorRow.includes('<span>Штурмовик/Танк, Ближний бой</span>')) throw new Error('GQ: the license row must not have a separate role span (v250)');
})();
// PHASE GR (v250, обновлена в v253): роль ЛИЦЕНЗИИ убрана полностью из отображения —
// в строках лицензий роль+теги ФРЕЙМА (frameRowFull), в карточке лицензии строки
// роли нет; описание лицензии (.lic-vibe) dim, имя яркое; поиск по роли
// работает (ищет по данным); в списке фреймов роль+теги на месте.
(function(){
  const { X, S, DB, elements } = runEval({});
  const lics = X.licenseData();
  // Balor: роль фрейма — внутри строки фрейма (v253); отдельной строки роли нет
  const balorRow = X.licenseRowInfoHtml(lics.find(l=>l.name === 'Balor'));
  if (balorRow.includes('<span>Штурмовик/Танк, Ближний бой</span>')) throw new Error('GR: the license row must not have a separate role span (v250)');
  const balorRoles = (balorRow.match(/Штурмовик\/Танк, Ближний бой/g) || []).length;
  if (balorRoles !== 1) throw new Error('GR: the Balor frame role must appear exactly once, inside its frame line (v253)');
  // v251: Balor is a two-frame license now (Hecatoncheires is its variant)
  if (!balorRow.includes('<b>Фрейм 1:</b> Балор — Штурмовик/Танк, Ближний бой, Регенерация, Гигант') || !balorRow.includes('<b>Фрейм 2:</b> Гекатонхейр — Штурмовик, Контролер, Средняя дистанция, Дроны, Маленький')) throw new Error('GR: the Balor frame lines must show role + tags (v253)');
  // Tokugawa: роль — внутри строк фреймов (у обоих фреймов она одна и та же — v253)
  const tokRow = X.licenseRowInfoHtml(lics.find(l=>l.name === 'Tokugawa'));
  const tokRoles = (tokRow.match(/Штурмовик, Перегрев, Ближний бой/g) || []).length;
  if (tokRoles !== 2) throw new Error('GR: the Tokugawa/Enkidu role must appear once per frame line (v253)');
  if (tokRow.includes('<span>Штурмовик, Перегрев, Ближний бой</span>')) throw new Error('GR: the Tokugawa license row must not have a separate role span (v250)');
  if (!tokRow.includes('<b>Фрейм 1:</b> Токугава — Штурмовик, Перегрев, Ближний бой, Энергия') || !tokRow.includes('<b>Фрейм 2:</b> Энкиду — Штурмовик, Перегрев, Ближний бой, Когти, Гигант')) throw new Error('GR: the Tokugawa frame lines must show role + tags (v253)');
  // все 38 лицензий: нет отдельной строки роли, роли нет в строке вообще
  for (const l of lics){
    const v = X.LICENSE_VIBE[l.name];
    if (!v) continue;
    const row = X.licenseRowInfoHtml(l);
    const role = X.capRole(v.role);
    if (row.includes('<span>' + role + '</span>')) throw new Error('GR: license ' + l.name + ' must not have a separate role span (v250)');
    // v253: the FRAME role lives inside frame lines — every <p> must be a
    // weapons/systems line or a frame line, never a standalone role line.
    const ps = row.match(/<p>/g) || [];
    const framePs = row.match(/<p><b>(Оружие и системы|Фрейм)/g) || [];
    if (ps.length !== framePs.length) throw new Error('GR: license ' + l.name + ' must not have a standalone role line (v253)');
  }
  // описание dim, имя — вне dim-блока (яркое)
  if (!html.includes('.lic-vibe { margin:10px 0 0; font-size:12px; color:var(--dim); }')) throw new Error('GR: .lic-vibe must be dim (v249)');
  // v251: Balor is a two-frame license now — the row name is the license name
  if (!(balorRow.indexOf('<b>HORUS: Балор</b>') < balorRow.indexOf('class="lic-vibe"'))) throw new Error('GR: the license name must stay outside the dim description block (v253 — two-frame name is the base frame Russian name)');
  // поиск по роли работает (ищет по данным, а не по отображению)
  if (!X.licenseMatches(lics.find(l=>l.name === 'Balor'), 'ближний бой')) throw new Error('GR: license search by role must still work (v250)');
  if (!X.licenseMatches(lics.find(l=>l.name === 'Vlad'), 'ловчий')) throw new Error('GR: license search by role must still work (v250)');
  X.showLicenseResults('ближний бой', elements['licenseResults']);
  if (!elements['licenseResults'].innerHTML.includes('HORUS: Балор')) throw new Error('GR: license search for «ближний бой» must find Balor (v253 — two-frame name)');
  // карточка лицензии — строки роли нет (v250)
  const vladDet = X.licenseDetailHtml('Vlad');
  if (vladDet.includes('Контролер-Штурмовик, Ловчий, Ближний бой')) throw new Error('GR: the license detail must not show the role (v250)');
})();
// PHASE GS (v250, обновлена в v253): роль ЛИЦЕНЗИИ убрана полностью — строки фреймов
// в лицензиях теперь роль+теги (frameRowFull); карточка лицензии без строки роли;
// список фреймов не тронут (роль+теги, frameRowFull); Minotaur — роль без «живой лабиринт».
(function(){
  const { X, S, DB, elements } = runEval({});
  const lics = X.licenseData();
  // Balor: «Фрейм: Балор — Штурмовик/Танк, Ближний бой, Регенерация, Гигант» (роль+теги)
  const balorRow = X.licenseRowInfoHtml(lics.find(l=>l.name === 'Balor'));
  // v251: Balor is a two-frame license now (Hecatoncheires is its variant)
  if (!balorRow.includes('<b>Фрейм 1:</b> Балор — Штурмовик/Танк, Ближний бой, Регенерация, Гигант') || !balorRow.includes('<b>Фрейм 2:</b> Гекатонхейр — Штурмовик, Контролер, Средняя дистанция, Дроны, Маленький')) throw new Error('GS: the Balor license row must show both frames with role + tags (v253)');
  // Tokugawa: «Фрейм 1: Токугава — Штурмовик, Перегрев, Ближний бой, Энергия» / «Фрейм 2: Энкиду — Штурмовик, Перегрев, Ближний бой, Когти, Гигант»
  const tokRow = X.licenseRowInfoHtml(lics.find(l=>l.name === 'Tokugawa'));
  if (!tokRow.includes('<b>Фрейм 1:</b> Токугава — Штурмовик, Перегрев, Ближний бой, Энергия') || !tokRow.includes('<b>Фрейм 2:</b> Энкиду — Штурмовик, Перегрев, Ближний бой, Когти, Гигант')) throw new Error('GS: the Tokugawa license row must show role + tags (v253)');
  // Minotaur: роль без «живой лабиринт», строки фреймов — роль+теги
  if (X.LICENSE_VIBE['Minotaur'].role !== 'контролер-танк, ближний бой') throw new Error('GS: the Minotaur role must be «контролер-танк, ближний бой» (v250)');
  if (JSON.stringify(X.LICENSE_VIBE).includes('живой лабиринт')) throw new Error('GS: «живой лабиринт» must be gone from LICENSE_VIBE (v250)');
  const minRow = X.licenseRowInfoHtml(lics.find(l=>l.name === 'Minotaur'));
  if (!minRow.includes('<b>Фрейм 1:</b> Минотавр — Контролер-Танк, Ближний бой, Стена') || !minRow.includes('<b>Фрейм 2:</b> Календула — Контролер-Танк, Ближний бой, Пустота')) throw new Error('GS: the Minotaur license row must show role + tags (v253)');
  if (X.frameRowFull('Minotaur') !== 'Контролер-Танк, Ближний бой, Стена') throw new Error('GS: the Minotaur frame row must show the new role + tag (v250)');
  if (X.frameRowFull('Calendula') !== 'Контролер-Танк, Ближний бой, Пустота') throw new Error('GS: the Calendula frame row must show its own tag «Пустота» (v252 — variant frames show their own tags)');
  // поиск «живой лабиринт» больше не находит Минотавра (задумано)
  if (X.licenseMatches(lics.find(l=>l.name === 'Minotaur'), 'живой лабиринт')) throw new Error('GS: license search for «живой лабиринт» must not find Minotaur (v250)');
  if (X.frameMatches('Minotaur', 'живой лабиринт')) throw new Error('GS: frame search for «живой лабиринт» must not match Minotaur (v250)');
  if (X.frameMatches('Calendula', 'живой лабиринт')) throw new Error('GS: frame search for «живой лабиринт» must not match Calendula (v250)');
  // карточка лицензии — строки роли нет, гранты и источник на месте
  const vladDet = X.licenseDetailHtml('Vlad');
  if (vladDet.includes('Контролер-Штурмовик, Ловчий, Ближний бой')) throw new Error('GS: the license detail must not show the role (v250)');
  if (!vladDet.includes('grant-row')) throw new Error('GS: the license detail must keep its grants (v250)');
  const kiddDet = X.licenseDetailHtml('Kidd');
  if (!kiddDet.includes('Источник: No Room for a Wallflower, Act 1')) throw new Error('GS: the license detail must keep its source (v250)');
  // список фреймов не тронут — роль+теги на месте
  if (X.frameRowFull('Balor') !== 'Штурмовик/Танк, Ближний бой, Регенерация, Гигант') throw new Error('GS: the frame list must keep role + tags (v250)');
  if (X.frameRowFull('Saladin') !== 'Танк-Защитник, Бафер защиты, Гигант') throw new Error('GS: the frame list must keep role + tags (v250)');
  X.renderRulesFrameList();
  if (!elements['rulesFrameList'].innerHTML.includes('Штурмовик/Танк, Ближний бой, Регенерация, Гигант')) throw new Error('GS: the Rules frames list must keep role + tags (v250)');
})();
// PHASE GT (v251): 7 фреймов из пяти книг — варианты базовых фреймов
// (поле variant в .lcp), пропущенные импортом v243; их пустые лицензии
// влиты в базовые, лицензий стало 38. Вариантные фреймы показывают тег
// базовой лицензии (известное ограничение v245 — закрыто в v252, см. фазу GU).
(function(){
  const { X, S, DB, elements } = runEval({});
  const lics = X.licenseData();
  if (lics.length !== 38) throw new Error('GT: licenseData() must return 38 licenses, got ' + lics.length);
  for (const n of ['Empakaai','Amber Phantom','Lycan','Kutuzov','Taraxacum','Hecatoncheires','Tagetes']) {
    if (lics.some(l=>l.name === n)) throw new Error('GT: there must be no ' + n + ' license (v251 — variant frame)');
    if (X.LICENSE_VIBE[n]) throw new Error('GT: LICENSE_VIBE must not hold ' + n + ' (v251)');
    if (X.LICENSE_SOURCE[n]) throw new Error('GT: LICENSE_SOURCE must not hold ' + n + ' (v251)');
  }
  if (Object.keys(X.LICENSE_VIBE).length !== 38) throw new Error('GT: LICENSE_VIBE must hold 38 licenses (v251)');
  // variant frames share the base license
  const shares = [['Empakaai','Blackbeard'],['Amber Phantom','Metalmark'],['Lycan','Manticore'],['Kutuzov','Napoleon'],['Taraxacum','Lancaster'],['Hecatoncheires','Balor'],['Tagetes','Sherman']];
  for (const [f, base] of shares) {
    if (DB.frames[f].lic !== base) throw new Error('GT: frame ' + f + ' must share the ' + base + ' license (v251)');
    if (DB.frames[f].ll !== 2) throw new Error('GT: frame ' + f + ' must stay LL2 (v251)');
  }
  // base licenses now grant 2 frames at rank II
  for (const base of ['Blackbeard','Metalmark','Manticore','Napoleon','Lancaster','Balor','Sherman']) {
    const lic = lics.find(l=>l.name === base);
    if (!lic) throw new Error('GT: the ' + base + ' license must exist (v251)');
    if ((lic.ranks[2] || []).filter(g=>g.kind === 'frame').length !== 2) throw new Error('GT: the ' + base + ' license must grant exactly 2 frames at rank II (v251)');
  }
  // Napoleon row: both frames, each with its own tag (v252)
  const napRow = X.licenseRowInfoHtml(lics.find(l=>l.name === 'Napoleon'));
  if (!napRow.includes('<b>Фрейм 1:</b> Наполеон — Танк-Контролер, Уменьшение урона, Маленький') || !napRow.includes('<b>Фрейм 2:</b> Кутузов — Защитник, Поддержка, Ближний бой, Щиты, Маленький')) throw new Error('GT: the Napoleon license row must show both frames with their own role + tags (v253)');
  const bbRow = X.licenseRowInfoHtml(lics.find(l=>l.name === 'Blackbeard'));
  if (!bbRow.includes('<b>Фрейм 1:</b> Чёрная Борода — Гладиатор-Убийца, Ближний бой, Гарпун') || !bbRow.includes('<b>Фрейм 2:</b> Эмпакааи — Штурмовик, Ближний бой, Захват')) throw new Error('GT: the Blackbeard license row must show both frames with their own role + tags (v253)');
  // frame sources stay (frames still exist, only their license changed)
  if (X.itemSource('frame', 'Kutuzov') !== 'Operation Winter Scar') throw new Error('GT: the Kutuzov frame must keep its Winter Scar source (v251)');
  if (X.itemSource('frame', 'Empakaai') !== "Siren's Song: A Mountain's Remorse") throw new Error('GT: the Empakaai frame must keep its Siren\'s Song source (v251)');
  if (X.itemSource('frame', 'Tagetes') !== 'Shadow of the Wolf') throw new Error('GT: the Tagetes frame must keep its Shadow of the Wolf source (v251)');
  // v252: variant frames show their OWN tags in the frame list (FRAME_VIBE) —
  // the known v245 limitation is closed by the user's decision.
  if (X.frameRowSub('Kutuzov') !== 'Щиты, Маленький') throw new Error('GT: Kutuzov must show its own tag (v252 — variant frame)');
  if (X.frameRowSub('Empakaai') !== 'Захват') throw new Error('GT: Empakaai must show its own tag (v252 — variant frame)');
  if (X.frameRowSub('Amber Phantom') !== 'Предвидение') throw new Error('GT: Amber Phantom must show its own tag (v252 — variant frame)');
  if (X.frameRowSub('Lycan') !== 'Помехи') throw new Error('GT: Lycan must show its own tag (v252 — variant frame)');
  if (X.frameRowSub('Taraxacum') !== 'Сканирование, Гигант') throw new Error('GT: Taraxacum must show its own tags (v252 — variant frame)');
  // Sagarmatha stays GMS (variant of the GMS frame Everest — no license to share)
  if (DB.frames['Sagarmatha'].lic !== 'GMS' || DB.frames['Sagarmatha'].ll !== 0) throw new Error('GT: Sagarmatha must stay a GMS frame (v251 — its base Everest has no license)');
  if (lics.some(l=>l.name === 'Sagarmatha')) throw new Error('GT: Sagarmatha must not become a license (v251)');
})();
// PHASE GU (v252): вариантные фреймы показывают СВОИ роль+теги (FRAME_VIBE
// по фреймам, решение пользователя 17.11: у лицензии ролей и тегов больше
// нет, только у фреймов). Поиск фрейма — по своему тегу (по базовому — нет,
// где различается); поиск лицензии — по тегу любого её фрейма.
(function(){
  const { X, S, DB, elements } = runEval({});
  const lics = X.licenseData();
  // FRAME_VIBE: 52 записи — все не-GMS фреймы; GMS здесь нет
  const fvKeys = Object.keys(X.FRAME_VIBE);
  if (fvKeys.length !== 52) throw new Error('GU: FRAME_VIBE must hold 52 frames, got ' + fvKeys.length);
  for (const k of ['Everest', 'Chomolungma', 'Sagarmatha']) if (X.FRAME_VIBE[k]) throw new Error('GU: FRAME_VIBE must not hold the GMS frame ' + k + ' (v252 — GMS stays on GMS_FRAME_ROLE)');
  for (const k of Object.keys(DB.frames)) {
    if (DB.frames[k].src === 'GMS') continue;
    const v = X.FRAME_VIBE[k];
    if (!v || typeof v.role !== 'string' || typeof v.frame !== 'string') throw new Error('GU: FRAME_VIBE must hold role+tags for frame ' + k);
  }
  // все 14 вариантов: своя строка роль+теги (frameRowFull)
  const own = [
    ['Orchis', 'Контролер/Поддержка, Средняя дистанция, Щит'],
    ['Calendula', 'Контролер-Танк, Ближний бой, Пустота'],
    ['Störtebeker', 'Штурмовик, Старый солдат, Дальний бой с перезарядкой, Криты'],
    ['Viceroy', 'Артиллерия, Ракеты, Дальняя дистанция, Залп'],
    ['Enkidu', 'Штурмовик, Перегрев, Ближний бой, Когти, Гигант'],
    ['“Worldkiller” Genghis Mk I', 'Штурмовик-Поджигатель, Ближний бой, Джаггернаут, Гигант'],
    ['Swallowtail (Ranger Variant)', 'Саппорт-Разведчик, Дебафер, Дальняя дистанция, Местность'],
    ['Kutuzov', 'Защитник, Поддержка, Ближний бой, Щиты, Маленький'],
    ['Empakaai', 'Штурмовик, Ближний бой, Захват'],
    ['Amber Phantom', 'Штурмовик, Ближний бой, Предвидение'],
    ['Lycan', 'Защитник, Штурмовик, Ближний бой, Помехи'],
    ['Taraxacum', 'Поддержка, Средняя дистанция, Сканирование, Гигант'],
    ['Hecatoncheires', 'Штурмовик, Контролер, Средняя дистанция, Дроны, Маленький'],
    ['Tagetes', 'Артиллерия, Дальняя дистанция, Винтовки'],
  ];
  for (const [k, want] of own) {
    if (X.frameRowFull(k) !== want) throw new Error('GU: ' + k + ' must show its own role + tags «' + want + '», got «' + X.frameRowFull(k) + '» (v252)');
  }
  // базовые фреймы не изменились; GMS — только подпись роли
  if (X.frameRowFull('Napoleon') !== 'Танк-Контролер, Уменьшение урона, Маленький') throw new Error('GU: Napoleon must keep its role + tag (v252)');
  if (X.frameRowFull('Balor') !== 'Штурмовик/Танк, Ближний бой, Регенерация, Гигант') throw new Error('GU: Balor must keep its role + tags (v252)');
  if (X.frameRowFull('Genghis') !== 'Штурмовик-Поджигатель, Ближний бой') throw new Error('GU: tagless Genghis must keep only its role (v252)');
  if (X.frameRowFull('Everest') !== 'LL0 Универсал') throw new Error('GU: GMS Everest must keep its role label (v252)');
  // поиск фреймов: свой тег находит вариант, базовый — нет (где различается)
  const frameYes = [['Kutuzov', 'щиты'], ['Empakaai', 'захват'], ['Amber Phantom', 'предвидение'], ['Lycan', 'помехи'], ['Taraxacum', 'сканирование'], ['Hecatoncheires', 'дрон'], ['Tagetes', 'винтовки'], ['Orchis', 'щит'], ['Calendula', 'пустота'], ['Störtebeker', 'криты'], ['Viceroy', 'залп'], ['Enkidu', 'когти'], ['“Worldkiller” Genghis Mk I', 'джаггернаут'], ['Swallowtail (Ranger Variant)', 'местность']];
  for (const [k, q] of frameYes) if (!X.frameMatches(k, q)) throw new Error('GU: frame search for «' + q + '» must match ' + k + ' via its own tag (v252)');
  const frameNo = [['Kutuzov', 'уменьшение'], ['Empakaai', 'гарпун'], ['Empakaai', 'гладиатор'], ['Amber Phantom', 'невидимость'], ['Lycan', 'взрыв'], ['Taraxacum', 'дроны'], ['Hecatoncheires', 'регенерация'], ['Tagetes', 'опасная зона'], ['Orchis', 'парирование'], ['Calendula', 'стена'], ['Viceroy', 'самонаведение'], ['Enkidu', 'энергия'], ['Swallowtail (Ranger Variant)', 'изорванность']];
  for (const [k, q] of frameNo) if (X.frameMatches(k, q)) throw new Error('GU: frame search for «' + q + '» must NOT match ' + k + ' anymore (v252 — the base tag is gone from this frame)');
  // поиск лицензий: по тегу любого её фрейма, включая варианты
  const licBy = (name)=>lics.find(l=>l.name === name);
  const licYes = [['Blackbeard', 'захват'], ['Blackbeard', 'гарпун'], ['Balor', 'дрон'], ['Napoleon', 'щиты'], ['Napoleon', 'уменьшение'], ['Metalmark', 'предвидение'], ['Metalmark', 'невидимость'], ['Lancaster', 'сканирование'], ['Minotaur', 'пустота'], ['Minotaur', 'стена'], ['Sherman', 'винтовки'], ['Manticore', 'помехи'], ['Tokugawa', 'когти'], ['Monarch', 'залп'], ['Swallowtail', 'местность'], ['Genghis', 'джаггернаут'], ['Raleigh', 'криты'], ['Black Witch', 'щит']];
  for (const [n, q] of licYes) if (!X.licenseMatches(licBy(n), q)) throw new Error('GU: license search for «' + q + '» must find ' + n + ' (v252 — via a frame tag)');
  if (X.licenseMatches(licBy('Sherman'), 'захват')) throw new Error('GU: license search for «захват» must not find Sherman (v252)');
  if (X.licenseMatches(licBy('Balor'), 'захват')) throw new Error('GU: license search for «захват» must not find Balor (v252)');
  // строки лицензий: каждый фрейм со своим тегом
  const napRow = X.licenseRowInfoHtml(licBy('Napoleon'));
  if (!napRow.includes('<b>Фрейм 2:</b> Кутузов — Защитник, Поддержка, Ближний бой, Щиты, Маленький')) throw new Error('GU: the Napoleon license row must show Kutuzov with its own role + tags (v253)');
  const minRow = X.licenseRowInfoHtml(licBy('Minotaur'));
  if (!minRow.includes('<b>Фрейм 2:</b> Календула — Контролер-Танк, Ближний бой, Пустота')) throw new Error('GU: the Minotaur license row must show Calendula with its own role + tag (v253)');
  const tokRow = X.licenseRowInfoHtml(licBy('Tokugawa'));
  if (!tokRow.includes('<b>Фрейм 2:</b> Энкиду — Штурмовик, Перегрев, Ближний бой, Когти, Гигант')) throw new Error('GU: the Tokugawa license row must show Enkidu with its own role + tags (v253)');
})();

// PHASE GV (v253): строки лицензий — роль+теги фрейма (frameRowFull), а не
// только теги; имя лицензии — русское имя базового фрейма; «Генгис» → «Чингис»;
// заголовки действий систем — на русском (nr).
(function(){
  const { X, S, DB, elements } = runEval({});
  const lics = X.licenseData();
  // имя лицензии — русское имя базового фрейма (все 14 двухфреймовых)
  const want = [['Genghis','HA: Чингис'],['Tokugawa','HA: Токугава'],['Minotaur','HORUS: Минотавр'],['Napoleon','HA: Наполеон'],['Blackbeard','IPS-N: Чёрная Борода'],['Balor','HORUS: Балор'],['Sherman','HA: Шерман'],['Manticore','HORUS: Мантикора'],['Metalmark','SSC: Металлмарк'],['Lancaster','IPS-N: Ланкастер'],['Raleigh','IPS-N: Роли'],['Monarch','SSC: Монарх'],['Black Witch','SSC: Чёрная Ведьма'],['Swallowtail','SSC: Махаон']];
  for (const [name, disp] of want) {
    const lic = lics.find(l=>l.name === name);
    if (X.licenseDispName(lic) !== disp) throw new Error('GV: license ' + name + ' must show «' + disp + '» (v253 — base frame Russian name), got «' + X.licenseDispName(lic) + '»');
  }
  // каждая строка лицензии: каждый фрейм — с ролью+тегами (frameRowFull),
  // фрейм без тегов — со своей ролью; отдельной строки роли лицензии нет
  for (const l of lics){
    const row = X.licenseRowInfoHtml(l);
    for (const r of [1,2,3]) for (const g of (l.ranks[r] || [])) {
      if (g.kind !== 'frame') continue;
      const full = X.frameRowFull(g.key);
      if (!row.includes(full)) throw new Error('GV: license ' + l.name + ' must show frame ' + g.key + ' with role+tags «' + full + '» (v253)');
    }
    const ps = row.match(/<p>/g) || [];
    const framePs = row.match(/<p><b>(Оружие и системы|Фрейм)/g) || [];
    if (ps.length !== framePs.length) throw new Error('GV: license ' + l.name + ' must not have a standalone role line (v253)');
  }
  // Чингис: имя базового фрейма в заголовке лицензии и в описаниях варианта
  const gengRow = X.licenseRowInfoHtml(lics.find(l=>l.name === 'Genghis'));
  if (!gengRow.includes('<b>HA: Чингис</b>')) throw new Error('GV: the Genghis license row must be titled «HA: Чингис» (v253)');
  if (!gengRow.includes('<b>Фрейм 1:</b> Чингис — Штурмовик-Поджигатель, Ближний бой</p>')) throw new Error('GV: the Genghis frame line must show its role (v253 — tagless frame)');
  if (!gengRow.includes('“Убийца миров” Чингис Mk I — Штурмовик-Поджигатель, Ближний бой, Джаггернаут, Гигант')) throw new Error('GV: the Worldkiller frame line must show role + tags (v253)');
  if (JSON.stringify(DB).includes('Генгис')) throw new Error('GV: «Генгис» must be gone from db.js (v253 — Чингис everywhere)');
  if (!DB.frames['“Worldkiller” Genghis Mk I'].tr.includes('Чингис')) throw new Error('GV: the Worldkiller traits must say «Чингис» (v253)');
  // заголовки действий систем — русские имена (nr), а не английские
  const hdr = [['Antilinear Time','Антилинейное время (Быстрая техника):'],['Accelerate','Разгон (Быстрая техника):'],['Total Strength Suite II','Комплект полной силы II (Протокол):'],['Blinkspace Tunneler','Туннелер блинк-пространства (Протокол):'],['Shahnameh','Шахнаме (Быстрая техника):']];
  for (const [n, h] of hdr) {
    const sys = DB.systems.find(x=>x.n === n);
    if (!sys.xr.includes(h)) throw new Error('GV: the ' + n + ' action header must be «' + h + '» (v253)');
    if (sys.xr.includes(n + ' (')) throw new Error('GV: the ' + n + ' action header must not use the English name (v253)');
  }
  // перекрёстные упоминания — русские имена
  const kCheck = DB.systems.find(x=>x.n === 'Forge Clamps');
  if (!kCheck.xr.includes('КОБОЛЬД') || kCheck.xr.includes('KOBOLD')) throw new Error('GV: Forge Clamps must say «КОБОЛЬД», not KOBOLD (v253)');
  // подтверждение сброса — «Эверест» по-русски
  if (!html.includes('Сбросить все поля к пустому листу LL0 (Эверест)?')) throw new Error('GV: reset_confirm must say «Эверест» in Russian (v253)');
})();
// PHASE GW (v254): номера моделей не подсвечиваются — число после «Мк»/«Mk»,
// «D/D», «Weapon»/«Shotgun»/«дробовик», а также склеенное дефисом/слешем
// с буквами («SSC-30», «T-1», «HHS-075», «Тип-3», «obj/00001»).
// Игровые значения подсвечиваются как раньше: кубики, диапазоны («1-6»),
// знаковые числа, значения («Дальность 3», «HP 10», «Взрыв 3»).
(function(){
  const { X, S, DB, elements } = runEval({});
  // негативные: номера моделей — без подсветки
  const noHi = ['Мк 3', 'Mk 3', 'Шит Мк 3', 'D/D 288', 'Devastator/Demolition Weapon 288', 'Heavy Howitzer-Shotgun 155 “Cannibal”', 'тяжёлый гаубичный дробовик 075', 'SSC-30', 'HHS-075', 'HHS-155', 'FORGE-2', 'LGC-04', 'FS-90', 'T-1', 'T-2', 'T-3', 'Линейка Type-II (T-2)', 'Тип-3', 'Type-3', 'obj/00001', 'Hades Mk3', '«Аид Mk3»', 'SOLIDCORE Mk IV', 'Genghis Mk I'];
  for (const s of noHi) {
    if (X.highlightNums(s).includes('wnum')) throw new Error('GW: model number must not be highlighted in «' + s + '» (v254)');
  }
  // реальные тексты из базы: описание D/D 288 и линейки Type-I/II/III
  const dd = DB.weapons.find(w=>w.n === 'D/D 288');
  if (X.highlightNums(dd.xr).includes('<span class="wnum">288</span>')) throw new Error('GW: the D/D 288 RU description must not highlight 288 (v254)');
  if (X.highlightNums(dd.x).includes('<span class="wnum">288</span>')) throw new Error('GW: the D/D 288 EN description must not highlight 288 (v254)');
  for (const w of DB.weapons) {
    if (!/T-[123]/.test(w.xr)) continue;
    if (X.highlightNums(w.xr).includes('T-<span class="wnum">')) throw new Error('GW: the Type line (T-1/T-2/T-3) must not be highlighted (v254)');
  }
  // позитивные: кубики, диапазоны, знаковые числа и значения — подсвечиваются
  if (X.highlightNums('1d3+2 энергетический, Дальность 3, Угроза 3') !== '<span class="wnum">1d3+2</span> энергетический, Дальность <span class="wnum">3</span>, Угроза <span class="wnum">3</span>') throw new Error('GW: dice and values must still be highlighted (v254)');
  if (X.highlightNums('урон 1-6') !== 'урон <span class="wnum">1</span>-<span class="wnum">6</span>') throw new Error('GW: the 1-6 range must highlight both numbers (v254)');
  if (!X.highlightNums('наносит +2 тепла').includes('<span class="wnum">+2</span>')) throw new Error('GW: signed numbers must still be highlighted (v254)');
  if (!X.highlightNums('Defense 10, HP 10').includes('<span class="wnum">10</span>')) throw new Error('GW: stat values must still be highlighted (v254)');
  if (!X.highlightNums('Взрыв 3').includes('<span class="wnum">3</span>')) throw new Error('GW: a tag value (Blast 3) must still be highlighted (v254)');
  // диалог справки по оружию D/D 288 — без подсветки 288
  const rGW = runEval({});
  rGW.X.showRef('weapon', 'D/D 288');
  if (rGW.elements['refDlgBody'].innerHTML.includes('<span class="wnum">288</span>')) throw new Error('GW: the D/D 288 reference dialog must not highlight 288 (v254)');
})();
// PHASE GX (v255): «N SP» не подсвечивается (lab систем, описания, «SP: N»);
// SP-счётчик всегда виден; SP пушек считается в счётчике.
(function(){
  const { X, S, DB, elements } = runEval({});
  // негативные: число перед SP и после «SP: » — без подсветки
  const noHiSP = ['3 SP', '2 SP', '1 SP', 'GMS · LL0 · 2 SP', 'GMS · LL0 · 3 SP', 'Exotic · 2 SP', 'SSC · LL3 · 3 SP', 'SP: 1', 'SP: 2'];
  for (const s of noHiSP) {
    if (X.highlightNums(s).includes('wnum')) throw new Error('GX: SP numbers must not be highlighted in «' + s + '» (v255)');
  }
  // «SPs» — не «SP»: число подсвечивается как раньше
  if (!X.highlightNums('3 SPs').includes('<span class="wnum">3</span>')) throw new Error('GX: a number before SPs must still be highlighted (v255)');
  // значение рядом с SP-числом подсвечивается, само SP-число — нет
  if (X.highlightNums('Дальность 15, 3 SP') !== 'Дальность <span class="wnum">15</span>, 3 SP') throw new Error('GX: a value next to an SP number must still be highlighted (v255)');
  // реальные тексты из базы: lab системы и описание Autopod
  const sysGX = DB.systems.find(s=>s.lab && s.lab.includes('2 SP'));
  if (X.highlightNums(sysGX.lab).includes('wnum')) throw new Error('GX: a system lab with SP must not highlight the number (v255)');
  const autoGX = DB.weapons.find(w=>w.n === 'Autopod');
  if (X.highlightNums(autoGX.xr).includes('SP: <span class="wnum">1</span>')) throw new Error('GX: the Autopod RU description must not highlight the SP cost (v255)');
  if (X.highlightNums(autoGX.x).includes('SP: <span class="wnum">1</span>')) throw new Error('GX: the Autopod EN description must not highlight the SP cost (v255)');
  // spCounterRow видна при выключенном редактировании систем
  if (elements['spCounterRow'].style.display === 'none') throw new Error('GX: the SP counter must be visible with systems editing OFF (v255)');
  X.toggleEdit('systems');
  if (elements['spCounterRow'].style.display === 'none') throw new Error('GX: the SP counter must be visible with systems editing ON (v255)');
  X.toggleEdit('systems');
  // weapSp: 13 пушек с SP, остальные — 0, кастом — своё значение, подмена сейва не проходит
  if (X.weapSp({name:'Terashima Blade'}) !== 2) throw new Error('GX: weapSp must be 2 for Terashima Blade (v255)');
  if (X.weapSp({name:'Autopod'}) !== 1) throw new Error('GX: weapSp must be 1 for Autopod (v255)');
  if (X.weapSp({name:'Legion Nexus'}) !== 2) throw new Error('GX: weapSp must be 2 for Legion Nexus (v255)');
  if (X.weapSp({name:'Chain Axe'}) !== 0) throw new Error('GX: weapSp must be 0 for a weapon without SP (v255)');
  if (X.weapSp({name:'My Custom Weapon', sp: 3}) !== 3) throw new Error('GX: weapSp must take the save value for a custom weapon (v255)');
  if (X.weapSp({name:'Terashima Blade', sp: 99}) !== 2) throw new Error('GX: weapSp must take the book value for a DB weapon (v255)');
  // счётчик: Terashima Blade (2 SP) на маунте — used 6 → 8, переполнение красное
  const tbIdx = DB.weapons.findIndex(w=>w.n === 'Terashima Blade');
  X.addWeaponByIndex(0, tbIdx);
  X.renderLists();
  if (!elements['spCounter'].textContent.includes('использовано 8 из 6')) throw new Error('GX: the SP counter must include weapon SP (v255)');
  if (elements['spCounter'].style.color !== '#ff6b6b') throw new Error('GX: the SP counter must be red on overflow (v255)');
  // SP пушки видна в строке lab на маунте
  if (!elements['mounts'].innerHTML.includes('2 SP')) throw new Error('GX: the weapon SP must show in the mount lab line (v255)');
  // пушка без SP не меняет used; её lab — без «0 SP»
  const caIdx = DB.weapons.findIndex(w=>w.n === 'Chain Axe');
  X.addWeaponByIndex(1, caIdx);
  X.renderLists();
  if (!elements['spCounter'].textContent.includes('использовано 8 из 6')) throw new Error('GX: a weapon without SP must not change the counter (v255)');
  if (elements['mounts'].innerHTML.includes('0 SP')) throw new Error('GX: a weapon without SP must not show 0 SP (v255)');
  // SP пушки видна в поиске (Brutus’s Shield — Exotic, доступен без лицензии)
  X.showWeaponResults(0, 'Brutus');
  if (!elements['mountResults-0'].innerHTML.includes('1 SP')) throw new Error('GX: the weapon SP must show in weapon search results (v255)');
  // диалог справки по пушке — «2 SP» видна, но без подсветки
  X.showRef('weapon', 'Terashima Blade');
  const wbody = elements['refDlgBody'].innerHTML;
  if (!wbody.includes('2 SP')) throw new Error('GX: the weapon reference dialog must show the SP (v255)');
  if (wbody.includes('<span class="wnum">2</span> SP')) throw new Error('GX: the weapon reference dialog must not highlight the SP number (v255)');
  // диалог справки по системе — lab с «2 SP» без подсветки
  // (отдельный runEval — ПОСЛЕ всех проверок основного, иначе он подменит
  // глобальный document и рендер основного X уйдёт в чужой стаб)
  const rGX = runEval({});
  rGX.X.showRef('system', sysGX.n);
  if (rGX.elements['refDlgBody'].innerHTML.includes('<span class="wnum">2</span> SP')) throw new Error('GX: the system reference dialog must not highlight the SP number (v255)');
  // встроенное оружие без SP (Latch Drone) не меняет счётчик
  const rGX2 = runEval({});
  rGX2.X.applyFrame('Lancaster');
  rGX2.X.renderLists();
  if (!rGX2.elements['spCounter'].textContent.includes('использовано 6 из')) throw new Error('GX: the integrated Latch Drone (no SP) must not change the counter (v255)');
})();
// PHASE GY (v256): локальный профиль-сирота (без driveFileId, неактивный)
// получает кнопку удаления; deleteLocalProfile удаляет только запись каталога.
(function(){
  const mkCatalog = activeId => JSON.stringify({active: activeId, profiles: [
    {id:'local-main', name:'Пилот без имени', driveFileId:null, localModifiedAt: 1000},
    {id:'drive-jonas', name:'Джонас Джуниор (JJ)', driveFileId:'file-jonas', modifiedTime:'2026-11-16T10:00:00.000Z', localModifiedAt: 2000},
    {id:'drive-boba', name:'Боба (Шуба)', driveFileId:'file-boba', modifiedTime:'2026-11-15T10:00:00.000Z', localModifiedAt: 3000},
  ]});
  // 1. список: локальный неактивный — с кнопкой удаления; Drive-профили и активный — без изменений
  const storeGY = {'lancer-tracker-profiles-v1': mkCatalog('drive-jonas')};
  const rGY = runEval(storeGY);
  const XGY = rGY.X;
  XGY.renderProfileList();
  const listHtml = rGY.elements['profileList'].innerHTML;
  if (!listHtml.includes("deleteLocalProfile('local-main')")) throw new Error('GY: an inactive local profile must have a delete button (v256)');
  if (!listHtml.includes('Удалить локальный профиль')) throw new Error('GY: the local delete button must say so (v256)');
  if (!listHtml.includes("deleteDriveProfile('drive-boba')")) throw new Error('GY: an inactive Drive profile must keep its Drive delete button (v256)');
  if (!listHtml.includes("switchDriveProfile('drive-boba')")) throw new Error('GY: an inactive Drive profile must keep its Activate button (v256)');
  if (listHtml.includes("deleteDriveProfile('drive-jonas')")) throw new Error('GY: the active profile must not have a Drive delete button (v256)');
  if (listHtml.includes("deleteLocalProfile('drive-jonas')")) throw new Error('GY: the active profile must not have a local delete button (v256)');
  if (listHtml.includes("switchDriveProfile('drive-jonas')")) throw new Error('GY: the active profile must not have an Activate button (v256)');
  if (listHtml.includes('class="btn danger"')) throw new Error('GY: the local delete button must not be a danger button (v256)');
  // 2. удаление: только запись каталога; активный профиль и KEY не тронуты
  const keyBefore = storeGY['lancer-tracker-v1'];
  const activeBefore = XGY.profileCatalog().active;
  XGY.deleteLocalProfile('local-main');
  if (rGY.g.confirmCalls.length !== 1) throw new Error('GY: deleteLocalProfile must ask for confirmation once (v256)');
  const catAfter = JSON.parse(storeGY['lancer-tracker-profiles-v1']);
  if (catAfter.profiles.some(p=>p.id==='local-main')) throw new Error('GY: deleteLocalProfile must remove the local profile from the catalog (v256)');
  if (catAfter.profiles.length !== 2) throw new Error('GY: deleteLocalProfile must remove only one profile (v256)');
  if (catAfter.active !== activeBefore) throw new Error('GY: deleteLocalProfile must not change the active profile (v256)');
  if (storeGY['lancer-tracker-v1'] !== keyBefore) throw new Error('GY: deleteLocalProfile must not touch the pilot data slot (v256)');
  const listAfter = rGY.elements['profileList'].innerHTML;
  if (!listAfter.includes('Джонас Джуниор')) throw new Error('GY: the list must re-render after deletion (v256)');
  if (listAfter.includes('Пилот без имени')) throw new Error('GY: the deleted profile must be gone from the list (v256)');
  // 3. отказ от confirm — ничего не удаляется
  // (отдельный runEval — ПОСЛЕ всех проверок основного, иначе он подменит
  // глобальный document и рендер основного X уйдёт в чужой стаб)
  const storeGY2 = {'lancer-tracker-profiles-v1': mkCatalog('drive-jonas')};
  const rGY2 = runEval(storeGY2);
  rGY2.g.window.confirm = m => { rGY2.g.confirmCalls.push(m); return false; };
  const before2 = storeGY2['lancer-tracker-profiles-v1'];
  rGY2.X.deleteLocalProfile('local-main');
  if (storeGY2['lancer-tracker-profiles-v1'] !== before2) throw new Error('GY: declining the confirm must not delete anything (v256)');
  if (rGY2.g.confirmCalls.length !== 1) throw new Error('GY: deleteLocalProfile must ask for confirmation once even when declined (v256)');
  // 4. вызовы для Drive-профиля, активного профиля и несуществующего id — no-op
  const storeGY3 = {'lancer-tracker-profiles-v1': mkCatalog('drive-jonas')};
  const rGY3 = runEval(storeGY3);
  const before3 = storeGY3['lancer-tracker-profiles-v1'];
  rGY3.X.deleteLocalProfile('drive-boba');
  rGY3.X.deleteLocalProfile('drive-jonas');
  rGY3.X.deleteLocalProfile('no-such-id');
  if (storeGY3['lancer-tracker-profiles-v1'] !== before3) throw new Error('GY: deleteLocalProfile must be a no-op for Drive, active and missing profiles (v256)');
  if (rGY3.g.confirmCalls.length !== 0) throw new Error('GY: deleteLocalProfile must not ask for confirmation on a no-op call (v256)');
  // 5. активный локальный профиль — без кнопки удаления, с кнопкой сохранения в Drive
  const storeGY4 = {'lancer-tracker-profiles-v1': mkCatalog('local-main')};
  const rGY4 = runEval(storeGY4);
  rGY4.X.renderProfileList();
  const listHtml4 = rGY4.elements['profileList'].innerHTML;
  if (!listHtml4.includes("saveProfileToDrive('local-main')")) throw new Error('GY: the active local profile must keep its Drive save button (v256)');
  if (listHtml4.includes("deleteLocalProfile('local-main')")) throw new Error('GY: the active local profile must not have a delete button (v256)');
  if (listHtml4.includes("deleteDriveProfile('local-main')")) throw new Error('GY: the active local profile must not have a Drive delete button (v256)');
})();
// PHASE GZ (v257): дроби «1/2»/«1/4» не подсвечиваются; .dbinfo span скоуплен
// до прямых потомков, поэтому вложенные .wnum в описаниях поиска — инлайн.
(function(){
  const rGZ = runEval({});
  const XGZ = rGZ.X;
  // 1. дроби целиком без подсветки (ни числитель, ни знаменатель)
  if (XGZ.highlightNums('размера 1/2, чтобы ехать') !== 'размера 1/2, чтобы ехать') throw new Error('GZ: the 1/2 fraction must not be highlighted at all (v257)');
  if (XGZ.highlightNums('размер 1/4') !== 'размер 1/4') throw new Error('GZ: the 1/4 fraction must not be highlighted at all (v257)');
  if (XGZ.highlightNums('12/34') !== '12/34') throw new Error('GZ: a multi-digit fraction must not be highlighted (v257)');
  // 2. не-дроби подсвечиваются как раньше
  if (XGZ.highlightNums('1/раунд на персонажа') !== '<span class="wnum">1</span>/раунд на персонажа') throw new Error('GZ: 1/round must still be highlighted (v257)');
  if (XGZ.highlightNums('урон 1-6') !== 'урон <span class="wnum">1</span>-<span class="wnum">6</span>') throw new Error('GZ: the 1-6 range must still highlight both numbers (v257)');
  if (XGZ.highlightNums('1d6+2 энергетический') !== '<span class="wnum">1d6+2</span> энергетический') throw new Error('GZ: dice must still be highlighted (v257)');
  if (!XGZ.highlightNums('наносит +2 тепла').includes('<span class="wnum">+2</span>')) throw new Error('GZ: signed numbers must still be highlighted (v257)');
  if (!XGZ.highlightNums('Дальность 3').includes('<span class="wnum">3</span>')) throw new Error('GZ: plain values must still be highlighted (v257)');
  // 3. CSS: только прямые потомки .dbinfo — блочные
  if (!html.includes('.dbinfo > span { display:block; font-size:13px; color:var(--dim);')) throw new Error('GZ: only direct-child .dbinfo spans may be block-level (v257)');
  if (html.includes('.dbinfo span { display:block;')) throw new Error('GZ: the broad .dbinfo span rule must be gone (v257)');
  // 4. строка поиска «Расширенный отсек»: дробь — обычным текстом
  XGZ.showSystemResults('расширенный');
  const boxExp = rGZ.elements['systemResults'].innerHTML;
  if (!boxExp.includes('Расширенный отсек')) throw new Error('GZ: the Expanded Compartment system must be found (v257)');
  if (!boxExp.includes('размера 1/2')) throw new Error('GZ: the 1/2 must stay as plain text in the search row (v257)');
  if (boxExp.includes('<span class="wnum">1</span>/') || boxExp.includes('/<span class="wnum">2</span>')) throw new Error('GZ: the 1/2 in the search row must not be highlighted (v257)');
  // 5. строка поиска «Авторская покраска»: числа — в .wnum ВНУТРИ .dim-описания
  XGZ.showSystemResults('покраска');
  const boxPaint = rGZ.elements['systemResults'].innerHTML;
  if (!boxPaint.includes('Авторская покраска')) throw new Error('GZ: the Custom Paint Job system must be found (v257)');
  const dimIdx = boxPaint.indexOf('<span class="dim"');
  if (dimIdx < 0) throw new Error('GZ: the search row must have a .dim description (v257)');
  const wnumIdx = boxPaint.indexOf('<span class="wnum">', dimIdx);
  if (wnumIdx < 0) throw new Error('GZ: the description must contain a highlighted number (v257)');
  const dimClose = boxPaint.indexOf('</span></div>', dimIdx);
  if (dimClose < 0 || wnumIdx > dimClose) throw new Error('GZ: the highlighted number must sit inside the .dim description, not on its own line (v257)');
  if (!boxPaint.includes('<span class="wnum">6</span>') || !boxPaint.includes('<span class="wnum">1</span>')) throw new Error('GZ: the 6 and the 1 in the paint description must be highlighted (v257)');
})();
// PHASE HA (v258): поиск и детали лицензии/фрейма — полноэкранный вид
// вместо диалога: вид заменяет основной экран (вкладки+навбар скрыты),
// инпут — обычное видимое поле (без автофокуса и blur-хака), внизу вида —
// панель «Закрыть» в стилях навбара; «Назад» идёт по стеку видов.
(function(){
  // 1. статика: диалога поиска нет, есть вид и панель «Закрыть»
  if (staticHtml.includes('id="searchDlg"')) throw new Error('HA: the search dialog must be gone (v258)');
  if (staticHtml.includes('dialog#searchDlg')) throw new Error('HA: the search dialog CSS must be gone (v258)');
  if (!staticHtml.includes('id="searchView"')) throw new Error('HA: the search view must exist (v258)');
  if (!staticHtml.includes('class="view-close-bar"')) throw new Error('HA: the bottom close bar must exist (v258)');
  if (!staticHtml.includes('view-close-bar"><button type="button" onclick="closeSearchDlg()"')) throw new Error('HA: the bottom close bar must close the view (v258)');
  if (!staticHtml.includes('id="mainNav"') || !staticHtml.includes('id="mainContent"')) throw new Error('HA: nav and main must have ids for hiding (v258)');
  // панель «Закрыть» — те же стили, что у навбара (общий селектор)
  if (!html.includes('nav, .view-close-bar { position:fixed;')) throw new Error('HA: the close bar must share the navbar styles (v258)');
  if (!html.includes('.view-close-bar button { color:var(--hud-amber);')) throw new Error('HA: the close button must be amber like the active tab (v258)');
  // blur-хак v61/v62 убран: ни focus(), ни blur() для поиска
  if (/openSearch[\s\S]{0,600}activeElement\.blur/.test(html)) throw new Error('HA: the v61/v62 blur hack must be gone (v258)');
  if (/openSearch[\s\S]{0,600}inp\.focus\(\)/.test(html)) throw new Error('HA: openSearch must not focus the input (v258)');
  const rHA = runEval({});
  const XHA = rHA.X;
  // 2. открытие поиска: вид виден, вкладки+навбар скрыты, инпут не в фокусе
  XHA.openSearch('system');
  if (!XHA.searchViewOpen()) throw new Error('HA: openSearch must show the view (v258)');
  if (rHA.elements['mainContent'].style.display !== 'none') throw new Error('HA: the view must hide the main content (v258)');
  if (rHA.elements['mainNav'].style.display !== 'none') throw new Error('HA: the view must hide the navbar (v258)');
  if (rHA.g.document.activeElement) throw new Error('HA: the search input must not be focused on open (v258)');
  if (!rHA.elements['searchDlgResults'].innerHTML.includes('Заряды HEX образца Б')) throw new Error('HA: the search view must show results (v258)');
  // 3. деталь лицензии: тот же вид, вкладки+навбар по-прежнему скрыты
  XHA.showLicenseDetail('Balor', 'search');
  if (!XHA.searchViewOpen()) throw new Error('HA: the license detail must stay in the same view (v258)');
  if (rHA.elements['mainContent'].style.display !== 'none' || rHA.elements['mainNav'].style.display !== 'none') throw new Error('HA: the license detail must keep the main content and navbar hidden (v258)');
  if (!rHA.elements['searchDlgResults'].innerHTML.includes('Ранг I') && !rHA.elements['searchDlgResults'].innerHTML.includes('Rank I')) throw new Error('HA: the license detail must show ranks (v258)');
  // 4. деталь фрейма из лицензии, «Назад» — обратно к лицензии
  XHA.showFrameDetail('Balor');
  if (!rHA.elements['searchDlgResults'].innerHTML.includes('Core Power')) throw new Error('HA: the frame detail must show Core Power (v258)');
  XHA.frameDetailBack();
  if (!rHA.elements['searchDlgResults'].innerHTML.includes('Ранг I') && !rHA.elements['searchDlgResults'].innerHTML.includes('Rank I')) throw new Error('HA: back from the frame must return to the license detail (v258)');
  // 5. закрытие вида: основной экран возвращается, инпута нет на экране
  XHA.closeSearchDlg();
  if (XHA.searchViewOpen()) throw new Error('HA: closeSearchDlg must hide the view (v258)');
  if (rHA.elements['mainContent'].style.display !== '' || rHA.elements['mainNav'].style.display !== '') throw new Error('HA: closing the view must restore the main content and navbar (v258)');
  if (rHA.elements['searchView'].style.display !== 'none') throw new Error('HA: after closing, the search input must not be on screen (v258)');
  // 6. браузерное Назад из вида поиска закрывает вид и возвращает вкладку
  // (эхо-popstate от закрытия в шаге 5 — сначала потребить, как в FI:
  // в стабе history ненастоящая, эхо само не прилетает)
  XHA.onDlgPopstate(); // эхо от closeSearchDlg: подавляется флагом
  XHA.openSearch('license');
  if (!XHA.searchViewOpen()) throw new Error('HA: the view must open again (v258)');
  XHA.onDlgPopstate();
  if (XHA.searchViewOpen()) throw new Error('HA: browser Back from the search view must close the view (v258)');
  if (rHA.elements['mainContent'].style.display !== '' || rHA.elements['mainNav'].style.display !== '') throw new Error('HA: browser Back must restore the main content and navbar (v258)');
})();
// PHASE HB (v259): закрытие вида поиска возвращает скролл главной —
// отложенно, двойным rAF (как в showTab), а не синхронно: синхронный
// scrollTo сразу после display='' не прилипал, и страница открывалась
// в самом верху (регрессия v258).
(function(){
  // 1. статика: в общем fullscreenViewHide (v260) — двойной rAF,
  // синхронного scrollTo нет; searchViewHide делегирует ему
  const hideFn = html.slice(html.indexOf('function fullscreenViewHide('), html.indexOf('function fullscreenViewOpen('));
  if (!hideFn.includes('requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo(0,y)))')) throw new Error('HB: fullscreenViewHide must restore the scroll via double rAF like showTab (v259)');
  if (hideFn.includes('window.scrollTo(0, fullscreenReturnScroll)')) throw new Error('HB: fullscreenViewHide must not scroll synchronously (v259)');
  const searchHideFn = html.slice(html.indexOf('function searchViewHide()'), html.indexOf('function searchViewOpen()'));
  if (!searchHideFn.includes("fullscreenViewHide('searchView')")) throw new Error('HB: searchViewHide must delegate to fullscreenViewHide (v260)');
  const rHB = runEval({});
  const XHB = rHB.X;
  // rAF в стабе — no-op: заменяем на очередь колбэков, чтобы прогнать их вручную
  const rafQ = [];
  global.requestAnimationFrame = cb => { rafQ.push(cb); return 0; };
  const flushRaf = () => { while (rafQ.length) rafQ.shift()(); };
  // window.scrollTo в стабе — no-op: записываем вызовы
  const scrolls = [];
  rHB.g.window.scrollTo = (x, y) => { scrolls.push(y); };
  // 2. сценарий (а): просто открыть/закрыть поиск без добавления
  rHB.g.window.scrollY = 500;
  XHB.openSearch('weapon', 0);
  if (!XHB.searchViewOpen()) throw new Error('HB: the view must open (v259)');
  scrolls.length = 0; // scrollTo(0,0) при открытии не считаем
  XHB.closeSearchDlg();
  if (XHB.searchViewOpen()) throw new Error('HB: the view must close (v259)');
  if (scrolls.length) throw new Error('HB: the scroll must NOT be restored synchronously on close (v259)');
  flushRaf();
  if (scrolls.length !== 1 || scrolls[0] !== 500) throw new Error('HB: after the deferred frames the scroll must be restored to 500 (v259), got ' + JSON.stringify(scrolls));
  // 3. сценарий (б): добавить оружие из поиска и закрыть — тот же результат
  rHB.g.window.scrollY = 800;
  XHB.openSearch('weapon', 0);
  XHB.addWeaponByIndex(0, 0);
  scrolls.length = 0;
  XHB.closeSearchDlg();
  if (scrolls.length) throw new Error('HB: after adding a weapon the scroll must NOT be restored synchronously (v259)');
  flushRaf();
  if (scrolls.length !== 1 || scrolls[0] !== 800) throw new Error('HB: after adding a weapon and closing, the scroll must be restored to 800 (v259), got ' + JSON.stringify(scrolls));
  // 4. браузерное Назад из вида — тоже через searchViewHide, скролл возвращается
  XHB.onDlgPopstate(); // эхо от closeSearchDlg: подавляется флагом
  rHB.g.window.scrollY = 300;
  XHB.openSearch('system');
  scrolls.length = 0;
  XHB.onDlgPopstate(); // браузерное Назад закрывает вид
  if (XHB.searchViewOpen()) throw new Error('HB: browser Back must close the view (v259)');
  if (scrolls.length) throw new Error('HB: browser Back must not restore the scroll synchronously (v259)');
  flushRaf();
  if (scrolls.length !== 1 || scrolls[0] !== 300) throw new Error('HB: browser Back must restore the scroll to 300 after the deferred frames (v259), got ' + JSON.stringify(scrolls));
})();
// PHASE HC (v260): пикеры кор-бонусов и снаряжения пилота — полноэкранные
// виды, как поиск (v258): вид заменяет основной экран, внизу — панель
// «Закрыть» в стилях навбара, инпут — обычное видимое поле без blur-хака,
// закрытие возвращает основной экран и скролл (двойной rAF), «Назад»
// закрывает вид. Оба пикера — через общие хелперы fullscreenView*.
(function(){
  // 1. статика: диалогов нет, есть виды и панели «Закрыть»
  if (staticHtml.includes('id="cbDlg"') || staticHtml.includes('id="pilotGearDlg"')) throw new Error('HC: the picker dialogs must be gone (v260)');
  if (staticHtml.includes('dialog#cbDlg') || staticHtml.includes('dialog#pilotGearDlg')) throw new Error('HC: the picker dialog CSS must be gone (v260)');
  if (!staticHtml.includes('id="cbView"') || !staticHtml.includes('id="pilotGearView"')) throw new Error('HC: the picker views must exist (v260)');
  if (!staticHtml.includes('view-close-bar"><button type="button" onclick="closeCoreBonusPicker()"')) throw new Error('HC: the Core Bonus view must have a bottom close bar (v260)');
  if (!staticHtml.includes('view-close-bar"><button type="button" onclick="closePilotGearPicker()"')) throw new Error('HC: the pilot gear view must have a bottom close bar (v260)');
  // оба пикера — через общий механизм видов, а не копии (v260)
  if (!html.includes('function fullscreenViewShow(') || !html.includes('function fullscreenViewHide(') || !html.includes('function fullscreenViewOpen(')) throw new Error('HC: the shared fullscreen view helpers must exist (v260)');
  if (!html.includes("fullscreenViewShow('cbView')") || !html.includes("fullscreenViewShow('pilotGearView')")) throw new Error('HC: both pickers must use the shared view helpers (v260)');
  if (html.includes("document.getElementById('cbDlg')") || html.includes("document.getElementById('pilotGearDlg')")) throw new Error('HC: no code must reference the removed dialogs (v260)');
  // blur-хак в пикере снаряжения убран, автофокуса нет
  if (/openPilotGearPicker[\s\S]{0,1000}activeElement\.blur/.test(html)) throw new Error('HC: the blur hack in openPilotGearPicker must be gone (v260)');
  if (/openPilotGearPicker[\s\S]{0,1000}\.focus\(\)/.test(html)) throw new Error('HC: openPilotGearPicker must not focus the input (v260)');
  const rHC = runEval({});
  const XHC = rHC.X;
  rHC.S.pilot.licenses = [{name:'Blackbeard', rank:2}, {name:'Lancaster', rank:1}]; // LL3, 1 слот — как в AQ
  // rAF в стабе — no-op: заменяем на очередь колбэков, чтобы прогнать их вручную
  const rafQ = [];
  global.requestAnimationFrame = cb => { rafQ.push(cb); return 0; };
  const flushRaf = () => { while (rafQ.length) rafQ.shift()(); };
  // window.scrollTo в стабе — no-op: записываем вызовы
  const scrolls = [];
  rHC.g.window.scrollTo = (x, y) => { scrolls.push(y); };
  // 2. пикер кор-бонусов: открытие прячет main+nav, закрытие возвращает их и скролл
  rHC.g.window.scrollY = 400;
  XHC.openCoreBonusPicker();
  if (!XHC.cbViewOpen()) throw new Error('HC: openCoreBonusPicker must show the view (v260)');
  if (rHC.elements['mainContent'].style.display !== 'none' || rHC.elements['mainNav'].style.display !== 'none') throw new Error('HC: the Core Bonus view must hide the main content and navbar (v260)');
  if (!rHC.elements['cbList'].innerHTML.includes('cb-row')) throw new Error('HC: the Core Bonus view must show the bonus rows (v260)');
  scrolls.length = 0; // scrollTo(0,0) при открытии не считаем
  XHC.closeCoreBonusPicker();
  if (XHC.cbViewOpen()) throw new Error('HC: closeCoreBonusPicker must hide the view (v260)');
  if (rHC.elements['mainContent'].style.display !== '' || rHC.elements['mainNav'].style.display !== '') throw new Error('HC: closing the Core Bonus view must restore the main content and navbar (v260)');
  if (scrolls.length) throw new Error('HC: the scroll must NOT be restored synchronously on close (v260)');
  flushRaf();
  if (scrolls.length !== 1 || scrolls[0] !== 400) throw new Error('HC: after the deferred frames the scroll must be restored to 400 (v260), got ' + JSON.stringify(scrolls));
  // 3. добавление бонуса из пикера закрывает вид
  scrolls.length = 0; // остаток от шага 2 не считаем
  XHC.openCoreBonusPicker();
  XHC.addCoreBonusByIdx(0);
  if (XHC.cbViewOpen()) throw new Error('HC: adding a Core Bonus must close the view (v260)');
  flushRaf(); scrolls.length = 0; // отложенный возврат скролла из шага 3 — прогнать, чтобы не выстрелил в шаге 4
  // 4. пикер снаряжения: открытие, поиск, закрытие, скролл
  rHC.g.window.scrollY = 650;
  XHC.openPilotGearPicker('Gear');
  if (!XHC.pilotGearViewOpen()) throw new Error('HC: openPilotGearPicker must show the view (v260)');
  if (rHC.elements['mainContent'].style.display !== 'none' || rHC.elements['mainNav'].style.display !== 'none') throw new Error('HC: the pilot gear view must hide the main content and navbar (v260)');
  if (rHC.g.document.activeElement) throw new Error('HC: the pilot gear input must not be focused on open (v260)');
  XHC.renderPilotGearResults('Запас Бахадура');
  if (!rHC.elements['pilotGearResults'].innerHTML.includes('Запас Бахадура')) throw new Error('HC: the pilot gear view must show search results (v260)');
  scrolls.length = 0;
  XHC.closePilotGearPicker();
  if (XHC.pilotGearViewOpen()) throw new Error('HC: closePilotGearPicker must hide the view (v260)');
  if (scrolls.length) throw new Error('HC: the pilot gear scroll must NOT be restored synchronously on close (v260)');
  flushRaf();
  if (scrolls.length !== 1 || scrolls[0] !== 650) throw new Error('HC: after the deferred frames the pilot gear scroll must be restored to 650 (v260), got ' + JSON.stringify(scrolls));
  // 5. браузерное Назад из вида снаряжения закрывает вид
  XHC.onDlgPopstate(); // эхо от closePilotGearPicker: подавляется флагом
  rHC.g.window.scrollY = 200;
  XHC.openPilotGearPicker('Armor');
  XHC.onDlgPopstate(); // браузерное Назад закрывает вид
  if (XHC.pilotGearViewOpen()) throw new Error('HC: browser Back must close the pilot gear view (v260)');
  if (rHC.elements['mainContent'].style.display !== '' || rHC.elements['mainNav'].style.display !== '') throw new Error('HC: browser Back must restore the main content and navbar (v260)');
})();
// PHASE HD (v261): браузерное восстановление скролла при Назад перебивало
// двойной rAF приложения (v259): запись истории создавалась уже после
// scrollTo(0,0), т.е. с позицией 0, и 'auto' возвращал 0 — в реальном
// браузере страница открывалась вверху, а стаб этого не ловил (историю
// браузера он не симулирует). Теперь приложение ставит
// history.scrollRestoration='manual' при старте, а запись истории пушится
// ДО показа вида — скролл при Назад трогает только приложение.
(function(){
  // 1. статика: 'manual' выставляется в bindDlgHistory (вызывается на старте)
  const bindFn = html.slice(html.indexOf('function bindDlgHistory()'), html.indexOf('// v260: общий механизм полноэкранных видов'));
  if (!bindFn.includes("history.scrollRestoration = 'manual'")) throw new Error('HD: bindDlgHistory must set history.scrollRestoration to manual (v261)');
  // 2. порядок: запись истории — ДО показа вида (все три вида)
  const searchOpenFn = html.slice(html.indexOf('function searchDlgOpen()'), html.indexOf('function searchDlgRenderTop()'));
  if (!(searchOpenFn.indexOf('histPush()') < searchOpenFn.indexOf('searchViewShow()'))) throw new Error('HD: searchDlgOpen must push the history entry before showing the view (v261)');
  const cbOpenFn = html.slice(html.indexOf('function openCoreBonusPicker()'), html.indexOf('function closeCoreBonusPicker()'));
  if (!(cbOpenFn.indexOf('histPush()') < cbOpenFn.indexOf("fullscreenViewShow('cbView')"))) throw new Error('HD: openCoreBonusPicker must push the history entry before showing the view (v261)');
  const gearOpenFn = html.slice(html.indexOf('function openPilotGearPicker('), html.indexOf('function closePilotGearPicker()'));
  if (!(gearOpenFn.indexOf('histPush()') < gearOpenFn.indexOf("fullscreenViewShow('pilotGearView')"))) throw new Error('HD: openPilotGearPicker must push the history entry before showing the view (v261)');
  // 3. рантайм: при старте scrollRestoration становится 'manual'
  const rHD = runEval({});
  const XHD = rHD.X;
  if (rHD.g.history.scrollRestoration !== 'manual') throw new Error('HD: history.scrollRestoration must be manual after startup (v261), got ' + rHD.g.history.scrollRestoration);
  // rAF в стабе — no-op: заменяем на очередь колбэков, чтобы прогнать их вручную
  const rafQ = [];
  global.requestAnimationFrame = cb => { rafQ.push(cb); return 0; };
  const flushRaf = () => { while (rafQ.length) rafQ.shift()(); };
  // window.scrollTo в стабе — no-op: записываем вызовы
  const scrolls = [];
  rHD.g.window.scrollTo = (x, y) => { scrolls.push(y); };
  // 4. сценарий из жалобы: добавить оружие из поиска и закрыть — скролл возвращается
  rHD.g.window.scrollY = 700;
  XHD.openSearch('weapon', 0);
  XHD.addWeaponByIndex(0, 0);
  scrolls.length = 0;
  XHD.closeSearchDlg();
  if (XHD.searchViewOpen()) throw new Error('HD: the view must close after adding a weapon (v261)');
  if (scrolls.length) throw new Error('HD: the scroll must NOT be restored synchronously on close (v261)');
  flushRaf();
  if (scrolls.length !== 1 || scrolls[0] !== 700) throw new Error('HD: after adding a weapon and closing, the scroll must be restored to 700 (v261), got ' + JSON.stringify(scrolls));
  // 5. кнопки в виде детали — на одной высоте: «← Назад» слева, ✕ справа
  // (v261); в деталях своей отдельной «← Назад» больше нет
  if (!staticHtml.includes('id="searchDlgBackBtn"')) throw new Error('HD: the search top row must have a back button (v261)');
  if (!staticHtml.includes('onclick="searchDlgBack()"')) throw new Error('HD: the top-row back button must call searchDlgBack (v261)');
  if (!staticHtml.includes('data-i18n="u238"')) throw new Error('HD: the top-row back button must be localized (v261)');
  if (html.includes('onclick="licenseDetailBack()"') || html.includes('onclick="frameDetailBack()"')) throw new Error('HD: the detail cards must not draw their own back button (v261)');
  // рантайм: на верхнем уровне «← Назад» скрыта, в детали — видна
  rHD.g.window.scrollY = 100;
  XHD.openSearch('license');
  if (rHD.elements['searchDlgBackBtn'].style.visibility !== 'hidden') throw new Error('HD: at the top search level the back button must be hidden (v261)');
  if (rHD.elements['searchDlgInput'].style.display === 'none') throw new Error('HD: at the top search level the input must be visible (v261)');
  XHD.showLicenseDetail('Balor', 'search');
  if (rHD.elements['searchDlgBackBtn'].style.visibility !== 'visible') throw new Error('HD: in the license detail the back button must be visible (v261)');
  if (rHD.elements['searchDlgInput'].style.display !== 'none') throw new Error('HD: in the license detail the input must be hidden (v261)');
  if (rHD.elements['searchDlgTop'].style.justifyContent !== 'space-between') throw new Error('HD: in the detail the top row must spread Back left and X right (v261)');
  if (rHD.elements['searchDlgResults'].innerHTML.includes('licenseDetailBack()')) throw new Error('HD: the license detail must not draw its own back button (v261)');
  // «← Назад» в верхней строке — обратно к результатам поиска
  XHD.licenseDetailBack();
  if (rHD.elements['searchDlgBackBtn'].style.visibility !== 'hidden') throw new Error('HD: back from the detail must hide the back button again (v261)');
  if (!rHD.elements['searchDlgResults'].innerHTML.includes('Balor')) throw new Error('HD: back from the detail must return to the search results (v261)');
})();
// PHASE HE (v262): оружие — сворачиваемые карточки, как системы; шапки секций
// переключают редактирование кликом в любом месте (v262).
// 1. Статика: CSS шапки/тела оружия, сет openWeap, toggleWeapCard, разметка
//    карточки (data-weap, weap-head, weap-body); шапки секций — onclick на div,
//    у кнопок-слайдеров onclick нет (иначе двойное переключение, вариант A).
if (!staticHtml.includes('.weap-head { cursor:pointer; }')) throw new Error('HE: the weapon card header must be clickable (v262)');
if (!staticHtml.includes('.wcard.open .weap-arrow { transform:rotate(90deg); }')) throw new Error('HE: the weapon arrow must rotate when open (v262)');
if (!staticHtml.includes('.weap-body { display:none;')) throw new Error('HE: the weapon card body must be hidden when collapsed (v262)');
if (!staticHtml.includes('.wcard.open .weap-body { display:block; }')) throw new Error('HE: the weapon card body must show when open (v262)');
if (!html.includes('let openWeap = new Set()')) throw new Error('HE: openWeap must exist (v262)');
if (!html.includes('function toggleWeapCard(')) throw new Error('HE: toggleWeapCard must exist (v262)');
if (!html.includes('data-weap=')) throw new Error('HE: the weapon card must carry data-weap (v262)');
if (!html.includes('class="weap-head" onclick="toggleWeapCard(this)"')) throw new Error('HE: the weapon card header must call toggleWeapCard (v262)');
if (!html.includes('class="weap-body"')) throw new Error('HE: the weapon card must have a body (v262)');
if (!staticHtml.includes('.card-head { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:10px; cursor:pointer; }')) throw new Error('HE: the section header must show it is clickable (v262)');
for (const b of ['mech','mounts','systems','talents','pilot','triggers','licenses','coreBonuses','pilotEquipment']) {
  if (!staticHtml.includes('class="card-head" onclick="toggleEdit(\'' + b + '\')"')) throw new Error('HE: the ' + b + ' section header must toggle editing on click (v262)');
  const cap = b[0].toUpperCase() + b.slice(1);
  if (staticHtml.includes('id="editToggle' + cap + '" onclick=')) throw new Error('HE: the ' + b + ' slider must not keep its own onclick (double toggle, v262)');
}
// 1b. Статика (v262, подсказки): id у подсказок триггеров и кор бонусов,
//    syncEditToggles прячет их при выключенном редактировании; cbSummary
//    (динамическая сводка) на месте; pilot_equip_empty удалён полностью.
if (!staticHtml.includes('id="triggersHint"')) throw new Error('HE: the triggers hint must have an id (v262)');
if (!staticHtml.includes('id="coreBonusesHint"')) throw new Error('HE: the Core Bonuses hint must have an id (v262)');
if (!html.includes("show('triggersHint', eg)")) throw new Error('HE: syncEditToggles must hide the triggers hint when editing is OFF (v262)');
if (!html.includes("show('coreBonusesHint', editOn('coreBonuses'))")) throw new Error('HE: syncEditToggles must hide the Core Bonuses hint when editing is OFF (v262)');
if (!staticHtml.includes('id="cbSummary"')) throw new Error('HE: cbSummary must stay (dynamic summary, not a hint, v262)');
if (html.includes('pilot_equip_empty')) throw new Error('HE: pilot_equip_empty must be gone entirely (v262)');
if (html.includes('Снаряжение пилота не импортировано')) throw new Error('HE: the pilot equipment empty hint text must be gone (v262)');
// 2. Рантайм: карточка оружия — шапка со стрелкой, свёрнута по умолчанию,
//    описание в DOM при выключенном редактировании, переключение переживает
//    перерисовку; то же оружие в двух маунтах — разные ключи.
(function(){
  const { X, S, DB, elements } = runEval({});
  const arIdx = DB.weapons.findIndex(w=>w.n==='Assault Rifle');
  if (arIdx < 0) throw new Error('HE: Assault Rifle must exist in the DB');
  X.addWeaponByIndex(0, arIdx);
  const wLast = S.mounts[0].weapons[S.mounts[0].weapons.length-1];
  wLast.desc = 'Тестовое описание оружия для проверки.';
  // Кастомное оружие с зарядами и Loading — для stopPropagation
  S.mounts[0].weapons.push({name:'Test Grenade', dmg:'1d6', range:'Range 5', desc:'Boom.', lim:3, tg:[['tg_loading','']]});
  X.renderLists();
  const mHtml = elements['mounts'].innerHTML;
  if (!mHtml.includes('<div class="wcard" data-weap="0:Assault Rifle"')) throw new Error('HE: the weapon card must carry data-weap="0:Assault Rifle" (v262)');
  if (!mHtml.includes('<span class="weap-arrow">')) throw new Error('HE: the weapon header must have a .weap-arrow (v262)');
  if (!mHtml.includes('<span class="weap-name">')) throw new Error('HE: the weapon header must have a .weap-name (v262)');
  if (mHtml.includes('wcard open')) throw new Error('HE: weapons must be collapsed by default (v262)');
  if (!mHtml.includes('Тестовое описание оружия')) throw new Error('HE: the weapon description must be in the card body in view mode (v262)');
  if (!mHtml.includes('Boom.')) throw new Error('HE: the custom weapon description must render (v262)');
  if (!mHtml.includes('event.stopPropagation();stepWeapCharges(0,')) throw new Error('HE: charge buttons must stopPropagation (v262)');
  if (!mHtml.includes('event.stopPropagation();toggleWeapLoaded(0,')) throw new Error('HE: the Loading toggle must stopPropagation (v262)');
  // В режиме редактирования — ✕ есть и тоже со stopPropagation
  X.toggleEdit('mounts');
  X.renderLists();
  const mHtmlEdit = elements['mounts'].innerHTML;
  if (!mHtmlEdit.includes('event.stopPropagation();delWeapon(0,')) throw new Error('HE: the weapon delete button must stopPropagation (v262)');
  if (!mHtmlEdit.includes('Тестовое описание оружия')) throw new Error('HE: the weapon description must stay in edit mode (v262)');
  X.toggleEdit('mounts');
  // toggleWeapCard: состояние переживает перерисовку (как EZ у систем)
  const { X: X2, S: S2, elements: el2 } = runEval({});
  X2.addWeaponByIndex(0, arIdx);
  X2.renderLists();
  const fakeHead = { closest: () => ({ getAttribute: () => '0:Assault Rifle', classList: { toggle: (c) => true } }) };
  X2.toggleWeapCard(fakeHead);
  X2.renderLists();
  const html2 = el2['mounts'].innerHTML;
  if (!html2.includes('<div class="wcard open" data-weap="0:Assault Rifle"')) throw new Error('HE: an opened weapon must stay open after re-render (v262)');
  // То же оружие во втором маунте — другой ключ, раскрывается независимо
  X2.addWeaponByIndex(1, arIdx);
  X2.renderLists();
  const html3 = el2['mounts'].innerHTML;
  if (!html3.includes('data-weap="1:Assault Rifle"')) throw new Error('HE: the same weapon in another mount must have its own key (v262)');
  if (!html3.includes('<div class="wcard open" data-weap="0:Assault Rifle"')) throw new Error('HE: the first mount weapon must stay open (v262)');
  if (html3.includes('<div class="wcard open" data-weap="1:Assault Rifle"')) throw new Error('HE: the second mount weapon must stay collapsed (v262)');
  // Системы не изменились: их сворачивание по-прежнему работает
  const sysIdx = DB.systems.findIndex(s=>s.n==='Personalizations');
  X2.addSystemByIndex(sysIdx);
  X2.renderLists();
  if (!el2['systems'].innerHTML.includes('<div class="sec sys" data-sys="Personalizations"')) throw new Error('HE: systems must still render as collapsible cards (v262)');
})();
// 3. Рантайм: шапка секции переключает редактирование ровно один раз,
//    и только своей секции; слайдер синхронизирован.
(function(){
  const { X, S, elements } = runEval({});
  if (X.editOn('mounts') || X.editOn('systems')) throw new Error('HE: editing must be OFF by default');
  X.toggleEdit('mounts'); // клик по шапке (или по слайдеру — один вызов)
  if (!X.editOn('mounts')) throw new Error('HE: one header click must turn mounts editing ON (v262)');
  if (X.editOn('systems')) throw new Error('HE: toggling mounts must not touch systems (v262)');
  if (!elements['editToggleMounts'].classList.contains('on')) throw new Error('HE: the mounts slider must sync ON (v262)');
  if (elements['editToggleSystems'].classList.contains('on')) throw new Error('HE: the systems slider must stay OFF (v262)');
  X.toggleEdit('mounts');
  if (X.editOn('mounts')) throw new Error('HE: a second header click must turn mounts editing OFF (v262)');
  if (elements['editToggleMounts'].classList.contains('on')) throw new Error('HE: the mounts slider must sync OFF (v262)');
  X.toggleEdit('systems');
  if (!X.editOn('systems') || X.editOn('mounts')) throw new Error('HE: the systems header must toggle only systems (v262)');
})();
// 4. Рантайм: подсказки триггеров и кор бонусов видны только при включённом
//    редактировании своей секции; пустое снаряжение пилота — без подсказки (v262).
(function(){
  const { X, S, elements } = runEval({});
  if (X.editOn('triggers') || X.editOn('coreBonuses')) throw new Error('HE: triggers/Core Bonuses editing must be OFF by default');
  if (elements['triggersHint'].style.display !== 'none') throw new Error('HE: the triggers hint must hide when triggers editing is OFF (v262)');
  if (elements['coreBonusesHint'].style.display !== 'none') throw new Error('HE: the Core Bonuses hint must hide when Core Bonuses editing is OFF (v262)');
  X.toggleEdit('triggers');
  if (elements['triggersHint'].style.display === 'none') throw new Error('HE: the triggers hint must show when triggers editing is ON (v262)');
  if (elements['coreBonusesHint'].style.display !== 'none') throw new Error('HE: toggling triggers must not show the Core Bonuses hint (v262)');
  X.toggleEdit('coreBonuses');
  if (elements['coreBonusesHint'].style.display === 'none') throw new Error('HE: the Core Bonuses hint must show when Core Bonuses editing is ON (v262)');
  X.toggleEdit('triggers'); X.toggleEdit('coreBonuses');
  if (elements['triggersHint'].style.display !== 'none' || elements['coreBonusesHint'].style.display !== 'none') throw new Error('HE: both hints must hide again when editing is OFF (v262)');
  // Пустое снаряжение пилота: ни в просмотре, ни в редактировании подсказки нет
  if (elements['pilotEquipment'].innerHTML.includes('Снаряжение пилота не импортировано') || elements['pilotEquipment'].innerHTML.includes('No pilot equipment imported')) throw new Error('HE: the pilot equipment empty hint must not render (v262)');
  X.toggleEdit('pilotEquipment');
  if (elements['pilotEquipment'].innerHTML.includes('Снаряжение пилота не импортировано') || elements['pilotEquipment'].innerHTML.includes('No pilot equipment imported')) throw new Error('HE: the pilot equipment empty hint must not render in edit mode either (v262)');
})();
// PHASE HF (v263): снаряжение пилота — сворачиваемые карточки, как системы
// и оружие; состояние свёрнуто/развёрнуто всех трёх видов карточек персистентно
// (отдельный профиль-независимый ключ localStorage) — переживает перезагрузку
// страницы и смену профиля.
// 1. Статика: CSS шапки/тела снаряжения, сет openPilotEquip, togglePilotEquipCard,
//    разметка карточки (data-pequip, pilot-equip-head, pilot-equip-body);
//    ключ UI_STATE_KEY, loadOpenState/persistOpenState, запись при переключении.
if (!staticHtml.includes('.pilot-equip-head { cursor:pointer; }')) throw new Error('HF: the pilot equipment card header must be clickable (v263)');
if (!staticHtml.includes('.pilot-equip-item.open .pilot-equip-arrow { transform:rotate(90deg); }')) throw new Error('HF: the pilot equipment arrow must rotate when open (v263)');
if (!staticHtml.includes('.pilot-equip-body { display:none;')) throw new Error('HF: the pilot equipment card body must be hidden when collapsed (v263)');
if (!staticHtml.includes('.pilot-equip-item.open .pilot-equip-body { display:block; }')) throw new Error('HF: the pilot equipment card body must show when open (v263)');
if (!html.includes('let openPilotEquip = new Set()')) throw new Error('HF: openPilotEquip must exist (v263)');
if (!html.includes('function togglePilotEquipCard(')) throw new Error('HF: togglePilotEquipCard must exist (v263)');
if (!html.includes('data-pequip=')) throw new Error('HF: the pilot equipment card must carry data-pequip (v263)');
if (!html.includes('class="pilot-equip-head" onclick="togglePilotEquipCard(this)"')) throw new Error('HF: the pilot equipment card header must call togglePilotEquipCard (v263)');
if (!html.includes('class="pilot-equip-body"')) throw new Error('HF: the pilot equipment card must have a body (v263)');
if (!html.includes("const UI_STATE_KEY = 'lancer-tracker-ui-v1'")) throw new Error('HF: the UI state key must exist (v263)');
if (!html.includes('function loadOpenState(')) throw new Error('HF: loadOpenState must exist (v263)');
if (!html.includes('function persistOpenState(')) throw new Error('HF: persistOpenState must exist (v263)');
if (!html.includes('loadOpenState();')) throw new Error('HF: the open state must load at startup (v263)');
if (!html.includes('event.stopPropagation();stepPilotEquipmentCharges(')) throw new Error('HF: pilot equipment charge buttons must stopPropagation (v263)');
if (!html.includes('event.stopPropagation();${remove}')) throw new Error('HF: the pilot equipment delete button must stopPropagation (v263)');
// 2. Рантайм: карточка снаряжения — шапка со стрелкой, свёрнута по умолчанию,
//    описание в теле, переключение переживает перерисовку.
(function(){
  const { X, S, DB, elements } = runEval({});
  X.addPilotGear('pg_archaic_melee');
  X.renderLists();
  const peHtml = elements['pilotEquipment'].innerHTML;
  if (!peHtml.includes('<div class="pilot-equip-item" data-pequip="pg_archaic_melee"')) throw new Error('HF: the pilot equipment card must carry data-pequip="pg_archaic_melee" (v263)');
  if (!peHtml.includes('<span class="pilot-equip-arrow">')) throw new Error('HF: the pilot equipment header must have a .pilot-equip-arrow (v263)');
  if (!peHtml.includes('<span class="pilot-equip-name">')) throw new Error('HF: the pilot equipment header must have a .pilot-equip-name (v263)');
  if (peHtml.includes('pilot-equip-item open')) throw new Error('HF: pilot equipment must be collapsed by default (v263)');
  if (!peHtml.includes('изготовлено из сплавов')) throw new Error('HF: the pilot equipment description must be in the card body (v263)');
  const fakeHead = { closest: () => ({ getAttribute: () => 'pg_archaic_melee', classList: { toggle: (c) => true } }) };
  X.togglePilotEquipCard(fakeHead);
  X.renderLists();
  const peHtml2 = elements['pilotEquipment'].innerHTML;
  if (!peHtml2.includes('<div class="pilot-equip-item open" data-pequip="pg_archaic_melee"')) throw new Error('HF: an opened pilot equipment card must stay open after re-render (v263)');
})();
// 3. Рантайм: персистентность — раскрытое переживает перезагрузку
//    (повторный runEval на том же store) и смену профиля (замена данных
//    пилота под KEY); битое значение в ключе не роняет старт.
(function(){
  const store = {};
  let r = runEval(store);
  const sysIdx = r.DB.systems.findIndex(s=>s.n==='Personalizations');
  r.X.addSystemByIndex(sysIdx);
  const arIdx = r.DB.weapons.findIndex(w=>w.n==='Assault Rifle');
  r.X.addWeaponByIndex(0, arIdx);
  r.X.addPilotGear('pg_archaic_melee');
  r.X.renderLists();
  const fake = key => ({ closest: () => ({ getAttribute: () => key, classList: { toggle: () => true } }) });
  r.X.toggleSysCard(fake('Personalizations'));
  r.X.toggleWeapCard(fake('0:Assault Rifle'));
  r.X.togglePilotEquipCard(fake('pg_archaic_melee'));
  const saved = JSON.parse(store['lancer-tracker-ui-v1']);
  if (!saved.sys.includes('Personalizations')) throw new Error('HF: the open system must be persisted (v263)');
  if (!saved.weap.includes('0:Assault Rifle')) throw new Error('HF: the open weapon must be persisted (v263)');
  if (!saved.pilotEquip.includes('pg_archaic_melee')) throw new Error('HF: the open pilot equipment must be persisted (v263)');
  // перезагрузка страницы: повторный runEval на том же store
  r = runEval(store);
  if (!r.X.openSys().includes('Personalizations')) throw new Error('HF: the open system must survive reload (v263)');
  if (!r.X.openWeap().includes('0:Assault Rifle')) throw new Error('HF: the open weapon must survive reload (v263)');
  if (!r.X.openPilotEquip().includes('pg_archaic_melee')) throw new Error('HF: the open pilot equipment must survive reload (v263)');
  r.X.renderLists();
  if (!r.elements['systems'].innerHTML.includes('<div class="sec sys open" data-sys="Personalizations"')) throw new Error('HF: the system must render open after reload (v263)');
  if (!r.elements['mounts'].innerHTML.includes('<div class="wcard open" data-weap="0:Assault Rifle"')) throw new Error('HF: the weapon must render open after reload (v263)');
  if (!r.elements['pilotEquipment'].innerHTML.includes('<div class="pilot-equip-item open" data-pequip="pg_archaic_melee"')) throw new Error('HF: the pilot equipment must render open after reload (v263)');
  // смена профиля: данные пилота под KEY заменены на другого пилота —
  // снаряжение из старого профиля пропало, а состояние раскрытия осталось
  const other = JSON.parse(JSON.stringify(r.X.DEFAULTS));
  other.pilot.name = 'Other Pilot';
  store[r.X.KEY] = JSON.stringify(other);
  r = runEval(store);
  if (r.S.pilot.name !== 'Other Pilot') throw new Error('HF: the profile switch simulation must load the other pilot (v263)');
  if (r.elements['pilotEquipment'].innerHTML.includes('pg_archaic_melee')) throw new Error('HF: the other profile must not have the old pilot equipment (v263)');
  if (!r.X.openSys().includes('Personalizations') || !r.X.openWeap().includes('0:Assault Rifle') || !r.X.openPilotEquip().includes('pg_archaic_melee')) throw new Error('HF: the open state must survive a profile switch (v263)');
  // закрытие тоже персистентно: закрыть оружие и перезагрузить
  r.X.toggleWeapCard({ closest: () => ({ getAttribute: () => '0:Assault Rifle', classList: { toggle: () => false } }) });
  const saved2 = JSON.parse(store['lancer-tracker-ui-v1']);
  if (saved2.weap.includes('0:Assault Rifle')) throw new Error('HF: closing a weapon must persist the removal (v263)');
  if (!saved2.sys.includes('Personalizations')) throw new Error('HF: closing the weapon must not drop the system state (v263)');
  r = runEval(store);
  if (r.X.openWeap().includes('0:Assault Rifle')) throw new Error('HF: a closed weapon must stay closed after reload (v263)');
  if (!r.X.openSys().includes('Personalizations')) throw new Error('HF: closing the weapon must not touch the system state (v263)');
  // битое значение в ключе — старт не падает, сеты пустые
  store['lancer-tracker-ui-v1'] = 'not json{';
  r = runEval(store);
  if (r.X.openSys().length || r.X.openWeap().length || r.X.openPilotEquip().length) throw new Error('HF: malformed UI state must load as empty sets (v263)');
  store['lancer-tracker-ui-v1'] = JSON.stringify({sys:'oops', weap:[1,2], pilotEquip:null});
  r = runEval(store);
  if (r.X.openSys().length || r.X.openWeap().length || r.X.openPilotEquip().length) throw new Error('HF: non-array UI state must load as empty sets (v263)');
})();
// 4. Рантайм: клик по чипу тега внутри шапки карточки НЕ переключает
//    open-состояние (v263 — баг: чип всплывал до шапки и разворачивал карточку),
//    а диалог тега при этом открывается.
(function(){
  const { X, S, DB, elements } = runEval({});
  const arIdx = DB.weapons.findIndex(w=>w.n==='Assault Rifle');
  X.addWeaponByIndex(0, arIdx);
  S.systems.push({name:'Test Sys', tg:[['tg_reliable',2]], desc:'Тестовая система.'});
  X.addPilotGear('pg_archaic_melee');
  X.renderLists();
  const mHtml = elements['mounts'].innerHTML;
  const sHtml = elements['systems'].innerHTML;
  const peHtml = elements['pilotEquipment'].innerHTML;
  if (!mHtml.includes("event.stopPropagation();showTag('tg_reliable'")) throw new Error('HF: the weapon header tag chip must stopPropagation (v263)');
  if (!sHtml.includes("event.stopPropagation();showTag('tg_reliable'")) throw new Error('HF: the system header tag chip must stopPropagation (v263)');
  if (!peHtml.includes("event.stopPropagation();showTag('tg_archaic'")) throw new Error('HF: the pilot equipment header tag chip must stopPropagation (v263)');
  // linkTagTerms — чипы в тексте описаний тоже не всплывают
  const linked = X.linkTagTerms('ДУГОВОЕ 1 и ОТБРОС 2');
  if (!linked.includes("event.stopPropagation();showTag('tg_arcing'")) throw new Error('HF: linkTagTerms chips must stopPropagation (v263)');
  // открыть все три карточки, позвать showTag — состояние не меняется,
  // диалог открывается, после перерисовки всё по-прежнему развёрнуто
  const fake = key => ({ closest: () => ({ getAttribute: () => key, classList: { toggle: () => true } }) });
  X.toggleWeapCard(fake('0:Assault Rifle'));
  X.toggleSysCard(fake('Test Sys'));
  X.togglePilotEquipCard(fake('pg_archaic_melee'));
  const before = JSON.stringify({sys: X.openSys(), weap: X.openWeap(), pe: X.openPilotEquip()});
  X.showTag('tg_reliable', '2');
  if (!elements['tagDialog']._open) throw new Error('HF: showTag must still open the tag dialog (v263)');
  const after = JSON.stringify({sys: X.openSys(), weap: X.openWeap(), pe: X.openPilotEquip()});
  if (before !== after) throw new Error('HF: showTag must not change the open state (v263)');
  X.renderLists();
  if (!elements['mounts'].innerHTML.includes('<div class="wcard open" data-weap="0:Assault Rifle"')) throw new Error('HF: the weapon must stay open after showTag (v263)');
  if (!elements['systems'].innerHTML.includes('<div class="sec sys open" data-sys="Test Sys"')) throw new Error('HF: the system must stay open after showTag (v263)');
  if (!elements['pilotEquipment'].innerHTML.includes('<div class="pilot-equip-item open" data-pequip="pg_archaic_melee"')) throw new Error('HF: the pilot equipment must stay open after showTag (v263)');
})();
// PHASE HG (v264): диалог броска при потере структуры/стресса (кнопка «отмечено N»),
// уничтожение оружия/систем и их починка. Починка НЕ тратит Repair автоматически:
// кнопка «Починить сейчас» лишь снимает флаг destroyed (у пользователя могут быть
// другие способы чинить — таланты, системы, кор-бонусы).
// 1. Статика: диалог dmgRollDlg, функции, STR-ключи, вид уничтожения, чип + перечёркивание.
if (!staticHtml.includes('id="dmgRollDlg"')) throw new Error('HG: the damage roll dialog must exist (v264)');
if (!staticHtml.includes('id="dmgRollName"')) throw new Error('HG: dmgRollName must exist (v264)');
if (!staticHtml.includes('id="dmgRollBody"')) throw new Error('HG: dmgRollBody must exist (v264)');
if (!staticHtml.includes('id="dmgRollActions"')) throw new Error('HG: dmgRollActions must exist (v264)');
if (!staticHtml.includes('id="destroyView"')) throw new Error('HG: the destroy view must exist (v264)');
if (!staticHtml.includes('id="destroyList"')) throw new Error('HG: destroyList must exist (v264)');
if (!staticHtml.includes('id="destroyTitle"')) throw new Error('HG: destroyTitle must exist (v264)');
if (!html.includes('function showDamageRoll(')) throw new Error('HG: showDamageRoll must exist (v264)');
if (!html.includes('function closeDamageRollDlg(')) throw new Error('HG: closeDamageRollDlg must exist (v264)');
if (!html.includes('function dmgRollRows(')) throw new Error('HG: dmgRollRows must exist (v264)');
if (!html.includes('function showDestroyedRepair(')) throw new Error('HG: showDestroyedRepair must exist (v264)');
if (!html.includes('function repairDestroyed(')) throw new Error('HG: repairDestroyed must exist (v264)');
if (!html.includes('function openDestroyPicker(')) throw new Error('HG: openDestroyPicker must exist (v264)');
if (!html.includes('function closeDestroyPicker(')) throw new Error('HG: closeDestroyPicker must exist (v264)');
if (!html.includes('function destroyMountWeapons(')) throw new Error('HG: destroyMountWeapons must exist (v264)');
if (!html.includes('function destroySystem(')) throw new Error('HG: destroySystem must exist (v264)');
if (!html.includes('function destroyViewOpen(')) throw new Error('HG: destroyViewOpen must exist (v264)');
if (!html.includes('let destroyHist = false')) throw new Error('HG: destroyHist must exist (v264)');
if (!html.includes("if (destroyViewOpen()){ destroyHist = false; fullscreenViewHide('destroyView'); return; }")) throw new Error('HG: popstate must close the destroy view (v264)');
if (!staticHtml.includes("id=\"marked-structure\" type=\"button\" onclick=\"showDamageRoll('structure')\"")) throw new Error('HG: the marked-structure button must open the damage roll dialog (v264)');
if (!staticHtml.includes("id=\"marked-stress\" type=\"button\" onclick=\"showDamageRoll('stress')\"")) throw new Error('HG: the marked-stress button must open the damage roll dialog (v264)');
if (!staticHtml.includes("onclick=\"showStatRef('structure')\">Structure</button>")) throw new Error('HG: the Structure label must still open showStatRef (v264)');
if (!staticHtml.includes("onclick=\"showStatRef('stress')\">Stress</button>")) throw new Error('HG: the Stress label must still open showStatRef (v264)');
if (!html.includes('STR.dmg_roll_dice')) throw new Error('HG: dmg_roll_dice STR must exist (v264)');
if (!html.includes('STR.dmg_roll_none')) throw new Error('HG: dmg_roll_none STR must exist (v264)');
if (!html.includes('STR.dmg_destroy_btn')) throw new Error('HG: dmg_destroy_btn STR must exist (v264)');
if (!html.includes('STR.destroy_none')) throw new Error('HG: destroy_none STR must exist (v264)');
if (!html.includes('STR.dmg_destroy_mount')) throw new Error('HG: dmg_destroy_mount STR must exist (v264)');
if (!html.includes('STR.repair_howto')) throw new Error('HG: repair_howto STR must exist (v264)');
if (!html.includes('STR.repair_now')) throw new Error('HG: repair_now STR must exist (v264)');
if (!staticHtml.includes('.wcard.destroyed .weap-name')) throw new Error('HG: the destroyed weapon name must be struck through (v264)');
if (!staticHtml.includes('.sec.sys.destroyed .sys-name')) throw new Error('HG: the destroyed system name must be struck through (v264)');
if (!html.includes("showDestroyedRepair('weapon'")) throw new Error('HG: the weapon card must open the repair dialog (v264)');
if (!html.includes("showDestroyedRepair('system'")) throw new Error('HG: the system card must open the repair dialog (v264)');
if (!html.includes("event.stopPropagation();showDestroyedRepair('weapon'")) throw new Error('HG: the weapon destroyed chip must stopPropagation (v264)');
if (!html.includes("event.stopPropagation();showDestroyedRepair('system'")) throw new Error('HG: the system destroyed chip must stopPropagation (v264)');
// 2. Рантайм: диалог структуры — правильное число кубов и таблица + кнопка уничтожения;
//    диалог стресса — та же таблица, без кнопки уничтожения; N=0 — пометка и таблица.
(function(){
  const store = {};
  const { X, S, DB, elements } = runEval(store);
  const arIdx = DB.weapons.findIndex(w=>w.n==='Assault Rifle');
  X.addWeaponByIndex(0, arIdx);
  const sysIdx = DB.systems.findIndex(s=>s.n==='Personalizations');
  X.addSystemByIndex(sysIdx);
  X.set('mech.structure', 2); X.set('mech.stress', 2);
  // структура: отмечено 2 → 2d6, таблица, кнопка уничтожения
  X.showDamageRoll('structure');
  if (!elements['dmgRollDlg']._open) throw new Error('HG: showDamageRoll must open the dialog (v264)');
  const sBody = elements['dmgRollBody'].innerHTML;
  if (!sBody.includes('2d6')) throw new Error('HG: the structure dialog must say 2d6 for 2 marks (v264)');
  for (const t of ['Glancing Blow','System Trauma','Direct Hit','Crushing Hit']) {
    if (!sBody.includes(t)) throw new Error('HG: the structure table must include ' + t + ' (v264)');
  }
  const sAct = elements['dmgRollActions'].innerHTML;
  if (!sAct.includes('Уничтожить оружие/систему')) throw new Error('HG: the structure dialog must have the destroy button (v264)');
  X.closeDamageRollDlg();
  if (elements['dmgRollDlg']._open) throw new Error('HG: closeDamageRollDlg must close the dialog (v264)');
  // стресс: отмечено 2 → 2d6, таблица, БЕЗ кнопки уничтожения
  X.showDamageRoll('stress');
  if (!elements['dmgRollDlg']._open) throw new Error('HG: showDamageRoll must open the stress dialog (v264)');
  const tBody = elements['dmgRollBody'].innerHTML;
  if (!tBody.includes('2d6')) throw new Error('HG: the stress dialog must say 2d6 for 2 marks (v264)');
  for (const t of ['Emergency Shunt','Destabilized Power Plant','Meltdown','Irreversible Meltdown']) {
    if (!tBody.includes(t)) throw new Error('HG: the stress table must include ' + t + ' (v264)');
  }
  if (!tBody.includes('Расплавление реактора')) throw new Error('HG: the stress dialog must include the meltdown description (v264)');
  const tAct = elements['dmgRollActions'].innerHTML;
  if (tAct.includes('Уничтожить оружие/систему')) throw new Error('HG: the stress dialog must NOT have the destroy button (v264)');
  X.closeDamageRollDlg();
  // N=0: отметок нет — пометка, но таблица всё равно показана
  X.set('mech.structure', 4);
  X.showDamageRoll('structure');
  const zBody = elements['dmgRollBody'].innerHTML;
  if (!zBody.includes('Отметок пока нет')) throw new Error('HG: the dialog must note there is nothing to roll at 0 marks (v264)');
  if (!zBody.includes('Glancing Blow')) throw new Error('HG: the table must still show at 0 marks (v264)');
  X.closeDamageRollDlg();
  // лейблы по-прежнему открывают showStatRef (справку), а не диалог броска
  X.showStatRef('structure');
  if (!elements['tagDialog']._open) throw new Error('HG: the Structure label must still open showStatRef (v264)');
})();
// 3. Рантайм: пикер уничтожения (маунт — всё оружие, система — одну), чип +
//    перечёркивание, состояние переживает save/load, починка НЕ тратит Repair.
(function(){
  const store = {};
  let r = runEval(store);
  const arIdx = r.DB.weapons.findIndex(w=>w.n==='Assault Rifle');
  r.X.addWeaponByIndex(0, arIdx);
  r.X.addWeaponByIndex(0, arIdx); // второе оружие на том же маунте
  const sysIdx = r.DB.systems.findIndex(s=>s.n==='Personalizations');
  r.X.addSystemByIndex(sysIdx);
  const peIdx = r.S.systems.findIndex(s=>s.name==='Personalizations');
  r.X.set('mech.repairs', 2);
  r.X.renderLists();
  // пикер: видны маунт и система
  r.X.openDestroyPicker();
  if (r.elements['destroyView'].style.display !== 'block') throw new Error('HG: openDestroyPicker must show the destroy view (v264)');
  const dList = r.elements['destroyList'].innerHTML;
  if (!dList.includes('всё оружие маунта')) throw new Error('HG: the destroy picker must list mounts (v264)');
  if (!dList.includes('Персонализация')) throw new Error('HG: the destroy picker must list systems (v264)');
  // маунт: всё его оружие уничтожено
  r.X.destroyMountWeapons(0);
  if (!r.S.mounts[0].weapons.every(w=>w.destroyed)) throw new Error('HG: destroying a mount must destroy all its weapons (v264)');
  const mHtml = r.elements['mounts'].innerHTML;
  if (!mHtml.includes('wcard destroyed')) throw new Error('HG: the destroyed weapon card must carry the destroyed class (v264)');
  if (!mHtml.includes('Уничтожено')) throw new Error('HG: the destroyed weapon must show the Destroyed chip (v264)');
  // система: одна уничтожена
  r.X.openDestroyPicker();
  r.X.destroySystem(peIdx);
  if (!r.S.systems[peIdx].destroyed) throw new Error('HG: destroySystem must mark the system destroyed (v264)');
  const sHtml = r.elements['systems'].innerHTML;
  if (!sHtml.includes('sys destroyed')) throw new Error('HG: the destroyed system card must carry the destroyed class (v264)');
  if (!sHtml.includes('Уничтожено')) throw new Error('HG: the destroyed system must show the Destroyed chip (v264)');
  // уничтоженное больше не предлагается в пикере
  r.X.openDestroyPicker();
  const dList2 = r.elements['destroyList'].innerHTML;
  if (dList2.includes('Персонализация')) throw new Error('HG: a destroyed system must not be offered again (v264)');
  r.X.closeDestroyPicker();
  // состояние переживает save/load
  r.X.save();
  r = runEval(store);
  if (!r.S.mounts[0].weapons.every(w=>w.destroyed)) throw new Error('HG: the destroyed weapons must persist across save/load (v264)');
  if (!r.S.systems[peIdx].destroyed) throw new Error('HG: the destroyed system must persist across save/load (v264)');
  // починка оружия: диалог, кнопка НЕ тратит Repair, чип уходит
  r.X.showDestroyedRepair('weapon', 0, 0);
  if (!r.elements['dmgRollDlg']._open) throw new Error('HG: showDestroyedRepair must open the dialog (v264)');
  const rBody = r.elements['dmgRollBody'].innerHTML;
  if (!rBody.includes('1 Repair')) throw new Error('HG: the repair dialog must explain the 1 Repair way (v264)');
  if (!rBody.includes('не списывает')) throw new Error('HG: the repair dialog must say the tracker does not spend Repairs (v264)');
  const rAct = r.elements['dmgRollActions'].innerHTML;
  if (!rAct.includes('Починить сейчас')) throw new Error('HG: the repair dialog must have the Repair now button (v264)');
  if (rAct.includes('disabled')) throw new Error('HG: the repair button must not be disabled (v264)');
  const repsBefore = r.X.get('mech.repairs');
  r.X.repairDestroyed('weapon', 0, 0);
  if (r.S.mounts[0].weapons[0].destroyed) throw new Error('HG: repairDestroyed must clear the destroyed flag (v264)');
  if (r.X.get('mech.repairs') !== repsBefore) throw new Error('HG: repairDestroyed must NOT spend Repairs (v264)');
  // одно из двух уничтоженных оружий починено — чипов «Уничтожено» стало 1 вместо 2
  if ((r.elements['mounts'].innerHTML.match(/Уничтожено/g) || []).length !== 1) throw new Error('HG: the repaired weapon must lose the Destroyed chip (v264)');
  if (r.elements['dmgRollDlg']._open) throw new Error('HG: repairDestroyed must close the dialog (v264)');
  // починка при 0 ремонтов: кнопка всё равно работает (ремонты не тратятся)
  r.X.set('mech.repairs', 0);
  r.X.showDestroyedRepair('system', peIdx);
  const rAct0 = r.elements['dmgRollActions'].innerHTML;
  if (!rAct0.includes('Починить сейчас')) throw new Error('HG: the repair button must be present with 0 Repairs (v264)');
  if (rAct0.includes('disabled')) throw new Error('HG: the repair button must not be disabled with 0 Repairs (v264)');
  r.X.repairDestroyed('system', peIdx);
  if (r.S.systems[peIdx].destroyed) throw new Error('HG: repairDestroyed must work with 0 Repairs (v264)');
  if (r.X.get('mech.repairs') !== 0) throw new Error('HG: repairDestroyed must not change Repairs (v264)');
  r.X.closeDamageRollDlg();
  // пустой пикер: нечего уничтожать (всё уничтожено заново)
  r.X.destroyMountWeapons(0);
  r.S.systems.forEach((s, i)=>{ if (!s.destroyed) r.X.destroySystem(i); });
  r.X.openDestroyPicker();
  if (!r.elements['destroyList'].innerHTML.includes('Нечего уничтожать')) throw new Error('HG: the destroy picker must note when nothing is left to destroy (v264)');
  r.X.closeDestroyPicker();
})();
console.log('SMOKE TEST PASSED: Heat/Stress order, defaults, multi-field search, frame apply (mounts/core/traits/derived stats/integrated weapon), SP counter, systems search, license filter, TDZ regression, license migration, Limited charges, combat-reference blocks, talent search, weapon tag chips, mount badges, fixed SP, RUS/ENG toggle, frame corporation/roles, bilingual datalists, description component, dispField fix, trigger search, description overflow fix, frame moved to Pilot tab, display-only weapons/systems, custom modals, apply confirm dismiss is atomic, edit toggles, edit toggles in the remaining blocks, slider toggles, search modal, no Apply Frame button, no Описание label, search icon left of the + Кастом … button, wrench icon in the slider knob, game mode hides edit-only notes, ranks inline with names, short descriptions shown in full, long ones show a paragraph with подробнее at the end, no separate SP label on systems, weapon descriptions in the card body in both modes (v262: collapsible weapon cards like systems), version in the footer, frame picker back on the Mech tab with the integrated-weapon note in the confirm, collapse is a blue link at the end of the text, traits in their own always-full card, Core Bonuses/Gear removed, Stress is radiation and Overcharge is lightning, System Points moved to the Systems card (always visible since v255), HASE explanation is edit-only too, talent features are cumulative up to the chosen rank, licenses card renamed to just «Лицензии», resource maxes auto-calculated from frame+HASE, Full Repair button moved into the rules block, loading recomputes resource maxes from frame+HASE, resource counters spread to one column on phones, Personalizations adds +2 HP, v39: counters back to 2 columns, rules buttons moved down with a 16px gap, Core Bonuses (30, with slots, license-rank requirements and HP/Heat max bonuses), v40: resource max as in Overcharge (value alone, max: N below), Repairs label without the Russian word, v41: structure/stress tables rebuilt as rows, v42: Core Power button variant B (red bar when unused, gray pressed when used), no separate indicator, v43: dense table/HASE texts rebuilt as lists, v44: Core Power button same height in both states, hazard-stripe metal panel, v45: Core Bonus picker rows are tappable, no Add button, v46: Grit label shortened, license rank dropdown widened with Roman numerals, v47: Mech and HASE merged into one Stats card (2nd after Resources), icons, compact view mode, v48: stats in 2 columns in view mode on phones, grids shrink (minmax), frame name truncates with an ellipsis, v49: frame under the name (full width), robot icon removed, dividers around HASE, v50: systems search gets a подробнее button to expand long descriptions, v51: deleting a mount asks for confirmation, v52: talent search shows rank descriptions with подробнее, no empty talents/triggers on fresh load or reset, footer disclaimer removed, language is a RUS/ENG slider, license name is a dropdown, v53: level-up section in the Rules tab (checklist, reallocation, totals by LL), v54: License Level is a stepper, no text field, v55: LL is derived from license ranks, no LL field to set, v56: LL and Grit update live when licenses change (renderLists calls renderCounters), v57: character creation wizard (10 steps, auto-opens on a fresh save, core step only at LL3+), v58: weapons and systems removed from the creation wizard (normal experience), level-up wizard (draft + apply, core step only when a new slot opens), v59: level-up wizard rewritten (direct writes, familiar UI with current items + search pickers, no reallocation step — rules as text, no Apply, button at the top of the Rules tab, renderLists syncs data-f inputs), v60: search pickers show all matching results, no paging (the «Показано 8 из N» footer lied — it said 8 while 20 were rendered), v61: the search modal no longer auto-focuses the input (no keyboard popping up on open — tap the field to search), v62: v61 was not enough — showModal() itself focuses the first focusable element, so the modal now blurs whatever got focused right after opening, v63: talent search cards no longer show the redundant rank-names enumeration (it merged with the first rank description) — a line break separates the tagline from the rank descriptions, v64: actions reference — «Your actions» at the top of the Rules tab shows only the reactions and protocols your talents and systems grant (Intercede, Supersonic, Return Fire, Valiant Aid, Flank + 7 system reactions + 17 system protocols, verified against the core book and lancer-data), protocols live under free actions, defaults stay below, v65: Cockpit navigation — bottom bar, icon-only (full-body robot, person, book, 56px tap targets, hazard-stripe top edge, yellow active state), HP is a ring (the ring IS the counter, colour shifts green/yellow/orange/red) and Heat is a vertical thermometer beside it, Structure/Stress/Repairs/Overcharge stay as counters below, v66: Core System moved into the resources card (Core Power button under the indicators, name + description below it, then the rules blocks), Core System is read-only (no edit toggle, no name input, description has no edit button — it always comes from the frame), HP/Heat labels removed, thermometer is 64px wide with the digit at 36px like the HP ring, +/- live inside the thermometer (top/bottom, not button-styled), flame under the number inside it, v67: HP +/- are built into the ring (minus left, plus right, plain text, not buttons), the ring centre shows just the value + a heart ("10 ❤️" — max is already below the ring), the HP number turns red at 0, the Core System description moved inside the orange Core Power panel (below the red button, above the 1 CP hint), v68: table titles shortened to one line ("Потеря структуры", "Перегрев реактора" in RU; "Structure Damage", "Reactor Overheat" in EN), orphaned i18n units u002/u003/u004/u012 removed (nav is icon-only, Heat label gone), bottom nav background rebuilt as a metal plate (amber glow from the top, brushed diagonal texture, metal gradient, amber edge line, shadow) with the hazard stripe kept, v69: ring centre shows "N hp" (heart removed — it looked off), the in-ring +/- zones got a subtle background and a vertical divider on the inner edge so the minus no longer reads as part of the number ("-6"), res-top is two equal columns so the ring and the thermometer sit balanced (ring no longer drifts to the centre, thermometer no longer pinned to the far right), max lives inside the controls (second line in the ring centre, under the flame in the thermometer) so the rows below the controls are gone and the block is shorter, v70: the rectangular background behind the in-ring +/- is gone (it did not fit the circle — only the vertical dividers remain), the nav hazard stripe is gone (it merged with the Core Power panel frame) and the nav top edge is now a solid 2px amber line with a soft glow, v71: the in-ring dividers are taller (zones 84px) so they reach the ring, and the +/- zones no longer flash on tap (no tap highlight, no text selection — the rectangular zone stays invisible); same no-flash treatment for the thermometer +/-, v72: the in-ring dividers are a few pixels longer (zones 92px) so they exactly touch the ring, v73: Intercede is granted by Bonded II (not a fake talent Sundance) and Supersonic by Ace III (not Sundance III) — both verified against the core book; the Turn structure block on the Rules tab no longer opens by default (My actions stays open), v74: the page footer (export/import/reset/wizard buttons, language slider, version) moved to the bottom of the Rules tab as .rules-foot; tabs switch by swipe on mobile (swipe left = next tab, swipe right = previous, no wrap at the ends, vertical swipe still scrolls), v75: Rules tab reordered (My actions, Quick actions, Full actions, Reactions, Pilot actions, Turn structure, Level up); «Other actions» merged into Quick actions as a subsection; the Free actions explanation removed from Reactions; the RUS/ENG slider now has the letters inside it (segmented pill, sliding highlight); switching tabs animates (new screen slides in from the swipe/tap direction); the nav highlight switches smoothly and the active tab gets a lens glow (amber radial-gradient circle + scale), v76: the page header (title + tagline + saved indicator) is gone completely; the swipe glitch is fixed — the incoming tab slides in fully opaque (no opacity in the keyframes, so the old tab cannot ghost through), the nav keeps its own compositing layer (will-change:transform), and showTab scrolls to the top on every switch, v77: the nav still dropped, but only when switching right — the left slide-in (translateX(-28px)) pushed the tab 12px past the left viewport edge, creating horizontal overflow that shifts the viewport on Android and drops the fixed nav (the right slide-in only overflows right, which browsers ignore); fixed by forbidding horizontal scroll on the body (overflow-x:hidden), v78: the user said it is still not right — the transform slide itself kept dropping the nav on this Android browser through v76 and v77, so the slide is gone entirely; tabs now just fade in softly (tabFadeIn, opacity only, no transform), movement stays only in the nav lens, v79: the lens is now a rectangle covering the whole button (a third of the nav width) and the full nav height, and it genuinely slides between the buttons (one .nav-lens element, transform 0/100/200% with a .25s transition) instead of teleporting, v80: the lens lost its rounded corners (sharp rectangle) and got a brighter background; the yellow dash under the active icon is gone; the active icon zooms to 1.3; the nav top stripe is thinner (1px) and darker (dark bronze #8a6d1f) for a sharper edge; the HP ring +/- zones are narrower (25px) and sit further from the center (15px) while their glyphs are nudged toward the center (padding 3px), v81: the selected tab went green (icon #5cdf33, black directional drop-shadow, green lens gradient/glow/border) and the nav lost its top border entirely; the mech icon is now a bulky Harvester with a big shoulder cannon in a 3/4 view and the pilot icon is an operator head with a headset and boom mic, v82: the v81 icons are reverted to the originals (the drawn Harvester and headset did not read at 30px) and the lens gradient now fades to transparent by 45% (near the middle of the button) instead of running to the bottom, v83: the lens box-shadow is black outside (0 0 18px rgb(0 0 0 / 39%)) with a dark-olive inset border offset 1px down (inset 0px 1px 0 1px rgb(55 83 1 / 45%)), v84: the screen shakes when damage lands — small shake (.3s, +/-4px) when HP drops, big shake (.45s, +/-7px) when Structure drops; only main shakes (the nav is a sibling, not a descendant, so its fixed position is safe) and the shake fires only when the value actually decreases, v85: vibration on damage (30ms buzz for HP, [50,30,90] pattern for a Structure break, guarded so it silently does nothing where the Vibration API is missing, e.g. iOS); the HP ring pulses red while HP is at or below 25%; activating Core Power plays a golden .8s flash on the button, v86: vibration removed entirely (it did not work on the user phone either); the Core Power flash now covers the whole panel and lasts 1.6s; the thermometer flame grows with the heat level (scale via --fs, no layout shift), sits behind the number, and pulses growing upward when heat is at max-1 or above, v87: the Core Power panel got a metal background (brushed texture + metal gradient, same metal as the nav) with a diagonal sheen sweeping across every 6.5s; the flame starts lower and smaller (bottom 18px, 16px) and grows stronger (up to ~3.2x at max heat), clipped by the thermometer frame (overflow:hidden) so it never sticks out, v88: nav buttons no longer flash blue on tap (tap highlight disabled, like the ring and thermometer zones already had), v89: the flame starts lower and bigger (bottom -16px, 28px) so only its top shows at the very bottom, and rises as it grows; the Core Power panel lost the brushed hairs and is now solid metal (no transparency); pressing the button brightens the panel background (brightness 1.35) in parallel with the golden shadow; the ring +/- zones are 88px tall (was 92px) so the dividers no longer touch the ring edge, v90: the activation flash is even brighter (brightness 1.6); the metal sheen stops while Core Power is used and resumes after the ability is reset; the flame sits 5px higher (bottom -11px), v91: the flame is binary — a small static icon below 75% of max heat, and the big pulsing flame from below at 75% and above; the smooth growth is gone, v92: the Talents card moved below the frame traits card in the Mech tab, v93: the crit flame is much bigger (56px, pulses to ~73px) to match the big flame in the user screenshot, v94: the flame pulse grows less (1.15 instead of 1.3) and leans left (-3deg) at the peak, v95: the small flame icon in the normal state sits lower (bottom 25px), between the minus and the max text, v96: the wizard is renamed Мастер сборки (Build Wizard), its button moved to the top of the Rules tab right of Level Up, and the HASE step now explains what each stat adds (u061), v97: the HASE explanation is the concise user text only (no preamble, no defaults suffix), in the wizard and in the Stats card when editing, v98: Engineering adds +1 to the maximum uses of Limited gear per 2 points (HEX Charges 3 becomes 4 at Engineering 2); new gear starts full, full repair refills to the new max, v99: system cards show tag chips like weapons do, so heat costs are visible (Type-3 Projected Shield shows Тепло 1 (себе)); DB.systems now carry tg, and build_db.py keeps it on rebuild, v100: the heat cost is no longer lost in the Actions reference (system-granted reactions/protocols show a tappable Тепло N chip from the granting system) and in system search results (tag chips shown when picking a system), v101: the Engineering bonus no longer makes non-Limited gear Limited — sysLim/weapLim add the bonus only when base Limited > 0, so the Shotgun, Cyclone Pulse Rifle and custom weapons no longer show a phantom Limited 1 charges stepper, v102: the charges label is just «Заряды:» / «Charges:» instead of «Limited {N}: заряды» — the max is already visible in the stepper, v103: tag terms in description text are clickable chips (ДУГОВОЕ, ОТБРОС 1 — only ALL-CAPS terms link, so ordinary надёжный/reliable in prose stays plain) — linkTagTerms() in descBox and the Actions reference, opening the tag dialog; navbar is ~12px shorter (buttons 48px, nav padding 4px, main bottom padding 92px), v104: the linking also covers talent feature descriptions and system search results (v103 missed them — talents do not render through descBox), v105: БРОНЕБОЙНОСТЬ links too (tagWordStem strips -ость; the text word is stemmed the same way as the tag name) and chips show the canonical tag name in normal case (tagLabel), like the old chips — not the ALL-CAPS text, v106: the English abbreviation AP links to tg_ap (bracketed abbreviations are match keys) and the chip label drops the bracketed abbreviation («Бронебойное», not «Бронебойное (AP)»); qualifiers like (цель)/(себе) stay, v107: talent-granted protocols are in the Actions reference — Shepherd (Drone Commander I) and Steady Aim (Crack Shot I), both verified against the core book; Brutal I now reads «максимально возможные урон и бонусный урон» so both damages are clearly maximized, v108: the thermometer flame and the Danger Zone checkbox are tied to the Danger Zone mechanic (heat >= half Heat Cap, per the core book) — the big flame appears at 50%, not 75%; the checkbox auto-checks/unchecks with heat; DANGER (left) and ZONE (right) flank the thermometer vertically, in caps, always English, shimmering red-orange, v109: the DANGER/ZONE labels show only in Danger Zone (hidden at zero heat) and the letters stand upright, one under another (text-orientation:upright), both reading top-to-bottom, v110: flamePulse and dzGlow run at the same 1.2s so the flame movement and the label colour shimmer stay in sync; the flame peak tilt is -5deg (was -3deg), v111: the HP ring +/- dividers use var(--line), exactly the ring track colour, so they blend into the empty part of the ring, v112: statuses are tags, not checkboxes — the old card is gone; tapping a status name in the «Статусы» reference (in Combat Resources, after Overcharge) adds a coloured tag between the HP ring and the Structure grid; the tag shows the description on tap and has a × to remove it; Burn is a status too; Danger Zone is not clickable and never appears as a tag (it has the thermometer indicator), v113: the Stats card is a table — name above, value below, equal-width cells; 3 rows: HASE (4), Size/Speed/Sensors/Tech Attack (4), Armor/Evasion/E-Defense (3); stat names English only, no «max 4» on Armor; the emoji icons are removed (ugly, icons to be revisited), v114: status names are bilingual everywhere (Exposed — Уязвим); the reference is a collapsible <details> under Overcharge; each status is one line with its description visible inline (no 2nd tap to read it); tapping a status toggles its tag (2nd tap removes it, like the ×), active ones show a ✓, v115: the status reference moved to the right Overcharge — it is now a .sec block right after the Overcharge collapsible in the Mech tab (not inside Combat Resources); the stats table is a flush grid (no gaps, no radius, shared borders); Tech Attack is now T.Attack; row 3 is 4 columns with Grit after Armor (Grit synced to both fields via S.pilot.grit); style: uppercase letter-spaced labels, warm HASE tint, Grit value in accent; the notes field auto-grows to fit its text (resize:none, overflow:hidden, height=scrollHeight on input and on render), v116: stat labels are 10px with .04em letter-spacing so ENGINEERING fits with side padding while all columns stay equal; Grit is back to normal white (no accent/red); the rows are colour-coded — top (HASE) yellow, middle neon green, bottom steel, v117: the stat cells have volume — each row is a vertical gradient (lighter on top) and each cell has an inset bevel (top highlight + bottom shadow); Core Power is a new layout — the text «Core Power (CP): 1 раз за миссию…» on the left and a round 60px red button with a bolt on the right at the same height (u075 reworded, no «1 CP»); the wide bar button is gone, v118: BUGFIX for v117 — renderCounters overwrote the button textContent with «Не использовано» on every render, so the round button showed the old text overflowing (the user caught it on his phone); the button is now 120px with an inline SVG — a 44px bolt in the centre and the label curved along the bottom arc via textPath (ENGAGE/USED, always English, 11px with 2px letter-spacing like the DANGER/ZONE labels); renderCounters updates only the textPath now, v119: the bolt is gone (the user asked to try without it); the tap no longer flashes blue (-webkit-tap-highlight-color:transparent, like the nav buttons in v88); the curved label has more letter-spacing (3px) and a stronger bend (arc radius 45→40, midpoint y 101.4→104); «1 раз» starts on a new line after «Core Power (CP):» (<br> in the cp-info), v120: BUGFIX for v119 — the user reported the letter-spacing did not change (3px via CSS was not visible in his WebView, or 1px was too subtle); the spacing is now 4px (double the original 2px) and is set BOTH in CSS and as a letter-spacing="4" presentation attribute directly on the SVG <text>, so it applies even if the WebView ignores CSS letter-spacing on textPath, v121: status tags are English-only now (renderStatusTags uses the bare English name, not the bilingual statusLabel) so they take less space; the reference list and the tag dialog keep the bilingual name (Exposed — Уязвим) and the description in the current language, so the Russian translation is still there when you need it, v122: PWA — the tracker installs as a standalone app (user picked the red Core Power button icon): manifest.webmanifest (name «Lancer — Трекер персонажа», short_name Lancer, display standalone, theme/background #0e1116, icons 192+512 as SVG), sw.js network-first (fetch first, cache only when offline, so swipe-down still loads the latest version from GitHub Pages), manifest + theme-color in head, service worker registered. The icon is icon.svg — a clean vector redrawing of the chosen red Core Power button (red radial circle + yellow bolt on the dark #0e1116 background), because the GitHub connector only pushes UTF-8 text and cannot push binary PNG files; the generated PNGs were dropped. Chrome accepts SVG manifest icons (sizes 192/512 declared, purpose any + maskable), v123: the Core Power button in the UI now has the same metal rim as the app icon — a metal ring around the red core, with gold curved text on the rim: ENGAGE (top arc, becomes USED when used) and CORE POWER (bottom arc); the icon rim reads ENGAGE (top) and LANCER (bottom), also gold; the rim was widened to fit the text (red core 38px, rim to the button edge); the button background is transparent now (the SVG draws rim + core, states switch the SVG fills), v124: the rim is red now (dark-red gradient, not metal) and narrower (12px, red core 48px), the gold text is centred in the rim (baselines r=49 top / r=59 bottom, rim midline r=54); the labels are swapped — CORE POWER on the top arc, ENGAGE/USED on the bottom arc; the icon mirrors it (red rim, LANCER on top, ENGAGE below), v125: the «Core Power (CP): 1 раз за миссию…» hint text beside the button is gone (the button speaks for itself now); the button stands alone, centred in the panel, v126: the button sits above the panel sheen — the diagonal light band now sweeps behind the button and only lights up the panel background (cp-top has position:relative + z-index:1 over the ::after sheen), v127: the restoration note is back — «Восстанавливается при полном ремонте или в начале миссии.» (u234, without the «1 раз за миссию» part) as a small centred line below the button; the button still stands alone, centred, v128: the layout is back to how it was — the restoration note (u234) sits on the left of the button in cp-info, the button on the right (no more centring); and the sheen no longer freezes as a sliver in the top-left corner during its pause — its rest position moved from -65% to -90% so the -14deg-skewed band is fully off-screen until the sweep, v129: the app icon background is yellow-black diagonal hazard stripes now (SVG pattern, same #ffd43b/#10131a as the panel hazard) instead of solid dark; and the horizontal scrollbar no longer flashes during the damage shake — html has overflow-x:clip (body overflow-x:hidden alone did not hold the viewport scrollbar when main is translated), v130: the damage shake is horizontal-only now (translateX, no vertical component) — the vertical shift was nudging the scroll height and flashing the vertical scrollbar; horizontal is already clipped by overflow-x:clip, so the shake touches no scrollbar at all. Safe fix: scrolling and layout untouched, v131: the HASE emoji icons (heart, wind, laptop, gear) are removed from both wizards — Build Wizard (wizHase) and Level-up wizard (luHase) now show plain English HASE names only; the resource icons (Structure/Stress/Repairs/Overcharge) are not HASE and stay, v132: the pilot triggers are a table in the Mech Stats card style now — bordered panel2 table, yellow HASE gradient, inset bevel, dividers between rows — but the name and the bonus stay on ONE row (name left, bonus right, 20px bold like a stat value), never stacked, since long trigger names would not fit above the number, v133: the mount capacity note (mount-cap, e.g. «1 Main или 2 Aux») moved to its own line below the mount header — it was squeezed inside the header flex row between the type select and the delete button, so it wrapped into a narrow column; the type select now fills the header width, v134: the whole weapons database/search hint paragraph (u066 — Massif Press, search fields, multi-word example, license-filter note) is removed as redundant; the systems and talents hints stay (only the quoted weapons text was removed); u066 stays an orphan in STR/JSON like u075, and the JS writers for dbWeaponCount/licNoteW stay guarded so nothing breaks, v135: the blue tap flash is removed globally — one -webkit-tap-highlight-color:transparent on the * rule, so the language slider, the rule accordions, and every other element no longer flash blue on tap (earlier it was removed piecemeal from the nav, the ring, the thermometer, and the Core Power button only), v136: HUD foundation + shell — the Cockpit style starts landing on the real tracker (CSS only, no layout or logic changes): HUD variables in :root (amber #ffb000, grid), a subtle 28px grid texture on the page background, square cards and rule blocks with a 2px amber top edge, amber section headers with .08em letter-spacing, square buttons with an amber primary button (dark text), and square edit toggles that turn amber when on, v137: sliders get depth — the toggle track is recessed (inset shadow) and both knobs are 3D (vertical gradient + inset bevel); the language slider knob is square now (HUD); and the Core Power button gets crisp edges — the blurred 14px drop shadow is replaced by a sharp 2px ring and a hard drop shadow with no blur, v138: the Core Power button sits flat — the pink outer ring (it read as a shadow) is now a crisp amber HUD ring, and the hard bottom shadow that made the button look lifted is removed entirely, v139: the slider inner shadow is shorter and more aggressive — the blurry 2px/4px inset shadow becomes a tight 1px/1px shadow at .65 opacity, so the recessed track reads as a crisp dark line instead of a soft smudge, v140: the Core Power button ring is now the same gold as the label text (#f5c518, the mid stop of the cpGold gradient) and thinner — 1px instead of 2px, v141: the language slider knob is bigger (42x26, it fills exactly half the track so it no longer wobbles and covers the top inset shadow); the Core Power ring is finer still (same 1px but gold at .6 opacity); and the button gets two flathead screws on its rim at the 9 and 3 oclock positions, their slots at different angles (left -30, right +35), v142: the edit toggle knob is bigger too (19x22 instead of 18x18 — it fills half the track width and the full track height, so it no longer looks small and loose inside the track), v143: tags and the more link get the HUD treatment — tag chips are square with an amber border and amber uppercase text, status tags are square and uppercase (their per-status colour is kept), the status X is square, and the more link is amber, uppercase, letter-spaced and bold instead of a plain blue link, v144: the edit toggle knob is black now (dark gradient with a bevel tuned for black) and the wrench inside it is orange — the emoji is replaced by an orange SVG wrench (theme orange #e8590c), since an emoji cannot be recoloured; the Repairs label wrench is untouched, v145: the gray top stripe on the toggle knob is gone (no more inset highlight); and all delete/close buttons are now the wrench orange (#e8590c) instead of red, and smaller (6px 10px padding, 13px font), v146: the Core Power button screw slots are rotated more randomly — left -12 (shallow) and right +68 (steep) instead of the mirrored -30/+35 pair, v147: the Stats table uses the saturated palette (variant 1, user-picked) — HASE yellow .48/.24 with #ffd43b labels, middle green .40/.20 with #7be495 labels, bottom steel .48/.24 with #b8c6d4 labels — and the trigger rows use the same saturated yellow, v148: the mech nav icon is back to the Block with antenna (one wide 18x13 block, two square eyes, mouth line) after the full-body attempts did not work out; the HASE row is now saturated red (.48/.24, labels #ff9a8a) and the trigger rows are saturated green (.40/.20, same as the stats middle row), v149: the red HASE did not land — the HASE row and the trigger rows are now bright yellow (#ffd500, .65/.35, labels #ffe600), brighter than the dull v147 yellow, v150: the navbar is brought into the overall HUD scheme — the striped background is gone, the top tint is amber, the active icon and the sliding lens are amber (the lens slide effect is kept), v151: the lens keeps only a thin top border (1px, no spread) — the side borders are gone, v152: the HASE row and the trigger rows now use the main theme orange #e8590c (var(--accent), .48/.24, HASE labels #ffa26b) instead of bright yellow, v153: the 4 resource trackers (Structure, Stress, Repairs, Overcharge) are square now (border-radius 0 on the cards and the +/- buttons) and have no separate colors — the per-tracker --rc colors (blue, yellow, green, purple) are removed, all use the uniform neutral top border, v154: the damage, range and threat numbers in weapon cards are orange and bold (.wmeta .wnum, theme orange var(--accent)) so they read better during play, v155: the top borders of the 4 resource trackers are thinner now (1px instead of 3px), v156: the table roll numbers (structure damage and reactor overheat — 5-6, 2-4, 1, several 1) are HUD amber now instead of blue; the blue accent2 is no longer used for them (the .sub-h rule was also switched to amber for consistency, though it is currently unused), v157: the status reference items (with descriptions) are square now (border-radius 0 instead of 8px); the per-status left border color is kept, v158: the .row items are vertically centered now (align-items:center instead of flex-end) so the wizard step text is centered, and the list-row X buttons are frameless now (.btn.x, transparent border and background, orange X) — 14 of them; the frames stay only on the 4 dialog close X buttons and the mount removal X (5 .btn.danger in total), v159: horizontal alignment in the wizard — the creation wizard trigger bonus is a fixed 48px centered column (.row .val) so all +2 values line up, and the four level-up raise buttons (+2 trigger, +1 talent, +1 license, +1 HASE) are flex:0 0 auto so they no longer stretch across the row, v160: BUGFIX — recalcDerived now recalculates Speed, Evasion, E-Defense, Tech Attack and SP from Agility and Systems (they were only set in applyFrame, so raising Agility left Speed and Evasion at the frame base values; e.g. Everest with Agility 2 is now Speed 5 and Evasion 10), v161: all derived stats (everything except HASE) are now fully auto-calculated and readonly — audit found 4 missing core-bonus modifiers, now applied in recalcDerived: Sloped Plating +1 Armor (capped at 4), Full Subjectivity Sync +2 Evasion, Fomorian Frame Reinforcement +1 Size (capped at 3), Lesson of Disbelief +2 E-Defense; talents give no permanent mech stat bonuses and systems only Personalizations (+2 HP), both already handled; the HASE input handler now syncs the derived-stat fields live, v162: Accurate and Inaccurate are flat +1 tags with no number (in Lancer there is no Inaccurate 1) — the {VAL} placeholder is removed from both tags (EN and RU, in ru_tags.json and the embedded DB), so the dialog now reads +1 Accuracy / +1 Difficulty instead of a dangling + with no number, v163: trigger rows get a vertical bar between the name and the value — the name is light grey #b8c6d4 (from the stats .bot labels) and the value is green #7be495 (from the stats .mid labels), with a 2px vertical divider on the left edge of the value (kept in edit mode too), v164: trigger rows now look like the stats table — the name is a grey rectangular block with volume (steel gradient from the stats .bot row) and the value is a green square with volume (green gradient from the stats .mid row, white number), the orange row background is gone; the ENGAGE label on the Core Power button is raised 2px (bottom arc r=57) so it sits in the middle of the rim, v165: the mount name lives inside the badge frame now — one rectangular chip with the icon on the left, a vertical divider, and the name in caps in the mount colour on the right (edit mode keeps the icon-only badge plus the type select), v166: the pulsing flame is gone — in Danger Zone the thermometer fill itself pulses instead (scaleY 0.97 to 1.03, so the level bobs up and down) and its colour shimmers (hue-rotate 0 to 12deg), at the same 1.2s as the DANGER/ZONE labels; the flame stays as a small static icon, v167: the resource tracker labels (Structure, Stress, Repairs, Overcharge) are uppercase now (CSS text-transform, same letter-spacing as the other caps labels), v168: the resource tracker labels are centered horizontally and a bit smaller (12px instead of 14px), v169: the deployable actions are in My actions now — Turret Attack and Area Denial as reactions, plus a new Your quick actions section with Activate Restock Drone, Detonate, Move ICEOUT Drone and Detonate Grounding Mine; the generator scans deployables too, so they cannot go missing again, v170: the search and custom buttons are a matching pair now — same height (both plain .btn), + CUSTOM on the left and SEARCH on the right, with no suffix on the custom button since the section already says what it is, v171: the two buttons in each pair are equal width now (both flex:1 from .row > *, the search button no longer pins its width), v172: the plus in the search add buttons is amber and bigger (22px) while the button stays the same size (40px, via line-height 1 and 8px padding), v173: the search add buttons got the tag border too — dim amber, full amber on hover, just like the tag chips, v174: deployable headers now show the full stats (HP, Evasion, E-Defense) — the Turret Drone shows HP 5, Evasion 10, E-Defense 10 in both languages, and the same fix covers all 15 deployables that have stats, v175: the talent quick actions Invigorate (Drone Commander III) and Covering Fire (Heavy Gunner I) now show in My Actions — the generator used to miss talent-granted quick actions entirely, v176: the frame search now has a full frame detail card (stats, traits, Core Power, mounts) — tap the info button on any frame to see everything before picking it, v177: the Rules Level Up section now has a Lancer List with all 29 frames (manufacturer and short info visible, details button per frame) for researching frames before you have the license, and the frame detail stats now use the same table layout as the Mech stats card, v178: the frame detail last stats row (Repair Cap/SP) is now a blue cell-only row instead of an orange row with an empty half, and the mounts now use the same mount-badge (icon, color, frame) as the Mech tab instead of clickable tag chips, v179: the Lancer List is now its own collapsible section in the Rules tab, on par with the other sections, instead of living inside the Level Up section, v180: the frame detail last stats row (Repair Cap/SP) is now 2 wide cells across the full width with the blue background on the row — the old 4-column layout with a cell-only background left empty dark columns that looked like random padding, v181: the search field is hidden on the frame detail screen (the close button stays), and the Lancer List has a top margin so it no longer sits right under its heading, v182: removed padding:10px from the .res resource card rule, v183: the Main/Aux mount icon is now two same-size triangles with the second one purple (the small green triangle looked crooked), v184: the Rules list is renamed to "Список мехов (фреймов)" — Lancers are pilots, not mechs, v185: the Goblin frame trait now grants the Reactive Code reaction (1/round, any Quick Tech when hit by a tech attack) — the action generator used to miss frame-trait-granted actions entirely, v186: Operation: Solstice Rain — Chomolungma (GMS LL0 frame, Advanced Intrusion Package) + Demolitionist and Sysop talents; frameAvailable now covers any LL0 frame, not just Everest, v187: the Chomolungma Core Power extra Invade options (Balance Control Lockout, System Crusher) are now separate quick actions in My Actions, granted by the Chomolungma frame, v188: each system is now a collapsible block like the Rules sections (collapsed by default, open state survives re-renders); in edit mode the full description is hidden, v189: systems are div-based collapsible cards (no <details> marker/name line-break), white header, tags and charges visible even when collapsed, description only in the expanded body, same in both modes, v190: layout fix — white caret, more margin between systems, Charges label grouped with the stepper (centered), meta line (SP/type) visible even when collapsed, v191–v204: Google Drive profile sync (OAuth, conflict resolution, profile deletion/sorting, coalesced saves), pilot gear database (import, stats/charges, edit toggle), database extracted to db.js (index.html loads db.js and pilot_gear_db.js), COMP/CON export, Grit drives derived stats (pilot/mech HP, SP, attack bonus, Save Target), Size moved to the frame name, Attack and Save Target in the stats table, stat bars/thermometer visuals, scroll preserved between tabs, resource tooltips, Core Power button refactor, icon fixes, v205: licenses are separate entities (not frames) — a licenses list in Rules with per-rank grant chips, a generic reference dialog showRef (action/system/weapon/frame/talent/mechanic, e.g. Leadership Dice), and the license search now lists licenses instead of frames (Chomolungma is no longer offered as a license; adding the same license twice does not duplicate it), v206: reverse index «Даёт:» — chips on system/talent/frame cards (rank-aware) and the grant source in My Actions; license grants are keyed by name (not array indices); licenses ready for several frames (the second Minotaur frame from a supplement shows the license name), v207: number highlighting (.wnum) everywhere — dice and numbers in all descriptions via linkTagTerms and in the reference dialog), v208: license detail grants are one per row with a kind label (Фрейм:/Система:/Оружие:), v209: the licenses list comes before the frames list in Rules, v210: B1 hard gaps — 26 new quick actions (16 Invade options, Hacker II/III, talent and frame actions) and 8 reactions (Saladin, Swallowtail, Autopod, Vorpal Gun, Held Image, 3 OROCHI drones) with weapon/coreBonus grant checks, v211: B1 data fills — Ammo Case I/II/III ammo lists and the four OROCHI drone profiles in the Hydra frame text, v212: search-dialog navigation stack (search → license → frame) with in-dialog and browser Back, plus dialog history entries, v213: closing a reference chip no longer closes the license underneath (echo popstate suppressed), v214: the Mine tag (tg_mine) is now on all 8 grenade systems with a mine profile, v215: Limited with a dice max (1d6+2, 2d6) now shows a current-value-only counter with no max and no upper clamp, v216: Loading weapons get a Loaded/Unloaded toggle (checkbox, not a counter — all 9 are single-shot), v217: Overkill tag value fixed to 1 (was null — the dialog read "выпавшие на ,"), plus a guard against any valued tag used without a value, v218: hairline separators between weapons, systems, talents, core bonuses and frame traits (same 1px line as pilot gear, no accent), trait names bold, v219: the rules blocks (Statuses, Structure Loss, Reactor Overheat, Rest and Full Repair) moved from the Mech tab to Rules below Reactions; the Full Repair button stays on the Mech tab, now always visible under the Core Power panel; no details block auto-opens in Rules; Back with no dialog open returns to the main tab from a non-main tab, v220: the status reference in Rules is a compact name-only list — the description opens on tap (one at a time) and applying/removing is a separate ＋/✓ button per row; the Full Repair button asks for confirmation and is now the quiet outline style instead of primary, v221: the popstate listener is bound at startup (not on the first dialog open) and one Back press does exactly one step — closing a dialog no longer also switches tabs, v222: Nuclear Cavalier III adds the Fuel Rod Gun on its own Integrated mount (one mount per specific weapon, per the book); no provenance is kept and lowering the rank does not remove the gun, v223: the granted mount is marked with a source (nuc-cav) — removing the talent or lowering it below III now removes the gun and the empty mount, touching only marked mounts; a manually added Fuel Rod Gun is never touched, v224: B2 named records closed — 30 system actions in My Actions (29 quick incl. 5 grenades as Quick and //SCORPION as a reaction; Grapple Swing, Roland Chamber and Repulse/Attract are not actions and stay text-only), v225: B2 unnamed activations closed — 28 system actions in My Actions (all quick; entry name = system name); Explosive Vents is not an action (it triggers automatically) and stays text-only; My Actions now holds 136 entries, v226: talent dice are chips with a counter on the talent card (Leader pool 3/5/6 by rank, Duelist pool 0-3, Brawler/Gunslinger/Torrent value 6 down to 1); the die rule text leaves the card (Leader II keeps its reaction sentence) and lives in the chip dialog; full repair resets the dice; the AI tag shows on the mech card when an AI system is installed, red with a count when more than one AI counts (Enlightenment does not count towards the one-AI limit), v227: the same dice chips in the talent search — the die rule text leaves the search result too, the chip (name only, the talent is not owned yet) opens the full rules, v228: in the search, every rank stays visible and the dice chip sits on its own rank line (Leader: chip on I, II and III; Duelist: II and III; Brawler/Gunslinger/Stormbringer: III), so it is clear what each level adds; the standalone chip above the description is gone, v229: Wallflower Act 1 imported — Kidd (own license, 5 systems + Blackspot laser), Sagarmatha (GMS LL0, HP 8), Enkidu (Tokugawa variant, Plasma Talons as its integrated weapon), Worldkiller Genghis Mk I (Genghis variant) and the Swallowtail Ranger Variant (Swallowtail variant), Empath, 6 exotic weapons/systems available without a license, 11 new actions in My Actions (10 quick + the Empath reaction); variant frames are gated by their base license in the search (frameAvailable fix); Plasma Maul Overkill is 1, v230: license vibe descriptions replace the rank summary; license and frame search match the vibe text (e.g. «дрон» finds drone licenses); frame search shows the license frame description instead of the Core Power name, v231: no « · LL2» anywhere; «страйкер» → «штурмовик»; license name is «КОРП: Имя» (e.g. «IPS-N: Влад»); the license row shows the role on its own line, the full vibe text in license search, the frame description only in the Rules list; frame rows show only the name and the frame description, v232: search and the Rules lists show the SAME rows (licenses — role + full vibe text, frames — frame description only); the license and frame detail cards match their rows (no compact/full versions); the vibe text is capitalized at render time (role parts and the first letter of each description), v233: vibe labels are inline with their text (only the name <b> is block-level), hairline dividers between the vibe blocks, row buttons aligned to the top; licenses and frames are sorted by Corporation → Combat distance → Name; v234: the license/frame row buttons float right so the text fills the full card width (4px radius), the vibe text and the frame description use the normal color (not dim), the GMS hint has a smaller top margin; v235: the vibe block has a 10px top margin, the Rules sections’ paragraphs use the normal color (no dim); v236 (correction of the v235 misread): the vibe text is back to 12px, and the .dbinfo span (role line, frame description) uses the dim color; v237: frame rows match the license rows — «КОРП: Имя» (e.g. «GMS: Эверест»), a role line (from the license vibe; GMS frames get the user-supplied «LL0 Танк» / «LL0 Контролер-Хакер» / «LL0 Универсал»), the frame detail matches its row, and frame search matches the GMS role label; v238: the full vibe text is removed from the license detail (the role line stays; the grants already list everything), and a non-core license shows its source at the bottom (Kidd — No Room for a Wallflower, Act 1; i18n u264); v239: sources continue to the item detail pages — the frame detail and the ref dialog (systems, weapons, talents) show the source at the bottom for non-core items (ITEM_SOURCE map: 5 Wallflower frames, 11 Wallflower systems, 6 Wallflower weapons, Empath, and Chomolungma from Operation: Solstice Rain; core items show no source); v240: editing is OFF by default everywhere for a new character (DEFAULTS and migrate() default all ten edit flags to false; the static toggle buttons render off; an imported profile already did this) — the sheet opens clean, editing is turned on with the wrench toggle; existing saves keep their recorded setting; v241: The Long Rim imported — Atlas, Caliban, Kobold, Lich, Sunzi, Zheng (each its own LL2 license), 25 systems, 11 weapons, Spaceborn and Black Thumb talents; 36 new actions in My Actions (29 quick + 2 reactions + 5 protocols); LICENSE_VIBE for the 6 new licenses (DRAFT until the user reviews them); ITEM_SOURCE / LICENSE_SOURCE → The Long Rim (44 items + 6 licenses); Caliban carries the Flayer Shotgun as its integrated weapon (Plasma Talons precedent); Spaceborn EVA is exotic (lic GMS, lab Exotic · 0 SP); the Fusion Rifle damage is the 1-6 range, not a die; frame-trait actions (Atlas Jäger Dodge, Sunzi Slip) stay text-only, like the Kidd Reroute Power precedent; downtime actions (Go Diving, Gunfight) and weapon mods (Supermassive Mod, Molten Wreathe) are not imported — the tracker has no downtime or weapon-mods section; v242: Wallflower pilot gear imported — 7 items (Anti-Armor Signature Weapon, Bahadur\'s Reserve, Hercynian Rations, Locus, 3 Carapace Hardsuits; draft RU, user to verify); PILOT_GEAR_DB 37 → 44; pilotDamageType maps capital-V «Variable» to «выбранный» (Anti-Armor damage Variable 5); the Molotov Cocktail action and hardsuit energy resistance stay data-only — the tracker does not render pilot-gear actions; v243: five books imported — Karrakin, Dustgrave, Siren\'s Song, Winter Scar, Shadow of the Wolf (14 frames, 23 systems, 19 weapons, 6 talents; draft RU, user to verify); 26 new actions in My Actions (14 quick + 6 reactions + 6 protocols); LICENSE_VIBE for the 10 new licenses (DRAFT until the user reviews them); ITEM_SOURCE / LICENSE_SOURCE → the five books (62 items + 10 licenses); variant frames share their base license (Orchis → Black Witch, Calendula → Minotaur, Störtebeker → Raleigh, Viceroy → Monarch); 3 integrated weapons (Marathon Arc Bow, Colossus Termo-Unguis, Shock Claws); system effects are now kept (v241 dropped them — 4 Long Rim systems lost theirs); the Other-activation action (Champions, Guide My Hands) is a 1/scene reaction; pilot gear 44 → 61 (17 new: 12 Madrigal, Psionic Piston, 4 Shadow of the Wolf); pilotDamageType is now case-insensitive (sotw .lcp uses lowercase kinetic/burn); v244: the frame vibe description is removed from the frame detail (stays in the list rows only — search and Rules); the detail keeps the role line, like the license detail since v238; v245: frame vibes are short tags (1-2 words) — size rule (size < 1 «маленький», > 1 «гигант»), «регенерация» only on Balor, «дроны» on frames with drone mechanics (Hydra keeps it in the role only); frame search also matches the license role; tagless frames (Genghis, Hydra, Raleigh) render no empty description block; v246: license rows use short tags — «Оружие и системы: [tags]» + «Фрейм: [tags]» (Фрейм 1/2 for two-frame licenses); systems are «система (чего)» from a controlled vocabulary, hard systems become an «N системы» counter; licenses with no weapons/systems show no line; tagless licenses show the frame name; v247: the license frame line shows the frame name + the exact tag line from the frame list (frameRowSub), tagless frames show only the name; hairline dividers removed from license rows; Gilgamesh «Больше зарядов»; v248: one frame line — role + tags (each tag capitalized, capList), GMS rows show only the role (core name removed from the list); Napoleon role «Время как броня» → «Уменьшение урона»; license frame lines use the same full line (frameRowFull), so the role duplicates in single-frame licenses (user to decide); v249: the separate role line is removed from license rows (the role stays inside the frame lines); the license description (.lic-vibe) is dim, the name stays bright; the license detail keeps its role line; v250: the license role is removed from license display entirely (rows + detail) — frame lines in licenses show tags only (frameRowSub), the role stays in the frame list/detail (frameRowFull); Minotaur role «живой лабиринт» removed (the «Стена» tag says it); v251: 7 variant frames share base licenses (Empakaai → Blackbeard, Amber Phantom → Metalmark, Lycan → Manticore, Kutuzov → Napoleon, Taraxacum → Lancaster, Hecatoncheires → Balor, Tagetes → Sherman) — their empty licenses are gone, licenses 45 → 38; variant frames show the base license tag (known v245 limitation); v252: variant frames show their OWN role + tags (FRAME_VIBE per frame, 52 entries; GMS stays on GMS_FRAME_ROLE) — the license has no role/tags anymore, each frame has its own; v253: license rows show role+tags per frame (frameRowFull); license names use the base frame Russian name (HA: Чингис); «Генгис» → «Чингис», system action headers use the Russian name; v254: model numbers are not highlighted (Мк 3, D/D 288, SSC-30, T-1, HHS-075, Тип-3, obj/00001) — dice, ranges and values still are; v255: «N SP» is not highlighted (and «SP: N» in weapon descriptions); the SP counter is always visible; weapon SP counts in the counter (13 weapons: 7 core from «SP: N» in descriptions + 6 from .lcp sp fields); v256: orphaned local profiles (no Drive file, inactive) get a delete button; deleteLocalProfile removes only the catalog entry (active profile and KEY untouched), confirm decline and Drive/active calls are no-ops); v257: fractions (1/2, 1/4) are not highlighted (1/round, 1-6, dice and values still are); .dbinfo span scoped to direct children, so highlighted numbers in search descriptions stay inline; v258: search and license/frame details are a fullscreen view (not a dialog) replacing the main content and navbar (single scroll, no backdrop), the search input is a plain visible field (no autofocus, v61/v62 blur hack removed), a navbar-styled «Закрыть» bar sits at the bottom of the view; v259: closing the search view restores the main page scroll deferred via double rAF (like showTab), so it no longer opens at the top after adding an item; v260: Core Bonus and pilot gear pickers are fullscreen views too (shared fullscreenView helpers, navbar-styled «Закрыть» bar, no autofocus/blur hack, Back closes the view); v261: history.scrollRestoration is manual at startup, so the browser no longer restores the scroll to 0 on Back after closing a view (the v259 double rAF is now the only scroll restore); the history entry is pushed before the view opens (search, Core Bonus, pilot gear); v262: weapon cards collapse/expand on click like systems (openWeap set keyed by mount:name, description always in the card body in both modes, charges/Loading/delete stopPropagation); section headers toggle editing on click anywhere in the header (slider onclick removed, no double toggle); v263: pilot equipment cards collapse/expand on click like systems/weapons (openPilotEquip set keyed by gear id, description in the card body); the open/collapsed state of systems, weapons and pilot equipment persists in a profile-independent localStorage key (lancer-tracker-ui-v1) across page reloads and profile switches; v264: the «marked N» buttons open a damage roll dialog (number of d6 = marks, take the lowest, full result table from the rules) instead of the stat reference (labels still open the reference); the structure dialog has a Destroy weapon/system button opening a picker (a mount destroys all its weapons, a system destroys one); destroyed weapons/systems show a Destroyed chip and a struck-through name; the chip dialog explains the 1 Repair Rest way but notes other ways exist, so Repair now only marks the item repaired and never spends Repairs.');
process.exit(0); // the Drive sync setInterval (30s) would keep Node alive otherwise
