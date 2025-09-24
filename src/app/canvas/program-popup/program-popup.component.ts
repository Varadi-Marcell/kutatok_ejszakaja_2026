import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { ProgramEvent } from '../../model/program-event';

@Component({
  selector: 'app-program-popup',
  templateUrl: './program-popup.component.html',
  styleUrls: ['./program-popup.component.css']
})
export class ProgramPopupComponent implements OnInit {
  @Input() programs: ProgramEvent[] = [];
  @Input() areaName: string = '';
  @Input() isVisible: boolean = false;
  @Output() close = new EventEmitter<void>();

  isLoading: boolean = false;

  ngOnInit() {
  }

  onClose() {
    this.close.emit();
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  // Prevent event bubbling when clicking inside the popup content
  onContentClick(event: Event) {
    event.stopPropagation();
  }
}
