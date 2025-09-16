import { Component, Input } from '@angular/core';
import { NgClass, NgIf } from "@angular/common";

@Component({
  selector: 'app-slide-icon',
  standalone: true,
  imports: [
    NgIf,
    NgClass
  ],
  templateUrl: './slide-icon.component.html',
  styleUrl: './slide-icon.component.scss'
})
export class SlideIconComponent {

  @Input("content") content: string;
  @Input("header") header: string;

  isInfoVisible: boolean = false;
  isClosing: boolean;

  showInfo() {
    this.isInfoVisible = true;
  }

  closeInfo(event: Event) {
    event.stopPropagation();
    this.isInfoVisible = false;

    this.isClosing = true;

    setTimeout(() => {
      this.isInfoVisible = false;
      this.isClosing = false;
    }, 300);

  }

}
