'use strict';

// Actor JSON for Dark Heresy 2E [Apex Edition] 0.1.4 (Foundry 14).
const APEX_STAT_KEYS = VEND_STAT_KEYS;
const APEX_SKILL_ROOTS = {
  Acrobatics:'acrobatics',Athletics:'athletics',Awareness:'naturalist',Charm:'speech',
  Command:'command',Commerce:'barter','Common Lore':'commonLore',Deceive:'deceive',
  Dodge:'dodge','Forbidden Lore':'forbiddenLore',Inquiry:'inquiry',Interrogation:'interrogation',
  Intimidate:'intimidate',Linguistics:'linguistics',Logic:'logic',Medicae:'doctor',
  Navigate:'navigate',Operate:'operate',Parry:'parry',Psyniscience:'psyniscience',
  'Scholastic Lore':'scholasticLore',Scrutiny:'scrutiny',Security:'lockpicking',
  'Sleight of Hand':'theft',Stealth:'stealth',Survival:'survival','Tech-Use':'repair',Trade:'trade'
};
const APEX_ORIGIN_KEYS = {admin:'administratum',arbite:'arbites',astra:'astraTelepathica',admech:'mechanicus',guard:'imperialGuard'};
const APEX_APTITUDE_KEYS = {
  'Weapon Skill':'weaponSkill','Ballistic Skill':'ballisticSkill',Strength:'strength',Toughness:'toughness',
  Agility:'agility',Intelligence:'intelligence',Perception:'perception',Willpower:'willpower',
  Fellowship:'fellowship',General:'general',Offense:'offence',Defense:'defence',Fieldcraft:'fieldcraft',
  Social:'social',Knowledge:'knowledge',Leadership:'leadership',Tech:'tech',Finesse:'finesse',Psyker:'psyker'
};
const APEX_SPECIALISATION_NAMES = {
  'Wysoki Gotyk':'High Gothic',powierzchnia:'Surface',naziemne:'Surface',Osnowa:'Warp',
  Płatnerz:'Armourer',wręcz:'Melee',dystansowy:'Ranged',dystansowa:'Ranged',
  'atak w zwarciu':'Melee','atak dystansowy':'Ranged',zimno:'Cold',gorąco:'Heat',strach:'Fear',
  'moce psioniczne':'Psychic Powers',użytkowe:'Utility',balistyczne:'Weapon',
  balistyczny:'Ballistic',manipulacyjny:'Manipulator',medyczny:'Medicae',narzędziowy:'Utility',optyczny:'Optical',
  Orkowie:'Orks',Mutanci:'Mutants',Psionicy:'Psykers',Demony:'Daemons',Obcy:'Xenos'
};
const APEX_STARTING_GEAR_ALIASES = {
  Autoquill:'Auto Quill','Medi-Kit':'Medi-kit',
  'Enforcer Light Carapace Armour':'Enforcer Light Carapace',
  'Carapace Chest Plate':'Carapace Chestplate',
  'Monotask Servo-skull (Utility)':'Monotask Servo-Skull',
  'Monotask Servo-skull (Laud Hailer)':'Monotask Servo-Skull',
  'Optical Mechadendrite':'Mechadendrite',
  'Grapnel and Line':'Grapnel & Line',
  'Armoured Body Glove':'Armoured Bodyglove',
  'Glow-globe':'Glow-globe/Stablight',
  Injector:'Inhaler/Injector'
};

function apexEnglish(value) {
  const text = String(value ?? '').trim();
  return Object.keys(PL_TERMS).find(key => PL_TERMS[key] === text) || APEX_SPECIALISATION_NAMES[text] || text;
}
function apexSkillKey(name, warnings) {
  const match = String(name).match(/^(.+?) \((.+)\)$/);
  const root = match ? match[1] : name;
  const base = APEX_SKILL_ROOTS[root] || APEX_SKILL_ROOTS[apexEnglish(root)];
  if (!base) { warnings.push(`Umiejętność ${name} nie ma klucza w Apex.`); return null; }
  if (!match) return base;
  const spec = apexEnglish(match[2]);
  const key = base + spec.replace(/[^A-Za-z0-9]+/g,' ').trim().split(' ').map(word => word[0].toUpperCase()+word.slice(1)).join('');
  if (!APEX_VALID_SKILLS.has(key)) warnings.push(`Specjalizacja ${name} nie występuje na liście umiejętności Apex.`);
  return key;
}
function apexCatalogItem(type, name) {
  const source = APEX_CATALOG[`${type}:${name}`];
  return source ? structuredClone(source) : null;
}
function apexByKey(type, key) {
  const source = Object.values(APEX_CATALOG).find(item => item.type===type && item.system?.dh2e?.key===key);
  return source ? structuredClone(source) : null;
}
function apexTalentName(value) {
  const raw = String(value ?? '').trim();
  const translated = plText(raw);
  const complete = APEX_TALENT_NAMES[translated] || APEX_TALENT_NAMES[raw];
  if (complete) return {name:complete,spec:''};
  const match = translated.match(/^(.+?) \((.+)\)$/);
  if (!match) return {name:apexEnglish(translated),spec:''};
  const name = APEX_TALENT_NAMES[match[1]] || apexEnglish(match[1]);
  return {name,spec:match[2].split(', ').map(apexEnglish).join(', ')};
}
function apexAddTalent(items, value, warnings) {
  const {name,spec} = apexTalentName(value);
  const specs = name==='Weapon Training' && spec.includes(', ') ? spec.split(', ') : [spec];
  for (const oneSpec of specs) {
    const item = apexCatalogItem('talent',name);
    if (!item) { warnings.push(`Zdolność ${value} nie ma wpisu w kompendium Apex.`); continue; }
    item.system.dh2e.spec = oneSpec;
    items.push(item);
  }
}
function apexGearName(raw) {
  if (APEX_STARTING_GEAR_ALIASES[raw]) return APEX_STARTING_GEAR_ALIASES[raw];
  const polish = plText(raw);
  return APEX_GEAR_NAMES[polish] || APEX_GEAR_NAMES[raw] ||
    (Object.values(APEX_CATALOG).some(item=>item.name===raw&&['weapon','armour','forceField','gear','drug','cybernetic','ammunition','weaponModification'].includes(item.type))?raw:null) ||
    apexEnglish(polish);
}
function apexGearPieces(value) {
  const raw = typeof value==='string' ? value : value.name;
  const names = {
    'Warhammer and Stub Revolver':['Warhammer','Stub Revolver'],
    'Laspistol and Sword':['Laspistol','Sword'],
    'Młot bojowy oraz rewolwer':['Warhammer','Stub Revolver'],
    'Pistolet laserowy oraz miecz':['Laspistol','Sword']
  };
  return names[raw] || [raw];
}
function apexGearVariant(raw) {
  const match=String(raw).match(/(?:Mechadendryt|Servo-skull|serwoczaszka)[^()]*\(([^()]+)\)/i);
  return match ? apexEnglish(match[1]) : /Optical Mechadendrite/i.test(raw) ? 'Optical' : '';
}
function apexAddGear(items, value, warnings, clips) {
  for (let raw of apexGearPieces(value)) {
    let quantity = 1;
    const count = String(raw).match(/^(\d+)\s+(?:doses? of|vials? of|dawki?|fiolki?|lio-szlugów|lho[- ]?sticks?)\s+(.+)$/i);
    if (count) { quantity=Number(count[1]); raw=count[2]; }
    else if (/^\d+\s+(?:Lho Sticks|lho-szlugów)$/i.test(raw)) { quantity=Number.parseInt(raw,10); raw='Lho-Sticks'; }
    const name = apexGearName(raw);
    const item = ['weapon','armour','forceField','ammunition','weaponModification','drug','gear','cybernetic']
      .map(type=>apexCatalogItem(type,name)).find(Boolean);
    if (!item) { warnings.push(`Przedmiot ${raw} nie ma wpisu w kompendium Apex.`); continue; }
    item.system.quantity = quantity;
    if (item.type==='armour' && !items.some(existing=>existing.type==='armour'&&existing.system.equipped)) item.system.equipped=true;
    if (item.type==='forceField') item.system.equipped=true;
    const variant=apexGearVariant(raw);
    if (variant) {item.flags={creator:{variant}};item.system.description=`<p>Variant: ${vendText(variant)}</p>`;}
    items.push(item);
    if (item.type==='weapon' && item.system.dh2e?.weaponClass!=='melee') {
      const clip = clips.get(item.system.dh2e?.gearKey);
      if (clip) { const ammo=structuredClone(clip);ammo.system.quantity=2;items.push(ammo); }
    }
  }
}
function createApexActorData(value) {
  const checked=validateCharacter(value), previous=character;
  character=checked;
  try {
    if ([...checked.Talents,...checked.Skills].some(name=>ADV_PLACEHOLDER.test(name)) ||
        advDivinationBenefit().talent?.includes('do wyboru')) throw new Error('Dokończ wybór specjalizacji przed eksportem do Apex.');
    const state=advanceState(),warnings=[],items=[],characteristics={},characteristicAdvances={},skills={};
    for (const [stat,key] of Object.entries(APEX_STAT_KEYS)) {
      characteristics[key]=checked[stat]+(advDivinationBenefit().stat===stat?2:0);
      if (state.stats[stat]) characteristicAdvances[key]=state.stats[stat];
    }
    for (const name of advKnownSkills()) {
      const key=apexSkillKey(name,warnings);
      if (key) skills[key]={rank:Math.min(4,advSkillRank(name))};
    }
    const talentNames=[...checked.Talents];
    const divination=advDivinationBenefit();
    if (divination.talent) talentNames.push(divination.talent);
    if (state.elite==='untouchable') talentNames.push('Odporność (moce psioniczne)');
    if (state.elite==='inquisitor') talentNames.push('Znajomości (Inkwizycja)');
    talentNames.push(...state.talents,...state.customTalents.map(entry=>entry.name));
    talentNames.forEach(name=>apexAddTalent(items,name,warnings));
    for (const [type,key] of [['homeWorld',checked.homeworld],['background',APEX_ORIGIN_KEYS[checked.background]||checked.background],['role',checked.role]]) {
      const item=apexByKey(type,key);
      if (item) items.push(item); else warnings.push(`Brak wpisu pochodzenia ${type}:${key} w Apex.`);
    }
    if (state.elite) {
      const item=apexByKey('eliteAdvance',state.elite);
      if (item) items.push(item); else warnings.push(`Brak rozwinięcia elitarnego ${state.elite} w Apex.`);
    }
    const clips=new Map(Object.values(APEX_CATALOG).filter(item=>item.type==='ammunition'&&item.system?.dh2e?.standardFor).map(item=>[item.system.dh2e.standardFor,item]));
    [...checked.Equip,...checked.AdditionalGear].forEach(value=>apexAddGear(items,value,warnings,clips));
    items.forEach(item=>{item._id=vendId();});
    const sanctioned=state.elite==='psyker'&&checked.background==='astra';
    const traits=checked.background==='admech'?[{key:'mechanicus-implants',spec:'',value:0}]:[];
    if (state.elite==='psyker') traits.push({key:'psyker',spec:'',value:0},...(sanctioned?[{key:'sanctioned',spec:'',value:0}]:[]));
    if (state.elite==='inquisitor') characteristics.influence+=1;
    const aptitudes=[...new Set(advAptitudes().map(name=>APEX_APTITUDE_KEYS[name]).filter(Boolean))];
    const index=PL_DIVINATIONS.findIndex(([title])=>checked.Divination?.startsWith(`${title}:`));
    const englishDivination=index>=0?Object.values(divinations)[index]?.name||'':'';
    const actor={
      name:checked.Name||'Acolyte',type:'character',img:'icons/svg/mystery-man.svg',
      system:{description:'',characteristics,skills,dh2e:{
        details:{divination:englishDivination},homeworld:checked.homeworld,
        background:APEX_ORIGIN_KEYS[checked.background]||checked.background,role:checked.role,
        aptitudes,xp:{total:1000,spent:advanceSpent()},characteristicAdvances,
        eliteAdvances:state.elite?[state.elite]:[],traits,
        psyRating:state.elite==='psyker'?Math.max(sanctioned?2:1,(state.psyRating||1)+(sanctioned?1:0)):0,
        psykerClass:state.elite==='psyker'?(sanctioned?'bound':'unbound'):'',
        corruption:state.corruption||0,wounds:checked.Wounds,
        fate:{threshold:checked.Fate,value:checked.Fate},fatigue:0
      }},items,effects:[]
    };
    return {actor,warnings};
  } finally { character=previous; }
}
function downloadApexActor() {
  const status=el('apexExportStatus');
  try {
    character.Name=el('saveCharName').value.trim()||character.Name||'Acolyte';
    const {actor,warnings}=createApexActorData(character);
    const link=document.createElement('a');
    link.href='data:application/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(actor,null,2));
    link.download=`${vendKey(actor.name)||'acolyte'}-apex.json`;
    document.body.append(link);link.click();link.remove();
    status.textContent=warnings.length?`Pobrano JSON Apex. Do sprawdzenia: ${warnings.join(' ')}`:'Pobrano JSON Apex z angielskimi wpisami kompendiów.';
  } catch(error) {status.textContent=`Nie udało się wyeksportować do Apex: ${error.message}`;}
}
