import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs';
import { SvgMapConfig } from '../../model/svg-map-config';
import { ProgramEvent } from '../../model/program-event';
import { ProgramSearchService, SearchResultGroup } from '../../services/program-search.service';

// Kedvencek tárolására szolgáló bejegyzés
interface FavoriteEntry {
  areaId: string;
  areaName: string;
}

@Component({
  selector: 'app-map-toolbar',
  templateUrl: './map-toolbar.component.html',
  styleUrls: ['./map-toolbar.component.css']
})
export class MapToolbarComponent implements OnInit, OnDestroy {

  // Az aktív térkép konfigurációja (a keresés ehhez tartozó programokat indexeli)
  @Input() config: SvgMapConfig | null = null;
  @Input() language: 'hu' | 'en' = 'hu';

  // Terület kiválasztása (keresési találat vagy kedvenc), nyelvváltás
  @Output() areaSelected = new EventEmitter<{ areaId: string; program?: ProgramEvent }>();
  @Output() languageChanged = new EventEmitter<'hu' | 'en'>();

  searchQuery: string = '';
  results: SearchResultGroup[] = [];
  isSearching: boolean = false;
  showResults: boolean = false;
  showSettingsMenu: boolean = false;
  showFavoritesMenu: boolean = false;
  toastMessage: string = '';
  favorites: FavoriteEntry[] = [];

  private searchSubject = new Subject<string>();
  private searchSub?: any;
  private toastTimeout: any = null;
  private readonly FAVORITES_KEY = 'kutatok_ejszakaja_favorites';

  constructor(private programSearchService: ProgramSearchService) { }

  ngOnInit() {
    this.loadFavorites();

    // Keresés debounce-olva, hogy ne bombázzuk a JSON-okat minden leütésre
    this.searchSub = this.searchSubject.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      tap(() => { this.isSearching = this.searchQuery.trim().length > 0; }),
      switchMap(query => {
        if (!query.trim() || !this.config) {
          return of([]);
        }
        return this.programSearchService.searchPrograms(query, this.config);
      })
    ).subscribe(results => {
      this.results = results;
      this.isSearching = false;
      this.showResults = true;
    });
  }

  ngOnDestroy() {
    if (this.searchSub) {
      this.searchSub.unsubscribe();
    }
  }

  // ===== Keresés =====

  onSearchInput(event: any) {
    this.searchQuery = event.target.value;
    if (!this.searchQuery.trim()) {
      this.results = [];
      this.showResults = false;
      this.isSearching = false;
      return;
    }
    this.searchSubject.next(this.searchQuery);
  }

  clearSearch() {
    this.searchQuery = '';
    this.results = [];
    this.showResults = false;
    this.isSearching = false;
  }

  // Találat kiválasztása: szülő komponens rázoomol + popupot nyit
  selectResult(group: SearchResultGroup, program?: ProgramEvent) {
    this.areaSelected.emit({ areaId: group.areaId, program: program });
    this.showResults = false;
  }

  // Enter: az első találat kiválasztása
  selectFirstResult() {
    if (this.results.length === 0) {
      return;
    }
    const first = this.results[0];
    this.selectResult(first, first.matchedPrograms.length > 0 ? first.matchedPrograms[0] : undefined);
  }

  // ===== Megosztás / beállítások / kedvencek =====

  // Megosztás: az oldal linkje a vágólapra
  sharePage() {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(
        () => this.showToast('A link a vágólapra másolva!'),
        () => this.showToast('A link: ' + url)
      );
    } else {
      this.showToast('A link: ' + url);
    }
  }

  toggleSettings() {
    this.showSettingsMenu = !this.showSettingsMenu;
    this.showFavoritesMenu = false;
  }

  toggleFavorites() {
    this.showFavoritesMenu = !this.showFavoritesMenu;
    this.showSettingsMenu = false;
  }

  selectLanguage(lang: 'hu' | 'en') {
    this.languageChanged.emit(lang);
    this.showSettingsMenu = false;
  }

  // ===== Kedvencek (localStorage) =====

  isFavorite(areaId: string): boolean {
    return this.favorites.some(f => f.areaId === areaId);
  }

  toggleFavorite(group: SearchResultGroup) {
    if (this.isFavorite(group.areaId)) {
      this.favorites = this.favorites.filter(f => f.areaId !== group.areaId);
      this.showToast('Eltávolítva a kedvencekből');
    } else {
      this.favorites.push({ areaId: group.areaId, areaName: group.areaName });
      this.showToast('Hozzáadva a kedvencekhez');
    }
    this.saveFavorites();
  }

  removeFavorite(favorite: FavoriteEntry) {
    this.favorites = this.favorites.filter(f => f.areaId !== favorite.areaId);
    this.saveFavorites();
  }

  selectFavorite(favorite: FavoriteEntry) {
    this.areaSelected.emit({ areaId: favorite.areaId });
    this.showFavoritesMenu = false;
  }

  private loadFavorites() {
    try {
      this.favorites = JSON.parse(localStorage.getItem(this.FAVORITES_KEY) || '[]');
    } catch {
      this.favorites = [];
    }
  }

  private saveFavorites() {
    localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(this.favorites));
  }

  // ===== Segédek =====

  showToast(message: string) {
    this.toastMessage = message;
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = setTimeout(() => { this.toastMessage = ''; }, 2500);
  }

  // Kattintás az eszköztáron kívül: legördülők bezárása
  @HostListener('document:click')
  onDocumentClick() {
    this.showResults = false;
    this.showSettingsMenu = false;
    this.showFavoritesMenu = false;
  }
}