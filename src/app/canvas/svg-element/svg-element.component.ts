import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { SvgMapConfig, InteractiveArea, AreaClickEvent, PolygonCoordinates, RectangleCoordinates, CircleCoordinates } from '../../model/svg-map-config';
import { ProgramSearchService } from '../../services/program-search.service';

/** Mini badge a standon: angol-ajánlott (en) és/vagy akadálymentesített (access). */
export interface AreaBadgeInfo {
  type: 'en' | 'access';
  x: number;
  y: number;
  r: number;
  sw: number;
}

/** A jelkulcs (legend) elrendezése viewBox-egységekben. */
export interface LegendLayout {
  x: number;
  y: number;
  w: number;
  h: number;
  fs: number;
  iconR: number;
  pad: number;
  gap: number;
  iconCx: number;
  rows: Array<{ type: 'en' | 'access'; label: string; cy: number }>;
}

@Component({
  selector: 'app-svg-element',
  templateUrl: './svg-element.component.html',
  styleUrls: ['./svg-element.component.css']
})
export class SvgElementComponent implements AfterViewInit, OnChanges, OnDestroy {

  @ViewChild('svgElement', { static: true }) svgElement: ElementRef<SVGElement>;
  
  @Input() config: SvgMapConfig | null = null;
  // Kiemelt terület azonosítója (keresési találat rázoomolás után)
  @Input() highlightedAreaId: string | null = null;
  // A jelenlegi UI nyelve (badge tooltip + jelkulcs feliratok)
  @Input() language = 'hu';
  @Output() areaClick = new EventEmitter<AreaClickEvent>();

  svgWidth: number;
  svgHeight: number;

  // Bootstrap Icons "person-wheelchair" path (inline, CDN-független), viewBox="0 0 16 16"
  readonly ACCESS_ICON_PATH =
    'M12 3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm-.663 2.146a1.5 1.5 0 0 0-.47-2.115l-2.5-1.508a1.5 1.5 0 0 0-1.676.086l-2.329 1.75a.866.866 0 0 0 1.051 1.375L7.361 3.37l.922.71-2.038 2.445A4.732 4.732 0 0 0 2.628 7.67l1.064 1.065a3.25 3.25 0 0 1 4.574 4.574l1.064 1.063a4.732 4.732 0 0 0 1.09-3.998l1.043-.292-.187 2.991a.872.872 0 1 0 1.741.098l.206-4.121A1 1 0 0 0 12.224 8h-2.79l1.903-2.854ZM3.023 9.48a3.25 3.25 0 0 0 4.496 4.496l1.077 1.077a4.75 4.75 0 0 1-6.65-6.65l1.077 1.078Z';

  // Területenkénti jelölések (a stand programjai alapján, csak true érték)
  areaFlags = new Map<string, { en: boolean; access: boolean }>();
  private flagsSub: Subscription | null = null;

  constructor(private programSearchService: ProgramSearchService) {}

  ngAfterViewInit() {
    // A hotspot-pottyok folyamatosan pulzalnak, kihalas nelkul
  }

  ngOnChanges(changes: SimpleChanges) {
    // Térképváltáskor újraszámoljuk a stand-jelöléseket
    if (changes['config']) {
      this.loadAreaFlags(this.config);
    }
  }

  // Ez kényszeríti ki, hogy a háttér <image> elem térképváltáskor teljesen
  // újra létrejöjjön ahelyett, hogy csak a href attribútuma frissülne
  trackBySvgPath(index: number, path: string): string {
    return path;
  }

  ngOnDestroy() {
    if (this.flagsSub) {
      this.flagsSub.unsubscribe();
      this.flagsSub = null;
    }
  }

  // ===== Stand-jelölések (angol-ajánlott / akadálymentesített) =====

  /**
   * Betölti az adott térkép programindexéből, hogy mely területeken van
   * legalább egy `recommended_for_english_speakers` / `accessible_venue` = true program.
   * A szerviz cache-eli az indexet, ezért plusz HTTP-költség gyakorlatilag nincs.
   */
  private loadAreaFlags(config: SvgMapConfig | null): void {
    if (this.flagsSub) {
      this.flagsSub.unsubscribe();
      this.flagsSub = null;
    }
    this.areaFlags = new Map();
    if (!config) {
      return;
    }
    this.flagsSub = this.programSearchService.getProgramIndex(config).subscribe(groups => {
      const flags = new Map<string, { en: boolean; access: boolean }>();
      for (const group of groups) {
        let en = false;
        let access = false;
        for (const program of group.programs) {
          if (program.recommended_for_english_speakers) {
            en = true;
          }
          if (program.accessible_venue) {
            access = true;
          }
          if (en && access) {
            break;
          }
        }
        if (en || access) {
          flags.set(group.areaId, { en, access });
        }
      }
      this.areaFlags = flags;
    });
  }

  handleAreaClick(area: InteractiveArea, event: Event) {
    this.areaClick.emit({
      area: area,
      originalEvent: event
    });
  }

  getPolygonCoordinates(area: InteractiveArea): PolygonCoordinates | null {
    return area.type === 'polygon' ? area.coordinates as PolygonCoordinates : null;
  }

  getPolygonPaths(area: InteractiveArea): string[] {
    const coords = this.getPolygonCoordinates(area);
    if (!coords) return [];
    
    if (Array.isArray(coords.d)) {
      return coords.d;
    } else {
      return [coords.d];
    }
  }

  getRectangleCoordinates(area: InteractiveArea): RectangleCoordinates | null {
    return area.type === 'rectangle' ? area.coordinates as RectangleCoordinates : null;
  }

  getCircleCoordinates(area: InteractiveArea): CircleCoordinates | null {
    return area.type === 'circle' ? area.coordinates as CircleCoordinates : null;
  }

  getViewBox(): string {
    if (!this.config) return '0 0 100 100';
    const vb = this.config.viewBox;
    return `${vb.x} ${vb.y} ${vb.width} ${vb.height}`;
  }

  getHotspotRadius(): number {
    if (!this.config) return 8;
    const shortestSide = Math.min(this.config.viewBox.width, this.config.viewBox.height);
    return Math.max(7, Math.min(42, shortestSide * 0.008));
  }

  // ===== CSS osztály segédek (kiemelés / Points of Interest mód) =====

  getGroupClass(area: InteractiveArea): string {
    return this.buildAreaClasses('interactive-area polygon-group', area);
  }

  getPathClass(area: InteractiveArea): string {
    return this.buildAreaClasses(area.style?.cssClass || 'polygon', area);
  }

  getRectClass(area: InteractiveArea): string {
    return this.buildAreaClasses('interactive-area ' + (area.style?.cssClass || 'polygon'), area);
  }

  getCircleClass(area: InteractiveArea): string {
    return this.buildAreaClasses('interactive-area', area);
  }

  private buildAreaClasses(base: string, area: InteractiveArea): string {
    let classes = base;
    if (this.highlightedAreaId === area.id) {
      classes += ' area-highlighted';
    }
    return classes;
  }

  // Terület középpontjának (SVG koordináta) kiszámítása a rázoomoláshoz
  getAreaCenter(area: InteractiveArea): { x: number; y: number } | null {
    if (area.type === 'rectangle') {
      const rect = area.coordinates as RectangleCoordinates;
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    }
    if (area.type === 'circle') {
      const circle = area.coordinates as CircleCoordinates;
      return { x: circle.cx, y: circle.cy };
    }
    if (area.type === 'polygon') {
      const coords = area.coordinates as PolygonCoordinates;
      const d = Array.isArray(coords.d) ? coords.d[0] : coords.d;
      if (!d) return null;
      return this.getPathCenter(d);
    }
    return null;
  }

  // Hotspot sugar az adott terulet meretehez igazitva: a potty maximum
  // a terulet kisebbik oldalanak 30%-a lehet, igy kis standokon sem takarja
  // el a beegetett feliratot
  getHotspotRadiusForArea(area: InteractiveArea): number {
    const base = this.getHotspotRadius();
    const bounds = this.getAreaBounds(area);
    if (!bounds) return base;
    const smallerSide = Math.min(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
    return Math.max(4, Math.min(base, smallerSide * 0.3));
  }

  // Pulzáló/lebegő pin-jelző pozicionálása a kiemelt terület fölé (keresés/
  // átirányítás után jól látható legyen, ne csak a finom szín-kiemelésre kelljen hagyatkozni)
  getHighlightPinTransform(area: InteractiveArea): string {
    const center = this.getAreaCenter(area);
    if (!center) return '';
    const r = this.getHotspotRadiusForArea(area);
    const s = (r * 2.6) / 16;
    const liftAbove = r * 1.3;
    const x = center.x - 8 * s;
    const y = center.y - liftAbove - 16 * s;
    return `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${s.toFixed(4)})`;
  }

  getHotspotStrokeWidth(area: InteractiveArea): number {
    return Math.min(8, Math.max(2, this.getHotspotRadiusForArea(area) * 0.45));
  }

  // Terulet befoglalo teglalapja (hotspot-meretezeshez)
  getAreaBounds(area: InteractiveArea): { minX: number; minY: number; maxX: number; maxY: number } | null {
    if (area.type === 'rectangle') {
      const rect = area.coordinates as RectangleCoordinates;
      return { minX: rect.x, minY: rect.y, maxX: rect.x + rect.width, maxY: rect.y + rect.height };
    }
    if (area.type === 'circle') {
      const circle = area.coordinates as CircleCoordinates;
      return { minX: circle.cx - circle.r, minY: circle.cy - circle.r, maxX: circle.cx + circle.r, maxY: circle.cy + circle.r };
    }
    if (area.type === 'polygon') {
      const coords = area.coordinates as PolygonCoordinates;
      const d = Array.isArray(coords.d) ? coords.d[0] : coords.d;
      if (!d) return null;
      return this.getPathBounds(d);
    }
    return null;
  }

  private getPathPoints(d: string): Array<{ x: number; y: number }> {
    const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
    const points: Array<{ x: number; y: number }> = [];
    let command = '';
    let index = 0;
    let currentX = 0;
    let currentY = 0;
    let startX = 0;
    let startY = 0;

    const isCommand = (token: string) => /^[a-zA-Z]$/.test(token);
    const readNumber = () => Number(tokens[index++]);
    const addPoint = () => points.push({ x: currentX, y: currentY });

    while (index < tokens.length) {
      if (isCommand(tokens[index])) {
        command = tokens[index++];
      }

      switch (command) {
        case 'M':
        case 'L':
          currentX = readNumber();
          currentY = readNumber();
          if (command === 'M') {
            startX = currentX;
            startY = currentY;
            command = 'L';
          }
          addPoint();
          break;
        case 'm':
        case 'l':
          currentX += readNumber();
          currentY += readNumber();
          if (command === 'm') {
            startX = currentX;
            startY = currentY;
            command = 'l';
          }
          addPoint();
          break;
        case 'H':
          currentX = readNumber();
          addPoint();
          break;
        case 'h':
          currentX += readNumber();
          addPoint();
          break;
        case 'V':
          currentY = readNumber();
          addPoint();
          break;
        case 'v':
          currentY += readNumber();
          addPoint();
          break;
        case 'Z':
        case 'z':
          currentX = startX;
          currentY = startY;
          addPoint();
          break;
        default:
          index++;
      }
    }

    return points;
  }

  private getPathBounds(d: string): { minX: number; minY: number; maxX: number; maxY: number } | null {
    const points = this.getPathPoints(d);
    if (points.length === 0) return null;

    return points.reduce((acc, point) => ({
      minX: Math.min(acc.minX, point.x),
      maxX: Math.max(acc.maxX, point.x),
      minY: Math.min(acc.minY, point.y),
      maxY: Math.max(acc.maxY, point.y)
    }), {
      minX: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY
    });
  }

  private getPathCenter(d: string): { x: number; y: number } | null {
    const bounds = this.getPathBounds(d);
    if (!bounds) return null;
    return {
      x: bounds.minX + (bounds.maxX - bounds.minX) / 2,
      y: bounds.minY + (bounds.maxY - bounds.minY) / 2
    };
  }

  /**
   * A terület sarkába (lehetőség szerint kívül, a jobb felső sarok fölé)
   * illesztett mini badge-ek pozíciói. A sugár a hotspot sugarához igazodik,
   * hogy se a stand feliratát, se a hotspotot ne takarja.
   */
  getAreaBadges(area: InteractiveArea): AreaBadgeInfo[] {
    const flags = this.areaFlags.get(area.id);
    // A nagytérképen (campus overview) nem kellenek a mini badge-ek - túl sok stand van rajta
    if (!flags || !this.config || this.config.id === 'nagyterkep') {
      return [];
    }
    const bounds = this.getAreaBounds(area);
    if (!bounds) {
      return [];
    }
    const types: Array<'en' | 'access'> = [];
    if (flags.en) {
      types.push('en');
    }
    if (flags.access) {
      types.push('access');
    }

    const r = Math.min(14, Math.max(6, this.getHotspotRadiusForArea(area) * 0.75));
    const sw = Math.max(0.9, r * 0.16);
    const step = r * 2.3;
    const vb = this.config.viewBox;
    const rowWidth = (types.length - 1) * step;

    // Előnyben: a stand külsejében, a jobb felső sarok felett
    let startX = bounds.maxX + r * 1.2;
    let startY = bounds.minY - r * 1.2;
    if (startX + rowWidth + r > vb.x + vb.width || startY - r < vb.y) {
      // Tartalék: a stand belsejében, a jobb felső sarokban
      startX = bounds.maxX - r * 1.2;
      startY = bounds.minY + r * 1.2;
    }

    return types.map((type, i) => {
      let x = startX - i * step;
      let y = startY;
      // Clamp a viewBox-be, hogy egyik badge se csússzon ki a látható térből
      x = Math.min(Math.max(x, vb.x + r), vb.x + vb.width - r);
      y = Math.min(Math.max(y, vb.y + r), vb.y + vb.height - r);
      return { type, x, y, r, sw };
    });
  }

  // Akadálymentesített ikon (16-os viewBox) pozicionálása egy badge középpontjára
  getAccessIconTransform(badge: AreaBadgeInfo): string {
    return this.accessIconTransform(badge.x, badge.y, badge.r);
  }

  getLegendAccessTransform(legend: LegendLayout, row: { cy: number }): string {
    return this.accessIconTransform(legend.iconCx, row.cy, legend.iconR);
  }

  private accessIconTransform(cx: number, cy: number, r: number): string {
    // Az ikon 16x16-os viewBox-a a (8,8) középpont körül skálázva tölti ki a kört
    const s = (r * 2 * 1.5) / 16;
    return `translate(${(cx - 8 * s).toFixed(3)} ${(cy - 8 * s).toFixed(3)}) scale(${s.toFixed(4)})`;
  }

  /**
   * Jelkulcs a térkép bal alsó sarkába – csak akkor jelenik meg,
   * ha az adott térképen van legalább egy jelölt stand.
   */
  getLegendLayout(): LegendLayout | null {
    // A nagytérképen (campus overview) nem kell a jelkulcs
    if (!this.config || this.config.id === 'nagyterkep') {
      return null;
    }
    let anyEn = false;
    let anyAccess = false;
    for (const area of this.config.interactiveAreas) {
      const flags = this.areaFlags.get(area.id);
      if (flags?.en) {
        anyEn = true;
      }
      if (flags?.access) {
        anyAccess = true;
      }
      if (anyEn && anyAccess) {
        break;
      }
    }
    if (!anyEn && !anyAccess) {
      return null;
    }

    const enLabel = this.language === 'en' ? 'English-friendly' : 'Angol nyelvűeknek ajánlott';
    const accLabel = this.language === 'en' ? 'Accessible venue' : 'Akadálymentesített';

    const vb = this.config.viewBox;
    const unit = Math.min(vb.width, vb.height);
    const fs = unit * 0.024;
    const iconR = fs * 0.9;
    const pad = fs * 0.7;
    const gap = fs * 0.5;
    const textW = Math.max(enLabel.length, accLabel.length) * fs * 0.6;
    const w = pad + iconR * 2 + gap + textW + pad;
    const rowH = fs * 2.2;
    const count = (anyEn ? 1 : 0) + (anyAccess ? 1 : 0);
    const h = pad * 1.2 + rowH * count + pad * 0.6;
    const x = vb.x + fs;
    const y = vb.y + vb.height - h - fs;

    const rows: LegendLayout['rows'] = [];
    if (anyEn) {
      rows.push({ type: 'en', label: enLabel, cy: y + pad + rowH * 0.5 });
    }
    if (anyAccess) {
      rows.push({ type: 'access', label: accLabel, cy: y + pad + rowH * (anyEn ? 1.5 : 0.5) });
    }
    return { x, y, w, h, fs, iconR, pad, gap, iconCx: x + pad + iconR, rows };
  }

}
