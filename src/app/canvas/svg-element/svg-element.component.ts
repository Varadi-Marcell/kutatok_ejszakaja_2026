import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-svg-element',
  templateUrl: './svg-element.component.html',
  styleUrls: ['./svg-element.component.css']
})
export class SvgElementComponent implements AfterViewInit{


  @ViewChild('svgElement', { static: true }) svgElement: ElementRef<SVGElement>;

  imageSrc = 'assets/nagyterkep_jo2_kisebb.svg'; // Update the path to your image
  svgWidth: number;
  svgHeight: number;

  // Define polygons and rectangles with IDs for grouping
  elements = [
    {
      id: 'group1',
      polygon: {
        d: 'm 2075.7813,1399.4961 -54.004,77.3789 -297.2734,425.1367 -36.7539,-25.75 -47.875,-33.625 -29.1289,-20.3789 297.2734,-425.1367 29.375,20.75 54.0039,-77.375 z m 0,0',
        cssClass: 'polygon'
      },
      rectangle: {
        x: 1419.9997,
        y: 1242.299,
        width: 108.7012,
        height: 70.801,
        fillStyle: 'none',
        strokeStyle: '#000000',
        strokeWidth: 5.1151,
        transform: 'matrix(1.250094, 0, 0, 1.250038, 0, 0.0784362)'
      }
    },
    {
      id: 'group2',
      polygon: {
        d: 'm 2059.2813,1046.2344 h -50.879 c -12.5039,0 -22.6289,-10.125 -22.6289,-22.625 v -50.87503 c 0,-12.5 10.125,-22.625 22.6289,-22.625 h 50.879 c 12.5,0 22.625,10.125 22.625,22.625 v 50.87503 c 0,12.5 -10.125,22.625 -22.625,22.625 z m 0,0',
        cssClass: 'polygon'
      },
      rectangle: {
        x: 1457.8,
        y: 727.39924,
        width: 108.7012,
        height: 70.80094,
        fillStyle: 'none',
        strokeStyle: '#000000',
        strokeWidth: 5.1151,
        transform: 'matrix(1.250094, 0, 0, 1.250038, 0, 0.0784362)'
      }
    },
    {
      id: 'groupA6',
      polygon: {
        d:'m 1726.3789,1323.9961 -37.8789,54 -19.875,-13.75 -25,35.625 20,13.75 -39.1289,56.7539 -72.7539,-50.6289 -24.5039,35.6289 73.5078,51 -37.8789,55.125 -19.875,-13.875 -25.0039,36.0039 19.2539,13.125 -39.8789,57 -72.0078,-50.125 -152.5117,219.3789 -15.25,-10.25 -24.125,35.6289 -9.625,-6.5 24.5,-35.6289 -32.504,-22.625 152.3868,-219.5078 39.5039,-57 24.8789,-36 38.375,-54.7539 24.5039,-35.625 39.375,-56.375 24.5039,-36.0039 38.0039,-54 z m 0,0',
        cssClass: 'polygon'
      },
      rectangle: {
        x: 1457.8,
        y: 727.39924,
        width: 108.7012,
        height: 70.80094,
        fillStyle: 'none',
        strokeStyle: '#000000',
        strokeWidth: 5.1151,
        transform: 'matrix(1.250094, 0, 0, 1.250038, 0, 0.0784362)'
      }
    }
  ];

  ngAfterViewInit() {
    const image = new Image();
    image.src = this.imageSrc;
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

  handleGroupClick(group) {
    alert(`${group.id} clicked!`);
  }

}
