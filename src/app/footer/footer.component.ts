import { Component, OnInit } from '@angular/core';
import { ImageItem } from "../model/image-item";
import { HttpClient } from "@angular/common/http";

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent implements OnInit {

  footerButtons = [
    { label: 'Footer Gomb 1', action: 'footerButton1' },
    { label: 'Footer Gomb 2', action: 'footerButton2' },
    { label: 'Footer Gomb 3', action: 'footerButton3' },
    { label: 'Footer Gomb 4', action: 'footerButton4' }
  ];
  responsiveOptions = [
    {
      breakpoint: '1024px',
      numVisible: 5,
    },
    {
      breakpoint: '768px',
      numVisible: 3,
    },
    {
      breakpoint: '560px',
      numVisible: 1,
    },
  ];

  constructor() {
  }

  ngOnInit(): void {
  }

  footerAction(action: string) {
    console.log(action);
  }




}
