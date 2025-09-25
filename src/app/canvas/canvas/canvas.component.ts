import { AfterViewInit, Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import panzoom from "@panzoom/panzoom";
import { SvgElementComponent } from "../svg-element/svg-element.component";
import { SvgConfigService } from "../../services/svg-config.service";
import { SvgMapConfig, AreaClickEvent } from "../../model/svg-map-config";
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
          startScale: 0.6,
          boundsPadding: 0.1,
          startX: 0,
          startY: -570

        });

        this.scene.nativeElement.addEventListener('wheel', (e: WheelEvent) => {
          e.preventDefault(); // do not scroll

          if (!this.instance) return;

          const zoomSpeed = 0.2;
          const currentZoomFactor = this.instance.getScale();
          let zoomFactor;

          if (e.deltaY < 0) { // zoom in
            zoomFactor = currentZoomFactor + zoomSpeed;
          } else { // zoom out
            zoomFactor = currentZoomFactor - zoomSpeed;
            if (zoomFactor < 0.5) { // minZoom
              zoomFactor = 0.5;
            }
          }

          const point = {clientX: e.clientX, clientY: e.clientY};
          this.instance.zoomToPoint(zoomFactor, point);
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
      const currentZoomFactor = this.instance.getScale();
      const zoomFactor = currentZoomFactor + 0.1;
      console.log('Zoom in:', zoomFactor);
      this.instance.zoom(zoomFactor);
    } catch (error) {
      console.error('Hiba a zoom in során:', error);
    }
  }

  zoomOut() {
    if (!this.instance) {
      console.warn('Panzoom még nem inicializálódott');
      return;
    }

    try {
      const currentZoomFactor = this.instance.getScale();
      const zoomFactor = Math.max(currentZoomFactor - 0.1, 0.1); // minimum zoom 0.1
      console.log('Zoom out:', zoomFactor);
      this.instance.zoom(zoomFactor);
    } catch (error) {
      console.error('Hiba a zoom out során:', error);
    }
  }

  onAreaClick(event: AreaClickEvent) {
    console.log('Terület kattintva:', event.area.name, event.area);

    // Set popup data and show loading
    this.popupAreaName = event.area.name || event.area.id;
    this.isLoadingPrograms = true;
    this.showPopup = true;
    this.popupPrograms = [];

    // Dinamikus JSON betöltés az area id alapján
    this.svgConfigService.loadAreaData(event.area.id).subscribe({
      next: (data) => {
        console.log(`${event.area.id.toUpperCase()} programok:`, data);
        console.log(`Összesen ${data.length} program található a ${event.area.id.toUpperCase()}-nél`);

        this.popupPrograms = data;
        this.isLoadingPrograms = false;
      },
      error: (error) => {
        console.error(`Hiba a ${event.area.id} adatok betöltésekor:`, error);
        this.isLoadingPrograms = false;
        this.showPopup = false;
        // Fallback: eredeti alert ha nincs JSON fájl
        alert(`${event.area.name} (${event.area.id}) területre kattintottál!`);
      }
    });
  }

  onClosePopup() {
    this.showPopup = false;
    this.popupPrograms = [];
    this.popupAreaName = '';
    this.isLoadingPrograms = false;
  }

  // Különböző SVG konfigurációk betöltése
  loadNagyterkep() {
    this.resetPanzoom();
    this.svgConfigService.loadNagyterkepConfig().subscribe({
      next: (config) => {
        this.currentSvgConfig = config;
        this.reinitializePanzoom();
      },
      error: (error) => {
        console.error('Hiba a konfiguráció betöltésekor:', error);
      }
    });
  }

  // További SVG-k betöltésére szolgáló metódusok később implementálhatók
  loadDiszaula() {
    this.resetPanzoom();
    this.svgConfigService.loadDiszaulaConfig().subscribe({
      next: (config) => {
        this.currentSvgConfig = config;
        this.reinitializePanzoom();
      },
      error: (error) => {
        console.error('Hiba a konfiguráció betöltésekor:', error);
      }
    });
  }

  loadElocsarnok() {
    this.resetPanzoom();
    this.svgConfigService.loadElocsarnokConfig().subscribe({
      next: (config) => {
        this.currentSvgConfig = config;
        this.reinitializePanzoom();
      },
      error: (error) => {
        console.error('Hiba a konfiguráció betöltésekor:', error);
      }
    });
  }

  loadRegiAula() {
    this.resetPanzoom();
    this.svgConfigService.loadRegiAulaConfig().subscribe({
      next: (config) => {
        this.currentSvgConfig = config;
        this.reinitializePanzoom();
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
