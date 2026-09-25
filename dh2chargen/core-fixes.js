'use strict';

const CHARACTER_STATS = ['WS', 'BS', 'S', 'T', 'Ag', 'Int', 'Per', 'WP', 'Fel', 'Infl'];
const CHARACTER_APTITUDES = ['Weapon Skill', 'Ballistic Skill', 'Strength', 'Toughness', 'Agility', 'Intelligence', 'Perception', 'Willpower', 'Fellowship'];
let aptitudeSources = [], aptitudeChoices = {}, aptitudeReplacements = {};

function getFullApts() {
    aptitudeSources = ['General', homeworlds[character.homeworld].aptitude, backgrounds[character.background].aptitude, ...roles[character.role].aptitudes];
    aptitudeChoices = {};
    aptitudeReplacements = {};
    renderAptitudes();
}

function aptitudeSelect(options, selected, change, label) {
    const select = document.createElement('select');
    select.className = 'w3-select w3-border w3-round';
    select.setAttribute('aria-label', label);
    select.add(new Option('Wybierz…', ''));
    options.forEach(value => select.add(new Option(plText(value), value)));
    select.value = selected || '';
    select.addEventListener('change', () => change(select.value));
    return select;
}

function renderAptitudes() {
    for (let i = 0; i < 12; i++) el('aptTd_' + i).replaceChildren();
    const resolved = [];
    let row = 0, pending = false;
    // Stałe predyspozycje, wybory, następnie zastępstwa za duplikaty.
    for (const value of aptitudeSources.filter(value => !value.includes(' ZZ '))) {
        if (!resolved.includes(value)) {
            resolved.push(value);
            el('aptTd_' + row++).textContent = plText(value);
        }
    }
    aptitudeSources.forEach((source, i) => {
        if (!source.includes(' ZZ ')) return;
        const selected = aptitudeChoices[i];
        el('aptTd_' + row++).append(aptitudeSelect(source.split(' ZZ '), selected, value => {
            aptitudeChoices[i] = value;
            aptitudeReplacements = {};
            renderAptitudes();
        }, 'Predyspozycja do wyboru'));
        if (!selected) pending = true;
        else if (!resolved.includes(selected)) resolved.push(selected);
    });
    if (!pending) {
        const needed = 8 - resolved.length;
        for (let i = 0; i < needed; i++) {
            const selected = aptitudeReplacements[i];
            const options = CHARACTER_APTITUDES.filter(value => !resolved.includes(value) && !Object.entries(aptitudeReplacements).some(([j, val]) => Number(j) !== i && val === value));
            el('aptTd_' + row++).append(aptitudeSelect(options, selected, value => {
                aptitudeReplacements[i] = value;
                renderAptitudes();
            }, 'Zastępstwo za powtarzającą się predyspozycję'));
        }
        for (let i = 0; i < needed; i++) {
            const value = aptitudeReplacements[i];
            if (value && !resolved.includes(value)) resolved.push(value);
        }
    }
    character.Aptitudes = resolved;
    el('btnAptNext').style.display = !pending && resolved.length === 8 ? '' : 'none';
}

function setChars() {
    const values = CHARACTER_STATS.map(stat => Number(el(stat + 'Man').value));
    if (values.some(value => !Number.isInteger(value) || value < 1 || value > 100)) {
        el('charValidation').textContent = 'Wpisz wszystkie cechy jako liczby całkowite od 1 do 100. Standardowy rzut daje wynik od 22 do 40.';
        return;
    }
    el('charValidation').textContent = '';
    CHARACTER_STATS.forEach((stat, i) => { character[stat] = values[i]; el(stat).textContent = values[i]; });
    el('btnCharNext').style.display = '';
}

const originalCheckChars = checkChars;
checkChars = function () {
    originalCheckChars();
    if (window.characterRerolled) document.querySelectorAll('.reroll').forEach(button => button.style.visibility = 'hidden');
};
const originalReroll = reRollChar;
reRollChar = function (stat) {
    if (window.characterRerolled) return;
    originalReroll(stat);
    window.characterRerolled = true;
};

const originalBuildSheet = buildSheet;
buildSheet = function () {
    // Ponowne wczytanie nie powiela wierszy ani masy wyposażenia.
    for (const prefix of ['melee', 'ranged', 'gear', 'talent', 'skill', 'extraMelee', 'extraRanged']) {
        document.querySelectorAll('#charSheet [id]').forEach(node => {
            if (new RegExp('^' + prefix + '\\d+$').test(node.id)) node.remove();
        });
    }
    el('attr_GearCarryCurrent').textContent = '0';
    el('attr_Cybernetics').textContent = '';
    document.querySelector('.repeating_Cybernetics').style.display = 'none';
    for (let i = 0; i < 12; i++) if (el('aptitude' + i)) el('aptitude' + i).textContent = '';
    originalBuildSheet();
    el('characterName').textContent = character.Name || 'Akolita';
    if (typeof renderAdvancementSheet === 'function') {
        el('advancedSkillRows').replaceChildren();
        renderAdvancementSheet();
    }
};

// Cofnięcie listy do pozycji „Wybierz” musi ponownie zablokować krok,
// zamiast odczytywać nieistniejący wpis z tabeli danych.
for (const [fn, field, table, button, description] of [
    ['talChange', 'Talents', talents, 'btnTalNext', 'talent_desc_'],
    ['equipChange', 'Equip', equipment, 'btnEquipNext', 'equip_desc_'],
    ['skillChange', 'Skills', null, 'btnSkillNext', 'skill_desc_']
]) {
    const original = window[fn];
    window[fn] = function (id) {
        const select = el(id), value = select.value;
        const index = Number(id.split('_').pop());
        if (value === '...' || !value || (table && !Object.hasOwn(table, value))) {
            character[field][index] = 'ZZ';
            el(description + index).textContent = '';
            el(button).style.display = 'none';
            return;
        }
        original(id);
    };
}

document.addEventListener('DOMContentLoaded', () => {
    for (let i = 8; i < 12; i++) el('aptsTable').insertRow().insertCell().id = 'aptTd_' + i;
    document.querySelectorAll('.charMan').forEach(input => input.addEventListener('input', () => { el('btnCharNext').style.display = 'none'; }));
    const error = document.createElement('p');
    error.id = 'charValidation'; error.className = 'error w3-center'; error.setAttribute('role', 'alert');
    el('btnCharNext').before(error);
    const name = document.createElement('h3');
    name.id = 'characterName'; name.className = 'w3-center';
    el('charSheet').querySelector('h3').after(name);
    const print = document.createElement('button');
    print.type = 'button'; print.className = 'w3-button w3-round w3-light-grey print-button';
    print.textContent = 'Drukuj / zapisz jako PDF';
    print.addEventListener('click', () => window.print());
    name.after(print);
});
