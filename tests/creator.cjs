const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');

(async () => {
    const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
    const errors = [], requests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (/^https?:/.test(request.url())) requests.push(request.url()); });
    const url = pathToFileURL(path.resolve('dh2chargen/index.html')).href;
    await page.goto(url);
    await page.waitForFunction(() => typeof $ === 'function' && document.querySelectorAll('.core-card').length === 21);
    assert.deepEqual(errors, [], 'Startup errors');
    assert.deepEqual(requests, [], 'The creator must work offline');
    assert.equal(await page.locator('html').getAttribute('lang'), 'pl');
    assert.deepEqual(await page.evaluate(() => ['homeSelect', 'backSelect', 'roleSelect'].map(id => el(id).querySelectorAll('.core-card').length)), [6, 7, 8]);
    assert.deepEqual(await page.evaluate(()=>Object.keys(ADV_SKILL_APTS).filter(name=>!VEND_SKILL_KEYS[name])),[], 'Każda umiejętność z podręcznika ma klucz Vendare');
    await page.evaluate(() => {
        // Inwentarz z tabel 4-1, 4-2 i 4-3 polskiego Podręcznika Głównego (s. 120–122).
        const inventory={
            1:'Błyskawiczne przeładowanie|Broń specjalna|Furia|Informatorzy w tłumie|Intuicja|Krzepkość|Na cztery łapy|Oburęczność|Odporność|Powalenie|Powstanie|Przyzwanie żelaza|Ramię w ramię|Rozbrajanie|Szklana pułapka|Szybka naprawa|Szybkie dobycie|Techmodlitwa|Walka na ślepo|Wróg|Zobojętniały|Zmysł Osnowy|Znajomości|Żelazna szczęka|Znikąd osłony',
            2:'Broń egzotyczna|Kontratak|Magnetyczna lewitacja|Mistrz walki|Mistrz walki bez broni|Nabite bicepsy|Nie dozwól wiedźmie|Nienawiść|Nierozpoznawalny|Nieuchronny atak|Nieustanna czujność|Niezależne celowanie|Niszczycielskie natarcie|Podwójny strzał|Potęga woli|Precyzyjny zabójca|Prosangwiniczny|Przewodnik Osnowy|Sieć kontaktów|Strzał z biodra|Strzelec wyborowy|Szał bitewny|Szybki atak|Świetlisty wstrząs|Trudny cel|Twardziel|Ulepszenie zbroi|Używanie mechadendrytów|Walka dwiema broniami|Wir śmierci|Wspólne przesłuchiwanie|Zabójczy atak|Zatuszowanie',
            3:'Aura dowódcy|Błyskawiczny atak|Bycza szarża|Głos zabójcy|Delikatne przesłuchiwanie|Forteca woli|Miażdżący cios|Mistrz ostrza|Mistrz dwóch broni|Mistrzostwo|Mocarny strzał|Nadludzka szybkość|Niezłomna wiara|Niezłomny|Niosący śmierć|Odcięcie Osnowy|Oko zemsty|Potężny cios|Prawdziwe męstwo|Przebłysk intuicji|Sprint|Świetlisty podmuch|Ulubieniec Osnowy|Wiedza wpojona|Wybitny chirurgon|Wybór celu|Zejście z linii'
        };
        const baseName=name=>name.replace(/ \((wręcz|dystansow[ay]|atak w zwarciu|atak dystansowy)\)$/,'');
        for(const [tier,names] of Object.entries(inventory)){
            const expected=names.split('|').sort((a,b)=>a.localeCompare(b,'pl'));
            const actual=[...new Set(ADV_TALENTS.filter(item=>item.tier===Number(tier)&&!item.requirements.elite).map(item=>baseName(item.name)))].sort((a,b)=>a.localeCompare(b,'pl'));
            if(JSON.stringify(actual)!==JSON.stringify(expected))throw new Error(`Zdolności poziomu ${tier}: ${JSON.stringify({missing:expected.filter(name=>!actual.includes(name)),extra:actual.filter(name=>!expected.includes(name))})}`);
        }
        if(ADV_TALENTS.some(item=>item.apts.some(apt=>apt&&!ADV_ALL_APTITUDES.includes(apt))))throw new Error('Nieznana predyspozycja zdolności');
    });
    await page.getByText('Stwórz postać', { exact: true }).click();
    await page.getByRole('button', { name: 'Wybierz: Świat-kuźnia', exact: true }).click();
    await page.getByRole('button', { name: 'Wybierz: Adeptus Mechanicus', exact: true }).click();
    await page.getByRole('button', { name: 'Wybierz: Mędrzec', exact: true }).click();
    await page.getByText('Wylosuj wszystkie cechy', { exact: true }).click();
    assert.equal(await page.locator('#btnCharNext').isVisible(), true);

    const result = await page.evaluate(() => {
        $.fx.off = true;
        const assert = (condition, message) => { if (!condition) throw new Error(message); };
        const selectChoices = (id, first) => {
            for (const select of el(id).querySelectorAll('select')) {
                select.selectedIndex = first ? 1 : select.options.length - 1;
                select.dispatchEvent(new Event('change'));
            }
        };
        const finishAptitudeChoices = () => {
            for (let i = 0; i < 16; i++) {
                const select = [...el('aptsTable').querySelectorAll('select')].find(item => !item.value);
                if (!select) break;
                select.selectedIndex = select.options.length - 1;
                select.dispatchEvent(new Event('change'));
            }
            assert(character.Aptitudes.length === 8 && new Set(character.Aptitudes).size === 8, 'Eight distinct aptitudes');
        };
        const nonCore = { homeworlds: 'agri', backgrounds: 'sororitas', roles: 'ace' };
        for (const [group, id] of Object.entries(nonCore)) {
            let rejected = false;
            try { requireCore(group, id); } catch { rejected = true; }
            assert(rejected, 'Supplement blocked: ' + id);
        }
        let count = 0;
        for (const first of [true, false]) for (const home of CORE.homeworlds) for (const background of CORE.backgrounds) for (const role of CORE.roles) {
            chooseHome(home); chooseBack(background); chooseRole(role);
            for (const stat of CHARACTER_STATS) character[stat] = 30;
            finishChars(); try { finishAptitudeChoices(); } catch (error) { throw new Error(`${home}/${background}/${role}: ${error.message}; aptitudes=${JSON.stringify(character.Aptitudes)}`); } finishApts();
            selectChoices('talentTable', first); finishTalents();
            selectChoices('equipTable', first); finishEquip();
            selectChoices('skillTable', first); finishSkills();
            character.Wounds += 3;
            character.Divination = PL_DIVINATIONS[1].join(': ');
            buildSheet();
            if (role === 'mystic') {
                assert(character.Advances.elite === 'psyker' && character.Advances.psyRating === 1, 'Free Psyker for Mystic');
                assert(background === 'astra' ? character.Advances.corruption === 0 : character.Advances.corruption >= 4 && character.Advances.corruption <= 13, 'Sanctioning and corruption');
            }
            const sheet = el('charSheet').textContent;
            assert(!/undefined|NaN/.test(sheet), 'Invalid sheet: ' + [home, background, role]);
            const english = /\b(Fellowship|Willpower|Toughness|Knowledge|General|Weapon Training|Common Lore|Low-Tech|Reliable|Two-Handed|Impact|Rending|Energy|Feral World|Outcast|Wounds|Fate|Choose|Rolled)\b/;
            assert(!english.test(sheet), 'Untranslated sheet: ' + sheet.match(english));
            assert(!english.test(el('talentTable').textContent + el('equipTable').textContent + el('skillTable').textContent), 'Untranslated choices');
            const code = encodeCharacter(character);
            const restored = decodeCharacter(code);
            assert(restored.homeworld === home && restored.background === background && restored.role === role, 'Save round-trip');
            const weight = el('attr_GearCarryCurrent').textContent;
            buildSheet();
            assert(el('attr_GearCarryCurrent').textContent === weight, 'Repeated sheet must not add weight');
            count++;
        }
        character.Name = 'Żaneta Łęcka — Śledczy';
        assert(decodeCharacter(encodeCharacter(character)).Name === character.Name, 'Polish Unicode round-trip');
        const old = { ...character, Name: '', HomeBonus: '', BackBonus: '', RoleBonus: '', Divination: 'Trust in your fear: Increase this character\'s Perception by 5. He also gains the Phobia Mental Disorder.' };
        const oldCode = btoa(JSON.stringify(old));
        assert(decodeCharacter(oldCode).Divination.startsWith('Ufaj swoim lękom.'), 'Legacy English import');
        for (const code of ['', 'not base64!!!', btoa('{'), encodeCharacter({}), encodeCharacter({ ...character, role: 'ace' }), encodeCharacter({ ...character, Equip: ['<img src=x onerror=alert(1)>'] })]) {
            let rejected = false;
            try { decodeCharacter(code); } catch { rejected = true; }
            assert(rejected, 'Invalid import rejected');
        }
        el('saveCharName').value = character.Name;
        saveLocalCharacter();
        retrieveChar();
        assert(el('charList').options.length > 0, 'Local save');
        chooseChar();
        assert(el('characterName').textContent === character.Name, 'Local load');
        assert(homeworlds.agri.name === 'Agri-World' && roles.ace.name === 'Ace' && backgrounds.sororitas.name === 'Adepta Sororitas', 'Supplement data stays untranslated');
        return { combinations: count, weight: el('attr_GearCarryCurrent').textContent };
    });
    assert.deepEqual(errors, [], 'Runtime errors');
    fs.mkdirSync('test-results', { recursive: true });
    const assertSheetLayout = async width => {
        await page.setViewportSize({ width, height: 1000 });
        const overlaps=await page.evaluate(() => {
            const collides=(a,b)=>a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1;
            const errors=[];
            for(const row of document.querySelectorAll('#charSheet .sheet-characteristics > .w3-row-padding > .w3-half > .w3-row-padding')){
                const label=row.querySelector('.w3-half:first-child label'),boxes=row.querySelector('.sheet-advance-boxes');
                if(label&&boxes&&collides(label.getBoundingClientRect(),boxes.getBoundingClientRect()))errors.push(label.textContent.trim());
            }
            for(const row of document.querySelectorAll('#charSheet .skillDetail')){
                const name=row.querySelector(':scope > span:first-child'),boxes=row.querySelector('.sheet-advance-boxes');
                if(!name||!boxes)continue;
                if(collides(name.getBoundingClientRect(),boxes.getBoundingClientRect()))errors.push(`${name.textContent.trim()}: tekst nachodzi na pola`);
                const labels=[...boxes.querySelectorAll('label')].map(label=>label.getBoundingClientRect());
                if(labels.some(label=>Math.abs(label.top-labels[0].top)>2))errors.push(`${name.textContent.trim()}: pola nie są w jednym rzędzie`);
            }
            return errors;
        });
        assert.deepEqual(overlaps, [], `Sheet text and checkboxes overlap at ${width}px`);
    };
    await assertSheetLayout(1440);
    await page.screenshot({ path: 'test-results/sheet-desktop.png', fullPage: true });
    await assertSheetLayout(768);
    await assertSheetLayout(390);
    await page.screenshot({ path: 'test-results/sheet-mobile.png', fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Mobile sheet overflow');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.reload();
    await page.getByText('Stwórz postać', { exact: true }).click();
    await page.waitForFunction(() => getComputedStyle(el('homeSelect')).opacity === '1');
    await page.screenshot({ path: 'test-results/origins-desktop.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: 'test-results/origins-mobile.png', fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Mobile page overflow');
    // Pełna ścieżka przez widoczne przyciski, z kontrolą wymaganych wyborów.
    await page.reload();
    await page.evaluate(() => { $.fx.off = true; });
    await page.getByText('Stwórz postać', { exact: true }).click();
    await page.getByRole('button', { name: 'Wybierz: Dziki świat', exact: true }).click();
    await page.getByRole('button', { name: 'Wybierz: Gwardia Imperialna', exact: true }).click();
    await page.getByRole('button', { name: 'Wybierz: Wojownik', exact: true }).click();
    await page.getByText('Wpisz cechy ręcznie', { exact: true }).click();
    await page.getByRole('button', { name: 'Zatwierdź', exact: true }).click();
    assert.equal(await page.locator('#btnCharNext').isVisible(), false);
    for (const input of await page.locator('.charMan').all()) await input.fill('30');
    await page.getByRole('button', { name: 'Zatwierdź', exact: true }).click();
    await page.locator('#btnCharNext').click();
    for (let i = 0; i < 12; i++) {
        const selector = await page.locator('#aptsTable select').evaluateAll(items => items.findIndex(item => !item.value));
        if (selector < 0) break;
        await page.locator('#aptsTable select').nth(selector).selectOption({ index: 1 });
    }
    await page.locator('#btnAptNext').click();
    for (const [table, next] of [['talentTable', 'btnTalNext'], ['equipTable', 'btnEquipNext'], ['skillTable', 'btnSkillNext']]) {
        for (const select of await page.locator('#' + table + ' select').all()) await select.selectOption({ index: 1 });
        const first = page.locator('#' + table + ' select').first();
        await first.selectOption({ index: 0 });
        assert.equal(await page.locator('#' + next).isVisible(), false, 'Incomplete choices must block the next step');
        await first.selectOption({ index: 1 });
        await page.locator('#' + next).click();
    }
    await page.locator('#rollWounds').click();
    await page.locator('#rollFate').click();
    await page.locator('#btnWoundNext').click();
    await page.evaluate(() => { const originalRoll=roll;window.roll=(formula,...args)=>formula==='1d100'?23:originalRoll(formula,...args); });
    await page.locator('#rollDiv').click();
    await page.locator('#btnDivNext').click();
    assert.equal(await page.locator('#advanceSelect').isVisible(), true);
    await page.evaluate(() => {
        const check=(condition,message)=>{if(!condition)throw new Error(message);};
        check(!el('eliteChoices') && !document.querySelector('#advanceTalents button, .custom-talent button'), 'Elite picker and talent buy buttons removed');
        check(getComputedStyle(el('advanceAptitudes')).position==='sticky', 'Aptitudes stay visible while scrolling');
        check(el('advanceAptitudes').querySelectorAll('.aptitude-badge').length===advAptitudes().length, 'Current aptitudes shown');
        const statLabel=el('advanceStats').querySelector('[data-stat="WS"] label');
        statLabel.dispatchEvent(new Event('mouseenter'));
        const highlighted=[...el('advanceAptitudes').querySelectorAll('.is-matched')].map(badge=>badge.dataset.aptitude);
        check(highlighted.length===ADV_STAT_APTS.WS.filter(apt=>advAptitudes().includes(apt)).length && highlighted.every(apt=>ADV_STAT_APTS.WS.includes(apt)), 'Matching aptitudes highlighted');
        statLabel.dispatchEvent(new Event('mouseleave'));
        check(!el('advanceAptitudes').querySelector('.is-matched'), 'Highlight clears');
        check(el('advanceCostTables').querySelectorAll('table').length===3, 'Three cost tables');
        check(el('advanceCostTables').textContent.includes(String(ADV_TALENT_COST[2][2])), 'Talent costs shown');
        check(el('advanceSkills').textContent.includes('Podstawowy'), 'First skill level named Podstawowy');
        check(JSON.stringify([...el('advanceTalents').querySelectorAll('.talent-tier')].map(group=>group.querySelectorAll('.talent-option').length))===JSON.stringify([25,36,28]), 'Every core talent variant shown on the XP page');
        const checkedCharacter={Int:character.Int,Per:character.Per,Skills:[...character.Skills],background:character.background,Equip:[...character.Equip]};
        const vigilance=ADV_TALENTS.find(item=>item.name==='Nieustanna czujność');
        character.Int=30;character.Per=35;character.Skills.push('Awareness','Awareness');
        check(advTalentAllowed(vigilance),'Either characteristic plus trained Awareness meets prerequisites');
        character.Per=30;check(!advTalentAllowed(vigilance),'Missing alternative characteristic blocks the talent');
        character.Int=checkedCharacter.Int;character.Per=checkedCharacter.Per;character.Skills=checkedCharacter.Skills;
        const iron=ADV_TALENTS.find(item=>item.name==='Przyzwanie żelaza');
        character.background='admech';character.Equip.push('Wszczep ferromagnetyczny');
        check(advTalentAllowed(iron),'Implant and Mechanicus background meet prerequisites');
        character.background=checkedCharacter.background;character.Equip=checkedCharacter.Equip;
        for (const tier of el('advanceTalents').querySelectorAll('.talent-tier')) {
            const rows=[...tier.querySelectorAll('.talent-option')];
            const sorted=[...rows].sort((a,b)=>Number(b.dataset.eligible==='true')-Number(a.dataset.eligible==='true')||Number(a.dataset.cost)-Number(b.dataset.cost)||a.dataset.talentName.localeCompare(b.dataset.talentName,'pl'));
            check(rows.every((row,index)=>row===sorted[index]),'Talent order by eligibility, cost, name');
        }
        check(el('advanceTalents').querySelector('[data-talent-name="Znajomości"]').textContent.includes('Wymagania: Ogłada 30'), 'Talent requirements shown');
        const initial=advanceBalance();
        const repeat=el('advanceTalents').querySelector('[data-talent-name="Krzepkość"] input');repeat.click();
        check(advanceBalance()<initial && advanceState().talents.includes('Krzepkość'), 'Repeatable talent bought by checkbox');
        el('advanceTalents').querySelector('[aria-label="Krzepkość: zakup 1"]').click();
        check(advanceBalance()===initial, 'Repeatable talent removed by checkbox');
        const specialized=el('advanceTalents').querySelector('[data-talent-name="Broń specjalna"]');
        specialized.querySelector('input.w3-input').value='Testowa';specialized.querySelector('input[type="checkbox"]').click();
        check(advanceState().talents.includes('Broń specjalna (Testowa)'), 'Specialized talent bought by checkbox');
        el('advanceTalents').querySelector('[data-talent-name="Broń specjalna"] input:checked').click();
        check(advanceBalance()===initial, 'Specialized talent removed by checkbox');
    });
    await page.screenshot({ path: 'test-results/advancement-mobile.png', fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Mobile advancement overflow');
    await page.locator('#advanceTalents .talent-tier').first().screenshot({ path: 'test-results/talent-tier-1.png' });
    await page.locator('#advanceStats [data-stat="WS"] input').first().check();
    assert.equal(await page.locator('#xpRemaining').innerText(), '900');
    await page.locator('#advanceSkills .advance-row').filter({ hasText: 'Atletyka' }).locator('input').nth(1).check();
    assert.equal(await page.locator('#xpRemaining').innerText(), '700');
    await page.getByRole('button', { name: 'Dalej do wyposażenia' }).click();
    assert.equal(await page.locator('#gearLimit').innerText(), '3');
    await page.evaluate(() => {
        const check=(condition,message)=>{if(!condition)throw new Error(message);};
        const cyber=ADV_ARMORY.filter(item=>item.category==='cybernetyka');
        check(cyber.length===32,'All 27 core cybernetics and five mechadendrite variants listed');
        check(ADV_ARMORY.some(item=>item.name==='Zaawansowana apteczka'&&item.weight===5&&item.availability==='Rzadkie'),'Advanced medikit variant listed');
        check(armoryWeightLabel(ADV_ARMORY.find(item=>item.name==='Stabilizator')).includes('×1/2'),'Relative modification weight is shown');
        check(new Set(ADV_ARMORY.map(item=>item.name)).size===ADV_ARMORY.length,'No duplicate armory entries');
        const rare=ADV_ARMORY.find(item=>item.name==='Diagnozer');
        const uncommonCyber=ADV_ARMORY.find(item=>item.name==='Kondensator');
        const uniqueCyber=ADV_ARMORY.find(item=>item.name==='Złe oko');
        check(!armoryItemAllowed(rare,'guard')&&armoryItemAllowed(rare,'admin'),'Administratum improves all items one level');
        check(!armoryItemAllowed(uncommonCyber,'guard')&&armoryItemAllowed(uncommonCyber,'admech'),'Mechanicus improves cybernetics two levels');
        check(!armoryItemAllowed(rare,'admech')&&!armoryItemAllowed(uncommonCyber,'admin')&&!armoryItemAllowed(uniqueCyber,'admech'),'Bonuses apply only to their categories and do not bypass limit');
        const original=character.background;
        character.background='admin';renderArmory();
        check(![...el('armoryItem').options].find(option=>option.value==='Diagnozer').disabled,'Administratum rare item enabled');
        character.background='admech';el('armoryCategory').value='cybernetyka';renderArmory();
        check(![...el('armoryItem').options].find(option=>option.value==='Kondensator').disabled,'Mechanicus uncommon cybernetics enabled');
        check([...el('armoryItem').options].find(option=>option.value==='Złe oko').disabled,'Very rare cybernetics remains unavailable');
        character.background=original;el('armoryCategory').value='';renderArmory();
    });
    await page.screenshot({ path: 'test-results/armory-mobile.png', fullPage: true });
    await page.locator('#armoryItem').selectOption('Pistolet laserowy');
    await page.getByRole('button', { name: 'Dodaj przedmiot' }).click();
    assert.equal(await page.locator('#gearCount').innerText(), '1');
    await page.locator('#armoryCategory').selectOption('cybernetyka');
    await page.locator('#armoryItem').selectOption('Bioniczna ręka');
    await page.getByRole('button', { name: 'Dodaj przedmiot' }).click();
    assert.equal(await page.locator('#gearCount').innerText(), '2');
    await page.locator('#armoryCategory').selectOption('broń');
    await page.locator('#armoryItem').selectOption('Laserowy karabin snajperski');
    await page.getByRole('button', { name: 'Dodaj przedmiot' }).click();
    assert.equal(await page.locator('#gearCount').innerText(), '3');
    await page.getByRole('button', { name: 'Zobacz kartę postaci' }).click();
    assert.equal(await page.locator('#attr_Homeworld').innerText(), 'Dziki świat');
    assert.equal(await page.locator('#attr_Background').innerText(), 'Gwardia Imperialna');
    assert.equal(await page.locator('#attr_Role').innerText(), 'Wojownik');
    assert.equal(await page.locator('#attr_WS').inputValue(), '35');
    assert.equal(await page.locator('#advancedTalentRows .talentDetail').getByText('Szybkie dobycie').count(), 1, 'Wróżba dodaje darmową zdolność');
    assert.equal(await page.locator('#advancedTalentRows > .w3-row .sheet-item.underline').count(), 1, 'Dodatkowa zdolność ma styl karty');
    assert.equal(await page.locator('#additionalGearRows').getByText(/Pistolet laserowy/).count(), 1);
    assert.equal(await page.locator('#additionalCybernetics').getByText('Bioniczna ręka').count(), 1);
    assert.equal(await page.locator('#charSheet [id^="extraRanged"] .weaponName').filter({ hasText: 'Laserowy karabin snajperski' }).count(), 1);
    assert.equal(await page.evaluate(() => decodeCharacter(encodeCharacter(character)).AdditionalGear.includes('Bioniczna ręka')), true);
    await page.evaluate(() => loadCharacter(encodeCharacter(character)));
    assert.equal(await page.locator('#additionalCybernetics').getByText('Bioniczna ręka').count(), 1, 'Cybernetic implant survives import');
    assert.equal(await page.locator('#charSheet [id^="extraRanged"] .weaponName').filter({ hasText: 'Laserowy karabin snajperski' }).count(), 1, 'Additional weapon is not duplicated after import');
    assert.equal(await page.locator('#advancedTalentRows .talentDetail').getByText('Szybkie dobycie').count(), 1, 'Zdolność z wróżby przetrwa import');
    const foundry=await page.evaluate(() => createVendareActorData(character));
    assert.equal(await page.evaluate(() => vendSpecialityKey('Common Lore','Adeptus Ministorum')),'ecclesiarchy','Ministorum trafia do specjalizacji Vendare');
    assert.equal(await page.evaluate(() => vendSpecialityKey('Common Lore','Adeptus Administratum')),'administratum','Administratum trafia do specjalizacji Vendare');
    assert.equal(foundry.actor.type, 'acolyte', 'Eksport korzysta z typu aktora Vendare');
    assert.equal(foundry.actor.system.experience.value, 1000, 'Foundry dostaje całe początkowe PD');
    const foundrySpent=Object.values(foundry.actor.system.characteristics).reduce((sum,entry)=>sum+entry.cost,0)
        +Object.values(foundry.actor.system.skills).reduce((sum,entry)=>sum+(entry.specialities?Object.values(entry.specialities).reduce((inner,speciality)=>inner+speciality.cost,0):entry.cost),0)
        +foundry.actor.items.filter(item=>item.type==='talent').reduce((sum,item)=>sum+item.system.cost,0)
        +foundry.actor.system.psy.cost+foundry.actor.system.experience.spentOther;
    assert.equal(foundrySpent,1000-await page.evaluate(()=>character.Experience),'Koszty PD po imporcie odpowiadają kreatorowi');
    assert.equal(foundry.actor.system.characteristics.weaponSkill.base+foundry.actor.system.characteristics.weaponSkill.advance, Number(await page.locator('#attr_WS').inputValue()), 'Rozwój cechy trafia do pól Vendare');
    assert.equal(foundry.actor.items.some(item=>item.name==='Szybkie dobycie'&&item.type==='talent'&&item.system.starter), true, 'Wróżba trafia do przedmiotów Foundry');
    assert.equal(foundry.actor.items.some(item=>item.name==='Bioniczna ręka'&&item.type==='cybernetic'), true, 'Cybernetyka trafia do Foundry');
    assert.equal(foundry.actor.items.some(item=>item.name==='Laserowy karabin snajperski'&&item.type==='weapon'&&item.system.range===150), true, 'Broń zachowuje dostępne parametry');
    assert.equal(foundry.actor.items.some(item=>item.name==='Pistolet laserowy'&&item.type==='weapon'&&item.system.range===30), true, 'Polska nazwa standardowej broni jest mapowana na jej parametry');
    assert.equal(foundry.actor.items.some(item=>item.type==='ammunition'&&item.system.quantity===2), true, 'Dodatkowa broń ma dwa magazynki');
    assert.equal(new Set(foundry.actor.items.map(item=>item._id)).size,foundry.actor.items.length,'Każdy przedmiot Foundry ma unikalny identyfikator');
    assert.equal(foundry.actor.items.every(item=>/^[A-Za-z0-9]{16}$/.test(item._id)),true,'Identyfikatory przedmiotów mają format Foundry');
    for(const ammo of foundry.actor.items.filter(item=>item.type==='ammunition')){
        const weapon=foundry.actor.items.find(item=>item._id===ammo.system.weaponId);
        assert.equal(weapon?.type,'weapon','Amunicja odwołuje się do istniejącej broni');
        assert.equal(weapon.system.ammo.includes(ammo._id),true,'Broń ma przypisaną amunicję');
    }
    assert.equal(foundry.actor.items.filter(item=>item.type==='aptitude').length>=7, true, 'Predyspozycje trafiają do Foundry');
    await page.getByRole('button', { name: 'Eksport / zapis' }).click();
    await page.screenshot({ path: 'test-results/foundry-modal.png' });
    const [foundryDownload]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Pobierz JSON do Foundry'}).click()]);
    assert.match(foundryDownload.suggestedFilename(), /-vendare\.json$/, 'Foundry dostaje nazwany plik JSON');
    const downloadedActor=JSON.parse(decodeURIComponent(foundryDownload.url().split(',')[1]));
    assert.equal(downloadedActor.type,'acolyte','Pobrany plik jest aktorem Foundry, nie wewnętrznym kodem kreatora');
    assert.equal(downloadedActor.items.some(item=>item.type==='cybernetic'),true,'Pobrany JSON zawiera ekwipunek');
    await page.getByRole('button',{name:'Zamknij'}).last().click();
    const [directDownload]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Pobierz do Foundry'}).click()]);
    assert.match(directDownload.suggestedFilename(),/-vendare\.json$/,'Karta postaci ma bezpośredni przycisk pobierania');
    await assertSheetLayout(390);
    await assertSheetLayout(1440);
    assert.equal(await page.evaluate(() => decodeCharacter(encodeCharacter(character)).Experience), 700);
    await page.evaluate(() => {
        const saved=structuredClone(character);
        const check=(condition,message)=>{if(!condition)throw new Error(message);};
        const fresh=()=>{character=structuredClone(saved);character.AdditionalGear=[];character.Advances={stats:{},skills:{},talents:[],elite:null,psyRating:0,corruption:0};character.Experience=1000;};
        fresh();character.WP=40;character.Advances.elite='psyker';character.Advances.psyRating=2;character.Advances.corruption=4;character.Experience=advanceBalance();
        check(advAptitudes().includes('Psyker')&&character.Experience===300,'Psionik i rozwój Współczynnika Psionicznego');
        check(decodeCharacter(encodeCharacter(character)).Advances.psyRating===2,'Eksport Psionika');
        fresh();character.WP=35;setAdvanceRank('stats','WP',1,0,rank=>advStatPrice('WP',rank));
        check(advanceSpent()===500,'Koszt Siły Woli przed Psionikiem');
        character.Advances.elite='psyker';character.Advances.psyRating=1;character.Advances.corruption=4;character.Experience=advanceBalance();
        check(character.Experience===200,'Psionik nie obniża wcześniejszego kosztu');
        check(decodeCharacter(encodeCharacter(character)).Experience===200,'Eksport zachowuje cenę zakupu');
        fresh();character.Advances.elite='untouchable';character.Experience=advanceBalance();
        check(advTalentOwned('Odporność (moce psioniczne)')&&character.Experience===700,'Bonus Nietykalnego');
        check(decodeCharacter(encodeCharacter(character)).Advances.elite==='untouchable','Eksport Nietykalnego');
        fresh();character.Advances.talents=['Broń specjalna (Elektryczna)','Krzepkość','Krzepkość'];character.Experience=advanceBalance();
        check(character.Experience>=0&&decodeCharacter(encodeCharacter(character)).Advances.talents.length===3,'Zdolności specjalistyczne i powtarzalne');
        fresh();character.Advances.talents=['Wróg (Testowa)'];character.Experience=advanceBalance();
        check(decodeCharacter(encodeCharacter(character)).Advances.talents[0]==='Wróg (Testowa)','Eksport nowej zdolności specjalistycznej');
        fresh();character.Advances.customTalents=[{name:'Próba własnej zdolności',tier:2,apts:['Perception','Defense'],prerequisitesConfirmed:true}];character.Experience=advanceBalance();
        check(character.Experience===550&&decodeCharacter(encodeCharacter(character)).Advances.customTalents.length===1,'Zdolność z ręcznie podanymi predyspozycjami');
        character.Advances.customTalents[0].prerequisitesConfirmed=false;let invalidTalent=false;try{decodeCharacter(encodeCharacter(character));}catch{invalidTalent=true;}check(invalidTalent,'Wymagania zdolności muszą być potwierdzone');
        fresh();character.AdditionalGear=[{name:'Granat dymny',category:'broń',availability:'Powszechne',weight:0.5}];
        check(decodeCharacter(encodeCharacter(character)).AdditionalGear.length===1,'Ręcznie wprowadzony przedmiot z podręcznika');
        character.AdditionalGear[0].availability='Rzadkie';let rejected=false;try{decodeCharacter(encodeCharacter(character));}catch{rejected=true;}check(rejected,'Zbyt rzadka dostępność blokowana');
        fresh();character.background='admin';character.AdditionalGear=['Diagnozer'];
        check(decodeCharacter(encodeCharacter(character)).AdditionalGear[0]==='Diagnozer','Eksport dopuszcza premię Administratum');
        character.AdditionalGear=['Kondensator'];rejected=false;try{decodeCharacter(encodeCharacter(character));}catch{rejected=true;}check(rejected,'Administratum nie otrzymuje dwóch stopni premii do cybernetyki');
        fresh();character.background='admech';character.AdditionalGear=['Kondensator'];
        check(decodeCharacter(encodeCharacter(character)).AdditionalGear[0]==='Kondensator','Eksport dopuszcza premię Mechanicus do cybernetyki');
        character.AdditionalGear=['Diagnozer'];rejected=false;try{decodeCharacter(encodeCharacter(character));}catch{rejected=true;}check(rejected,'Mechanicus nie otrzymuje premii do zwykłych przedmiotów');
        fresh();character.Divination=PL_DIVINATIONS[21].join(': ');character.Skills=character.Skills.filter(name=>name!=='Dodge');buildSheet();
        check(advDivinationBenefit().skill==='Dodge'&&advSkillRank('Dodge')===1,'Wróżba przyznaje podstawowy Unik');
        check(el('advancedSkillRows').querySelector('.skillDetail .sheet-advance-boxes input:checked')!==null,'Unik z wróżby używa stylu i pól karty');
        check(decodeCharacter(encodeCharacter(character)).Divination===character.Divination,'Darmowy Unik przetrwa eksport');
        fresh();character.Divination=PL_DIVINATIONS[6].join(': ');character.Talents.push('Quick Draw');buildSheet();
        check(advDivinationBenefit().stat==='Ag'&&advStatValue('Ag')===character.Ag+2,'Znana zdolność z wróżby daje premię do cechy');
        check(!el('advancedTalentRows').textContent.includes('Szybkie dobycie'),'Znana zdolność nie jest dodawana drugi raz');
        fresh();character.Divination=PL_DIVINATIONS[4].join(': ');character.DivinationChoice='';renderDivinationChoice();
        const hatredChoice=el('divinationChoice').querySelector('input');check(hatredChoice!==null,'Wróżba prosi o grupę Nienawiści');
        hatredChoice.value='Orkowie';hatredChoice.dispatchEvent(new Event('input'));buildSheet();
        check(advDivinationBenefit().talent==='Nienawiść (Orkowie)'&&el('advancedTalentRows').textContent.includes('Nienawiść (Orkowie)'),'Specjalizacja Nienawiści z wróżby pojawia się na karcie');
        check(decodeCharacter(encodeCharacter(character)).DivinationChoice==='Orkowie','Specjalizacja wróżby przetrwa eksport');
        fresh();character.Divination=PL_DIVINATIONS[18].join(': ');character.DivinationChoice='';renderDivinationChoice();
        const resistanceChoice=el('divinationChoice').querySelector('select');check(resistanceChoice!==null,'Wróżba prosi o rodzaj Odporności');
        resistanceChoice.value='strach';resistanceChoice.dispatchEvent(new Event('change'));buildSheet();
        check(advDivinationBenefit().talent==='Odporność (strach)','Wróżba może przyznać wybraną Odporność');
        character.DivinationChoice='niepoprawna';let invalidDivination=false;try{decodeCharacter(encodeCharacter(character));}catch{invalidDivination=true;}check(invalidDivination,'Import odrzuca nieprawidłową specjalizację wróżby');
        fresh();character.Divination=PL_DIVINATIONS[1].join(': ');character.role='mystic';character.background='astra';buildSheet();
        check(advanceState().elite==='psyker'&&el('eliteStartingBonuses').textContent.includes('Sankcjonowany')&&el('eliteStartingBonuses').textContent.includes('Współczynnik Psioniczny: 1'),'Startowe właściwości sankcjonowanego Psionika widoczne na karcie');
        check(advAptitudes().includes('Psyker'),'Psionik otrzymuje predyspozycję');
        character.Advances.skills['Linguistics (Wysoki Gotyk)']=1;character.Experience=advanceBalance();
        const vendarePsyker=createVendareActorData(character).actor;
        check(vendarePsyker.system.psy.rating===1&&vendarePsyker.system.psy.class==='bound'&&vendarePsyker.system.bio.elite==='Psionik','Psionik jest odwzorowany w Vendare');
        check(vendarePsyker.system.skills.linguistics.specialities.highGothic.advance===0,'Polska specjalizacja umiejętności trafia do Vendare');
        check(vendarePsyker.items.some(item=>item.type==='aptitude'&&item.name==='Psyker'),'Predyspozycja Psionika trafia do Vendare');
        character.background='outcast';character.Advances.corruption=7;renderAdvancementSheet();
        check(el('eliteStartingBonuses').textContent.includes('Punkty Spaczenia: 7')&&el('eliteStartingBonuses').textContent.includes('bez sankcji'),'Psionik-Renegat ma startowe Punkty Spaczenia');
        fresh();character.Advances.stats.WS=5;check(advanceBalance()<0&&advanceValid(),'Przekroczenie 1000 PD blokowane');
        fresh();character.Talents.push('Resistance (Pick One)');renderAdvancement();
        const spec=el('startingSpecializations');check(spec.querySelector('input')!==null,'Specjalizacja startowa wymagana');spec.querySelector('input').value='strach';spec.querySelector('button').click();
        check(character.Talents.includes('Resistance (strach)'),'Zapis specjalizacji startowej');
        check(decodeCharacter(encodeCharacter(character)).Talents.includes('Resistance (strach)'),'Eksport specjalizacji startowej');
        fresh();character.homeworld='forge';renderHomeworldTalent();const forge=el('homeworldTalentChoice').querySelector('select');forge.value='Weapon-Tech';forge.dispatchEvent(new Event('change'));
        check(character.Talents.includes('Weapon-Tech'),'Darmowa zdolność Świata-kuźni');
        fresh();character.homeworld='voidborn';finishDiv();check(character.Talents.includes('Strong Minded'),'Darmowa zdolność Pustki kosmosu');
        character=saved;buildSheet();
    });
    await page.evaluate(() => {
        character.Skills=character.Skills.filter(name=>!['Medicae','Parry'].includes(name));
        character.Advances.skills={Medicae:1,Parry:1};
        character.Advances.talents=['Broń specjalna (Łańcuchowa)'];
        buildSheet();
    });
    await assertSheetLayout(390);
    assert.equal(await page.locator('#advancedSkillRows .skillDetail').count(), 2, 'Kupione umiejętności są w osobnych wierszach karty');
    assert.equal(await page.locator('#advancedTalentRows .talentDetail').filter({hasText:'Broń specjalna (Łańcuchowa)'}).evaluate(node=>getComputedStyle(node).textAlign), 'center', 'Kupiona zdolność jest wyśrodkowana');
    await page.locator('#advancedSkillRows').screenshot({ path: 'test-results/advanced-skill-rows-mobile.png' });
    await page.screenshot({ path: 'test-results/full-flow-mobile.png', fullPage: true });
    assert.deepEqual(errors, [], 'Full UI flow errors');
    await browser.close();
    console.log(JSON.stringify({ ...result, errors, externalRequests: requests.length, status: 'passed' }, null, 2));
})().catch(error => { console.error(error); process.exit(1); });
