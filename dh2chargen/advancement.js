'use strict';

const ADV_STAT_NAMES = {WS:'Walka Wręcz',BS:'Umiejętności Strzeleckie',S:'Siła',T:'Wytrzymałość',Ag:'Zręczność',Int:'Inteligencja',Per:'Percepcja',WP:'Siła Woli',Fel:'Ogłada'};
const ADV_STAT_LEVELS = ['Podstawowy','Średni','Zaawansowany','Biegły','Mistrzowski'];
const ADV_SKILL_LEVELS = ['Podstawowy','Przeszkolony','Doświadczony','Weteran'];
const ADV_ELITE_TEXT = {
  psyker: 'Psionik: właściwość psionik, predyspozycja Psionika, Współczynnik Psioniczny 1. Bez sankcji: 1k10+3 Punktów Spaczenia (s. 90).',
  untouchable: 'Nietykalny: Odporność (moce psioniczne); Ogłada liczona jako połowa (w górę), a wobec psioników jako 1; odporność na Zjawiska Psioniczne; +30 przeciw Grozie Osnowy. Brak pozytywnych efektów mocy psionicznych (s. 91).',
  inquisitor: 'Inkwizytor: wymaga Wpływu 75 i mianowania przez Inkwizytora; otrzymuje Znajomości (Inkwizycja), Zakazaną wiedzę (wybrana specjalizacja) i predyspozycję Przywództwo (s. 88).'
};
const ADV_PLACEHOLDER = /\((Pick One|Choose Group)\)/;
const ADV_SAFE_SPECIALIZATION = /^[\p{L}\p{N} .,'/–-]{1,80}$/u;
const ADV_SAFE_TALENT_NAME = /^[\p{L}\p{N} .,'()/–-]{1,100}$/u;
const ADV_DIVINATION_GRANTS = new Map([
  ['Ludzie muszą zginąć, aby ludzkość przetrwała.',{talent:'Zobojętniały',fallback:'WP'}],
  ['Bądź błogosławieństwem towarzyszy i zgubą wrogów.',{talent:'Nienawiść',specialized:true,fallback:'S'}],
  ['Uśmierć obcych, nim wypowiedzą swe kłamstwa.',{talent:'Szybkie dobycie',fallback:'Ag'}],
  ['Jedynym lękiem jest zginąć ze świadomością niedopełnionych obowiązków.',{talent:'Odporność',specialized:true,fallback:'T'}],
  ['Niewinność to iluzja.',{talent:'Intuicja',fallback:'Int'}],
  ['Wojować jest rzeczą ludzką.',{skill:'Dodge',fallback:'Ag'}],
  ['Nic nie zastąpi gorliwości.',{talent:'Informatorzy w tłumie',fallback:'Fel'}]
]);

function advDivinationRule(){return ADV_DIVINATION_GRANTS.get((character.Divination||'').split(': ')[0]);}
function advDivinationBenefit(){
  const rule=advDivinationRule();if(!rule)return {};
  if(rule.skill)return character.Skills.includes(rule.skill)?{stat:rule.fallback}:{skill:rule.skill};
  const alreadyOwned=character.Talents.some(item=>{const name=plText(item);return rule.specialized?name.startsWith(rule.talent+' ('):name===rule.talent;});
  if(alreadyOwned)return {stat:rule.fallback};
  return {talent:rule.specialized?`${rule.talent} (${character.DivinationChoice||'do wyboru'})`:rule.talent};
}

const originalChooseHomeForAdvancement=chooseHome;
chooseHome=function(id){originalChooseHomeForAdvancement(id);delete character.Advances;character.AdditionalGear=[];character.Experience=1000;};

function advanceState() {
  if (!character.Advances) character.Advances = {stats:{},statCosts:{},skills:{},skillCosts:{},talents:[],talentPurchaseCosts:[],customTalents:[],elite:character.role==='mystic'?'psyker':null,psyRating:character.role==='mystic'?1:0,corruption:character.role==='mystic'&&character.background!=='astra'?Math.floor(Math.random()*10)+4:0};
  if (character.role==='mystic') { character.Advances.elite='psyker'; if (!character.Advances.psyRating) character.Advances.psyRating=1; }
  if (!Array.isArray(character.Advances.customTalents)) character.Advances.customTalents=[];
  if (!character.Advances.statCosts) character.Advances.statCosts={};
  if (!character.Advances.skillCosts) character.Advances.skillCosts={};
  if (!Array.isArray(character.Advances.talentPurchaseCosts)) character.Advances.talentPurchaseCosts=[];
  if (!Array.isArray(character.AdditionalGear)) character.AdditionalGear = [];
  return character.Advances;
}
function advStatValue(stat) { return character[stat] + (advDivinationBenefit().stat===stat?2:0) + 5*(advanceState().stats[stat]||0); }
function advSkillBase(name) { return character.Skills.filter(item=>item===name).length+(advDivinationBenefit().skill===name?1:0)+(advanceState().elite==='inquisitor'&&advanceState().inquisitorLore&&name===`Forbidden Lore (${advanceState().inquisitorLore})`?1:0); }
function advSkillRank(name) { return Math.max(advSkillBase(name), advanceState().skills[name]||0); }
function advSkillRoot(name) { return name.split(' (')[0]; }
function advAptitudes() {
  const list=[...character.Aptitudes];
  if (advanceState().elite==='psyker' && !list.includes('Psyker')) list.push('Psyker');
  if (advanceState().elite==='inquisitor' && !list.includes('Leadership')) list.push('Leadership');
  return list;
}
function advMatches(apts) { const held=new Set(advAptitudes()); return apts.filter(a=>held.has(a)).length; }
function advStatPrice(stat,level) { return ADV_STAT_COST[advMatches(ADV_STAT_APTS[stat])][level-1]; }
function advSkillPrice(name,rank) { return ADV_SKILL_COST[advMatches(ADV_SKILL_APTS[advSkillRoot(name)])][rank-1]; }
function advTalentPrice(item) { return ADV_TALENT_COST[advMatches(item.apts)][item.tier-1]; }
function advTalentEntry(name){return ADV_TALENTS.find(t=>t.name===name&&!t.specialized)||ADV_TALENTS.find(t=>t.specialized&&name.startsWith(t.name+' (')&&name.endsWith(')')&&ADV_SAFE_SPECIALIZATION.test(name.slice(t.name.length+2,-1)));}
function advTalentOwned(name) { return (advanceState().elite==='untouchable'&&name==='Odporność (moce psioniczne)') || advDivinationBenefit().talent?.toLowerCase()===name.toLowerCase() || character.Talents.some(t=>plText(t).toLowerCase()===name.toLowerCase()) || advanceState().talents.includes(name) || advanceState().customTalents.some(t=>t.name.toLowerCase()===name.toLowerCase()); }
function advKnownSkills(){return [...new Set([...character.Skills,...(advDivinationBenefit().skill?[advDivinationBenefit().skill]:[]),...Object.keys(advanceState().skills)])];}
function advHasSkill([name,rank]){return advKnownSkills().some(skill=>(name.includes(' (')?skill.toLowerCase()===name.toLowerCase():advSkillRoot(skill)===name)&&advSkillRank(skill)>=rank);}
function advHasEquipment(name){return [...character.Equip,...character.AdditionalGear].some(item=>{const value=typeof item==='string'?item:item.name;return [value,plText(value)].some(text=>text.toLowerCase().includes(name.toLowerCase()));});}
function advTalentStartsWith(prefix){return [...character.Talents,...(advDivinationBenefit().talent?[advDivinationBenefit().talent]:[]),...advanceState().talents].some(name=>plText(name).toLowerCase().startsWith(prefix.toLowerCase()));}
function advHasMeleeTraining(){return [...character.Talents,...advanceState().talents].some(name=>/^Broń specjalna \(/i.test(plText(name))&&/(niezaawans|low-tech|łańcuch|chain|elektrycz|shock|energetycz|power|siłow|force)/i.test(plText(name)));}
function advMasteryAllowed(name){const spec=name.slice('Mistrzostwo ('.length,-1).toLocaleLowerCase('pl');return advKnownSkills().some(skill=>advSkillRank(skill)>=4&&plText(skill).toLocaleLowerCase('pl')===spec);}
function advTalentAllowed(item) {
  const req=item.requirements;
  if (req.elite && advanceState().elite!==req.elite) return false;
  for (const stat of Object.keys(ADV_STAT_NAMES)) if (req[stat] && advStatValue(stat)<req[stat]) return false;
  if (req.anyStat && !req.anyStat.some(([stat,value])=>advStatValue(stat)>=value)) return false;
  if (req.skill && !advHasSkill(req.skill)) return false;
  if (req.skills && !req.skills.every(advHasSkill)) return false;
  if (req.anySkill && !req.anySkill.some(advHasSkill)) return false;
  if (req.skillRank && !advKnownSkills().some(skill=>advSkillRank(skill)>=req.skillRank)) return false;
  if (req.talent && !advTalentOwned(req.talent)) return false;
  if (req.talents && !req.talents.every(advTalentOwned)) return false;
  if (req.anyTalent && !req.anyTalent.some(advTalentOwned)) return false;
  if (req.talentPrefix && !advTalentStartsWith(req.talentPrefix)) return false;
  if (req.meleeTraining && !advHasMeleeTraining()) return false;
  if (req.mechanicus && character.background!=='admech') return false;
  if (req.gear && ![].concat(req.gear).every(advHasEquipment)) return false;
  if (req.psyker && advanceState().elite!=='psyker') return false;
  return true;
}
function advanceSpent() {
  const state=advanceState(); let spent=state.elite && character.role!=='mystic' ? (state.elite==='inquisitor'?1000:300) : 0;
  for (const [stat,count] of Object.entries(state.stats)) {
    const recorded=state.statCosts[stat];
    if(Array.isArray(recorded)&&recorded.length===count)spent+=recorded.reduce((sum,cost)=>sum+cost,0);
    else for(let level=1;level<=count;level++)spent+=advStatPrice(stat,level);
  }
  for (const [skill,rank] of Object.entries(state.skills)) {
    const base=advSkillBase(skill),recorded=state.skillCosts[skill];
    if(Array.isArray(recorded)&&recorded.length===rank-base)spent+=recorded.reduce((sum,cost)=>sum+cost,0);
    else for(let level=base+1;level<=rank;level++)spent+=advSkillPrice(skill,level);
  }
  state.talents.forEach((name,i)=>{const talent=advTalentEntry(name);if(talent)spent+=state.talentPurchaseCosts.length===state.talents.length?state.talentPurchaseCosts[i]:advTalentPrice(talent);});
  for (const item of state.customTalents) spent+=Number.isInteger(item.costAtPurchase)?item.costAtPurchase:advTalentPrice(item);
  if (state.elite==='psyker') for(let rating=2;rating<=state.psyRating;rating++) spent+=rating*200;
  return spent;
}
function setAdvanceRank(kind,key,next,base,price){
  const state=advanceState(),levels=state[kind],costs=state[kind==='stats'?'statCosts':'skillCosts'];
  const current=levels[key]||base;
  const recorded=Array.isArray(costs[key])?costs[key]:[];
  if(recorded.length!==current-base){recorded.length=0;for(let level=base+1;level<=current;level++)recorded.push(price(level));}
  if(next>current)for(let level=current+1;level<=next;level++)recorded.push(price(level));
  else recorded.length=next-base;
  if(next<=base){delete levels[key];delete costs[key];}
  else{levels[key]=next;costs[key]=recorded;}
}
function addTalentPurchase(name,item){const state=advanceState();if(state.talentPurchaseCosts.length!==state.talents.length)state.talentPurchaseCosts=state.talents.map(n=>advTalentPrice(advTalentEntry(n)));state.talents.push(name);state.talentPurchaseCosts.push(advTalentPrice(item));}
function removeTalentPurchase(name,last=false){const state=advanceState(),index=last?state.talents.lastIndexOf(name):state.talents.indexOf(name);if(index<0)return;state.talents.splice(index,1);if(state.talentPurchaseCosts.length)state.talentPurchaseCosts.splice(index,1);}
function advanceBalance() { return 1000-advanceSpent(); }
function advanceValid() {
  const state=advanceState();
  if (advanceBalance()<0) return 'Brakuje Punktów Doświadczenia.';
  if (Object.keys(ADV_STAT_NAMES).some(stat=>advStatValue(stat)>100)) return 'Cechy nie mogą przekroczyć 100.';
  if (state.elite==='psyker' && character.role!=='mystic' && advStatValue('WP')<40) return 'Psionik wymaga Siły Woli 40.';
  if (state.elite==='inquisitor' && advStatValue('Infl')<75) return 'Inkwizytor wymaga Wpływu 75.';
  if (state.elite!=='psyker' && state.psyRating) return 'Współczynnik Psioniczny wymaga Psionika.';
  if (state.talents.some(name=>!advTalentEntry(name)||!advTalentAllowed(advTalentEntry(name)))) return 'Nie są spełnione wymagania zakupionej zdolności.';
  if (state.talents.some(name=>name.startsWith('Mistrzostwo (')&&!advMasteryAllowed(name))) return 'Mistrzostwo wymaga 4. rangi wskazanej umiejętności.';
  return '';
}
function tryAdvance(change) {
  const before=structuredClone(advanceState()); change();
  const error=advanceValid();
  if (error) { character.Advances=before; el('advanceError').textContent=error; }
  else el('advanceError').textContent='';
  renderAdvancement();
}
function highlightAptitudes(apts) {
  const held=new Set(advAptitudes());
  document.querySelectorAll('#advanceAptitudes [data-aptitude]').forEach(badge=>badge.classList.toggle('is-matched',Boolean(apts&&held.has(badge.dataset.aptitude)&&apts.includes(badge.dataset.aptitude))));
}
function watchAptitudes(node,apts) {
  node.addEventListener('mouseenter',()=>highlightAptitudes(apts));
  node.addEventListener('mouseleave',()=>highlightAptitudes(null));
  node.addEventListener('focusin',()=>highlightAptitudes(apts));
  node.addEventListener('focusout',()=>highlightAptitudes(null));
}
function renderAdvanceAptitudes() {
  const container=el('advanceAptitudes');container.replaceChildren();
  const title=document.createElement('strong');title.textContent='Aktualne predyspozycje';container.append(title);
  for(const apt of advAptitudes()) { const badge=document.createElement('span');badge.className='aptitude-badge';badge.dataset.aptitude=apt;badge.textContent=plText(apt);container.append(badge); }
}
function renderCostTables() {
  const target=el('advanceCostTables');target.replaceChildren();
  const heading=document.createElement('h3');heading.textContent='Tabele kosztów rozwoju (PD)';target.append(heading);
  for(const [title,levels,costs] of [['Cechy',ADV_STAT_LEVELS,ADV_STAT_COST],['Umiejętności',ADV_SKILL_LEVELS,ADV_SKILL_COST],['Zdolności',['Poziom 1','Poziom 2','Poziom 3'],ADV_TALENT_COST]]){
    const wrap=document.createElement('div'),caption=document.createElement('h4'),table=document.createElement('table');wrap.className='advance-cost-table';caption.textContent=title;table.className='w3-table w3-bordered';
    const head=document.createElement('thead'),headRow=document.createElement('tr');for(const label of ['Posiadane predyspozycje',...levels]){const cell=document.createElement('th');cell.textContent=label;headRow.append(cell);}head.append(headRow);table.append(head);
    const body=document.createElement('tbody');costs.forEach((row,count)=>{const tr=document.createElement('tr');for(const value of [String(count),...row]){const cell=document.createElement('td');cell.textContent=value;tr.append(cell);}body.append(tr);});table.append(body);wrap.append(caption,table);target.append(wrap);
  }
}
function talentRequirementText(item) {
  const req=item.requirements,parts=[];
  for(const [stat,name] of Object.entries(ADV_STAT_NAMES)) if(req[stat])parts.push(`${name} ${req[stat]}`);
  if(req.anyStat)parts.push(req.anyStat.map(([stat,value])=>`${ADV_STAT_NAMES[stat]} ${value}`).join(' lub '));
  if(req.skill)parts.push(`${plText(req.skill[0])}: ${ADV_SKILL_LEVELS[req.skill[1]-1]||req.skill[1]}`);
  if(req.skills)parts.push(...req.skills.map(([name,rank])=>`${plText(name)}: ${ADV_SKILL_LEVELS[rank-1]||rank}`));
  if(req.anySkill)parts.push(req.anySkill.map(([name,rank])=>`${plText(name)}: ${ADV_SKILL_LEVELS[rank-1]||rank}`).join(' lub '));
  if(req.skillRank)parts.push(`wybrana umiejętność: ${ADV_SKILL_LEVELS[req.skillRank-1]}`);
  if(req.talent)parts.push(`zdolność ${req.talent}`);
  if(req.talents)parts.push(...req.talents.map(name=>`zdolność ${name}`));
  if(req.anyTalent)parts.push(req.anyTalent.map(name=>`zdolność ${name}`).join(' lub '));
  if(req.talentPrefix)parts.push(`zdolność ${req.talentText||req.talentPrefix+'…'}`);
  if(req.meleeTraining)parts.push('Broń specjalna (dowolna broń biała)');
  if(req.mechanicus)parts.push('wszczepy Mechanicus');
  if(req.gear)parts.push(req.gearText||[].concat(req.gear).join(', '));
  if(req.psyker)parts.push('Psionik');
  if(req.elite)parts.push(ADV_ELITE_TEXT[req.elite]?.split(':')[0]||req.elite);
  return parts.length?`Wymagania: ${parts.join(', ')}.`:'';
}
function markTalentRow(row,item) {
  row.dataset.talentName=item.name;
  row.dataset.tier=item.tier;
  row.dataset.cost=advTalentPrice(item);
  row.dataset.eligible=advTalentAllowed(item)?'true':'false';
}
function checkboxRow(container,label,names,current,base,onChange,apts) {
  const row=document.createElement('div'); row.className='advance-row';
  const title=document.createElement('strong'); title.textContent=label; row.append(title);
  const boxes=document.createElement('span'); boxes.className='advance-boxes';
  names.forEach((name,index)=>{
    const level=index+1, wrap=document.createElement('label'), box=document.createElement('input');
    box.type='checkbox'; box.checked=level<=current; box.disabled=level<=base;
    box.setAttribute('aria-label',`${label}: ${name}`);
    box.addEventListener('change',()=>onChange(level,box.checked));
    wrap.append(box,document.createTextNode(name));
    watchAptitudes(wrap,apts);
    boxes.append(wrap);
  });
  row.append(boxes); container.append(row);
  return row;
}
function renderAdvancement() {
  const state=advanceState(); character.Experience=advanceBalance();
  el('xpRemaining').textContent=character.Experience;
  renderAdvanceAptitudes();renderCostTables();
  renderHomeworldTalent();
  renderStartingSpecializations();
  const effects=el('eliteEffects'); effects.replaceChildren();
  if(state.elite) {
    const p=document.createElement('p'); p.textContent=ADV_ELITE_TEXT[state.elite]; effects.append(p);
    if(state.elite==='psyker') {
      const info=document.createElement('p');info.textContent=character.background==='astra'?'Sankcjonowany: badania Terry podczas tworzenia postaci.':`Psionik-Renegat: ${state.corruption} Punktów Spaczenia.`;effects.append(info);
      const rating=document.createElement('button'); rating.type='button';rating.className='w3-button w3-round w3-light-grey'; rating.textContent=`Współczynnik Psioniczny: ${state.psyRating} · podnieś za ${(state.psyRating+1)*200} PD`;
      rating.disabled=advanceBalance()<(state.psyRating+1)*200;
      rating.addEventListener('click',()=>tryAdvance(()=>state.psyRating++)); effects.append(rating);
      if(state.psyRating>1) { const undo=document.createElement('button');undo.type='button';undo.className='w3-button w3-round w3-light-grey';undo.textContent='Cofnij ostatni poziom WP';undo.addEventListener('click',()=>tryAdvance(()=>state.psyRating--));effects.append(undo); }
      const note=document.createElement('p');note.textContent='Zakup mocy psionicznych za PD nie jest dostępny w kreatorze.';effects.append(note);
    }
    if(state.elite==='inquisitor'){
      const label=document.createElement('label');label.textContent='Specjalizacja Zakazanej wiedzy: ';
      const input=document.createElement('input');input.className='w3-input w3-border';input.maxLength=80;input.value=state.inquisitorLore||'';
      input.addEventListener('change',()=>{const value=input.value.trim();if(ADV_SAFE_SPECIALIZATION.test(value)){state.inquisitorLore=value;el('advanceError').textContent='';renderAdvancement();}else el('advanceError').textContent='Podaj poprawną specjalizację Zakazanej wiedzy.';});
      label.append(input);effects.append(label);
    }
  }
  const stats=el('advanceStats');stats.replaceChildren();
  for(const [stat,name] of Object.entries(ADV_STAT_NAMES)) {
    const row=checkboxRow(stats,`${name} (${advStatValue(stat)})`,ADV_STAT_LEVELS,state.stats[stat]||0,0,(level,checked)=>tryAdvance(()=>setAdvanceRank('stats',stat,checked?level:level-1,0,rank=>advStatPrice(stat,rank))),ADV_STAT_APTS[stat]);
    row.dataset.stat=stat;
    row.querySelectorAll('label').forEach((label,i)=>{label.append(document.createTextNode(` · ${state.statCosts[stat]?.[i]??advStatPrice(stat,i+1)} PD`));});
  }
  const choice=el('advanceSkillChoice');if(!choice.options.length){ choice.add(new Option('Wybierz…',''));Object.keys(ADV_SKILL_APTS).sort((a,b)=>plText(a).localeCompare(plText(b),'pl')).forEach(name=>choice.add(new Option(plText(name),name))); }
  const divination=advDivinationBenefit();
  const listed=new Set([...character.Skills,...(divination.skill?[divination.skill]:[]),...Object.keys(state.skills),...(state.elite==='inquisitor'&&state.inquisitorLore?[`Forbidden Lore (${state.inquisitorLore})`]:[])]), skills=el('advanceSkills');skills.replaceChildren();
  [...listed].sort((a,b)=>plText(a).localeCompare(plText(b),'pl')).forEach(name=>{
    if(!ADV_SKILL_APTS[advSkillRoot(name)])return;
    const rank=advSkillRank(name),base=Math.min(4,advSkillBase(name));
    const row=checkboxRow(skills,plText(name),ADV_SKILL_LEVELS,rank,base,(level,checked)=>tryAdvance(()=>setAdvanceRank('skills',name,checked?level:level-1,base,target=>advSkillPrice(name,target))),ADV_SKILL_APTS[advSkillRoot(name)]);
    row.querySelectorAll('label').forEach((label,i)=>{if(i+1>base)label.append(document.createTextNode(` · ${state.skillCosts[name]?.[i-base]??advSkillPrice(name,i+1)} PD`));});
  });
  const talents=el('advanceTalents');talents.replaceChildren();
  for(const tier of [1,2,3]){
    const group=document.createElement('section');group.className='talent-tier';
    const heading=document.createElement('h4');heading.textContent=`Poziom ${tier}`;group.append(heading);
    ADV_TALENTS.filter(item=>item.tier===tier&&(!item.requirements.elite||item.requirements.elite===state.elite))
      .sort((a,b)=>Number(advTalentAllowed(b))-Number(advTalentAllowed(a))||advTalentPrice(a)-advTalentPrice(b)||a.name.localeCompare(b.name,'pl'))
      .forEach(item=>{
    const requirement=talentRequirementText(item),availability=advTalentAllowed(item)?'':' Wymagania niespełnione.';
    if(item.name==='Krzepkość'){
      const row=document.createElement('div');row.className='talent-option';const count=state.talents.filter(name=>name==='Krzepkość').length;
      markTalentRow(row,item);
      const label=document.createElement('label'),box=document.createElement('input');box.type='checkbox';box.disabled=advanceBalance()<advTalentPrice(item);box.setAttribute('aria-label',`Krzepkość: kolejne wykupienie`);box.addEventListener('change',()=>tryAdvance(()=>addTalentPurchase('Krzepkość',item)));
      label.append(box,document.createTextNode(`Krzepkość — kolejne wykupienie (${advTalentPrice(item)} PD). Każdy zakup zwiększa Żywotność o 1. ${requirement}${availability}`));watchAptitudes(label,item.apts);row.append(label);
      for(let index=0;index<count;index++){const owned=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.checked=true;check.setAttribute('aria-label',`Krzepkość: zakup ${index+1}`);check.addEventListener('change',()=>tryAdvance(()=>removeTalentPurchase('Krzepkość',true)));owned.append(check,document.createTextNode(`Zakup ${index+1}`));watchAptitudes(owned,item.apts);row.append(owned);}
      group.append(row);return;
    }
    if(item.specialized){
      const row=document.createElement('div');row.className='talent-option specialized-talent';
      markTalentRow(row,item);
      const title=document.createElement('span');title.textContent=`${item.name} (${advTalentPrice(item)} PD) — ${item.effect} ${requirement}${availability}`;
      const input=document.createElement('input');input.className='w3-input w3-border';input.maxLength=80;input.placeholder='Specjalizacja';input.setAttribute('aria-label',`Specjalizacja: ${item.name}`);
      const label=document.createElement('label'),box=document.createElement('input');box.type='checkbox';box.disabled=!advTalentAllowed(item)||advTalentPrice(item)>advanceBalance();box.setAttribute('aria-label',`Wykup: ${item.name}`);
      box.addEventListener('change',()=>{const spec=input.value.trim();if(!ADV_SAFE_SPECIALIZATION.test(spec)){box.checked=false;el('advanceError').textContent='Podaj specjalizację zdolności.';return;}const name=`${item.name} (${spec})`;if(item.name==='Mistrzostwo'&&!advMasteryAllowed(name)){box.checked=false;el('advanceError').textContent='Mistrzostwo wymaga 4. rangi wskazanej umiejętności.';return;}if(advTalentOwned(name)){box.checked=false;el('advanceError').textContent='Ta specjalizacja jest już znana.';return;}tryAdvance(()=>addTalentPurchase(name,item));});
      label.append(box,document.createTextNode('Wykup specjalizację'));watchAptitudes(label,item.apts);row.append(title,input,label);
      state.talents.filter(name=>advTalentEntry(name)===item).forEach(name=>{const chosen=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.checked=true;check.addEventListener('change',()=>tryAdvance(()=>removeTalentPurchase(name)));chosen.append(check,document.createTextNode(`${name} — ${state.talentPurchaseCosts[state.talents.indexOf(name)]??advTalentPrice(item)} PD`));watchAptitudes(chosen,item.apts);row.append(chosen);});
      group.append(row);return;
    }
    const row=document.createElement('label');row.className='talent-option';
    markTalentRow(row,item);
    const box=document.createElement('input');box.type='checkbox';box.checked=advTalentOwned(item.name);
    box.disabled=character.Talents.some(t=>plText(t)===item.name)||divination.talent===item.name||(!box.checked&&(!advTalentAllowed(item)||advTalentPrice(item)>advanceBalance()));
    box.addEventListener('change',()=>tryAdvance(()=>{if(box.checked)addTalentPurchase(item.name,item);else removeTalentPurchase(item.name);}));
    const paid=state.talents.indexOf(item.name),shownCost=paid>=0?(state.talentPurchaseCosts[paid]??advTalentPrice(item)):advTalentPrice(item);
    const description=document.createElement('span');description.textContent=`${item.name} (${shownCost} PD) — ${item.effect} ${requirement}${availability}`;
    row.append(box,description);watchAptitudes(row,item.apts);group.append(row);
  });
    talents.append(group);
  }
  renderCustomTalents();
}
function renderHomeworldTalent(){
  const container=el('homeworldTalentChoice');container.replaceChildren();
  if(character.homeworld!=='forge')return;
  const title=document.createElement('h3');title.textContent='Zdolność ze Świata-kuźni';
  const label=document.createElement('label');label.textContent='Wybraniec Omnisjasza — wybierz darmową zdolność: ';
  const select=document.createElement('select');select.className='w3-select w3-border';select.setAttribute('aria-label','Zdolność ze Świata-kuźni');
  select.add(new Option('Wybierz…',''));select.add(new Option('Szybka naprawa','Technical Knock'));select.add(new Option('Techmodlitwa','Weapon-Tech'));
  select.value=character.Talents.includes('Technical Knock')?'Technical Knock':character.Talents.includes('Weapon-Tech')?'Weapon-Tech':'';
  select.addEventListener('change',()=>{character.Talents=character.Talents.filter(name=>!['Technical Knock','Weapon-Tech'].includes(name));if(select.value)character.Talents.push(select.value);renderAdvancement();});
  label.append(select);container.append(title,label);
}
function customTalentDraft(){return {tier:Number(el('customTalentTier').value),apts:[el('customTalentApt1').value,el('customTalentApt2').value].filter(Boolean)};}
function renderCustomTalents(){
  for(const id of ['customTalentApt1','customTalentApt2']){
    const select=el(id);if(!select.options.length){select.add(new Option(id==='customTalentApt1'?'Wybierz…':'Brak',''));ADV_ALL_APTITUDES.forEach(apt=>select.add(new Option(plText(apt),apt)));select.addEventListener('change',updateCustomTalentCost);}
  }
  if(!el('customTalentTier').dataset.listener){el('customTalentTier').addEventListener('change',updateCustomTalentCost);el('customTalentTier').dataset.listener='1';}
  for(const id of ['customTalentPrereq','customTalentPurchase']){
    const box=el(id);
    if(!box.dataset.listener){box.parentElement.addEventListener('mouseenter',()=>highlightAptitudes(customTalentDraft().apts));box.parentElement.addEventListener('mouseleave',()=>highlightAptitudes(null));box.parentElement.addEventListener('focusin',()=>highlightAptitudes(customTalentDraft().apts));box.parentElement.addEventListener('focusout',()=>highlightAptitudes(null));box.dataset.listener='1';}
  }
  updateCustomTalentCost();
  const bought=el('customTalentBought');bought.replaceChildren();
  advanceState().customTalents.forEach((item,index)=>{const label=document.createElement('label'),box=document.createElement('input');box.type='checkbox';box.checked=true;box.addEventListener('change',()=>tryAdvance(()=>advanceState().customTalents.splice(index,1)));label.append(box,document.createTextNode(`${item.name} — ${item.costAtPurchase??advTalentPrice(item)} PD`));watchAptitudes(label,item.apts);bought.append(label);});
}
function updateCustomTalentCost(){const draft=customTalentDraft();el('customTalentCost').textContent=draft.apts.length?`Koszt: ${advTalentPrice(draft)} PD`:'Wybierz predyspozycję z tabeli podręcznika.';}
function addCustomTalent(){
  el('customTalentPurchase').checked=false;
  const name=el('customTalentName').value.trim(),draft=customTalentDraft();
  if(!ADV_SAFE_TALENT_NAME.test(name)||/moc[eąy]? psioniczn/i.test(name)||advTalentEntry(name)||advTalentOwned(name)||![1,2,3].includes(draft.tier)||draft.apts.length<1||new Set(draft.apts).size!==draft.apts.length||!el('customTalentPrereq').checked){el('advanceError').textContent='Sprawdź nazwę, poziom, predyspozycje i wymagania zdolności z podręcznika.';return;}
  tryAdvance(()=>advanceState().customTalents.push({name,tier:draft.tier,apts:draft.apts,prerequisitesConfirmed:true,costAtPurchase:advTalentPrice(draft)}));
  if(!el('advanceError').textContent){el('customTalentName').value='';el('customTalentPrereq').checked=false;}
}
function renderStartingSpecializations(){
  const container=el('startingSpecializations');container.replaceChildren();
  for(const field of ['Skills','Talents']) character[field].forEach((item,index)=>{
    if(!ADV_PLACEHOLDER.test(item))return;
    if(!container.querySelector('h3')){const title=document.createElement('h3');title.textContent='Uzupełnij specjalizacje startowe';container.append(title);}
    const label=document.createElement('label');label.textContent=`${field==='Skills'?'Umiejętność':'Zdolność'}: ${plText(item)} — wpisz wybraną specjalizację `;
    const input=document.createElement('input');input.className='w3-input w3-border';input.maxLength=80;
    const button=document.createElement('button');button.type='button';button.className='w3-button w3-green w3-round';button.textContent='Zapisz specjalizację';
    button.addEventListener('click',()=>{
      const name=input.value.trim();if(!ADV_SAFE_SPECIALIZATION.test(name)){el('advanceError').textContent='Specjalizacja powinna mieć 1–80 znaków i nie zawierać nawiasów.';return;}
      const resolved=item.replace(ADV_PLACEHOLDER,`(${name})`);
      if(field==='Skills' && stateSkillsHas(item)){const state=advanceState();state.skills[resolved]=state.skills[item];delete state.skills[item];if(state.skillCosts[item]){state.skillCosts[resolved]=state.skillCosts[item];delete state.skillCosts[item];}}
      character[field][index]=resolved;el('advanceError').textContent='';renderAdvancement();
    });
    label.append(input,button);container.append(label);
  });
}
function stateSkillsHas(name){return Object.hasOwn(advanceState().skills,name);}
function addAdvancementSkill() {
  const root=el('advanceSkillChoice').value, specialization=el('advanceSkillSpecialization').value.trim();
  if(!root){el('advanceError').textContent='Wybierz umiejętność.';return;}
  if(ADV_SPECIAL_SKILLS.has(root)!==Boolean(specialization)){el('advanceError').textContent=ADV_SPECIAL_SKILLS.has(root)?'Podaj specjalizację.':'Ta umiejętność nie ma specjalizacji.';return;}
  const name=specialization?`${root} (${specialization})`:root;
  if(advSkillRank(name)){el('advanceError').textContent='Ta umiejętność jest już na liście.';return;}
  tryAdvance(()=>setAdvanceRank('skills',name,1,0,rank=>advSkillPrice(name,rank)));
  el('advanceSkillSpecialization').value='';el('advanceSkillChoice').value='';
}
function showExtraStep(from,to) { el(from).style.display='none';el(to).style.display='block';el(to).style.opacity='1';window.scrollTo(0,0); }
const originalRollDivinationForAdvancement=rollDivination;
rollDivination=function(){originalRollDivinationForAdvancement();character.DivinationChoice='';renderDivinationChoice();};
function renderDivinationChoice(){
  const container=el('divinationChoice');container.replaceChildren();el('divinationChoiceError').textContent='';
  const rule=advDivinationRule();
  if(!rule?.specialized||advDivinationBenefit().stat)return;
  const label=document.createElement('label');label.textContent=`Specjalizacja zdolności ${rule.talent}: `;
  if(rule.talent==='Odporność'){
    const select=document.createElement('select');select.className='w3-select w3-border';select.add(new Option('Wybierz…',''));
    for(const value of ['zimno','gorąco','strach'])select.add(new Option(value,value));
    select.value=character.DivinationChoice||'';
    select.addEventListener('change',()=>{character.DivinationChoice=select.value;el('divinationChoiceError').textContent='';});label.append(select);
  }else{
    const input=document.createElement('input');input.className='w3-input w3-border';input.maxLength=80;input.value=character.DivinationChoice||'';
    input.addEventListener('input',()=>{character.DivinationChoice=input.value.trim();el('divinationChoiceError').textContent='';});label.append(input);
  }
  container.append(label);
}
finishDiv=function(){
  const rule=advDivinationRule();
  if(rule?.specialized&&!advDivinationBenefit().stat){
    const choice=character.DivinationChoice||'';
    if(rule.talent==='Odporność'?!['zimno','gorąco','strach'].includes(choice):!ADV_SAFE_SPECIALIZATION.test(choice)){
      el('divinationChoiceError').textContent='Wybierz specjalizację zdolności z wróżby.';return;
    }
  }
  if(character.homeworld==='voidborn'&&!character.Talents.includes('Strong Minded'))character.Talents.push('Strong Minded');advanceState();renderAdvancement();showExtraStep('divSelect','advanceSelect');
};
function skipAdvancement(){
  const state=advanceState(); character.Advances={stats:{},statCosts:{},skills:{},skillCosts:{},talents:[],talentPurchaseCosts:[],customTalents:[],elite:character.role==='mystic'?'psyker':null,psyRating:character.role==='mystic'?1:0,corruption:character.role==='mystic'?state.corruption:0};
  renderAdvancement();finishAdvancement();
}
function finishAdvancement(){
  if(character.homeworld==='forge'&&!character.Talents.some(name=>['Technical Knock','Weapon-Tech'].includes(name))){el('advanceError').textContent='Wybierz zdolność ze Świata-kuźni.';return;}
  if([...character.Skills,...character.Talents].some(item=>ADV_PLACEHOLDER.test(item))){el('advanceError').textContent='Uzupełnij specjalizacje startowe przed przejściem dalej.';return;}
  if(advanceState().elite==='inquisitor'&&!ADV_SAFE_SPECIALIZATION.test(advanceState().inquisitorLore||'')){el('advanceError').textContent='Inkwizytor musi wybrać specjalizację Zakazanej wiedzy.';return;}
  character.Experience=advanceBalance();renderArmory();showExtraStep('advanceSelect','armorySelect');
}
function backToAdvancement(){renderAdvancement();showExtraStep('armorySelect','advanceSelect');}
function armoryEntry(value){ return typeof value==='string'?ADV_ARMORY.find(item=>item.name===value):value; }
function armoryEffectiveAvailability(item,background=character.background){
  const base=ADV_ALLOWED_AVAILABILITY.indexOf(item.availability);
  if(base<0)return null;
  const bonus=background==='admin'?1:background==='admech'&&item.category==='cybernetyka'?2:0;
  return ADV_ALLOWED_AVAILABILITY[Math.max(0,base-bonus)];
}
function armoryItemAllowed(item,background=character.background){
  const effective=armoryEffectiveAvailability(item,background);
  return effective!==null&&ADV_ALLOWED_AVAILABILITY.indexOf(effective)<=ADV_ALLOWED_AVAILABILITY.indexOf('Niezwykłe');
}
function armoryAvailabilityLabel(item,background=character.background){
  const effective=armoryEffectiveAvailability(item,background);
  return effective===item.availability?item.availability:`${item.availability} → ${effective}`;
}
function armoryWeightLabel(item){return ADV_VARIABLE_WEIGHT[item.name]|| (item.category==='cybernetyka'?'obc. —':`${item.weight} kg`);}
function renderArmory(){
  advanceState();const category=el('armoryCategory').value,select=el('armoryItem');select.replaceChildren(new Option('Wybierz przedmiot…',''));
  el('gearCyberHelp').hidden=category!=='cybernetyka';
  const bonus=character.background==='admin'?'Adeptus Administratum: dostępność każdego przedmiotu +1 stopień.':character.background==='admech'?'Adeptus Mechanicus: dostępność cybernetyki +2 stopnie.':'';
  el('gearBonus').textContent=bonus;
  ADV_ARMORY.filter(item=>!category||item.category===category).sort((a,b)=>Number(armoryItemAllowed(b))-Number(armoryItemAllowed(a))||a.name.localeCompare(b.name,'pl')).forEach(item=>{
    const allowed=armoryItemAllowed(item);
    const option=new Option(`${item.name} · ${armoryAvailabilityLabel(item)} · ${armoryWeightLabel(item)}${allowed?'':' · niedostępne przy tworzeniu'}`,item.name);
    option.disabled=!allowed;select.add(option);
  });
  el('gearLimit').textContent=Math.floor(character.Infl/10);el('gearCount').textContent=character.AdditionalGear.length;
  const list=el('armoryChosen');list.replaceChildren();
  character.AdditionalGear.forEach((value,index)=>{const item=armoryEntry(value),li=document.createElement('li'),remove=document.createElement('button');li.textContent=`${item.name} (${armoryAvailabilityLabel(item)})${item.category==='broń'?' — 2 magazynki standardowej amunicji':''} `;remove.type='button';remove.className='w3-button w3-light-grey w3-round';remove.textContent='Usuń';remove.addEventListener('click',()=>{character.AdditionalGear.splice(index,1);renderArmory();});li.append(remove);list.append(li);});
}
function addArmoryItem(){const name=el('armoryItem').value,item=armoryEntry(name);if(!item||!armoryItemAllowed(item)){el('gearError').textContent='Ten przedmiot jest zbyt rzadki przy tworzeniu tej postaci.';return;}const limit=Math.floor(character.Infl/10);if(character.AdditionalGear.length>=limit){el('gearError').textContent='Wykorzystano limit przedmiotów wynikający z Wpływu.';return;}el('gearError').textContent='';character.AdditionalGear.push(name);renderArmory();}
function addCustomArmoryItem(){
  const name=el('customGearName').value.trim(),category=el('customGearCategory').value,availability=el('customGearAvailability').value,weight=Number(el('customGearWeight').value);
  const item={name,category,availability,weight};
  if(!name||name.length>100||!ADV_ALLOWED_AVAILABILITY.includes(availability)||!['broń','pancerz','sprzęt','narzędzia','używki','modyfikacja','amunicja','cybernetyka'].includes(category)||!Number.isFinite(weight)||weight<0||weight>1000){el('gearError').textContent='Podaj nazwę i poprawne dane przedmiotu z podręcznika głównego.';return;}
  const known=ADV_ARMORY.find(entry=>entry.name===name);
  if(known&&(known.category!==category||known.availability!==availability||known.weight!==weight)){el('gearError').textContent='Ten przedmiot jest już w katalogu. Wybierz go z listy, aby użyć danych z podręcznika.';return;}
  if(!armoryItemAllowed(item)){el('gearError').textContent='Ten przedmiot jest zbyt rzadki przy tworzeniu tej postaci.';return;}
  if(character.AdditionalGear.length>=Math.floor(character.Infl/10)){el('gearError').textContent='Wykorzystano limit przedmiotów wynikający z Wpływu.';return;}
  el('gearError').textContent='';character.AdditionalGear.push(item);el('customGearName').value='';renderArmory();
}
function finishArmory(){character.Experience=advanceBalance();buildSheet();showExtraStep('armorySelect','charSheet');}

function renderAdvancementSheet(){
  const state=advanceState(), summary=el('advancementSummary');summary.replaceChildren();
  const divination=advDivinationBenefit();
  const lines=[`PD: wykorzystano ${advanceSpent()} z 1000; pozostało ${character.Experience}.`];
  if(state.elite){lines.push(`Rozwinięcie Elitarne: ${state.elite==='psyker'?'Psionik':state.elite==='untouchable'?'Nietykalny':'Inkwizytor'}. ${ADV_ELITE_TEXT[state.elite]}`);if(state.elite==='psyker')lines.push(`Współczynnik Psioniczny ${state.psyRating}; ${character.background==='astra'?'Sankcjonowany':`Psionik-Renegat, ${state.corruption} Punktów Spaczenia`}.`);}
  if(state.elite==='untouchable')lines.push(`Ogłada w testach: ${Math.ceil(advStatValue('Fel')/2)}; wobec psioników: 1.`);
  for(const line of lines){const p=document.createElement('p');p.textContent=line;summary.append(p);}
  const elitePanel=el('eliteStartingBonuses');elitePanel.replaceChildren();elitePanel.hidden=state.elite!=='psyker';
  if(state.elite==='psyker'){
    const title=document.createElement('h4');title.textContent='Rozwinięcie elitarne: Psionik';elitePanel.append(title);
    for(const [label,value] of [
      ['Właściwości',character.background==='astra'?'Psionik, Sankcjonowany':'Psionik (bez sankcji)'],
      ['Predyspozycja','Psionika'],
      ['Współczynnik Psioniczny',String(state.psyRating)],
      ['Punkty Spaczenia',String(state.corruption)]
    ]){const p=document.createElement('p'),strong=document.createElement('strong');strong.textContent=label+': ';p.append(strong,document.createTextNode(value));elitePanel.append(p);}
  }
  for(const [stat,name] of Object.entries(ADV_STAT_NAMES)){
    const field=el('attr_'+stat);field.value=advStatValue(stat);
    let boxes=el('sheet-advance-'+stat);if(!boxes){boxes=document.createElement('span');boxes.id='sheet-advance-'+stat;boxes.className='sheet-advance-boxes';field.parentElement.append(boxes);}boxes.replaceChildren();
    ADV_STAT_LEVELS.forEach((level,i)=>{const label=document.createElement('label'),box=document.createElement('input');box.type='checkbox';box.checked=i<(state.stats[stat]||0);box.disabled=true;label.title=level;label.append(box,document.createTextNode(level.slice(0,1)));boxes.append(label);});
  }
  document.querySelectorAll('#charSheet [id^="skill"]:not(#skillSelect)').forEach(row=>{if(!/^skill\d+$/.test(row.id))return;const index=Number(row.id.slice(5)),name=character.Skills[index];const detail=row.querySelector('.skillDetail');if(detail){detail.textContent='';const label=document.createElement('span');label.textContent=plText(name)+' ';detail.append(label);appendSkillBoxes(detail,advSkillRank(name));}});
  const extraSkillNames=new Set([...(divination.skill?[divination.skill]:[]),...Object.keys(state.skills),...(state.elite==='inquisitor'&&state.inquisitorLore?[`Forbidden Lore (${state.inquisitorLore})`]:[])]);
  for(const name of extraSkillNames)if(!character.Skills.includes(name)){
    const row=sheetRowFromTemplate('defaultSkill','.skillDetail',plText(name));
    appendSkillBoxes(row.querySelector('.skillDetail'),advSkillRank(name));el('advancedSkillRows').append(row);
  }
  const talents=el('advancedTalentRows');talents.replaceChildren();
  const allExtraTalents=new Set([...(divination.talent?[divination.talent]:[]),...(state.elite==='untouchable'?['Odporność (moce psioniczne)']:[]),...(state.elite==='inquisitor'?['Znajomości (Inkwizycja)']:[]),...state.talents,...state.customTalents.map(item=>item.name)]);
  allExtraTalents.forEach(name=>{if(!character.Talents.some(t=>plText(t)===name))talents.append(sheetRowFromTemplate('defaultTalent','.talentDetail',name));});
  const gear=el('additionalGearRows'),cyber=el('additionalCybernetics');gear.replaceChildren();cyber.replaceChildren();let additionalWeight=0,variableWeight=false;character.AdditionalGear.forEach(value=>{const item=armoryEntry(value);if(!item)return;additionalWeight+=item.weight;variableWeight||=!!ADV_VARIABLE_WEIGHT[item.name];const p=document.createElement('p');p.textContent=item.category==='cybernetyka'?item.name:`${item.name} — ${armoryWeightLabel(item)}${item.category==='broń'?' (2 magazynki standardowej amunicji)':''}`;(item.category==='cybernetyka'?cyber:gear).append(p);});
  if(variableWeight){const note=document.createElement('p');note.className='armory-weight-note';note.textContent='Masa modyfikacji zależna od broni nie jest wliczona do sumy udźwigu.';gear.append(note);}
  character.AdditionalGear.forEach((value,i)=>{const item=armoryEntry(value);if(item?.category==='broń')renderAdditionalWeapon(item.name,i);});
  const current=Number(el('attr_GearCarryCurrent').textContent)||0;const total=Math.round((current+additionalWeight)*10)/10;el('attr_GearCarryCurrent').textContent=total;el('attr_GearCarryAvailable').textContent=Math.round((Number(el('attr_GearCarryMax').textContent)-total)*10)/10;
  const ag=Math.floor(advStatValue('Ag')/10),t=Math.floor(advStatValue('T')/10),wp=Math.floor(advStatValue('WP')/10),s=Math.floor(advStatValue('S')/10);
  character.Movement=[ag,ag*2,ag*3,ag*6];
  character.Fatigue=t+wp+(character.background==='outcast'?2:0);
  [['halfMove',ag],['fullMove',ag*2],['charge',ag*3],['run',ag*6]].forEach(([id,val])=>el(id).textContent=val+' m');
  el('attr_FatigueThreshold').textContent=character.Fatigue;
  el('attr_Wounds_max').textContent=character.Wounds+state.talents.filter(name=>name==='Krzepkość').length;
  const carryMax=[0.9,2.25,4.5,9,18,27,36,45,56,67,78,90,112,225,337,450,675,900,1350,1800,2250][s+t];
  if(carryMax){character.Carry=carryMax;el('attr_baseCarry').textContent=s+t;el('attr_GearCarryMax').textContent=carryMax;el('attr_GearCarryAvailable').textContent=Math.round((carryMax-total)*10)/10;}
  advAptitudes().forEach((name,i)=>{if(el('aptitude'+i))el('aptitude'+i).textContent=plText(name);});
}
function sheetRowFromTemplate(templateId,detailSelector,name){
  const row=el(templateId).cloneNode(true);row.removeAttribute('id');row.style.display='';
  const detail=row.querySelector(detailSelector);detail.replaceChildren();
  if(detailSelector==='.skillDetail'){const label=document.createElement('span');label.textContent=name;detail.append(label);}
  else detail.textContent=name;
  return row;
}
function renderAdditionalWeapon(name,index){
  let spec=ADV_WEAPON_STATS[name];
  if(!spec){
    const ranged=Object.keys(rangedWeapons).find(key=>plText(key)===name);
    const melee=Object.keys(meleeWeapons).find(key=>plText(key)===name);
    if(ranged)spec={...rangedWeapons[ranged],ranged:true};
    else if(melee)spec={...meleeWeapons[melee],ranged:false};
  }
  if(!spec)return; // Parametry przedmiotów wpisanych ręcznie pozostają w podręczniku.
  const template=el(spec.ranged?'defaultRangedWeapon':'defaultMeleeWeapon');
  const row=template.cloneNode(true);row.id=(spec.ranged?'extraRanged':'extraMelee')+index;row.style.display='block';
  for(const [className,value] of Object.entries({weaponName:name,weaponClass:spec.class,weaponRange:spec.range,weaponDamage:spec.damage,weaponType:spec.type,weaponPen:spec.pen,weaponRoF:spec.RoF,weaponClip:spec.clip,weaponReload:spec.reload,weaponSpecial:spec.special})){
    const cell=row.querySelector('.'+className);if(cell)cell.textContent=plText(value??'–');
  }
  template.after(row);
}
function appendSkillBoxes(container,rank){const span=document.createElement('span');span.className='sheet-advance-boxes';ADV_SKILL_LEVELS.forEach((level,i)=>{const label=document.createElement('label'),box=document.createElement('input');box.type='checkbox';box.checked=i<rank;box.disabled=true;box.setAttribute('aria-label',level);label.title=level;label.append(box,document.createTextNode(String(i+1)));span.append(label);});container.append(span);}

document.addEventListener('DOMContentLoaded',()=>{
  const sheet=el('charSheet'), first=sheet.querySelector('.sheet-wrapper');
  const summary=document.createElement('div');summary.id='advancementSummary';summary.className='advancement-summary';first.prepend(summary);
  const skillRows=document.createElement('div');skillRows.id='advancedSkillRows';el('defaultSkill').after(skillRows);
  const talentRows=document.createElement('div');talentRows.id='advancedTalentRows';el('defaultTalent').after(talentRows);
  const gearRows=document.createElement('div');gearRows.id='additionalGearRows';el('defaultGear').after(gearRows);
});
