'use strict';

const STORAGE_KEY = 'dh2chargen-pl-characters-v1';
function encodeCharacter(value) {
    const bytes = new TextEncoder().encode(JSON.stringify(value));
    return 'DH2PL1:' + btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''));
}

function decodeCharacter(code) {
    if (typeof code !== 'string' || !code.trim() || code.length > 100000) throw new Error('Wklej poprawny kod postaci.');
    const utf8 = code.trim().startsWith('DH2PL1:');
    const binary = atob(code.trim().replace(/^DH2PL1:/, ''));
    const text = utf8 ? new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, char => char.charCodeAt(0))) : binary;
    return validateCharacter(JSON.parse(text));
}

function validateCharacter(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Nieprawidłowy zapis postaci.');
    for (const [field, group] of [['homeworld', 'homeworlds'], ['background', 'backgrounds'], ['role', 'roles']]) requireCore(group, value[field]);
    const result = { homeworld: value.homeworld, background: value.background, role: value.role };
    for (const stat of CHARACTER_STATS) {
        if (!Number.isInteger(value[stat]) || value[stat] < 1 || value[stat] > 100) throw new Error('Kod zawiera nieprawidłowe wartości cech.');
        result[stat] = value[stat];
    }
    const allowed = {
        Aptitudes: new Set(['General', ...CHARACTER_APTITUDES, 'Offense', 'Defense', 'Fieldcraft', 'Social', 'Knowledge', 'Leadership', 'Tech', 'Finesse', 'Psyker']),
        Talents: coreTalentKeys,
        Equip: new Set(CORE.backgrounds.flatMap(id => backgrounds[id].equipment.flatMap(s => s.split(' ZZ ')))),
        Skills: new Set(CORE.backgrounds.flatMap(id => backgrounds[id].skills.flatMap(s => s.split(' ZZ '))))
    };
    for (const [field, permitted] of Object.entries(allowed)) {
        const permittedItem = item => permitted.has(item) || ((field==='Skills'||field==='Talents') && [...permitted].some(template=>ADV_PLACEHOLDER.test(template) && item.startsWith(template.slice(0,template.indexOf('(')+1)) && item.endsWith(')') && ADV_SAFE_SPECIALIZATION.test(item.slice(template.indexOf('(')+1,-1))));
        if (!Array.isArray(value[field]) || value[field].length > 30 || !value[field].every(item => typeof item === 'string' && item.length<=120 && permittedItem(item))) throw new Error('Kod zawiera nieobsługiwane lub nieukończone wybory postaci.');
        result[field] = [...value[field]];
    }
    for (const field of ['Wounds', 'Fate']) {
        if (!Number.isInteger(value[field]) || value[field] < 0 || value[field] > 1000) throw new Error('Kod zawiera nieprawidłową Żywotność lub Przeznaczenie.');
        result[field] = value[field];
    }
    if (typeof value.Divination !== 'string' || value.Divination.length > 3000) throw new Error('Nieprawidłowy opis wróżby.');
    result.Divination = LEGACY_TRANSLATIONS.get(value.Divination) || value.Divination;
    const divinationRule=ADV_DIVINATION_GRANTS.get(result.Divination.split(': ')[0]);
    const divinationChoice=value.DivinationChoice??'';
    if (typeof divinationChoice!=='string'||divinationChoice.length>80||(!divinationRule?.specialized&&divinationChoice)||
        (divinationRule?.talent==='Odporność'&&divinationChoice&&!['zimno','gorąco','strach'].includes(divinationChoice))||
        (divinationRule?.talent==='Nienawiść'&&divinationChoice&&!ADV_SAFE_SPECIALIZATION.test(divinationChoice))) throw new Error('Nieprawidłowa specjalizacja wróżby.');
    result.DivinationChoice=divinationChoice;
    result.Name = typeof value.Name === 'string' ? value.Name.slice(0, 120) : '';
    const raw = value.Advances || {stats:{},skills:{},talents:[],elite:result.role==='mystic'?'psyker':null,psyRating:result.role==='mystic'?1:0,corruption:result.role==='mystic'&&result.background!=='astra'?Math.floor(Math.random()*10)+4:0};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !raw.stats || !raw.skills || !Array.isArray(raw.talents)) throw new Error('Nieprawidłowe rozwinięcia postaci.');
    const advance = {stats:{},statCosts:{},skills:{},skillCosts:{},talents:[],talentPurchaseCosts:[],customTalents:[],elite:raw.elite||null,psyRating:raw.psyRating||0,corruption:raw.corruption||0,inquisitorLore:raw.inquisitorLore||''};
    if (!Object.entries(raw.stats).every(([name,level])=>Object.hasOwn(ADV_STAT_APTS,name)&&Number.isInteger(level)&&level>=0&&level<=5)) throw new Error('Nieprawidłowy rozwój cech.');
    advance.stats={...raw.stats};
    if (raw.statCosts!==undefined) {
        if (!raw.statCosts || typeof raw.statCosts!=='object' || Array.isArray(raw.statCosts) || !Object.entries(raw.statCosts).every(([name,costs])=>Object.hasOwn(advance.stats,name)&&Array.isArray(costs)&&costs.length===advance.stats[name]&&costs.every((cost,i)=>ADV_STAT_COST.some(row=>row[i]===cost)))) throw new Error('Nieprawidłowe koszty rozwoju cech.');
        advance.statCosts=structuredClone(raw.statCosts);
    }
    if (!Object.entries(raw.skills).every(([name,rank])=>typeof name==='string'&&name.length<=100&&ADV_SKILL_APTS[advSkillRoot(name)]&&Number.isInteger(rank)&&rank>=1&&rank<=4&&(ADV_SPECIAL_SKILLS.has(advSkillRoot(name))?/^[^()]+ \([^()]{1,80}\)$/.test(name):name===advSkillRoot(name)))) throw new Error('Nieprawidłowy rozwój umiejętności.');
    advance.skills={...raw.skills};
    if (raw.skillCosts!==undefined) {
        if (!raw.skillCosts || typeof raw.skillCosts!=='object' || Array.isArray(raw.skillCosts) || !Object.entries(raw.skillCosts).every(([name,costs])=>Object.hasOwn(advance.skills,name)&&Array.isArray(costs)&&costs.length<=4&&costs.every(cost=>ADV_SKILL_COST.some(row=>row.includes(cost))))) throw new Error('Nieprawidłowe koszty rozwoju umiejętności.');
        advance.skillCosts=structuredClone(raw.skillCosts);
    }
    if (raw.talents.length>20 || raw.talents.some((name,i)=>name!=='Krzepkość'&&raw.talents.indexOf(name)!==i) || !raw.talents.every(name=>typeof name==='string'&&name.length<=120&&advTalentEntry(name))) throw new Error('Nieprawidłowe zdolności.');
    advance.talents=[...raw.talents];
    if (raw.talentPurchaseCosts!==undefined) {
        if (!Array.isArray(raw.talentPurchaseCosts)||(raw.talentPurchaseCosts.length!==0&&raw.talentPurchaseCosts.length!==advance.talents.length)||!raw.talentPurchaseCosts.every((cost,i)=>ADV_TALENT_COST.some(row=>row[advTalentEntry(advance.talents[i]).tier-1]===cost))) throw new Error('Nieprawidłowe koszty zdolności.');
        advance.talentPurchaseCosts=[...raw.talentPurchaseCosts];
    }
    const customTalents=raw.customTalents||[];
    if (!Array.isArray(customTalents)||customTalents.length>20||!customTalents.every(item=>item&&typeof item==='object'&&!Array.isArray(item)&&ADV_SAFE_TALENT_NAME.test(item.name)&&!/moc[eąy]? psioniczn/i.test(item.name)&&!advTalentEntry(item.name)&&[1,2,3].includes(item.tier)&&Array.isArray(item.apts)&&item.apts.length>=1&&item.apts.length<=2&&new Set(item.apts).size===item.apts.length&&item.apts.every(apt=>ADV_ALL_APTITUDES.includes(apt))&&item.prerequisitesConfirmed===true&&(item.costAtPurchase===undefined||ADV_TALENT_COST.some(row=>row[item.tier-1]===item.costAtPurchase)))) throw new Error('Nieprawidłowa własna zdolność.');
    advance.customTalents=customTalents.map(item=>({name:item.name,tier:item.tier,apts:[...item.apts],prerequisitesConfirmed:true,...(item.costAtPurchase===undefined?{}:{costAtPurchase:item.costAtPurchase})}));
    if (new Set([...advance.talents,...advance.customTalents.map(item=>item.name)].filter(name=>name!=='Krzepkość')).size !== [...advance.talents,...advance.customTalents.map(item=>item.name)].filter(name=>name!=='Krzepkość').length) throw new Error('Powielona zdolność.');
    if (![null,'psyker','untouchable','inquisitor'].includes(advance.elite) || !Number.isInteger(advance.psyRating) || advance.psyRating<0 || advance.psyRating>10 || !Number.isInteger(advance.corruption) || advance.corruption<0 || advance.corruption>13 || (result.role==='mystic'&&advance.elite!=='psyker')) throw new Error('Nieprawidłowe Rozwinięcie Elitarne.');
    if (advance.elite==='psyker' && advance.psyRating<1) throw new Error('Psionik musi mieć Współczynnik Psioniczny co najmniej 1.');
    if (advance.elite==='psyker' && (result.background==='astra'?advance.corruption!==0:advance.corruption<4||advance.corruption>13)) throw new Error('Nieprawidłowe Punkty Spaczenia Psionika.');
    if (advance.elite!=='psyker' && (advance.psyRating||advance.corruption)) throw new Error('Nieprawidłowy zapis Współczynnika Psionicznego.');
    if (advance.elite==='inquisitor'?!ADV_SAFE_SPECIALIZATION.test(advance.inquisitorLore):advance.inquisitorLore!=='') throw new Error('Nieprawidłowa specjalizacja Inkwizytora.');
    result.Advances=advance;
    if (!Array.isArray(value.AdditionalGear) || value.AdditionalGear.length>Math.floor(result.Infl/10) || !value.AdditionalGear.every(entry=>{
        if (typeof entry==='string') { const item=ADV_ARMORY.find(item=>item.name===entry);return item&&armoryItemAllowed(item,result.background); }
        if (!entry||typeof entry!=='object'||Array.isArray(entry)||typeof entry.name!=='string'||!entry.name.trim()||entry.name.length>100||!['broń','pancerz','sprzęt','narzędzia','używki','modyfikacja','amunicja','cybernetyka'].includes(entry.category)||!ADV_ALLOWED_AVAILABILITY.includes(entry.availability)||!Number.isFinite(entry.weight)||entry.weight<0||entry.weight>1000) return false;
        const known=ADV_ARMORY.find(item=>item.name===entry.name);
        return (!known||(known.category===entry.category&&known.availability===entry.availability&&known.weight===entry.weight))&&armoryItemAllowed(entry,result.background);
    })) {
        if (value.AdditionalGear !== undefined) throw new Error('Nieprawidłowe dodatkowe wyposażenie.');
        result.AdditionalGear=[];
    } else result.AdditionalGear=value.AdditionalGear.map(entry=>typeof entry==='string'?entry:{name:entry.name,category:entry.category,availability:entry.availability,weight:entry.weight});
    result.Experience=1000;
    result.HomeBonus = homeworlds[result.homeworld].bonus;
    result.BackBonus = backgrounds[result.background].bonus;
    result.RoleBonus = roles[result.role].bonus;
    result.CharPlus = [...homeworlds[result.homeworld].charPlus];
    result.CharMinus = homeworlds[result.homeworld].charMinus;
    result.Movement = [1, 2, 3, 6].map(multiplier => multiplier * Math.floor(result.Ag / 10));
    result.Carry = carry[Math.floor(result.S / 10) + Math.floor(result.T / 10)];
    result.Fatigue = Math.floor(result.T / 10) + Math.floor(result.WP / 10) + (result.background === 'outcast' ? 2 : 0);
    const previous=character;
    try {
        character=result;
        const error=advanceValid();
        if (error) throw new Error(error);
        if (Object.entries(result.Advances.skillCosts).some(([name,costs])=>costs.length!==result.Advances.skills[name]-advSkillBase(name)||costs.some((cost,i)=>!ADV_SKILL_COST.some(row=>row[advSkillBase(name)+i]===cost)))) throw new Error('Niespójne koszty rozwoju umiejętności.');
        result.Experience=advanceBalance();
        const agilityBonus=Math.floor(advStatValue('Ag')/10),strengthBonus=Math.floor(advStatValue('S')/10),toughnessBonus=Math.floor(advStatValue('T')/10),willpowerBonus=Math.floor(advStatValue('WP')/10);
        result.Movement=[1,2,3,6].map(multiplier=>agilityBonus*multiplier);
        result.Carry=carry[strengthBonus+toughnessBonus];
        result.Fatigue=toughnessBonus+willpowerBonus+(result.background==='outcast'?2:0);
        if (value.Advances && value.Experience!==result.Experience) throw new Error('Niespójny zapis Punktów Doświadczenia.');
    } finally { character=previous; }
    return result;
}

function exportChar() {
    character.Name = el('saveCharName').value.trim() || character.Name || '';
    el('exportText').value = encodeCharacter(character);
    el('exportText').select();
}

function loadCharacter(code) {
    const loaded = decodeCharacter(code);
    character = loaded;
    buildSheet();
    document.querySelectorAll('section[id]').forEach(section => { section.style.display = 'none'; });
    el('charSheet').style.display = 'block';
    el('charSheet').style.opacity = '1';
    el('importModal').style.display = 'none';
    el('saveCharName').value = character.Name;
    document.documentElement.scrollTop = 0;
}

function importChar() {
    el('noString').hidden = true;
    try { loadCharacter(el('importInput').value); }
    catch (error) {
        el('noString').textContent = error instanceof SyntaxError || error.name === 'InvalidCharacterError' ? 'Nieprawidłowy kod postaci. Sprawdź, czy został skopiowany w całości.' : error.message;
        el('noString').hidden = false;
    }
}

function readLocalCharacters() {
    const entries = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(entries)) throw new Error('Nie można odczytać lokalnych zapisów. Użyj wyeksportowanego kodu.');
    return entries;
}

function saveLocalCharacter() {
    try {
        exportChar();
        const entries = readLocalCharacters();
        entries.push({ name: character.Name || 'Akolita', time: new Date().toISOString(), code: el('exportText').value });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
        el('saveStatus').textContent = 'Postać została zapisana w tej przeglądarce.';
        el('characterName').textContent = character.Name || 'Akolita';
    } catch {
        el('saveStatus').textContent = 'Nie udało się zapisać w przeglądarce. Zachowaj wygenerowany kod postaci.';
    }
}

function retrieveChar() {
    try {
        const entries = readLocalCharacters();
        el('charList').replaceChildren();
        entries.forEach((entry, i) => el('charList').add(new Option(entry.name + ' — ' + new Date(entry.time).toLocaleString('pl-PL'), String(i))));
        el('charList').hidden = el('charLoad').hidden = !entries.length;
        el('loadStatus').textContent = entries.length ? '' : 'Brak postaci zapisanych w tej przeglądarce.';
    } catch {
        el('loadStatus').textContent = 'Nie można odczytać zapisów przeglądarki. Wklej kod postaci.';
    }
}

function chooseChar() {
    try { loadCharacter(readLocalCharacters()[Number(el('charList').value)].code); }
    catch (error) { el('loadStatus').textContent = error.message; }
}

document.addEventListener('keydown', event => {
    if (event.key === 'Escape') document.querySelectorAll('.w3-modal').forEach(modal => modal.style.display = 'none');
});
