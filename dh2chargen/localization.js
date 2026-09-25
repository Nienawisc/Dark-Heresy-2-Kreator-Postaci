'use strict';

function plText(value) {
    if (typeof value !== 'string') return value;
    const text = value.trim();
    if (Object.hasOwn(PL_TERMS, text)) return PL_TERMS[text];
    if (text.includes(' ZZ ')) return text.split(' ZZ ').map(plText).join(' lub ');
    const specialization = text.match(/^([^()]+) \(([^()]+)\)$/);
    if (specialization) return plText(specialization[1]) + ' (' + plText(specialization[2]) + ')';
    if (text.includes(', ')) return text.split(', ').map(plText).join(', ');
    return text.replace(/(\d+)d(\d+)/g, '$1k$2').replace(/^S\//, 'P/').replace(/^Rolled /, 'Wynik: ');
}

// Tłumaczenie wyłącznie tekstu prezentacji. Wartości <option> zostają
// identyfikatorami źródłowymi, na których opierają się wybory i zapis.
function plHTML(value) {
    const template = document.createElement('template');
    template.innerHTML = String(value);
    template.content.querySelectorAll('option:not([value])').forEach(option => {
        option.value = option.textContent;
    });
    const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
        if (node.textContent.trim()) node.textContent = plText(node.textContent);
    }
    return template.innerHTML;
}

const LEGACY_TRANSLATIONS = new Map();
for (const [group, data] of Object.entries({ homeworlds, backgrounds, roles })) {
    for (const id of CORE[group]) {
        const [name, , , bonus] = PL_OPTIONS[id];
        LEGACY_TRANSLATIONS.set(data[id].bonus, bonus);
        data[id].name = name;
        data[id].bonus = bonus;
    }
}
for (const [key, description] of Object.entries(PL_SKILLS)) skills[key].description = description;
for (const [key, description] of Object.entries(PL_EQUIPMENT)) equipment[key].description = description;
const coreTalentKeys = new Set([
    ...CORE.homeworlds.flatMap(id => (homeworlds[id].talent || '').split(' ZZ ')),
    ...CORE.backgrounds.flatMap(id => backgrounds[id].talents.flatMap(s => s.split(' ZZ '))),
    ...CORE.roles.flatMap(id => roles[id].talent.split(' ZZ '))
].filter(Boolean));
for (const key of coreTalentKeys) talents[key].description = PL_TALENTS[key] || PL_TALENTS['Weapon Training'];
Object.values(divinations).forEach((entry, i) => {
    const [name, desc] = PL_DIVINATIONS[i];
    LEGACY_TRANSLATIONS.set(entry.name + ': ' + entry.desc, name + ': ' + desc);
    entry.name = name;
    entry.desc = desc;
});

// Rozbieżności odczytane i sprawdzone na stronach polskiego PDF-u.
homeworlds.shrine.wounds = 7; // s. 38
backgrounds.astra.talents = ['Weapon Training (Las) ZZ Weapon Training (Low-Tech)']; // s. 50
roles.desperado.aptitudes = ['Agility', 'Ballistic Skill', 'Defense', 'Social', 'Finesse']; // s. 70
equipment['Warhammer and Stub Revolver'].weight = '6kg';
equipment['Laspistol and Sword'].weight = '4.5kg';
// Źródło ma dwa wpisy „Whip”; drugi nadpisywał zwykły bicz biczem elektrycznym.
meleeWeapons.Whip = { class: 'Low-Tech', damage: '1d10', type: 'Rending', pen: '0', special: '3m Range, Flexible, Primitive (6)' };
meleeWeapons['Shock Maul'].special = 'Shocking';

function requireCore(group, id) {
    if (!CORE[group].includes(id)) throw new Error('Ta opcja nie należy do podręcznika głównego.');
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function renderCoreCards() {
    const statNames = { WS: 'Walka Wręcz', BS: 'Umiejętności Strzeleckie', S: 'Siła', T: 'Wytrzymałość', Ag: 'Zręczność', Int: 'Inteligencja', Per: 'Percepcja', WP: 'Siła Woli', Fel: 'Ogłada', Infl: 'Wpływ' };
    const groups = [
        ['homeworlds', homeworlds, 'homeSelect', 'Wybierz Pochodzenie', 'chooseHome'],
        ['backgrounds', backgrounds, 'backSelect', 'Wybierz Przeszłość', 'chooseBack'],
        ['roles', roles, 'roleSelect', 'Wybierz Rolę', 'chooseRole']
    ];
    for (const [group, data, sectionId, heading, action] of groups) {
        const section = document.getElementById(sectionId);
        section.innerHTML = `<h2 class="w3-center">${heading}</h2><p class="w3-center">Podręcznik główny • ${CORE[group].length} możliwości</p><div class="core-grid"></div>`;
        for (const id of CORE[group]) {
            const item = data[id];
            const [name, page, summary, bonus] = PL_OPTIONS[id];
            const card = document.createElement('article');
            card.className = 'core-card w3-card-2 w3-round-large';
            const imageId = id === 'voidborn' ? 'void' : id;
            let details;
            if (group === 'homeworlds') {
                details = `<p>${item.charPlus.map(k => '+' + statNames[k]).join(', ')}, −${statNames[item.charMinus]}</p><p>Próg Punktów Przeznaczenia: ${item.fate} (Błogosławieństwo Imperatora ${item.blessing}+)<br>Żywotność: ${item.wounds}+1k5<br>Predyspozycja: ${plText(item.aptitude)}</p>`;
            } else if (group === 'backgrounds') {
                details = `<p><b>Predyspozycja:</b> ${plText(item.aptitude)}</p><p><b>Umiejętności:</b> ${item.skills.map(plText).join('; ')}</p><p><b>Zdolności:</b> ${item.talents.map(plText).join('; ')}</p><p><b>Ekwipunek:</b> ${item.equipment.map(plText).join('; ')}</p>`;
            } else {
                details = `<p><b>Predyspozycje:</b> ${item.aptitudes.map(plText).join('; ')}</p><p><b>Zdolność:</b> ${plText(item.talent)}</p>`;
            }
            card.innerHTML = `<img src="images/${imageId}.png" alt="" loading="lazy"><div class="core-card-content"><h3>${name}</h3><p>${summary}</p><hr>${details}<hr><p>${bonus}</p><p class="source-page">Podręcznik główny, s. ${page}</p><button class="w3-button w3-green w3-round" type="button">Wybierz: ${name}</button></div>`;
            card.querySelector('button').addEventListener('click', () => window[action](id));
            section.querySelector('.core-grid').append(card);
        }
    }
}

document.addEventListener('DOMContentLoaded', renderCoreCards);
