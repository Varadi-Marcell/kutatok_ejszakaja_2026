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
  'Infrastruktúra igénye'?: string;
  'Neve'?: string;
  'e-mail címe'?: string;
  'tel. száma'?: string | number;
  'Segítők'?: string;
  age?: string;
  building?: string;
}
