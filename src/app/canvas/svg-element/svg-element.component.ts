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

}
