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
    if (this.config) {
      const image = new Image();
      image.src = this.config.svgPath;
      image.onload = () => {
        this.svgWidth = image.width;
        this.svgHeight = image.height;
      };

      // Handle the case where the image is already loaded
      if (image.complete) {
        this.svgWidth = image.width;
        this.svgHeight = image.height;
      }
    }
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
      // Számok kinyerése az útvonalból és a pontok átlagának vétele
      const numbers = (d.match(/-?\d+(\.\d+)?/g) || []).map(Number);
      let sumX = 0, sumY = 0, count = 0;
      for (let i = 0; i + 1 < numbers.length; i += 2) {
        sumX += numbers[i];
        sumY += numbers[i + 1];
        count++;
      }
      if (count === 0) return null;
      return { x: sumX / count, y: sumY / count };
    }
    return null;
  }

}
