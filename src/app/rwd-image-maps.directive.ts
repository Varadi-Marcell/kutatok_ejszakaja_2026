import {Directive, ElementRef, Renderer2, OnInit, OnDestroy, HostListener} from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Directive({
  selector: '[rwdimgmap]'
})

export class RwdImageMaps  {
  private originalWidth: number;
  private originalHeight: number;

  constructor(private el: ElementRef, private renderer: Renderer2) { }

  // @HostListener('load', ['$event.target'])
  // onLoad(img: HTMLImageElement) {
  //   this.originalWidth = img.naturalWidth;
  //   this.originalHeight = img.naturalHeight;
  //   this.resize();
  // }

  @HostListener('window:resize')
  onResize() {
    this.resize();
  }

  @HostListener('load', ['$event.target'])
  onLoad(img: HTMLImageElement) {
    this.originalWidth = img.naturalWidth;
    this.originalHeight = img.naturalHeight;
    this.resize();
  }

  private resize() {
    const imgWidth = this.el.nativeElement.width;
    const imgHeight = this.el.nativeElement.height;

    const wPercent = imgWidth / 100;
    const hPercent = imgHeight / 100;
    const mapName = this.el.nativeElement.useMap.replace('#', '');
    const areas = document.querySelectorAll(`map[name="${mapName}"] area`);

    areas.forEach(area => {
      const coords = area.getAttribute('coords').split(',');
      let coordsPercent = new Array(coords.length);

      for (let i = 0; i < coordsPercent.length; ++i) {
        if (i % 2 === 0) {
          coordsPercent[i] = parseInt(String((Number(coords[i]) / this.originalWidth) * 100 * wPercent));
        } else {
          coordsPercent[i] = parseInt(String((Number(coords[i]) / this.originalHeight) * 100 * hPercent));
        }
      }
      this.renderer.setAttribute(area, 'coords', coordsPercent.toString());
    });
  }
}
