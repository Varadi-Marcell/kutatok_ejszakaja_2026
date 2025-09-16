import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Panorama } from "../../model/panorama";

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss'
})
export class SidenavComponent implements OnInit {

  isCollapsed: boolean = false;
  // panoramas = [
  //   {
  //     id: 2,
  //     name: 'Panoráma 2',
  //     file: 'assets/panorama2.jpg',
  //     category: 'Budapest',
  //     infoPoint: {
  //       id: 1,
  //       name: 'Infópont 1',
  //       position: {
  //         theta: (3 * Math.PI) / 2,
  //         phi: Math.PI / 2,
  //       },
  //       header: 'Információs pont 1',
  //       content: 'Ez egy információs pont.\nEz egy információs pont...',
  //       isOpen: false,
  //     },
  //     navigationPoint: {
  //       id: 1,
  //       name: 'Panoráma 2',
  //       position: {
  //         theta: (3.8 * Math.PI) / 2,
  //         phi: Math.PI / 2,
  //       },
  //       header: 'Panoráma 2',
  //     }
  //   },
  //   {
  //     id: 3,
  //     name: 'Panoráma 3',
  //     file: 'assets/panorama3.jpg',
  //     category: 'Budapest',
  //     infoPoint: {
  //       id: 2,
  //       name: 'Infópont 2',
  //       position: {
  //         theta: (4 * Math.PI) / 2,
  //         phi: Math.PI / 2,
  //         z: -1000,
  //       },
  //       header: 'Információs pont 2',
  //       content: 'Ez egy másik információs pont.',
  //       isOpen: false,
  //     },
  //     navigationPoint: {
  //       id: 2,
  //       name: 'Panoráma 3',
  //       position: {
  //         theta: (4.2 * Math.PI) / 2,
  //         phi: Math.PI / 2,
  //       },
  //       header: 'Panoráma 3',
  //     }
  //   },
  //   {
  //     id: 4,
  //     name: 'Panoráma 4',
  //     file: 'assets/panorama4.jpg',
  //     category: 'Budapest',
  //     infoPoint: {
  //       id: 3,
  //       name: 'Infópont 3',
  //       position: {
  //         theta: (4.5 * Math.PI) / 2,
  //         phi: Math.PI / 2,
  //       },
  //       header: 'Információs pont 3',
  //       content: 'Ez egy újabb információs pont.',
  //       isOpen: false,
  //     },
  //     navigationPoint: {
  //       id: 3,
  //       name: 'Panoráma 4',
  //       position: {
  //         theta: (4.5 * Math.PI) / 2,
  //         phi: Math.PI / 2,
  //       },
  //       header: 'Panoráma 4',
  //     }
  //   },
  //   {
  //     id: 5,
  //     name: 'Panoráma 5',
  //     file: 'assets/jpeg5.jpg',
  //     category: 'Budapest',
  //     infoPoint: {
  //       id: 4,
  //       name: 'Infópont 4',
  //       position: {
  //         theta: (5 * Math.PI) / 2,
  //         phi: Math.PI / 2,
  //       },
  //       header: 'Információs pont 4',
  //       content: 'Ez egy újabb információs pont.',
  //       isOpen: false,
  //     },
  //     navigationPoint: {
  //       id: 4,
  //       name: 'Panoráma 5',
  //       position: {
  //         theta: (5 * Math.PI) / 2,
  //         phi: Math.PI / 2,
  //       },
  //       header: 'Panoráma 5',
  //     }
  //   }
  // ];

  panoramas: Panorama[] = [];

  @Output() panoramaSelected = new EventEmitter<{ name: string; file: string }>();

  constructor(private http: HttpClient) {
  }
  ngOnInit(): void {
    this.initializePanoramas();
  }
  selectPanorama(panorama: { name: string; file: string }) {
    this.panoramaSelected.emit(panorama);
  }

  async initializePanoramas(): Promise<void> {
    await this.fetchPanoramas();
    if (this.panoramas.length > 0) {
      this.panoramaSelected.emit(this.panoramas[0]);
    }
  }

  fetchPanoramas(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get<Panorama[]>('assets/panoramas.json').subscribe(
        (data) => {
          this.panoramas = data;
          console.log('Panorama data loaded:', this.panoramas);
          resolve();
        },
        (error) => {
          console.error('Error loading panoramas:', error);
          reject(error);
        }
      );
    });
  }


}
