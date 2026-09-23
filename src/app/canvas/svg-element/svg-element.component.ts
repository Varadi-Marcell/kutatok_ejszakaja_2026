import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { SvgMapConfig, InteractiveArea, AreaClickEvent, PolygonCoordinates, RectangleCoordinates, CircleCoordinates } from '../../model/svg-map-config';

@Component({
  selector: 'app-svg-element',
  templateUrl: './svg-element.component.html',
  styleUrls: ['./svg-element.component.css']
})
export class SvgElementComponent implements AfterViewInit {

  @ViewChild('svgElement', { static: true }) svgElement: ElementRef<SVGElement>;
  
  @Input() config: SvgMapConfig | null = null;
  // Kiemelt terület azonosítója (keresési találat rázoomolás után)
  @Input() highlightedAreaId: string | null = null;
  @Output() areaClick = new EventEmitter<AreaClickEvent>();

  svgWidth: number;
  svgHeight: number;

  ngAfterViewInit() {
    // A hotspot-pottyok folyamatosan pulzalnak, kihalas nelkul
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

}
