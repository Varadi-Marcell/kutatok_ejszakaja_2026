import { Component, Input, Output, EventEmitter, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
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

  @ViewChild('popupContent', { static: false }) popupContent!: ElementRef;

  isLoading: boolean = false;
  isEnglish: boolean = false;
  isClosing: boolean = false;

  // Touch/swipe handling
  private startY: number = 0;
  private currentY: number = 0;
  private isDragging: boolean = false;
  private initialTransform: number = 0;

  ngOnInit() {
  }

  toggleLanguage() {
    this.isEnglish = !this.isEnglish;
  }

  onClose() {
    if (this.isClosing) return; // Prevent multiple close calls
    
    this.isClosing = true;
    
    // Wait for closing animation to complete before emitting close
    setTimeout(() => {
      this.isClosing = false;
      this.close.emit();
    }, 600); // Match the animation duration
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

  // Touch event handlers for swipe-to-close
  onTouchStart(event: TouchEvent) {
    if (event.touches.length === 1) {
      this.startY = event.touches[0].clientY;
      this.currentY = this.startY;
      this.isDragging = true;
      this.initialTransform = 0;
      
      // Add transition class for smooth dragging
      if (this.popupContent) {
        this.popupContent.nativeElement.style.transition = 'none';
      }
    }
  }

  onTouchMove(event: TouchEvent) {
    if (!this.isDragging || event.touches.length !== 1) return;

    this.currentY = event.touches[0].clientY;
    const deltaY = this.currentY - this.startY;

    // Only allow downward swipes
    if (deltaY > 0) {
      const translateY = Math.min(deltaY, 200); // Limit the drag distance
      
      if (this.popupContent) {
        this.popupContent.nativeElement.style.transform = `translateY(${translateY}px)`;
        
        // Add some opacity fade effect
        const opacity = Math.max(0.3, 1 - (translateY / 300));
        this.popupContent.nativeElement.style.opacity = opacity.toString();
      }
    }
  }

  onTouchEnd(event: TouchEvent) {
    if (!this.isDragging) return;

    const deltaY = this.currentY - this.startY;
    const threshold = 100; // Minimum distance to trigger close

    // Restore transition
    if (this.popupContent) {
      this.popupContent.nativeElement.style.transition = '';
    }

    if (deltaY > threshold) {
      // Close the popup
      this.onClose();
    } else {
      // Snap back to original position
      if (this.popupContent) {
        this.popupContent.nativeElement.style.transform = '';
        this.popupContent.nativeElement.style.opacity = '';
      }
    }

    this.isDragging = false;
  }

  // Keyboard accessibility
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.isVisible && event.key === 'Escape') {
      this.onClose();
    }
  }
}
