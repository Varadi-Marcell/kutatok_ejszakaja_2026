import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SvgMapConfig } from '../model/svg-map-config';

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
}
