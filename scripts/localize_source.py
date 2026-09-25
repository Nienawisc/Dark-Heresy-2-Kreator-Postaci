"""One-time source import transformation. Requires the upstream files in tmp/original.
The resulting HTML/JS are checked in and run directly; Python is not a runtime dependency.
"""
from pathlib import Path
from lxml import html, etree
import json
import re

root = Path(__file__).resolve().parents[1]
source = root / 'tmp/original'
target = root / 'dh2chargen'
terms = json.loads((root / 'tmp/terms.json').read_text(encoding='utf-8'))
translations = terms | json.loads((root / 'scripts/ui-pl.json').read_text(encoding='utf-8'))
tree = html.fromstring((source / 'index.html').read_text(encoding='utf-8'))
tree.set('lang', 'pl')
for section_id in ['homeSelect', 'backSelect', 'roleSelect']:
    section = tree.get_element_by_id(section_id)
    for child in list(section):
        section.remove(child)
    section.text = ''
for node in tree.xpath('//*[@id="importModal" or @id="saveModal"] | //div[contains(@class,"w3-bottom")] | //script[not(@src)]'):
    node.getparent().remove(node)
for node in tree.xpath('//p[contains(., "Wondering what")]'):
    node.getparent().remove(node)
unknown = []
for node in tree.iter():
    if node.tag == 'script' and 'googleapis' in node.get('src', ''):
        node.set('src', './vendor/jquery-3.3.1.min.js')
    if not isinstance(node.tag, str) or node.tag in ('script', 'style'):
        continue
    for attr in ('text', 'tail'):
        value = getattr(node, attr)
        if not value or not value.strip():
            continue
        normalized = ' '.join(value.split())
        if normalized in translations:
            setattr(node, attr, ' ' + translations[normalized] + ' ')
        elif re.search('[A-Za-z]', normalized) and normalized != 'kg':
            unknown.append(normalized)
    for attr in ('title', 'placeholder', 'aria-label'):
        if node.get(attr) in translations:
            node.set(attr, translations[node.get(attr)])
    if node.tag == 'a':
        if 'quickref' in node.get('href', ''):
            node.set('href', '../Dark Heresy II - Podręcznik Główny [PL].pdf')
            node.set('target', '_blank')
        elif 'ajott.github.io/dh2chargen' in node.get('href', ''):
            node.set('href', './index.html')
    if node.tag == 'meta' and node.get('name') == 'description':
        node.set('content', 'Polski kreator postaci Dark Heresy 2. edycja — opcje z podręcznika głównego.')
    if node.tag == 'link' and 'w3schools' in node.get('href', ''):
        node.set('href', './vendor/w3.css')
    if node.tag == 'script' and 'googleapis' in node.get('src', ''):
        node.set('src', './vendor/jquery-3.3.1.min.js')
    if node.tag == 'input' and 'charMan' in node.get('class', '').split():
        node.set('type', 'number')
        node.set('min', '1')
        node.set('max', '100')
        node.set('aria-label', 'Wartość cechy ' + node.get('id').replace('Man', ''))
if unknown:
    raise ValueError('Untranslated UI: ' + repr(sorted(set(unknown))))
head = tree.find('head')
for name in ['pl-data.js', 'localization.js', 'core-fixes.js']:
    head.append(etree.Element('script', src='./' + name))
head.append(etree.Element('link', rel='stylesheet', href='./polish.css'))
body = tree.find('body')
for fragment in html.fragments_fromstring('''
<div id="importModal" class="w3-modal" role="dialog" aria-modal="true" aria-labelledby="importTitle">
 <div class="w3-modal-content w3-round-large modal-content">
  <button type="button" class="w3-button w3-display-topright" aria-label="Zamknij" onclick="document.getElementById('importModal').style.display='none'">×</button>
  <h2 id="importTitle">Wczytaj postać</h2>
  <label for="importInput">Kod wyeksportowanej postaci</label>
  <textarea id="importInput" class="w3-input w3-border w3-round" rows="4"></textarea>
  <p id="noString" role="alert" class="error" hidden></p>
  <button class="w3-button w3-green w3-round" onclick="importChar()">Wczytaj kod</button>
  <hr><h3>Postacie w tej przeglądarce</h3>
  <button class="w3-button w3-round w3-light-grey" onclick="retrieveChar()">Pokaż zapisane postacie</button>
  <label for="charList" class="sr-only">Zapisana postać</label><select id="charList" class="w3-select w3-border" hidden></select>
  <button id="charLoad" class="w3-button w3-green w3-round" onclick="chooseChar()" hidden>Wczytaj wybraną</button>
  <p id="loadStatus" role="status"></p>
 </div>
</div>
<div id="saveModal" class="w3-modal" role="dialog" aria-modal="true" aria-labelledby="saveTitle">
 <div class="w3-modal-content w3-round-large modal-content">
  <button type="button" class="w3-button w3-display-topright" aria-label="Zamknij" onclick="document.getElementById('saveModal').style.display='none'">×</button>
  <h2 id="saveTitle">Zapisz postać</h2>
  <label for="saveCharName">Imię postaci</label><input id="saveCharName" class="w3-input w3-border w3-round" maxlength="120">
  <p>Postać zostanie zapisana w tej przeglądarce. Zachowaj też kod, aby przenieść ją na inny komputer lub odtworzyć po wyczyszczeniu danych przeglądarki.</p>
  <button class="w3-button w3-green w3-round" onclick="saveLocalCharacter()">Zapisz w przeglądarce</button>
  <p id="saveStatus" role="status"></p><hr>
  <label for="exportText">Kod postaci</label><textarea id="exportText" class="w3-input w3-border w3-round" rows="4" readonly></textarea>
  <button class="w3-button w3-green w3-round" onclick="exportChar()">Wygeneruj kod</button>
 </div>
</div>
<footer class="w3-center app-footer">Polski kreator postaci by Ten Zły</footer>
'''):
    body.append(fragment)
body.append(etree.Element('script', src='./saveChars.js'))
for node in tree.xpath('//script[@src="./saveChars.js"]')[:-1]:
    node.getparent().remove(node)
(target / 'index.html').write_text('<!doctype html>\n' + html.tostring(tree, encoding='unicode'), encoding='utf-8')

def wrap_text_calls(code):
    """Wrap jQuery text setters; leave getters intact. Preserve expressions/quotes."""
    matches = list(re.finditer(r'\.text\(', code))
    for match in reversed(matches):
        start = match.end()
        level, quote, escaped, end = 1, None, False, start
        while level:
            char = code[end]
            if quote:
                if escaped:
                    escaped = False
                elif char == '\\':
                    escaped = True
                elif char == quote:
                    quote = None
            elif char in '\"\'`':
                quote = char
            elif char == '(':
                level += 1
            elif char == ')':
                level -= 1
            end += 1
        arg = code[start:end-1]
        if arg.strip():
            code = code[:start] + 'plText(' + arg + ')' + code[end-1:]
    return code

for filename in ['main.js', 'cards.js']:
    code = (source / filename).read_text(encoding='utf-8')
    if filename == 'main.js':
        code = code[:code.index('function exportChar()')]
    code = wrap_text_calls(code)
    code = re.sub(r'(\.innerHTML\s*\+?=\s*)([^;\n]+)', r'\1plHTML(\2)', code)
    if filename == 'cards.js':
        for fn, group in [('chooseHome', 'homeworlds'), ('chooseBack', 'backgrounds'), ('chooseRole', 'roles')]:
            code = code.replace('function ' + fn + '(str) {', 'function ' + fn + '(str) {\n    requireCore("' + group + '", str);')
    (target / filename).write_text(code, encoding='utf-8')

# Oba historyczne wejścia prowadzą teraz do jednego, przetłumaczonego interfejsu.
redirect = '<!doctype html><html lang="pl"><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=./index.html"><title>Kreator postaci</title><a href="./index.html">Otwórz kreator postaci</a></html>\n'
for filename in ['quick.html', 'DarkHeresy2ed.html']:
    (target / filename).write_text(redirect, encoding='utf-8')
