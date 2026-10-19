// Regenerate the compact Apex item templates from an installed Apex 0.1.4 system.
// Usage: node scripts/build-apex-catalog.mjs "C:/.../Data/systems/dark-heresy-2e-apex"
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const systemPath = resolve(process.argv[2] ?? '');
if (!process.argv[2]) throw new Error('Podaj katalog zainstalowanego systemu Apex.');
const packageInfo = JSON.parse(await readFile(join(systemPath, 'system.json'), 'utf8'));
if (packageInfo.id !== 'dark-heresy-2e-apex' || packageInfo.version !== '0.1.4') {
  throw new Error(`Nieobsługiwana wersja Apex: ${packageInfo.id} ${packageInfo.version}`);
}
const { getDh2eCompendiumDefinitions, listDh2eDefinitionItems } = await import(
  pathToFileURL(join(systemPath, 'src/apps/dh2e-compendium-builder.mjs')).href
);
const { DH2E_SKILLS } = await import(pathToFileURL(join(systemPath, 'src/rolls/dh2e-skills.mjs')).href);
const catalog = {};
for (const pack of getDh2eCompendiumDefinitions()) {
  if (!['dh2e-equipment', 'dh2e-character'].includes(pack.name)) continue;
  for (const { item } of listDh2eDefinitionItems(pack)) {
    if (pack.name === 'dh2e-character' && !['homeWorld','background','role','eliteAdvance','talent','trait'].includes(item.type)) continue;
    const copy = structuredClone(item);
    // Book prose is intentionally not bundled with the creator. Preserve the
    // English names, rule keys and automation fields needed by imported items.
    delete copy.system.description;
    catalog[`${copy.type}:${copy.name}`] = copy;
  }
}
const output = `// Apex Edition ${packageInfo.version}; generated from its installed compendium builders.\n` +
  `// Regenerate with scripts/build-apex-catalog.mjs after checking a new system version.\n` +
  `const APEX_CATALOG = ${JSON.stringify(catalog)};\n` +
  `const APEX_VALID_SKILLS = new Set(${JSON.stringify(DH2E_SKILLS.map(skill => skill.key))});\n`;
await writeFile('dh2chargen/apex-catalog.js', output, 'utf8');
console.log(`Saved ${Object.keys(catalog).length} Apex item templates.`);
