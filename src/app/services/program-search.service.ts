import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';
import { SvgMapConfig } from '../model/svg-map-config';
import { ProgramEvent } from '../model/program-event';
import { SvgConfigService } from './svg-config.service';

// Egy épület (terület) összes programja
export interface ProgramGroup {
  areaId: string;
  areaName: string;
  programs: ProgramEvent[];
}

// Keresési találati csoport
export interface SearchResultGroup extends ProgramGroup {
  mapId: string;
  mapName: string;
  matchedPrograms: ProgramEvent[];
  areaMatches: boolean;
}

const BUILDING_DATA_URL = 'assets/kutatók éjszakája 2025/building.json';
const AREA_DATA_URL_TEMPLATE = 'assets/kutatók éjszakája 2025/{areaId}.json';
const NAGYTERKEP_SVG_PATH = 'assets/nagyterkep_jo.svg';

@Injectable({
  providedIn: 'root'
})
export class ProgramSearchService {

  // Kész keresési indexek cache-elve térkép azonosító szerint
  private indexCache = new Map<string, Observable<ProgramGroup[]>>();
  // Minden térkép konfigurációjának cache-e
  private allConfigs$: Observable<SvgMapConfig[]> | null = null;

  constructor(
    private http: HttpClient,
    private svgConfigService: SvgConfigService
  ) { }

  /**
   * Betölti (és cache-eli) az adott térkép programjait, területenként csoportosítva.
   * - Campus térkép: a nagy building.json-ből csoportosítunk a `building` mező szerint
   * - Többi térkép: területenkénti {areaId}.json fájlok párhuzamos betöltése
   */
  getProgramIndex(config: SvgMapConfig): Observable<ProgramGroup[]> {
    const cacheKey = config.id || config.svgPath;
    if (this.indexCache.has(cacheKey)) {
      return this.indexCache.get(cacheKey)!;
    }

    let index$: Observable<ProgramGroup[]>;

    if (config.svgPath === NAGYTERKEP_SVG_PATH) {
      // Campus térkép: egy nagy JSON, a programok `building` mezője a terület azonosító
      index$ = this.http.get<ProgramEvent[]>(BUILDING_DATA_URL).pipe(
        map(allPrograms => this.groupByBuilding(allPrograms, config)),
        shareReplay(1)
      );
    } else {
      // Többi térkép: területenkénti JSON fájlok párhuzamosan
      // (a hiányzó/hibás fájlok üres programlistát adnak, nem döntik el a keresést)
      const requests = config.interactiveAreas.map(area =>
        this.http
          .get<ProgramEvent[]>(AREA_DATA_URL_TEMPLATE.replace('{areaId}', area.id))
          .pipe(
            map(programs => ({ areaId: area.id, areaName: area.name, programs: programs || [] } as ProgramGroup)),
            catchError(() => of({ areaId: area.id, areaName: area.name, programs: [] } as ProgramGroup))
          )
      );
      index$ = forkJoin(requests).pipe(shareReplay(1));
    }

    this.indexCache.set(cacheKey, index$);
    return index$;
  }

  /**
   * Minden térkép konfigurációjának betöltése (cache-elve).
   */
  getAllConfigs(): Observable<SvgMapConfig[]> {
    if (!this.allConfigs$) {
      this.allConfigs$ = forkJoin([
        this.svgConfigService.loadNagyterkepConfig(),
        this.svgConfigService.loadElocsarnokConfig(),
        this.svgConfigService.loadDiszaulaConfig(),
        this.svgConfigService.loadRegiAulaConfig()
      ]).pipe(shareReplay(1));
    }
    return this.allConfigs$;
  }

  /**
   * Keresés az ÖSSZES térkép programjai és területei között.
   * Ékezet- és kisbetű-nagybetű független egyezést használ.
   * Az aktuális térkép találatai kerülnek a lista elejére.
   */
  searchAllMaps(query: string, currentMapId?: string): Observable<SearchResultGroup[]> {
    const q = this.normalize(query).trim();
    if (!q) {
      return of([]);
    }

    return this.getAllConfigs().pipe(
      switchMap(configs =>
        forkJoin(
          configs.map(config =>
            this.getProgramIndex(config).pipe(
              map(groups =>
                groups
                  .map(group => {
                    const matchedPrograms = group.programs.filter(program => this.programMatches(program, q));
                    const areaMatches =
                      this.normalize(group.areaName).includes(q) ||
                      this.normalize(group.areaId).includes(q);
                    return {
                      ...group,
                      mapId: config.id,
                      mapName: config.name,
                      matchedPrograms,
                      areaMatches
                    };
                  })
                  .filter(result => result.areaMatches || result.matchedPrograms.length > 0)
              )
            )
          )
        ).pipe(
          map(resultsByMap => {
            const flat: SearchResultGroup[] = ([] as SearchResultGroup[]).concat(...resultsByMap);

            // Ha egy épületnek dedikált beltéri térképe is van (Előcsarnok,
            // Díszaula, Régi Aula), a találat arra a térképre mutasson -
            // a campus térképen ugyanis csak az épület "külseje" kattintható
            const configsById = new Map(configs.map(c => [c.id, c] as [string, SvgMapConfig]));
            for (const result of flat) {
              const dedicated = configsById.get(result.areaId);
              if (dedicated && result.mapId !== dedicated.id) {
                result.mapId = dedicated.id;
                result.mapName = dedicated.name;
              }
            }

            if (currentMapId) {
              // Az aktuális térkép találati csoportjai az elejére kerülnek
              flat.sort((a, b) =>
                (a.mapId === currentMapId ? 0 : 1) - (b.mapId === currentMapId ? 0 : 1)
              );
            }
            return flat;
          })
        )
      )
    );
  }

  // Programok csoportosítása a `building` mező szerint (campus térkép)
  private groupByBuilding(allPrograms: ProgramEvent[], config: SvgMapConfig): ProgramGroup[] {
    const byBuilding = new Map<string, ProgramEvent[]>();
    for (const program of allPrograms) {
      const buildingId = program.building ? program.building.toString() : 'egyeb';
      if (!byBuilding.has(buildingId)) {
        byBuilding.set(buildingId, []);
      }
      byBuilding.get(buildingId)!.push(program);
    }

    // A területneveket a konfigurációból oldjuk fel
    const result: ProgramGroup[] = [];
    for (const [areaId, programs] of byBuilding.entries()) {
      const area = config.interactiveAreas.find(a => a.id === areaId);
      result.push({ areaId, areaName: area?.name || areaId, programs });
    }
    return result;
  }

  // Ékezetek eltávolítása és kisbetűsítés a rugalmas egyezéshez
  private normalize(text: any): string {
    return (text === null || text === undefined ? '' : text.toString())
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  // A program bármely fontos mezőjében keresünk
  private programMatches(program: ProgramEvent, q: string): boolean {
    const fields = [
      program.name,
      program.english_name,
      program.description,
      program.english_description,
      program.place,
      program.time,
      program['Neve']
    ];
    return fields.some(field => this.normalize(field).includes(q));
  }
}