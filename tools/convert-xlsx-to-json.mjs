/**
 * Excel -> JSON konverter
 * -----------------------
 * A "KÉ_2026_térképhez (1).xlsx" fájlból készíti el a
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

const INPUT_DEFAULT = 'C:/Users/Crashh/OneDrive/Documents/KÉ_2026_térképhez (1).xlsx';
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
  // Önálló (nem kari) külsős standok - saját területet kapnak a campus térképen
  'Baba Chill Zone': 'babachill',
  'Mályi Madármentők': 'malyimadarmentok',
};

// Munkalap szintű épület-kulcs felülírás: ezeknél a place szövegből NEM lehet
// megkülönböztetni a területet (pl. a "Mályi Madármentők" helyszíne szó szerint
// "díszaula"), ezért a munkalaphoz saját terület-kulcs tartozik.
const SHEET_BUILDING_OVERRIDE = {
  'Baba Chill Zone': 'babachill',
  'Mályi Madármentők': 'malyimadarmentok',
};

// Stand-szintű kimenetek (Régi aula standjai, céges standok):
// kimeneti fájl -> forrás munkalap + a standhoz tartozó programok pontos nevei.
// A térkép interaktív területeinek id-je a betöltendő fájlnév, ezért minden stand
// a saját kis JSON-ját kapja - így a standra kattintva pontosan a hozzá tartozó
// program(ok) jelennek meg (és a keresés is a helyes standra mutat).
const STAND_EXTRACTS = {
  'gtk-regisztracios-pult': { sheet: 'GTK', names: ['KARI REGISZTRÁCIÓS PULT', 'WONDER WORLD'] },
  'gtk-adatelemzo-kviz': { sheet: 'GTK', names: ['Közgazdász-adatelemző kvíz'] },
  'gtk-ember-vagy-ai': { sheet: 'GTK', names: ['Ember vagy AI? – Te felismered a különbséget?'] },
  'gtk-uzleti-villamproba': { sheet: 'GTK', names: ['Üzleti villámpróba – Játssz, gondolkodj, dönts!'] },
  'gtk-marketing-datalab': { sheet: 'GTK', names: ['Marketing Data Lab – Te vagy az algoritmus!'] },
  'gtk-skilstation': { sheet: 'GTK', names: ['SkillStation'] },
  'gtk-vakterkep': { sheet: 'GTK', names: ['Vaktérkép - online földrajz kvíz játék (GeoGuessr)'] },
  'bosch': { sheet: 'Céges partnerek', names: ['Bemutatkoznak a miskolci Bosch gyárai'] },
  'joyson': { sheet: 'Céges partnerek', names: ['Biztonságra hangolva-kutatástól életvédelemig-Joyson Safety Systems Hungary Kft.'] },

  // Díszaula beltéri standjai (a diszaula-config.json area id-i)
  'btk-anthroactivity': { sheet: 'BTK', names: ['AnthroActivity'] },
  'etk-mit-latsz-1': { sheet: 'ETK', names: ['Mit látsz a képen?'] },
  'etk-mit-latsz-2': { sheet: 'ETK', names: ['Mit látsz a képen?'] },
  'ajk-rendorseg-1': { sheet: 'ÁJK', names: ['Bűnmegelőzés - Balesetmegelőzés Borsod-Abaúj-Zemplén Megyei Rendőr-Főkapitányság - Balesetmegelőzési Bizottság'] },
  'ajk-rendorseg-2': { sheet: 'ÁJK', names: ['Vércseppek nyomában… Borsod-Abaúj-Zemplén Megyei Rendőr-Főkapitányság - Balesetmegelőzési Bizottság'] },
  'ajk-torvenyszek': { sheet: 'ÁJK', names: ['Pörgess és nyerj!'] },
  'ajk-aldozatsegito': { sheet: 'ÁJK', names: ['Ne válj áldozattá!'] },
  'ajk-detektiv': { sheet: 'ÁJK', names: ['Detektíviskola', 'Teszteld a jogi tudásod! - Jogi kvíz'] },
  'ajk-kari-stand': { sheet: 'ÁJK', names: ['KARI REGISZTRÁCIÓS PULT'] },
  'kingsejong-1': { sheet: 'KING SEJONG', names: ['Hagyományos koreai játékok'] },
  'kingsejong-2': { sheet: 'KING SEJONG', names: ['Hagyományos koreai játékok'] },
  'nk-1': { sheet: 'NK', names: ['Nemzetközi játékok nemzetközi hallgatókkal'] },
  'nk-2': { sheet: 'NK', names: ['Nemzetközi játékok nemzetközi hallgatókkal'] },
  'erm-formula-1': { sheet: 'ERM', names: ['Electric Racing Miskolc - Formula Student versenyautó testközelből'] },
  'erm-formula-2': { sheet: 'ERM', names: ['Electric Racing Miskolc - Formula Student versenyautó testközelből'] },
  'erm-formula-3': { sheet: 'ERM', names: ['Electric Racing Miskolc - Formula Student versenyautó testközelből'] },
  'sport-sportkozpont': {
    sheet: 'SPORT',
    names: ['Sportos Ügyességi kihívások', 'Ugró-mászó akadálypálya', 'Asztalitenisz', 'Mini pingpong', 'Denevérpad',
      'Gombfoci', 'Cornhole', 'Twister', 'Mölkky'],
  },
  'avk-hetkoznapi-kemia-1': { sheet: 'AVK', names: ['Hétköznapi kémia'] },
  'avk-hetkoznapi-kemia-2': { sheet: 'AVK', names: ['Hétköznapi kémia'] },
  'mfk-tavcsoves': { sheet: 'MFK', names: ['Távcsöves bemutató'] },
  'avk-feny': { sheet: 'AVK', names: ['Fényt viszünk a kémiába'] },
  'etk-diszaula-stand': {
    sheet: 'ETK',
    names: ['Babaszoba', 'Mire képes a testünk?', 'Lógjunk anyuval!',
      'Alma a vízben, ér a nyakban – ultrahangos kalandok', 'Készséggel az egészségügyért'],
  },

  // Üvegaula (főbejárat): a Foucault-ingához tartozó programok - a rajzon külön
  // feliratuk van ("Mozog a Föld?", "Aranyláz"), de stand-téglalap nem tartozott hozzájuk
  'mfk-inga': { sheet: 'MFK', names: ['Mozog a Föld? Kérdezd meg az ingát!'] },
  'mfk-arany': { sheet: 'MFK', names: ['Aranyláz Miskolcon!'] },
  'borsodchem': { sheet: 'Céges partnerek', names: ['WonderLab'] },
};

// Kari stand-csoportok (egy kar több standja ugyanazt a készletet mutatja):
// fájl -> munkalap + a helyszínből felismert épület-kulcs (+ opcionálisan név
// szerint duplikált extra programok, pl. az IOK stand az A1-es kvízeket is mutatja).
// Nem neveket sorolunk fel, hanem a BUILDING_RULES szerint szűrünk, így a tartalom követi az Excelt.
const BUILDING_FILTER_EXTRACTS = {
  'avk-1': { sheet: 'AVK', building: 'elocsarnok' },
  'avk-2': { sheet: 'AVK', building: 'elocsarnok' },
  'avk-3': { sheet: 'AVK', building: 'elocsarnok' },
  'avk-4': { sheet: 'AVK', building: 'elocsarnok' },
  'avk-5': { sheet: 'AVK', building: 'elocsarnok' },
  'avk-6': { sheet: 'AVK', building: 'elocsarnok' },
  'avk-7': { sheet: 'AVK', building: 'elocsarnok' },
  'avk-8': { sheet: 'AVK', building: 'elocsarnok' },
  'mfk-1': { sheet: 'MFK', building: 'elocsarnok' },
  'mfk-2': { sheet: 'MFK', building: 'elocsarnok' },
  'mfk-3': { sheet: 'MFK', building: 'elocsarnok' },
  'mfk-4': { sheet: 'MFK', building: 'elocsarnok' },
  'mfk-5': { sheet: 'MFK', building: 'elocsarnok' },
  'mfk-6': { sheet: 'MFK', building: 'elocsarnok' },
  'geik-1': { sheet: 'GÉIK', building: 'elocsarnok' },
  'geik-2': { sheet: 'GÉIK', building: 'elocsarnok' },
  'geik-3': { sheet: 'GÉIK', building: 'elocsarnok' },
  'btk-1': { sheet: 'BTK', building: 'elocsarnok' },
  // Az IOK stand az üveg előcsarnokos IOK-programok mellett az A1-es teremben
  // tartott 4 nyelvi kvízt is mutatja (szándékos duplikáció - a campus térképen
  // ezek az A1 épületnél maradnak).
  'iok-1': {
    sheet: 'IOK',
    building: 'elocsarnok',
    extraNames: [
      'Tudod-e? - Érdekességek a spanyol és olasz nyelv és kultúra kapcsán',
      'Ünnepeljük együtt a Nyelvek Európai Napját!',
      'Angolul a világ körül – nyelvi és kulturális érdekességek',
      'Játék a betűkkel',
    ],
  },
  'konf-1': { sheet: 'KONFUCIUSZ', building: 'elocsarnok' },
};

// Program nélküli standok (pl. Információs pult, Könyvtár, Alumni, BOKIK, Szeleta):
// üres listát írunk, hogy a popup "nincsenek elérhető programok" szöveget adjon alert helyett.
const EMPTY_AREA_FILES = [
  'elocsarnok-info', 'elocsarnok-konyvtar', 'elocsarnok-alumni', 'elocsarnok-bokik', 'elocsarnok-szeleta',
];

// Ezeket a munkalapokat kihagyjuk
const SKIPPED_SHEETS = new Set(['Kari táblák - sablon']);

// Kimeneti kulcsok sorrendje (a 2025-ös fájloknak megfelelően)
const KEY_ORDER = [
  'No.', 'name', 'english_name', 'description', 'english_description',
  'place', 'time', 'max_person', 'registration', 'age',
  'recommended_for_english_speakers', 'accessible_venue',
  'Infrastruktúra igénye', 'Neve', 'e-mail címe', 'tel. száma', 'Segítők',
  'building',
];

// A séma idegen kulcsai: csak figyelmeztetünk, ha bennük van adat
const IGNORED_HEADERS = new Set([
  'programfelelős', 'programfelelős (cég)', 'megjegyzés',
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
  // Pontos egyezések a részstring-szabályok ELÉ (pl. az "akadálymentesített
  // helyszín" is tartalmazza a "helyszín" szót - különben rossz kulcsra kerülne!)
  if (h.includes('angol nyelvűek számára is ajánlott')) return 'recommended_for_english_speakers';
  if (h.includes('akadálymentesített helyszín')) return 'accessible_venue';
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

/** Excel-boolean / igen-nem jellegű cella kiértékelése. */
function isAffirmative(value) {
  if (value === true) return true;
  if (typeof value === 'number') return value !== 0;
  const s = String(value == null ? '' : value).trim().toLowerCase();
  return s === 'true' || s === 'igen' || s === 'i' || s === 'x' || s === '1' || s === '+' || s === 'yes' || s === 'y';
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

/**
 * Helyszín-felülírások: bizonyos programoknál a táblázatban szereplő értéket
 * egy kézzel karbantartott, pontosabb helyszínre cseréljük, MIELŐTT az
 * épület-felismerés lefut - így a besorolás is az új helyszínből következik.
 * Szándékosan szűk szabályok (a nevük alapján azonosított programokra
 * vonatkoznak), hogy más programokra ne hassanak:
 *  - a regisztrációköteles IOK vizsgánál a táblázatbeli értéket (a helyi
 *    másolatban még "folyamatban", a megosztott táblázatban már az A1-es terem)
 *    a regisztrációs pultra cseréljük, ezért a szabály a vizsga NEVÉRE és a
 *    regisztrációs igényre illeszkedik (az "IOK" + "pult" szavakra), nem a
 *    helyszínre - különben a látogató egyenesen a terembe menne, pedig előbb
 *    regisztrálnia kell a pultnál. Az ilyen program az üveg előcsarnokhoz
 *    (elocsarnok) sorolódik, így bekerül az iok-1.json-ba, és a campus
 *    térképen is a pulthoz kerül;
 *  - a 4 nyelvi kvíznél a táblázatban még "folyamatban" szerepel, ezek helye a
 *    visszaigazolt A1. épület 1. emelet 105. tanterem (ez a szabály automatikusan
 *    "a1" épületbesorolást is ad nekik).
 */
const PLACE_OVERRIDES = [
  {
    namePatterns: [/^szobeli origo/],
    placePatterns: [/folyamatban/, /\ba\s*\/\s*1\b|\ba1\b/, /iok stand/, /uveg elocsarnok/],
    registrationPatterns: [/iok/, /pult/],
    newPlace: 'Üveg előcsarnok – IOK regisztrációs pult / Glass lobby – IOK registration desk',
  },
  {
    namePatterns: [/^tudod-e\?/, /^unnepeljuk egyutt a nyelvek europai napjat/, /^angolul a vilag korul/, /^jatek a betukkel/],
    placePatterns: [/folyamatban/],
    newPlace: 'A1. épület, 1. emelet, 105. tanterem / Building A1, 1st floor, Room 105',
  },
];

/** Az esetleges helyszín-felülírások alkalmazása egy programra. */
function applyPlaceOverrides(event) {
  const name = normalizePlace(event.name);
  const place = normalizePlace(event.place);
  if (!place) return;
  const registration = normalizePlace(event.registration);
  for (const rule of PLACE_OVERRIDES) {
    const nameOk = !rule.namePatterns || rule.namePatterns.some(pattern => pattern.test(name));
    const placeOk = !rule.placePatterns || rule.placePatterns.some(pattern => pattern.test(place));
    const registrationOk = !rule.registrationPatterns || rule.registrationPatterns.every(pattern => pattern.test(registration));
    if (nameOk && placeOk && registrationOk) {
      event.place = rule.newPlace;
      return;
    }
  }
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
      if (key === 'recommended_for_english_speakers' || key === 'accessible_venue') {
        // Boolean jellegű oszlopok: csak true esetén kerül be a kulcs (karcsú JSON),
        // hiányzó oszlop vagy nem-igen érték esetén a kulcs kimarad.
        // FONTOS: rawValue-t használunk, mert clean(true) -> "true" string lenne.
        if (isAffirmative(rawValue)) event[key] = true;
        continue;
      }
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
    // Helyszín-felülírások (pl. regisztrációköteles IOK program -> regisztrációs pult)
    applyPlaceOverrides(ev);
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
    const buildingKey = SHEET_BUILDING_OVERRIDE[sheetName] || detectBuilding(program.place);
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

// ----- Stand-szintű fájlok (Régi aula standjai, céges standok) -----
// A munkalap-szintű fájlokból kiemelt részhalmazok (lásd STAND_EXTRACTS).
const programsBySheet = new Map(sheets.map(({ sheetName, programs }) => [sheetName, programs]));
const normalizeName = (value) => String(value == null ? '' : value).replace(/\s+/g, ' ').trim().toLowerCase();

for (const [file, { sheet, names }] of Object.entries(STAND_EXTRACTS)) {
  const source = programsBySheet.get(sheet);
  if (!source) {
    warnings.push(`[${file}] A stand forrás-munkalapja nem található ("${sheet}") - a fájl kimaradt!`);
    continue;
  }
  const extracted = [];
  for (const wantedName of names) {
    const matches = source.filter(p => normalizeName(p.name) === normalizeName(wantedName));
    if (!matches.length) {
      warnings.push(`[${file}] Nincs ilyen nevű program a(z) "${sheet}" munkalapon: "${wantedName}"`);
      continue;
    }
    if (matches.length > 1) {
      warnings.push(`[${file}] Több program is ugyanazzal a névvel ("${wantedName}") - az elsőt használjuk.`);
    }
    extracted.push(matches[0]);
  }
  fs.writeFileSync(path.join(outDir, `${file}.json`), JSON.stringify(extracted, null, 2) + '\n', 'utf8');
  summary.push(`- [stand] ${file}.json: ${extracted.length} program (${sheet})`);
}

// ----- Kari stand-csoportok: az adott munkalap térhez tartozó programjai -----
for (const [file, { sheet, building, extraNames }] of Object.entries(BUILDING_FILTER_EXTRACTS)) {
  const source = programsBySheet.get(sheet);
  if (!source) {
    warnings.push(`[${file}] A stand-csoport forrás-munkalapja nem található ("${sheet}") - a fájl kimaradt!`);
    continue;
  }
  const extracted = source.filter(p => detectBuilding(p.place) === building);
  if (extraNames && extraNames.length) {
    // Szándékosan duplikált extra programok (pl. az IOK stand az A1-es kvízeket
    // is mutatja): név szerint, az eredeti sorrendben, a lista végére fűzve.
    for (const wantedName of extraNames) {
      const matches = source.filter(p => normalizeName(p.name) === normalizeName(wantedName));
      if (!matches.length) {
        warnings.push(`[${file}] Nincs ilyen nevű extra program a(z) "${sheet}" munkalapon: "${wantedName}"`);
        continue;
      }
      if (extracted.some(p => normalizeName(p.name) === normalizeName(wantedName))) continue;
      extracted.push(matches[0]);
    }
  }
  if (!extracted.length) {
    warnings.push(`[${file}] Egyetlen program sem tartozik a(z) "${building}" területhez a(z) "${sheet}" munkalapon.`);
  }
  fs.writeFileSync(path.join(outDir, `${file}.json`), JSON.stringify(extracted, null, 2) + '\n', 'utf8');
  summary.push(`- [stand] ${file}.json: ${extracted.length} program (${sheet} / ${building})`);
}

// ----- Program nélküli standok: üres listát írunk (nem 404/alert lesz belőle) -----
for (const file of EMPTY_AREA_FILES) {
  const filePath = path.join(outDir, `${file}.json`);
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8').trim() : '';
  if (existing && existing !== '[]') {
    // Kézzel karbantartott tartalom (pl. elocsarnok-alumni.json, elocsarnok-konyvtar.json):
    // ne írjuk felül üres listával, különben elveszne a stand adata
    summary.push(`- [stand] ${file}.json: kézzel karbantartott tartalom, érintetlenül hagyva`);
    continue;
  }
  fs.writeFileSync(path.join(outDir, `${file}.json`), '[]\n', 'utf8');
}
summary.push(`- [stand] üres stand-fájlok: ${EMPTY_AREA_FILES.length} (${EMPTY_AREA_FILES.join(', ')})`);

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