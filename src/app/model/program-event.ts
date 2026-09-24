export interface ProgramEvent {
  'No.'?: string | number;
  name: string;
  english_name?: string;
  description?: string;
  english_description?: string;
  place?: string;
  time?: string;
  max_person?: string | number;
  registration?: string;
  recommended_for_english_speakers?: boolean;
  accessible_venue?: boolean;
  // Ha a programhoz máshol (a kari standnál) kell előbb regisztrálni,
  // ez a 3 mező mutatja, hova irányítsuk a látogatót
  registration_map_id?: string;
  registration_area_id?: string;
  registration_stand_name?: string;
  // Ha ez a bejegyzés egy általános épület-listában (nagytérkép) is szerepel,
  // de a "valódi otthona" egy másik, dedikált térkép/stand (pl. az A/4 épület
  // generikus listájában szereplő GTK/Bosch program valójában a Régi Aulában van),
  // ez a 3 mező mutatja oda az utat - a kártyán egy "részletek itt" gomb jelenik meg
  detail_map_id?: string;
  detail_area_id?: string;
  detail_stand_name?: string;
  'Infrastruktúra igénye'?: string;
  'Neve'?: string;
  'e-mail címe'?: string;
  'tel. száma'?: string | number;
  'Segítők'?: string;
  age?: string;
  building?: string;
}
