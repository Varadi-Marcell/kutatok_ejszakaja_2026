import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ElementRef, ViewChild, HostListener } from '@angular/core';
import { ProgramEvent } from '../../model/program-event';

@Component({
  selector: 'app-program-popup',
  templateUrl: './program-popup.component.html',
  styleUrls: ['./program-popup.component.css']
})
export class ProgramPopupComponent implements OnInit, OnChanges {
  @Input() programs: ProgramEvent[] = [];
  @Input() areaName: string = '';
  @Input() isVisible: boolean = false;
  // Nyelv kívülről (térkép eszköztárból) állítható
  @Input() set language(value: 'hu' | 'en') {
    this.isEnglish = value === 'en';
  }
  // Kereséssel kiválasztott program neve (kiemeléshez)
  @Input() selectedProgramName: string | null = null;
  @Output() close = new EventEmitter<void>();
  // A kártyán belüli nyelvváltást fel kell vinni a szülő (canvas) globális
  // language állapotába, hogy az egész app (navbar, kereső) együtt váltson
  @Output() languageChanged = new EventEmitter<'hu' | 'en'>();

  @ViewChild('popupContent', { static: false }) popupContent!: ElementRef;

  isLoading: boolean = false;
  isEnglish: boolean = false;
  isClosing: boolean = false;

  // Touch/swipe handling
  private startY: number = 0;
  private startX: number = 0;
  private currentY: number = 0;
  private isDragging: boolean = false;
  // Lehuzasos bezaras csak akkor engedelyezett, ha a lista a tetejen van
  private canSwipeClose: boolean = false;

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    // Kereséssel kiválasztott program: görgessünk rá, amint a kártyák megjelentek
    if ((changes['programs'] || changes['selectedProgramName'] || changes['isVisible'])
      && this.isVisible && this.selectedProgramName) {
      this.scrollToSelectedProgram();
    }
  }

  private scrollToSelectedProgram() {
    // Kis késleltetés, hogy a *ngFor kártyák biztosan megjelenjenek a DOM-ban
    setTimeout(() => {
      const content = this.popupContent?.nativeElement as HTMLElement | undefined;
      const selected = content?.querySelector('.program-card.selected') as HTMLElement | null;
      selected?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  }

  toggleLanguage() {
    this.isEnglish = !this.isEnglish;
    this.languageChanged.emit(this.isEnglish ? 'en' : 'hu');
  }

  onClose() {
    if (this.isClosing) return;
    this.isClosing = true;
    setTimeout(() => {
      this.isClosing = false;
      this.close.emit();
    }, 600);
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  onContentClick(event: Event) {
    event.stopPropagation();
  }

  // A touch elttarget goergetheto szulojenek (.popup-body) megkeresese
  private getScrollContainer(event: TouchEvent): HTMLElement | null {
    const target = event.target as HTMLElement | null;
    const content = this.popupContent?.nativeElement as HTMLElement | undefined;
    if (!target || !content) return null;
    const body = content.querySelector(".popup-body") as HTMLElement | null;
    return body && body.contains(target) ? body : null;
  }

  private resetDragStyles() {
    if (this.popupContent) {
      this.popupContent.nativeElement.style.transform = "";
      this.popupContent.nativeElement.style.opacity = "";
    }
  }

  onTouchStart(event: TouchEvent) {
    if (event.touches.length === 1) {
      this.startY = event.touches[0].clientY;
      this.startX = event.touches[0].clientX;
      this.currentY = this.startY;
      this.isDragging = true;
      const scroller = this.getScrollContainer(event);
      this.canSwipeClose = !scroller || scroller.scrollTop <= 0;
      if (this.canSwipeClose && this.popupContent) {
        this.popupContent.nativeElement.style.transition = "none";
      }
    }
  }

  onTouchMove(event: TouchEvent) {
    if (!this.isDragging || event.touches.length !== 1) return;
    this.currentY = event.touches[0].clientY;
    const deltaY = this.currentY - this.startY;
    const deltaX = event.touches[0].clientX - this.startX;
    // Vizszintes mozdulat vagy felfele huzas megszakitja a lehuzast
    if (deltaY <= 0 || Math.abs(deltaX) > Math.abs(deltaY)) {
      this.canSwipeClose = false;
      this.resetDragStyles();
      return;
    }
    if (!this.canSwipeClose) return;
    const translateY = Math.min(deltaY, 200);
    if (this.popupContent) {
      this.popupContent.nativeElement.style.transform = "translateY(" + translateY + "px)";
      const opacity = Math.max(0.3, 1 - (translateY / 300));
      this.popupContent.nativeElement.style.opacity = opacity.toString();
    }
  }

  onTouchEnd(event: TouchEvent) {
    if (!this.isDragging) return;
    const deltaY = this.currentY - this.startY;
    const deltaX = event.changedTouches[0].clientX - this.startX;
    const threshold = 100;
    if (this.popupContent) {
      this.popupContent.nativeElement.style.transition = "";
    }
    // Csak akkor zar be, ha a mozdulat dontoen fuggoleges lehuzas volt
    if (this.canSwipeClose && deltaY > threshold && Math.abs(deltaY) > Math.abs(deltaX)) {
      this.onClose();
    } else {
      this.resetDragStyles();
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
