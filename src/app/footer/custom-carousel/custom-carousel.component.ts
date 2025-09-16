import { Component, HostListener, Input, OnInit } from '@angular/core';
import { ImageItem } from "../../model/image-item";
import { HttpClient } from "@angular/common/http";

@Component({
  selector: 'app-custom-carousel',
  templateUrl: './custom-carousel.component.html',
  styleUrl: './custom-carousel.component.scss'
})
export class CustomCarouselComponent implements OnInit {

  images: ImageItem[] = [];
  @Input() numVisible: number = 5;
  @Input() maxWidth: string = '640px';
  @Input() responsiveOptions: { breakpoint: string; numVisible: number }[] = [];

  currentIndex: number = 0;
  displayImages: ImageItem[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.initalizeImages();
  }

  selectImage(index: number): void {
    this.currentIndex = index;
  }

  next(): void {
    if (this.currentIndex < this.images.length - 1) {
      this.currentIndex++;
      this.updateDisplayImages();
    }
  }

  prev(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.updateDisplayImages();
    }
  }

  @HostListener('window:resize', [])
  onWindowResize(): void {
    this.updateDisplayImages();
  }

  updateDisplayImages(): void {
    const numVisible = this.getNumVisible();
    const half = Math.floor(numVisible / 2);
    let start = this.currentIndex - half;
    let end = this.currentIndex + half + 1;

    if (start < 0) {
      start = 0;
      end = numVisible;
    }
    if (end > this.images.length) {
      end = this.images.length;
      start = this.images.length - numVisible;
      if (start < 0) start = 0;
    }

    this.displayImages = this.images.slice(start, end);
  }

  getNumVisible(): number {
    const width = window.innerWidth;
    for (let option of this.responsiveOptions) {
      if (width <= parseInt(option.breakpoint, 10)) {
        return option.numVisible;
      }
    }
    return this.numVisible;
  }

  async initalizeImages(): Promise<void> {
    await this.fetchImages();
    this.updateDisplayImages();

  }

  fetchImages(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get<ImageItem[]>('assets/gallery.json').subscribe(
        (data) => {
          this.images = data;
          console.log('Images data loaded:', this.images);
          resolve();
        },
        (error) => {
          console.error('Error loading images:', error);
          reject(error);
        }
      );
    });
  }

}
