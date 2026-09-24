import { AfterViewInit, Component, ElementRef, HostListener, ViewChild, OnInit } from '@angular/core';
import panzoom from "@panzoom/panzoom";
import { Observable } from "rxjs";
import { SvgElementComponent } from "../svg-element/svg-element.component";
import { SvgConfigService } from "../../services/svg-config.service";
import { SvgMapConfig, AreaClickEvent, InteractiveArea } from "../../model/svg-map-config";
import { ProgramEvent } from "../../model/program-event";

interface Polygon {
  path: Path2D;
  hoverFillStyle: string;
  hoverStrokeStyle: string;
  isHovered: boolean;
  fillOpacity: number;
  animationFrameId: number | null;
}

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css']
})
export class CanvasComponent implements AfterViewInit, OnInit {

  @ViewChild('scene') scene: ElementRef;
  @ViewChild('svgComponent') svgComponent: SvgElementComponent;

  private instance: any;
  currentSvgConfig: SvgMapConfig | null = null;
  private isInitialized = false;

  // Popup properties
  showPopup: boolean = false;
  popupPrograms: ProgramEvent[] = [];
  popupAreaName: string = '';
  isLoadingPrograms: boolean = false;
  // A jelenleg (vagy legutóbb) megnyitott popup területének azonosítója - bezáráskor
  // ezt emeljük ki újra a térképen, hogy a felhasználó lássa, melyik standról volt szó
  private popupAreaId: string | null = null;

  // Keresés / térkép UI állapot
  highlightedAreaId: string | null = null;
  language: 'hu' | 'en' = 'hu';
  selectedProgramName: string | null = null;
  // Ha a popup egy regisztrációhoz kötött program miatti átirányítás eredménye,
  // itt az eredeti program neve (magyarázó sávhoz a popupban)
  redirectedProgramName: string | null = null;
  private highlightTimeout: any = null;
  // Térképváltás után feldolgozásra váró keresési kiválasztás
  private pendingSelection: { mapId: string; areaId: string; areaName?: string; program?: ProgramEvent } | null = null;

  constructor(private svgConfigService: SvgConfigService) {
  }

  ngOnInit() {
    // Betöltjük az alapértelmezett konfigurációt
    this.loadDefaultConfig();
  }

  loadDefaultConfig() {
    this.svgConfigService.loadNagyterkepConfig().subscribe({
      next: (config) => {
        this.currentSvgConfig = config;
      },
      error: (error) => {
        console.error('Hiba a konfiguráció betöltésekor:', error);
      }
    });
  }

  ngAfterViewInit() {
    // Késleltetett inicializálás, hogy biztosan betöltődjenek a komponensek
    setTimeout(() => {
      this.initializePanzoom();
    }, 100);
  }

  private initializePanzoom() {
    // Próbálkozások különböző elemekkel
    const svgElement = document.querySelector('app-svg-element svg');
    const svgContainer = document.querySelector('app-svg-element .svg-container');
    const svgComponent = document.querySelector('app-svg-element');

    let targetElement = null;
    let method = '';

    // 1. Próbálkozás: SVG container
    if (svgContainer && this.scene && !this.isInitialized) {
      targetElement = svgContainer;
      method = 'SVG Container';
    }
    // 2. Próbálkozás: SVG elem
    else if (svgElement && this.scene && !this.isInitialized) {
      targetElement = svgElement;
      method = 'SVG Element';
    }
    // 3. Próbálkozás: Teljes komponens
    else if (svgComponent && this.scene && !this.isInitialized) {
      targetElement = svgComponent;
      method = 'SVG Component';
    }
    // 4. Fallback: ViewChild
    else if (this.svgComponent && this.svgComponent.svgElement && this.scene && !this.isInitialized) {
      targetElement = this.svgComponent.svgElement.nativeElement;
      method = 'ViewChild';
    }

    if (targetElement) {
      try {
        console.log(`Panzoom inicializálása ${method} módszerrel...`);
        this.instance = panzoom(targetElement as HTMLElement, {
          bounds: true,
          maxZoom: 3,
          minZoom: 0.4,
          // Auto-fit: az egész térkép látszódjon (a SVG preserveAspectRatio="meet"
          // beállítása a böngészőben középre igazítja és betölti a teljes nézetbe)
          startScale: 1,
          boundsPadding: 0.1,
          startX: 0,
          startY: 0,
          // Kisebb lepés + lágy easing, hogy a zoomolás (görgő és gombok) ne legyen hirtelen
          step: 0.12,
          animate: true,
          duration: 220,
          easing: 'ease-out'
        });

        // A könyvtár beépített, sima görgős zoomolása (deltaY-arányos, fókuszpontra zoomol)
        this.scene.nativeElement.addEventListener('wheel', (e: WheelEvent) => {
          if (!this.instance) return;
          // A bal felső eszköztár (kereső / beállítások / kedvencek legördülők) felett
          // hagyjuk a natív görgetést - ne a térkép zoomoljon a lista görgetése helyett
          const target = e.target as HTMLElement | null;
          if (target?.closest('.top-left-stack')) {
            return;
          }
          this.instance.zoomWithWheel(e);
        });

        this.isInitialized = true;
        console.log(`Panzoom sikeresen inicializálva ${method} módszerrel`);
      } catch (error) {
        console.error(`Hiba a panzoom inicializálásakor (${method}):`, error);
        // Újrapróbálkozás 500ms múlva
        setTimeout(() => {
          this.initializePanzoom();
        }, 500);
      }
    } else {
      console.log('Elemek még nem érhetők el, újrapróbálkozás 500ms múlva...');
      setTimeout(() => {
        this.initializePanzoom();
      }, 500);
    }
  }
  zoomIn() {
    if (!this.instance) {
      console.warn('Panzoom még nem inicializálódott');
      return;
    }

    try {
      this.instance.zoomIn();
    } catch (error) {
      console.error('Hiba a zoom in során:', error);
    }
  }

  // Teljes térkép láthatóvá tétele (auto-fit): alap zoom és középre igazítás
  fitToView() {
    if (!this.instance) return;
    try {
      this.instance.zoom(1);
      this.instance.pan(0, 0);
    } catch (error) {
      console.error('Hiba a térkép illesztésekor:', error);
    }
  }

  // Ablak átméretezésekor újra illesztjük a térképet a képernyőre
  @HostListener('window:resize')
  onResize() {
    this.fitToView();
  }

  zoomOut() {
    if (!this.instance) {
      console.warn('Panzoom még nem inicializálódott');
      return;
    }

    try {
      this.instance.zoomOut();
    } catch (error) {
      console.error('Hiba a zoom out során:', error);
    }
  }

  onAreaClick(event: AreaClickEvent) {
    console.log('Terület kattintva:', event.area.name, event.area);
    this.openAreaPrograms(event.area);
  }

  // Programok megnyitása egy területhez (kattintás VAGY keresési találat alapján)
  // isNavigation: kereséssel/átirányítással jutottunk ide (nem sima kattintással) -
  // csak ilyenkor emeljük ki újra a standot bezáráskor, sima kattintásnál felesleges
  openAreaPrograms(area: InteractiveArea, selectedProgram?: ProgramEvent, isNavigation: boolean = false) {
    // Set popup data and show loading
    this.popupAreaId = isNavigation ? area.id : null;
    this.popupAreaName = area.name || area.id;
    this.isLoadingPrograms = true;
    this.showPopup = true;
    this.popupPrograms = [];
    this.selectedProgramName = selectedProgram?.name || null;
    // Ha ez a terület a kiválasztott program regisztrációs standja (nem az, ahol
    // a program ténylegesen zajlik), jelezzük a popupban, miért irányítottunk ide
    this.redirectedProgramName = (selectedProgram?.registration_area_id === area.id && selectedProgram?.name)
      ? selectedProgram.name
      : null;

    // Check if we're on the campus map (nagyterkep)
    const isNagyterkep = this.currentSvgConfig?.id === 'nagyterkep';

    if (isNagyterkep) {
      // For nagyterkep_jo.svg, load building.json and use area.id as building key
      this.svgConfigService.loadBuildingData(area.id).subscribe({
        next: (data) => {
          console.log(`${area.id.toUpperCase()} programok (building.json-ből):`, data);
          console.log(`Összesen ${data.length} program található a ${area.id.toUpperCase()}-nél`);

          this.popupPrograms = data;
          this.isLoadingPrograms = false;
        },
        error: (error) => {
          console.error(`Hiba a ${area.id} adatok betöltésekor (building.json):`, error);
          this.isLoadingPrograms = false;
          this.showPopup = false;
          // Fallback: eredeti alert ha nincs adat
          alert(`${area.name} (${area.id}) területre kattintottál!`);
        }
      });
    } else {
      // For other SVGs, use the original logic
      this.svgConfigService.loadAreaData(area.id).subscribe({
        next: (data) => {
          console.log(`${area.id.toUpperCase()} programok:`, data);
          console.log(`Összesen ${data.length} program található a ${area.id.toUpperCase()}-nél`);

          this.popupPrograms = data;
          this.isLoadingPrograms = false;
        },
        error: (error) => {
          console.error(`Hiba a ${area.id} adatok betöltésekor:`, error);
          this.isLoadingPrograms = false;
          this.showPopup = false;
          // Fallback: eredeti alert ha nincs JSON fájl
          alert(`${area.name} (${area.id}) területre kattintottál!`);
        }
      });
    }
  }

  // ===== Keresés események (map-toolbar) =====

  // Keresési találat kiválasztása: szükség esetén térképváltás,
  // majd kiemeles + program popup (nincs zoom)
  onSearchAreaSelected(payload: { mapId: string; areaId: string; areaName?: string; program?: ProgramEvent }) {
    const activeId = this.currentSvgConfig?.id || null;

    // Ha a találat egy másik térképen van, előbb arra váltunk;
    // a kiválasztás a betöltés után fut le (processPendingSelection)
    if (payload.mapId && activeId && payload.mapId !== activeId) {
      this.pendingSelection = payload;
      this.loadMap(payload.mapId);
      return;
    }

    this.applyAreaSelection(payload.areaId, payload.program, payload.areaName);
  }

  // A kivalasztas alkalmazasa: kiemeles + program popup (zoom nelkul)
  private applyAreaSelection(areaId: string, program?: ProgramEvent, areaName?: string) {
    if (!this.currentSvgConfig) return;

    const area = this.currentSvgConfig.interactiveAreas.find(a => a.id === areaId);
    if (area) {
      this.highlightArea(area.id);

      // Program popup megnyitása (ugyanaz, mintha a területre kattintottak volna)
      this.openAreaPrograms(area, program, true);
      return;
    }

    // Az új térképen nincs ilyen terület (pl. az épület kattintható része csak
    // a campus térképen létezik) - popup nyitás az épület programjaival
    console.warn('A terület nem található a térképen, popup nyitás az épület adataival:', areaId);
    this.popupAreaId = null;
    this.popupAreaName = areaName || areaId;
    this.isLoadingPrograms = true;
    this.showPopup = true;
    this.popupPrograms = [];
    this.selectedProgramName = program?.name || null;
    this.redirectedProgramName = null;

    this.svgConfigService.loadBuildingData(areaId).subscribe({
      next: (data) => {
        this.popupPrograms = data;
        this.isLoadingPrograms = false;
      },
      error: (error) => {
        console.error('Hiba az épület programjainak betöltésekor:', error);
        this.isLoadingPrograms = false;
        this.showPopup = false;
      }
    });
  }

  // Térképváltás után függőben lévő keresési kiválasztás feldolgozása
  private processPendingSelection() {
    if (!this.pendingSelection || !this.currentSvgConfig) return;
    if (this.pendingSelection.mapId !== this.currentSvgConfig.id) return;

    const pending = this.pendingSelection;
    this.pendingSelection = null;

    // Rövid várakozás, hogy a Panzoom újrainicializálódjon
    setTimeout(() => this.applyAreaSelection(pending.areaId, pending.program, pending.areaName), 400);
  }

  // Terület kiemelése néhány másodpercre
  highlightArea(areaId: string) {
    this.highlightedAreaId = areaId;
    if (this.highlightTimeout) {
      clearTimeout(this.highlightTimeout);
    }
    this.highlightTimeout = setTimeout(() => {
      this.highlightedAreaId = null;
    }, 6000);
  }


  // Nyelvváltás az eszköztárból
  onLanguageChanged(lang: 'hu' | 'en') {
    this.language = lang;
  }

  onClosePopup() {
    this.showPopup = false;
    this.popupPrograms = [];
    this.popupAreaName = '';
    this.isLoadingPrograms = false;
    this.redirectedProgramName = null;
    // A popup nyitva léte alatt a korábbi kiemelés időzítője lejárhatott - bezáráskor
    // frissen újraindítjuk, hogy a látogató most, hogy újra látja a térképet, lássa is,
    // melyik standról volt szó
    if (this.popupAreaId) {
      this.highlightArea(this.popupAreaId);
    }
    this.popupAreaId = null;
  }

  // Különböző SVG konfigurációk betöltése térkép azonosító szerint
  loadMap(mapId: string) {
    // Térkép váltáskor bezárjuk a nyitott popup ablakot
    this.onClosePopup();

    this.resetPanzoom();

    let config$: Observable<SvgMapConfig>;
    switch (mapId) {
      case 'elocsarnok':
        config$ = this.svgConfigService.loadElocsarnokConfig();
        break;
      case 'diszaula':
        config$ = this.svgConfigService.loadDiszaulaConfig();
        break;
      case 'regi_aula':
        config$ = this.svgConfigService.loadRegiAulaConfig();
        break;
      case 'harmas':
        config$ = this.svgConfigService.loadHarmasConfig();
        break;
      case 'parkolo':
        config$ = this.svgConfigService.loadParkoloConfig();
        break;
      case 'nagyterkep':
      default:
        config$ = this.svgConfigService.loadNagyterkepConfig();
        break;
    }

    config$.subscribe({
      next: (config) => {
        this.currentSvgConfig = config;
        this.reinitializePanzoom();
        this.processPendingSelection();
      },
      error: (error) => {
        console.error('Hiba a konfiguráció betöltésekor:', error);
      }
    });
  }

  private resetPanzoom() {
    if (this.instance) {
      this.instance.destroy();
      this.instance = null;
    }
    this.isInitialized = false;
  }

  private reinitializePanzoom() {
    setTimeout(() => {
      this.initializePanzoom();
    }, 300);
  }
}
