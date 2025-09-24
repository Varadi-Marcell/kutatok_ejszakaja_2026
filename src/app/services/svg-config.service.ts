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

  // GEIK programok betöltése (backward compatibility)
  loadGeikData(): Observable<ProgramEvent[]> {
    return this.http.get<ProgramEvent[]>('assets/kutatók éjszakája 2025/geik.json');
  }

  // Dinamikus area adatok betöltése
  loadAreaData(areaId: string): Observable<ProgramEvent[]> {
    return this.http.get<ProgramEvent[]>(`assets/kutatók éjszakája 2025/${areaId}.json`);
  }
}
