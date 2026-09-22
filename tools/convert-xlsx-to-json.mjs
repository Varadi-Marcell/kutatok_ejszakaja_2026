/**
 * Excel -> JSON konverter
 * -----------------------
 * A "KÉ_2026_térképhez.xlsx" fájlból készíti el a
 * src/assets/kutatók éjszakája 2026/*.json fájlokat,
 * a 2025-ös JSON-sémát (ProgramEvent) követve.
 *
 * Futtatás:  npm run convert
 *            node tools/convert-xlsx-to-json.mjs [excelÚtvonal] [kimenetiMappa]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const INPUT_DEFAULT = 'C:/Users/Crashh/OneDrive/Documents/KÉ_2026_térképhez.xlsx';
const OUT_DEFAULT = path.join(ROOT, 'src/assets/kutatók éjszakája 2026');

const inputPath = process.argv[2] || INPUT_DEFAULT;
const outDir = process.argv[3] || OUT_DEFAULT;

// Munkalap -> kimeneti fájl (a 2025-ös areaId-khez igazítva)
const SHEET_TO_FILE = {
  'MFK': 'mfk',
  'AVK': 'avk',
  'GÉIK': 'geik',
  'ÁJK': 'ajk',
  'GTK': 'gtk',
  'BTK': 'btk',
  'ETK': 'etk',
  'IOK': 'iok',
  'KLM': 'klm',
  'SPORT': 'sport',
  'NK': 'nk',
  'KONFUCIUSZ': 'konf',
  'KING SEJONG': 'kingsejong',
  'PFK-KÖSZI': 'koszi',
  'FIEK': 'fiek',
  'ERM': 'erme',
  'Zenepalota': 'zenepalota',
  'Céges partnerek': 'ceges',
};

// Ezeket a munkalapokat kihagyjuk
const SKIPPED_SHEETS = new Set(['Kari táblák - sablon']);

// Kimeneti kulcsok sorrendje (a 2025-ös fájloknak megfelelően)
const KEY_ORDER = [
  'No.', 'name', 'english_name', 'description', 'english_description',
  'place', 'time', 'max_person', 'registration', 'age',
  'Infrastruktúra igénye', 'Neve', 'e-mail címe', 'tel. száma', 'Segítők',
  'building',
];

// A séma idegen kulcsai: csak figyelmeztetünk, ha bennük van adat
const IGNORED_HEADERS = new Set([
  'programfelelős', 'programfelelős (cég)', 'megjegyzés',
  'angol nyelvűek számára is ajánlott', 'akadálymentesített helyszín',
  'felületre felkerült',
]);

function normalizeHeader(h) {
  return String(h)
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}
/**
 * Oszlopfejléc -> séma kulcs. Rugalmas, mert a fejlécekben \r\n és
 * zárójeles kiegészítések is vannak (pl. "Program maximális férőhelye\r\n(fő)").
 */
function headerToKey(header) {
  const h = normalizeHeader(header);
  if (!h) return null;
  // Először az ismert, de nem kimenő oszlopok (pl. "Akadálymentesített
  // helyszín" is tartalmazza a "helyszín" szót!)
  if (IGNORED_HEADERS.has(h)) return 'IGNORED';
  if (h === 'no.' || h === 'no' || h === 'sorszám') return 'No.';
  if (h === 'program neve') return 'name';
  if (h.includes('angol nyelvű megnevezés')) return 'english_name';
  if (h.includes('angol nyelvű leírás')) return 'english_description';
  if (h.includes('leírás') && !h.includes('angol')) return 'description';
  if (h.includes('helyszín')) return 'place';
  if (h.includes('időpont')) return 'time';
  if (h.includes('férőhely')) return 'max_person';
  if (h.includes('regisztrációs')) return 'registration';
  if (h === 'korosztály') return 'age';
  if (h.includes('infrastrukturális')) return 'Infrastruktúra igénye';
  if (h.includes('programtartó neve')) return 'Neve';
  if (h.includes('programtartó e-mail')) return 'e-mail címe';
  if (h.includes('programtartó telefon')) return 'tel. száma';
  if (h === 'segítők' || h === 'segítők neve') return 'Segítők';
  return 'UNKNOWN';
}

/** Cellérték tisztítása: stringgé alakítás, szóközök/soremelések rendezése. */
function clean(value) {
  if (value == null) return '';
  let s = String(value);
  // E-mail címek kivonása (Outlook "Név <cím>" formátum tisztítása)
  if (s.includes('@')) {
    const emails = s.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g);
    if (emails && emails.length) {
      return [...new Set(emails)].join(', ');
    }
  }
  s = s.replace(/\r\n/g, '\n');
  s = s.replace(/[ \t]+/g, ' ');          // dupla szóközök összevonása
  s = s.replace(/\n{3,}/g, '\n\n');       // 3+ üres sor összevonása
  s = s.split('\n').map(l => l.trim()).join('\n').trim();
  return s;
}

/** A fejlécsort tartalmazó sor indexének megkeresése (A oszlop = "No."). */
function findHeaderRowIndex(rows) {
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    if (normalizeHeader(rows[i][0]) === 'no.') return i;
  }
  return -1;
}

/**
 * Excel idő-szériaszám (a nap törtrésze, pl. 0.75 = 18:00) -> "ÓÓ:PP".
 * Az Excelben a "Program időpontja(i)" oszlop egyes cellái valódi
 * időértékként (számként) vannak tárolva, nem szövegként.
 */
function formatExcelTime(value) {
  const totalMinutes = Math.round(value * 24 * 60);
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function convertSheet(ws, sheetName, warnings) {
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });
  const headerIdx = findHeaderRowIndex(rows);
  if (headerIdx === -1) {
    warnings.push(`[${sheetName}] Nincs "No." fejlécsor - a munkalap kimaradt.`);
    return null;
  }

  const headers = rows[headerIdx];
  const colMap = headers.map((h, idx) => ({ key: headerToKey(h), idx }));

  const programs = [];
  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || !row.some(cell => String(cell).trim() !== '')) continue;

    const event = {};
    let name = '';
    for (const { key, idx } of colMap) {
      let rawValue = row[idx];
      // Az "időpont" oszlopban az Excel néha valódi idő-szériaszámot tárol
      // (pl. 0.75 = 18:00) - alakítsuk vissza "ÓÓ:PP" alakra
      if (key === 'time' && typeof rawValue === 'number' && rawValue > 0 && rawValue < 1) {
        rawValue = formatExcelTime(rawValue);
      }
      const value = clean(rawValue);
      if (key === 'IGNORED' || key == null) continue;
      if (key === 'UNKNOWN') {
        if (value) {
          warnings.push(`[${sheetName}] Ismeretlen oszlop kihagyva: "${normalizeHeader(headers[idx])}" (érték: "${value.slice(0, 60)}")`);
        }
        continue;
      }
      if (!value) continue;
      if (key === 'name') name = value;
      event[key] = value;
    }

    if (!name) {
      // Név nélküli sor (megjegyzés vagy üres helyőrző) - kihagyjuk
      const firstCell = clean(row.find(c => String(c).trim() !== '') || '');
      if (firstCell) {
        warnings.push(`[${sheetName}] Név nélküli sor kihagyva (${r + 1}. sor): "${firstCell.slice(0, 80)}"`);
      }
      continue;
    }
    programs.push(event);
  }

  // Kulcsok a 2025-ös sorrendbe rendezése
  return programs.map(ev => {
    const ordered = {};
    for (const k of KEY_ORDER) {
      if (ev[k] !== undefined) ordered[k] = ev[k];
    }
    for (const k of Object.keys(ev)) {
      if (!KEY_ORDER.includes(k)) ordered[k] = ev[k];
    }
    return ordered;
  });
}

// ---------- Épület-felismerés (building kulcs) a place mezőből ----------

/** Ékezetek eltávolítása + kisbetűsítés (ugyanaz a normalizálás, amit a kereső is használ). */
function normalizePlace(text) {
  return (text == null ? '' : String(text))
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Helyszín -> épület kulcs szabályok. SORREND FONTOS: először a konkrét
 * épületkódok, utána az egyéb minták. (2025-ös building.json konvenciói.)
 */
const BUILDING_RULES = [
  // Konkrét épületkódok (C/2, C2, A4/017 stb. variánsok)
  [/\bc\s*\/\s*3\b|\bc3\b/, 'c3'],
  [/\bc\s*\/\s*2\b|\bc2\b/, 'c2'],
  [/\bc\s*\/\s*1\b|\bc1\b/, 'c1'],
  [/\bb\s*\/\s*1\b|\bb1\b/, 'b1'],
  [/\ba\s*\/\s*6\b|\ba6\b/, 'a6'],
  [/\ba\s*\/\s*5\b|\ba5\b/, 'a5'],
  [/\ba\s*\/\s*4\b|\ba4\b/, 'a4'],
  [/\ba\s*\/\s*3\b|\ba3\b/, 'a3'],
  [/\ba\s*\/\s*2\b|\ba2\b/, 'a2'],
  [/\ba\s*\/\s*1\b|\ba1\b/, 'a1'],
  // Informatikai épület (+ a Rejtő Ferenc EMC laboratórium is ide tartozik, mint 2025-ben)
  [/inf\.\s*ep\b|informatikai ep|rejto ferenc|emc labor/, 'info'],
  // Stefánia épület (ETK) - a "stefania epulet, aula" miatt az üveg/aula szabály ELŐTT!
  [/stefania/, 'stefania'],
  // Üvegaula / üvegelőcsarnok / főbejárat / főépület (kivéve "főépület előtt" = szabadtér!)
  [/uvegaula|uvegeloc|uveg eloc|uveg aula|fobejarat|foepulet(?!\s*elott)|(^|\W)aula(\W|$)/, 'elocsarnok'],
  // Díszaula (az üveg szabály után, hogy az "üvegelőcsarnok/díszaula" kombó elocsarnok legyen)
  [/diszaula/, 'diszaula'],
  // Zenepalota
  [/zenepalota/, 'zenepalota'],
];

/** A place szövegből megpróbálja megállapítani az épületkulcsot, vagy null-t ad. */
function detectBuilding(place) {
  const norm = normalizePlace(place);
  if (!norm) return null;
  for (const [pattern, key] of BUILDING_RULES) {
    if (pattern.test(norm)) return key;
  }
  return null;
}

// ---------- Fő program ----------
const warnings = [];
const summary = [];

if (!fs.existsSync(inputPath)) {
  console.error(`HIBA: A bemeneti fájl nem található: ${inputPath}`);
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });

const wb = XLSX.readFile(inputPath);

// Munkalaponként feldolgozott programok (épület-hozzárendelés előtt)
const sheets = []; // { sheetName, target, programs }

for (const sheetName of wb.SheetNames) {
  if (SKIPPED_SHEETS.has(sheetName)) {
    summary.push(`- ${sheetName}: kihagyva (sablon/üres)`);
    continue;
  }
  const target = SHEET_TO_FILE[sheetName];
  if (!target) {
    warnings.push(`[${sheetName}] Nincs hozzárendelt kimeneti fájlnév - a munkalap kimaradt! (SHEET_TO_FILE)`);
    continue;
  }
  const programs = convertSheet(wb.Sheets[sheetName], sheetName, warnings);
  if (programs === null) {
    summary.push(`- ${sheetName}: üres/nem feldolgozható`);
    continue;
  }
  sheets.push({ sheetName, target, programs });
}

// ----- Building kulcsok hozzárendelése a place mezőből -----
const buildingCounts = {};
const unmatchedPlaces = [];
const buildingEntries = []; // building.json tartalma

for (const { sheetName, target, programs } of sheets) {
  for (const program of programs) {
    const buildingKey = detectBuilding(program.place);
    // building.json: MINDEN program bekerül, ahol azonosítható, ott building kulccsal
    const entry = { ...program };
    if (buildingKey) {
      entry.building = buildingKey;
      buildingCounts[buildingKey] = (buildingCounts[buildingKey] || 0) + 1;
    } else if (program.place) {
      unmatchedPlaces.push(`[${target}.json] "${program.name}" - place: "${program.place.replace(/\n/g, ' | ').slice(0, 90)}"`);
    }
    buildingEntries.push(entry);
    // A területenkénti fájlok 2025-stílusúak maradnak: building kulcs nélkül
    const { building, ...areaProgram } = entry;
    void building;
    Object.assign(program, areaProgram);
    delete program.building;
  }
  const outPath = path.join(outDir, `${target}.json`);
  fs.writeFileSync(outPath, JSON.stringify(programs, null, 2) + '\n', 'utf8');
  summary.push(`- ${sheetName} -> ${target}.json: ${programs.length} program`);
}

// Campus térkép: building.json - az alkalmazás épület (area id) szerint csoportosít
fs.writeFileSync(path.join(outDir, 'building.json'), JSON.stringify(buildingEntries, null, 2) + '\n', 'utf8');

console.log('Konverzió kész:');
console.log(summary.join('\n'));

// Épületenkénti megoszlás (a nagyterkep area id-jei)
console.log('\nÉpület-hozzárendelés (building.json):');
const assignedTotal = Object.values(buildingCounts).reduce((a, b) => a + b, 0);
for (const [key, count] of Object.entries(buildingCounts).sort()) {
  console.log(`  ${key}: ${count} program`);
}
console.log(`  Összesen épülethez rendelve: ${assignedTotal} / ${buildingEntries.length} program`);
if (unmatchedPlaces.length) {
  console.log(`\nNem azonosítható épület (${unmatchedPlaces.length} program):`);
  console.log(unmatchedPlaces.map(p => `  ? ${p}`).join('\n'));
}
if (warnings.length) {
  console.log('\nFigyelmeztetések:');
  console.log(warnings.map(w => `! ${w}`).join('\n'));
}
console.log(`\nKimenet: ${outDir}`);