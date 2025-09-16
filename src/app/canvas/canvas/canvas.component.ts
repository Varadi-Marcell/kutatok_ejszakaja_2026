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

  // @ViewChild('myCanvas', { static: true }) myCanvas: ElementRef<HTMLCanvasElement>;
  // @ViewChild('mapImage', { static: true }) mapImage: ElementRef<HTMLImageElement>;
  // private ctx: CanvasRenderingContext2D;
  // private path: Path2D;
  //
  // ngAfterViewInit() {
  //   const image = this.mapImage.nativeElement;
  //
  //   image.onload = () => {
  //     this.myCanvas.nativeElement.width = image.width;
  //     this.myCanvas.nativeElement.height = image.height;
  //
  //     this.ctx = this.myCanvas.nativeElement.getContext('2d');
  //     this.drawImageToCanvas(image);
  //     this.drawRects();
  //     this.drawPolygons();
  //
  //     this.myCanvas.nativeElement.addEventListener('click', this.handleClick.bind(this));
  //
  //   };
  // }
  //
  // handleClick(event: MouseEvent) {
  //   console.log(event.x)
  //   console.log(event.y);
  //   const rect = this.myCanvas.nativeElement.getBoundingClientRect();
  //   const x = event.clientX - rect.left;
  //   const y = event.clientY - rect.top;
  //
  //   // Ha a kattintás a path felett történt
  //   if (this.ctx.isPointInPath(this.path, x, y)) {
  //     alert('Path clicked!'); // Vagy bármi más akció
  //   }
  // }
  //
  // drawImageToCanvas(image: HTMLImageElement) {
  //   // Rajzolás a canvas-ra
  //   this.ctx.drawImage(image, 0, 0, image.width, image.height);
  // }
  //
  // drawPolygons() {
  //   let array = [];
  //   array.push('m 2075.7813,1399.4961 -54.004,77.3789 -297.2734,425.1367 -36.7539,-25.75 -47.875,-33.625 -29.1289,-20.3789 297.2734,-425.1367 29.375,20.75 54.0039,-77.375 z m 0,0')
  //   array.push('m 2059.2813,1046.2344 h -50.879 c -12.5039,0 -22.6289,-10.125 -22.6289,-22.625 v -50.87503 c 0,-12.5 10.125,-22.625 22.6289,-22.625 h 50.879 c 12.5,0 22.625,10.125 22.625,22.625 v 50.87503 c 0,12.5 -10.125,22.625 -22.625,22.625 z m 0,0')
  //
  //   array.forEach(el => {
  //     const path = new Path2D(el);
  //
  //     this.ctx.fillStyle = '#007a30';
  //
  //     this.ctx.fill(path);
  //
  //   })
  // }
  //
  // drawRects() {
  //   this.ctx.save();
  //
  //   // Apply the transformation for the rectangle
  //   this.ctx.setTransform(1.250094, 0, 0, 1.250038, 0, 0.0784362);
  //
  //
  //   this.ctx.fillStyle = '#ffd95e'; // fill: #ffd95e
  //   this.ctx.strokeStyle = '#000000'; // stroke: #000000
  //   this.ctx.lineWidth = 5.1151; // stroke-width: 5.1151
  //   this.ctx.lineCap = 'round'; // stroke-linecap: round
  //   this.ctx.lineJoin = 'round'; // stroke-linejoin: round
  //
  //   // m 1419.9997,1242.299 h 108.7012 v 70.801 h -108.7012 z m 0,0
  //   const arr = [
  //     {
  //       x: 1457.8,
  //       y:727.39924,
  //       width: 108.7012,
  //       height:70.80094
  //     },
  //     {
  //       x: 1419.9997,
  //       y:1242.299,
  //       width: 108.7012,
  //       height:70.801
  //     },
  //   ]
  //   arr.forEach(el => {
  //     this.ctx.fillRect(el.x, el.y, el.width, el.height);
  //     this.ctx.strokeRect(el.x, el.y, el.width, el.height);
  //   })
  //
  //   this.ctx.restore();
  // }

  // @ViewChild('myCanvas', { static: true }) myCanvas: ElementRef<HTMLCanvasElement>;
  // @ViewChild('mapImage', { static: true }) mapImage: ElementRef<HTMLImageElement>;
  //
  // private ctx: CanvasRenderingContext2D;
  // private polygons: Polygon[] = [];
  //
  // ngAfterViewInit() {
  //   const image = this.mapImage.nativeElement;
  //
  //   image.onload = () => {
  //     this.initializeCanvas(image);
  //   };
  //
  //   // Handle the case where the image is already loaded (from cache)
  //   if (image.complete) {
  //     this.initializeCanvas(image);
  //   }
  // }
  //
  // initializeCanvas(image: HTMLImageElement) {
  //   // Set canvas dimensions to match the image
  //   this.myCanvas.nativeElement.width = image.width;
  //   this.myCanvas.nativeElement.height = image.height;
  //
  //   this.ctx = this.myCanvas.nativeElement.getContext('2d');
  //
  //   // Initial drawing
  //   this.drawImageToCanvas(image);
  //   this.drawRects();
  //   this.drawPolygons();
  //
  //   // Event listeners for hover effect and clicks
  //   this.myCanvas.nativeElement.addEventListener('mousemove', this.handleMouseMove.bind(this));
  //   this.myCanvas.nativeElement.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
  //   this.myCanvas.nativeElement.addEventListener('click', this.handleClick.bind(this));
  // }
  //
  // handleMouseMove(event: MouseEvent) {
  //   const rect = this.myCanvas.nativeElement.getBoundingClientRect();
  //   const x = event.clientX - rect.left;
  //   const y = event.clientY - rect.top;
  //
  //   this.polygons.forEach(polygon => {
  //     const isHovered = this.ctx.isPointInPath(polygon.path, x, y);
  //     if (isHovered && !polygon.isHovered) {
  //       polygon.isHovered = true;
  //       this.startFadeIn(polygon);
  //     } else if (!isHovered && polygon.isHovered) {
  //       polygon.isHovered = false;
  //       this.startFadeOut(polygon);
  //     }
  //   });
  // }
  //
  // handleMouseLeave() {
  //   // Fade out all polygons when the mouse leaves the canvas
  //   this.polygons.forEach(polygon => {
  //     if (polygon.isHovered) {
  //       polygon.isHovered = false;
  //       this.startFadeOut(polygon);
  //     }
  //   });
  // }
  //
  // handleClick(event: MouseEvent) {
  //   const rect = this.myCanvas.nativeElement.getBoundingClientRect();
  //   const x = event.clientX - rect.left;
  //   const y = event.clientY - rect.top;
  //
  //   // Check if click occurred over any polygon
  //   this.polygons.forEach(polygon => {
  //     if (this.ctx.isPointInPath(polygon.path, x, y)) {
  //       alert('Polygon clicked!'); // Or any other action
  //     }
  //   });
  // }
  //
  // drawImageToCanvas(image: HTMLImageElement) {
  //   // Draw the image onto the canvas
  //   this.ctx.drawImage(image, 0, 0, image.width, image.height);
  // }
  //
  // drawPolygons() {
  //   const pathData1 = 'm 2075.7813,1399.4961 -54.004,77.3789 -297.2734,425.1367 -36.7539,-25.75 -47.875,-33.625 -29.1289,-20.3789 297.2734,-425.1367 29.375,20.75 54.0039,-77.375 z m 0,0';
  //   const pathData2 = 'm 2059.2813,1046.2344 h -50.879 c -12.5039,0 -22.6289,-10.125 -22.6289,-22.625 v -50.87503 c 0,-12.5 10.125,-22.625 22.6289,-22.625 h 50.879 c 12.5,0 22.625,10.125 22.625,22.625 v 50.87503 c 0,12.5 -10.125,22.625 -22.625,22.625 z m 0,0';
  //
  //   const path1 = new Path2D(pathData1);
  //   const path2 = new Path2D(pathData2);
  //
  //   // Store polygons with their hover styles and initial hover state
  //   this.polygons.push({
  //     path: path1,
  //     hoverFillStyle: 'blue',
  //     hoverStrokeStyle: 'black',
  //     isHovered: false,
  //     fillOpacity: 0,
  //     animationFrameId: null
  //   });
  //
  //   this.polygons.push({
  //     path: path2,
  //     hoverFillStyle: 'blue',
  //     hoverStrokeStyle: 'black',
  //     isHovered: false,
  //     fillOpacity: 0,
  //     animationFrameId: null
  //   });
  //
  //   // Initial drawing of polygons (they will be invisible by default)
  //   this.redraw();
  // }
  //
  // drawRects() {
  //   this.ctx.save();
  //
  //   // Apply the transformation for the rectangles
  //   this.ctx.setTransform(1.250094, 0, 0, 1.250038, 0, 0.0784362);
  //
  //   this.ctx.fillStyle = '#ffd95e'; // Fill color
  //   this.ctx.strokeStyle = '#000000'; // Stroke color
  //   this.ctx.lineWidth = 5.1151; // Line width
  //   this.ctx.lineCap = 'round'; // Line cap style
  //   this.ctx.lineJoin = 'round'; // Line join style
  //
  //   const rectangles = [
  //     {
  //       x: 1457.8,
  //       y: 727.39924,
  //       width: 108.7012,
  //       height: 70.80094
  //     },
  //     {
  //       x: 1419.9997,
  //       y: 1242.299,
  //       width: 108.7012,
  //       height: 70.801
  //     },
  //   ];
  //
  //   // Draw each rectangle
  //   rectangles.forEach(rect => {
  //     this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  //     this.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
  //   });
  //
  //   this.ctx.restore();
  // }
  //
  // redraw() {
  //   // Clear the entire canvas
  //   this.ctx.clearRect(0, 0, this.myCanvas.nativeElement.width, this.myCanvas.nativeElement.height);
  //
  //   // Redraw the image
  //   this.drawImageToCanvas(this.mapImage.nativeElement);
  //
  //   // Redraw rectangles
  //   this.drawRects();
  //
  //   // Draw polygons with hover effect
  //   this.polygons.forEach(polygon => {
  //     if (polygon.fillOpacity > 0) {
  //       this.ctx.save();
  //       this.ctx.globalAlpha = polygon.fillOpacity;
  //       this.ctx.fillStyle = polygon.hoverFillStyle;
  //       this.ctx.strokeStyle = polygon.hoverStrokeStyle;
  //       this.ctx.lineWidth = 5; // Stroke width of 5 when hovered
  //       this.ctx.fill(polygon.path);
  //       this.ctx.stroke(polygon.path);
  //       this.ctx.restore();
  //     }
  //   });
  // }
  //
  // startFadeIn(polygon: Polygon) {
  //   if (polygon.animationFrameId) {
  //     cancelAnimationFrame(polygon.animationFrameId);
  //   }
  //
  //   const duration = 500; // Duration in milliseconds
  //   const startTime = performance.now();
  //   const startOpacity = polygon.fillOpacity;
  //   const targetOpacity = 1;
  //
  //   const animate = (time: number) => {
  //     const elapsed = time - startTime;
  //     const progress = Math.min(elapsed / duration, 1);
  //     polygon.fillOpacity = startOpacity + (targetOpacity - startOpacity) * progress;
  //     this.redraw();
  //     if (progress < 1) {
  //       polygon.animationFrameId = requestAnimationFrame(animate);
  //     } else {
  //       polygon.animationFrameId = null;
  //     }
  //   };
  //
  //   polygon.animationFrameId = requestAnimationFrame(animate);
  // }
  //
  // startFadeOut(polygon: Polygon) {
  //   if (polygon.animationFrameId) {
  //     cancelAnimationFrame(polygon.animationFrameId);
  //   }
  //
  //   const duration = 500; // Duration in milliseconds
  //   const startTime = performance.now();
  //   const startOpacity = polygon.fillOpacity;
  //   const targetOpacity = 0;
  //
  //   const animate = (time: number) => {
  //     const elapsed = time - startTime;
  //     const progress = Math.min(elapsed / duration, 1);
  //     polygon.fillOpacity = startOpacity + (targetOpacity - startOpacity) * progress;
  //     this.redraw();
  //     if (progress < 1) {
  //       polygon.animationFrameId = requestAnimationFrame(animate);
  //     } else {
  //       polygon.animationFrameId = null;
  //     }
  //   };
  //
  //   polygon.animationFrameId = requestAnimationFrame(animate);
  // }

}
