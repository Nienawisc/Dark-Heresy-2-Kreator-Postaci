'use strict';

// Schemat aktora acolyte systemu Vendare/DarkHeresy2E-FoundryVTT 4.4.0.1.
// https://github.com/Vendare/DarkHeresy2E-FoundryVTT/blob/master/template.json
const VEND_SKILL_KEYS = {
  Acrobatics:'acrobatics',Athletics:'athletics',Awareness:'awareness',Charm:'charm',
  Command:'command',Commerce:'commerce','Common Lore':'commonLore',Deceive:'deceive',
  Dodge:'dodge','Forbidden Lore':'forbiddenLore',Inquiry:'inquiry',Interrogation:'interrogation',
  Intimidate:'intimidate',Linguistics:'linguistics',Logic:'logic',Medicae:'medicae',
  Navigate:'navigate',Operate:'operate',Parry:'parry',Psyniscience:'psyniscience',
  'Scholastic Lore':'scholasticLore',Scrutiny:'scrutiny',Security:'security',
  'Sleight of Hand':'sleightOfHand',Stealth:'stealth',Survival:'survival',
  'Tech-Use':'techUse',Trade:'trade'
};
const VEND_STAT_KEYS = {
  WS:'weaponSkill',BS:'ballisticSkill',S:'strength',T:'toughness',Ag:'agility',
  Int:'intelligence',Per:'perception',WP:'willpower',Fel:'fellowship',Infl:'influence'
};
const VEND_AVAILABILITY = {
  Wszechobecne:'ubiquitous',Pospolite:'abundant',Liczne:'plentiful',Powszechne:'common',
  'Średnio Dostępne':'average',Niezwykłe:'scarce',Rzadkie:'rare',Niespotykane:'very-rare',
  Wyjątkowe:'extremely-rare','Niemal Unikalne':'near-unique',Unikalne:'unique'
};
const VEND_SPECIALITIES = {
  commonLore:'adeptaSororitas adeptusArbites adeptusAstartes adeptusAstraTelepathica adeptusMechanicus administratum askellonSector chartistCaptains collegiaTitanicu ecclesiarchy imperialCreed imperialGuard imperialNavy imperium navigators planetaryDefenceForces rogueTraders scholaProgenium tech underworld war',
  forbiddenLore:'archaeotech chaosSpaceMarines criminalCartelsAndSmugglers daemonology heresy theHorusHeresyAndTheLongWar inquisition mutants officioAssassinorum pirates psykers theWarp xenos',
  linguistics:'chapterRunes chaosMarks eldar highGothic imperialCodes lowGothic mercenary necrontyr ork technaLingua tau underworld xenosMarkings',
  navigate:'surface stellar warp',operate:'surface aeronautica voidship',
  scholasticLore:'astromancy beasts bureaucracy chymistry cryptology heraldry imperialWarrants judgement legend numerology occult philosophy tacticaImperialis',
  trade:'agri archaeologist armourer astrographer chymist cryptographer cook explorator linguist loremancer morticator performancer prospector scrimshawer sculptor shipwright soothsayer technomat voidfarer'
};
const VEND_COMPOSITE_GEAR = {
  'Warhammer and Stub Revolver':['Warhammer','Stub Revolver'],
  'Laspistol and Sword':['Laspistol','Sword']
};

function vendText(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
function vendAptitude(name){return plText(({Offence:'Offense',Defence:'Defense'})[name]||name);}
function vendId(){
  const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes=crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes,byte=>alphabet[byte%alphabet.length]).join('');
}
function vendKey(value){
  const words=String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,' ').trim().split(/\s+/).filter(Boolean);
  return words.map((word,index)=>index?word[0].toUpperCase()+word.slice(1):word[0].toLowerCase()+word.slice(1)).join('')||'specjalizacja';
}
function vendSpecialityKey(root,name){
  const aliases={'Wysoki Gotyk':'High Gothic','powierzchnia':'Surface','naziemne':'Surface','Płatnerz':'Armourer','Adeptus Ministorum':'Ecclesiarchy','Adeptus Administratum':'Administratum'};
  if(root==='Navigate'&&name==='Osnowa')return 'warp';
  const english=aliases[name]||Object.keys(PL_TERMS).find(key=>PL_TERMS[key]===name)||name;
  return vendKey(english);
}
function vendSkillCost(name,rank,base,state){
  const recorded=state.skillCosts[name];
  if(Array.isArray(recorded)&&recorded.length===rank-base)return recorded.reduce((sum,cost)=>sum+cost,0);
  let cost=0;for(let level=base+1;level<=rank;level++)cost+=advSkillPrice(name,level);
  return cost;
}
function vendTalentItem(name,starter,cost,custom){
  const entry=custom||advTalentEntry(name);
  return {name,type:'talent',system:{
    description:entry?.effect||'',source:'Polski Podręcznik Główny',
    benefit:entry?.effect||'',prerequisites:entry?.requirements?talentRequirementText(entry):'',
    aptitudes:(entry?.apts||[]).filter(Boolean).map(vendAptitude).join(', '),
    tier:entry?.tier||0,starter,cost
  }};
}
function vendWeight(value){const number=Number.parseFloat(String(value??'').replace(',','.'));return Number.isFinite(number)?number:0;}
function vendArmourPart(description){
  const part={head:0,leftArm:0,rightArm:0,body:0,leftLeg:0,rightLeg:0};
  const points=Number(description.match(/(\d+) Armour Points?/i)?.[1]||0);
  const coverage=description.match(/Coverage:\s*([^.;]+)/i)?.[1]||'';
  if(/All/i.test(coverage))for(const key of Object.keys(part))part[key]=points;
  else{
    if(/Head/i.test(coverage))part.head=points;
    if(/Arms?/i.test(coverage))part.leftArm=part.rightArm=points;
    if(/Body/i.test(coverage))part.body=points;
    if(/Legs?/i.test(coverage))part.leftLeg=part.rightLeg=points;
  }
  return part;
}
function vendWeaponType(name,stats){
  const text=`${name} ${stats.class||''} ${stats.special||''}`.toLowerCase();
  if(/laser|lasgun|laspistol|las weapon/.test(text))return 'las';
  if(/chain|łańcuch/.test(text))return 'chain';
  if(/shock|elektrycz|porażaj/.test(text))return 'shock';
  if(/flame|miotacz ognia/.test(text))return 'flame';
  if(/bolt/.test(text))return 'bolt';
  if(/plasma|plazm/.test(text))return 'plasma';
  if(/melta/.test(text))return 'melta';
  if(/power|energetyczna/.test(text))return 'power';
  if(/force|siłowa/.test(text))return 'force';
  if(/low.tech|niezaawansowana/.test(text))return 'lowtech';
  if(/launcher|wyrzutnia|granatnik/.test(text))return 'launcher';
  if(/explosive|wybuchowa|granat|bomba/.test(text))return 'explosive';
  if(/pistol|revolver|rewolwer|shotgun|strzelba|autogun|karabin|cannon/.test(text))return 'solidprojectile';
  return '';
}
function vendWeaponSystem(name,stats,base){
  const ranged=stats.ranged??Boolean(stats.RoF||stats.range);
  const weaponClass=ranged?({pistol:'pistol',basic:'basic',heavy:'heavy',thrown:'thrown',miotana:'thrown',ciężka:'heavy',podstawowa:'basic'}[String(stats.class||'').toLowerCase()]||'basic'):'melee';
  const rof=String(stats.RoF||'').split('/');
  const damageType=({energy:'energy',energetyczne:'energy',impact:'impact',udarowe:'impact',rending:'rending',rozpruwające:'rending',kłute:'rending',explosive:'explosive',eksplozyjne:'explosive'})[String(stats.type||'').toLowerCase()]||'impact';
  const clip=Number.parseInt(String(stats.clip||'0'),10)||0;
  return {...base,class:weaponClass,type:vendWeaponType(name,stats),
    range:Number.parseInt(String(stats.range||'0'),10)||0,
    rateOfFire:{single:/^[sp1]$/i.test(rof[0]||'')?1:0,burst:Number.parseInt(rof[1],10)||0,full:Number.parseInt(rof[2],10)||0},
    damage:String(stats.damage||'').replace(/(\d+)k(\d+)/gi,'$1d$2').replace(/[–—]/g,'').trim(),
    damageType,penetration:/^\d+$/.test(String(stats.pen||''))?String(stats.pen):'0',
    clip:{max:clip,value:clip},reload:({half:'Half',akcja:'Half',full:'Full',runda:'Full','2 full':'2 Full','2 rundy':'2 Full'})[String(stats.reload||'').toLowerCase()]||String(stats.reload||'Full'),
    special:plText(stats.special||''),attack:0,ammo:[]};
}
function vendEquipmentItem(value,warnings){
  const original=typeof value==='string'?value:value.name;
  const name=plText(original);
  const sourceKey=Object.hasOwn(equipment,original)?original:Object.keys(equipment).find(key=>plText(key)===name);
  const source=equipment[sourceKey]||{};
  const catalogue=ADV_ARMORY.find(item=>item.name===name||item.name===original)||(typeof value==='object'?value:null);
  const weight=catalogue?.weight??vendWeight(source.weight);
  const base={craftsmanship:'common',availability:VEND_AVAILABILITY[catalogue?.availability]||'common',weight,description:source.description||''};
  const weaponKey=Object.hasOwn(rangedWeapons,original)||Object.hasOwn(meleeWeapons,original)?original:[...Object.keys(rangedWeapons),...Object.keys(meleeWeapons)].find(key=>plText(key)===name);
  const stats=rangedWeapons[weaponKey]||meleeWeapons[weaponKey]||ADV_WEAPON_STATS[name];
  const category=catalogue?.category||(/Armour Points?/i.test(source.description||'')?'pancerz':stats?'broń':'sprzęt');
  if(category==='broń'){
    if(!stats)warnings.push(`${name}: parametry broni wymagają uzupełnienia.`);
    return {name,type:'weapon',system:stats?vendWeaponSystem(name,stats,base):vendWeaponSystem(name,{},base)};
  }
  if(category==='pancerz'&&/^Pole /.test(name)){
    warnings.push(`${name}: parametry pola ochronnego wymagają uzupełnienia.`);
    return {name,type:'forceField',system:base};
  }
  if(category==='pancerz'){
    const part=vendArmourPart(source.description||'');
    if(!Object.values(part).some(Boolean))warnings.push(`${name}: Punkty Pancerza i osłaniane lokacje wymagają uzupełnienia.`);
    return {name,type:'armour',system:{...base,type:/skorup|carapace/i.test(`${name} ${original}`)?'carapace':/balistycz|flak/i.test(`${name} ${original}`)?'flak':'basic',isAdditive:false,part,maxAgility:Number(source.description?.match(/Max Ag:\s*(\d+)/i)?.[1]||0)}};
  }
  const type=({cybernetyka:'cybernetic',narzędzia:'tool',modyfikacja:'weaponModification',amunicja:'ammunition'})[category]||'gear';
  return {name,type,system:{...base,...(type==='cybernetic'?{installed:true}:{}),...(type==='ammunition'?{quantity:1}:{})}};
}
function createVendareActorData(value){
  const checked=validateCharacter(value),previous=character;
  character=checked;
  try{
    const state=advanceState(),warnings=[],items=[],characteristics={},skills={};
    let spentCharacteristics=0,spentSkills=0,spentTalents=0;
    for(const [stat,key] of Object.entries(VEND_STAT_KEYS)){
      const rank=state.stats[stat]||0,recorded=state.statCosts[stat];
      const cost=Array.isArray(recorded)&&recorded.length===rank?recorded.reduce((sum,n)=>sum+n,0):Array.from({length:rank},(_,i)=>advStatPrice(stat,i+1)).reduce((sum,n)=>sum+n,0);
      characteristics[key]={base:checked[stat]+(advDivinationBenefit().stat===stat?2:0),advance:rank*5,cost,unnatural:0,aptitudes:(ADV_STAT_APTS[stat]||[]).map(vendAptitude)};
      spentCharacteristics+=cost;
    }
    for(const name of new Set([...advKnownSkills(),...(state.elite==='inquisitor'&&state.inquisitorLore?[`Forbidden Lore (${state.inquisitorLore})`]:[])])){
      const root=advSkillRoot(name),key=VEND_SKILL_KEYS[root];
      if(!key){warnings.push(`${name}: brak odpowiednika umiejętności w Vendare.`);continue;}
      const rank=Math.min(4,advSkillRank(name)),base=advSkillBase(name),cost=vendSkillCost(name,rank,base,state);
      spentSkills+=cost;
      if(ADV_SPECIAL_SKILLS.has(root)){
        const specialization=name.match(/\(([^()]*)\)$/)?.[1];
        if(!specialization){warnings.push(`${name}: nie podano specjalizacji.`);continue;}
        const skill=skills[key]||{specialities:{}};
        let specKey=vendSpecialityKey(root,specialization);
        if(!VEND_SPECIALITIES[key].split(' ').includes(specKey))warnings.push(`${name}: specjalizacja spoza listy Vendare; sprawdź ją po imporcie.`);
        if(Object.hasOwn(skill.specialities,specKey))specKey+=String(Object.keys(skill.specialities).length+1);
        skill.specialities[specKey]={label:specialization,advance:(rank-1)*10,starter:base>0,cost};
        skills[key]=skill;
      }else skills[key]={advance:(rank-1)*10,starter:base>0,cost};
    }
    for(const [root,key] of Object.entries(VEND_SKILL_KEYS))(skills[key]||={}).aptitudes=ADV_SKILL_APTS[root].map(vendAptitude);
    for(const aptitude of new Set(advAptitudes().map(vendAptitude)))items.push({name:aptitude,type:'aptitude',system:{description:'',source:'Kreator postaci'}});
    const addTalent=(name,starter,cost,custom)=>{items.push(vendTalentItem(name,starter,cost,custom));spentTalents+=cost;};
    character.Talents.forEach(name=>addTalent(plText(name),true,0));
    const divination=advDivinationBenefit();
    if(divination.talent)addTalent(divination.talent,true,0);
    if(state.elite==='untouchable')addTalent('Odporność (moce psioniczne)',true,0);
    if(state.elite==='inquisitor')addTalent('Znajomości (Inkwizycja)',true,0);
    state.talents.forEach((name,index)=>{
      const cost=state.talentPurchaseCosts.length===state.talents.length?state.talentPurchaseCosts[index]:advTalentPrice(advTalentEntry(name));
      addTalent(name,false,cost);
    });
    state.customTalents.forEach(entry=>addTalent(entry.name,false,Number.isInteger(entry.costAtPurchase)?entry.costAtPurchase:advTalentPrice(entry),entry));
    for(const [name,text] of [['Premia za pochodzenie',checked.HomeBonus],['Premia za przeszłość',checked.BackBonus],['Premia za rolę',checked.RoleBonus]]){
      items.push({name,type:'specialAbility',system:{description:vendText(plText(text)),source:'Podręcznik Główny',benefit:plText(text)}});
    }
    if(state.elite)items.push({name:`Rozwinięcie elitarne: ${{psyker:'Psionik',untouchable:'Nietykalny',inquisitor:'Inkwizytor'}[state.elite]}`,type:'specialAbility',system:{description:vendText(ADV_ELITE_TEXT[state.elite]),source:'Podręcznik Główny',benefit:ADV_ELITE_TEXT[state.elite]}});
    character.Equip.flatMap(name=>VEND_COMPOSITE_GEAR[name]||[name]).forEach(name=>items.push(vendEquipmentItem(name,warnings)));
    character.AdditionalGear.forEach(value=>{
      const item=vendEquipmentItem(value,warnings);items.push(item);
      if(item.type==='weapon'&&item.system.class!=='melee'){
        item._id=vendId();
        const ammo={_id:vendId(),name:`Amunicja standardowa — ${item.name}`,type:'ammunition',system:{craftsmanship:'common',availability:'common',weight:0,description:'Dwa standardowe magazynki z wyposażenia początkowego.',quantity:2,weapon:item.name,weaponId:item._id}};
        item.system.ammo=[ammo._id];items.push(ammo);
      }
    });
    items.forEach(item=>{item._id||=vendId();});
    const psyCost=state.elite==='psyker'?Array.from({length:Math.max(0,state.psyRating-1)},(_,i)=>(i+2)*200).reduce((sum,n)=>sum+n,0):0;
    const spentOther=advanceSpent()-spentCharacteristics-spentSkills-spentTalents-psyCost;
    if(spentOther<0)throw new Error('Nie udało się uzgodnić kosztów PD z formatem Vendare.');
    const notes=[['Premia za pochodzenie',checked.HomeBonus],['Premia za przeszłość',checked.BackBonus],['Premia za rolę',checked.RoleBonus]].map(([name,text])=>`<p><strong>${vendText(name)}:</strong> ${vendText(plText(text))}</p>`);
    if(warnings.length)notes.push(`<p><strong>Do uzupełnienia po imporcie:</strong></p><ul>${warnings.map(warning=>`<li>${vendText(warning)}</li>`).join('')}</ul>`);
    const actor={name:checked.Name||'Akolita',type:'acolyte',system:{
      bio:{homeWorld:plText(homeworlds[checked.homeworld].name),background:plText(backgrounds[checked.background].name),role:plText(roles[checked.role].name),elite:state.elite?({psyker:'Psionik',untouchable:'Nietykalny',inquisitor:'Inkwizytor'}[state.elite]):'',divination:checked.Divination,notes:notes.join('')},
      characteristics,skills,wounds:{max:checked.Wounds+state.talents.filter(name=>name==='Krzepkość').length,value:checked.Wounds+state.talents.filter(name=>name==='Krzepkość').length,critical:0},
      fate:{max:checked.Fate,value:checked.Fate},fatigue:{value:0},
      psy:{rating:state.elite==='psyker'?state.psyRating:0,sustained:0,class:checked.background==='astra'?'bound':'unbound',cost:psyCost},
      corruption:state.corruption||0,experience:{value:1000,spentOther}
    },items,effects:[]};
    return {actor,warnings};
  }finally{character=previous;}
}
function downloadVendareActor(){
  const status=el('foundryExportStatus');
  try{
    character.Name=el('saveCharName').value.trim()||character.Name||'Akolita';
    const {actor,warnings}=createVendareActorData(character);
    const link=document.createElement('a');
    link.href='data:application/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(actor,null,2));
    link.download=`${vendKey(actor.name)||'akolita'}-vendare.json`;document.body.append(link);link.click();link.remove();
    status.textContent=`Pobrano plik Foundry VTT. ${warnings.length?`${warnings.length} pozycji wymaga uzupełnienia parametrów po imporcie.`:'Wszystkie dostępne parametry zostały przeniesione.'}`;
  }catch(error){status.textContent=`Nie udało się wyeksportować postaci: ${error.message}`;}
}
