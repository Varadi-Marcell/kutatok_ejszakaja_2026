import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import panzoom from "@panzoom/panzoom";
import { SvgElementComponent } from "../svg-element/svg-element.component";

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
export class CanvasComponent implements AfterViewInit {


  @ViewChild('scene') scene: ElementRef;
  @ViewChild(SvgElementComponent) svgElementComponent: SvgElementComponent;
  private instance: any;
  constructor() {
  }
  ngOnInit() {

  }

  ngAfterViewInit() {

    this.instance = panzoom(this.svgElementComponent.svgElement.nativeElement, {
      bounds: true,
      maxZoom: 1,
      minZoom: 0.1
    });

    this.scene.nativeElement.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault(); // do not scroll

      const zoomSpeed = 0.2;
      const currentZoomFactor = this.instance.getScale();
      let zoomFactor;

      if (e.deltaY < 0) { // zoom in
        zoomFactor = currentZoomFactor + zoomSpeed;
      } else { // zoom out
        zoomFactor = currentZoomFactor - zoomSpeed;
        if (zoomFactor < 1) { // minZoom
          zoomFactor = 1;
        }
      }

      const point = {clientX: e.clientX, clientY: e.clientY};

      this.instance.zoomToPoint(zoomFactor, point);

    });
  }
  zoomIn() {
    const currentZoomFactor = this.instance.getScale();
    const zoomFactor = currentZoomFactor + 0.1;
    console.log(zoomFactor)

    this.instance.zoomIn(zoomFactor);
  }

  zoomOut() {
    const currentZoomFactor = this.instance.getScale();
    const zoomFactor = currentZoomFactor - 0.1;
    console.log(zoomFactor)
    if (zoomFactor >= 1) {
    }
      this.instance.zoomOut(zoomFactor);
  }
}
