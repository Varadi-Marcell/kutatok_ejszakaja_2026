import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SvgMapConfig } from '../model/svg-map-config';
import { ProgramEvent } from '../model/program-event';

@Injectable({
  providedIn: 'root'
})
export class SvgConfigService {

  constructor(private http: HttpClient) { }

  loadConfig(configPath: string): Observable<SvgMapConfig> {
    return this.http.get<SvgMapConfig>(configPath);
  }

  // Előre definiált konfigurációk betöltése
  loadNagyterkepConfig(): Observable<SvgMapConfig> {
    return this.loadConfig('assets/svg-configs/nagyterkep-config.json');
  }

  // További SVG konfigurációk hozzáadhatók itt
  loadDiszaulaConfig(): Observable<SvgMapConfig> {
    // Később implementálható
    return this.loadConfig('assets/svg-configs/diszaula-config.json');
  }

  loadElocsarnokConfig(): Observable<SvgMapConfig> {
    // Később implementálható
    return this.loadConfig('assets/svg-configs/elocsarnok-config.json');
  }

  loadRegiAulaConfig(): Observable<SvgMapConfig> {
    return this.loadConfig('assets/svg-configs/regi_aula-config.json');
  }

  // Előadóterem 3 (Harmas) térkép betöltése
  loadHarmasConfig(): Observable<SvgMapConfig> {
    return this.loadConfig('assets/svg-configs/harmas-config.json');
  }

  // Parkoló térkép betöltése
  loadParkoloConfig(): Observable<SvgMapConfig> {
    return this.loadConfig('assets/svg-configs/parkolo-config.json');
  }

  // GEIK programok betöltése (backward compatibility)
  loadGeikData(): Observable<ProgramEvent[]> {
    return this.http.get<ProgramEvent[]>('assets/kutatók éjszakája 2026/geik.json');
  }

  // Dinamikus area adatok betöltése
  loadAreaData(areaId: string): Observable<ProgramEvent[]> {
    return this.http.get<ProgramEvent[]>(`assets/kutatók éjszakája 2026/${areaId}.json`);
  }

  // Building.json betöltése és szűrése building kulcs alapján
  loadBuildingData(buildingKey: string): Observable<ProgramEvent[]> {
    return new Observable<ProgramEvent[]>(observer => {
      this.http.get<ProgramEvent[]>('assets/kutatók éjszakája 2026/building.json').subscribe({
        next: (allData) => {
          // Szűrjük az adatokat a building kulcs alapján
          const filteredData = allData.filter(item => item.building === buildingKey);
          observer.next(filteredData);
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }
}
