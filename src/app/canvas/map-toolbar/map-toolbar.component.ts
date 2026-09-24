import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs';
import { ProgramEvent } from '../../model/program-event';
import { ProgramSearchService, SearchResultGroup } from '../../services/program-search.service';

// Kedvenc esemeny tarolasara szolgalo bejegyzes (az epulet csak navigacios info)
interface FavoriteEntry {
  programKey: string;
  name: string;
  englishName?: string;
  mapId?: string;
  areaId: string;
  areaName: string;
}

@Component({
  selector: 'app-map-toolbar',
  templateUrl: './map-toolbar.component.html',
  styleUrls: ['./map-toolbar.component.css']
})
export class MapToolbarComponent implements OnInit, OnDestroy {

  // Az aktív térkép azonosítója (a találati listában ez kerül az elejére)
  @Input() currentMapId: string | null = null;
  @Input() language: 'hu' | 'en' = 'hu';

  // Terület/program kiválasztása, nyelvváltás
  @Output() areaSelected = new EventEmitter<{ mapId: string; areaId: string; areaName?: string; program?: ProgramEvent }>();
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
        if (!query.trim()) {
          return of([]);
        }
        return this.programSearchService.searchAllMaps(query, this.currentMapId || undefined);
      })
    ).subscribe({
      next: (results) => {
        this.results = results;
        this.isSearching = false;
        this.showResults = true;
      },
      error: () => {
        // Hiba eseten se ragadjon be a kereso-spinner: ures lista + legordulo bezarasa
        this.results = [];
        this.isSearching = false;
        this.showResults = false;
      }
    });
  }

  ngOnDestroy() {
    if (this.searchSub) {
      this.searchSub.unsubscribe();
    }
  }

  // ===== Keresés =====

  onSearchFocus() {
    this.showSettingsMenu = false;
    this.showFavoritesMenu = false;
    if (this.searchQuery.trim()) {
      this.showResults = true;
    }
  }

  onSearchInput(event: any) {
    this.searchQuery = event.target.value;
    this.showSettingsMenu = false;
    this.showFavoritesMenu = false;
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

  // Találat kiválasztása: szülő komponens térképvált + popupot nyit
  // Ha a programhoz máshol (a kari standnál) kell regisztrálni, oda irányítunk,
  // nem abba az épületbe, ahol a program ténylegesen zajlik
  selectResult(group: SearchResultGroup, program?: ProgramEvent) {
    const target = this.registrationTarget(program);
    this.areaSelected.emit({
      mapId: target?.mapId || group.mapId,
      areaId: target?.areaId || group.areaId,
      areaName: target?.areaName || group.areaName,
      program: program
    });
    this.showResults = false;
  }

  // Ha a programnak van regisztrációs vagy "valódi otthona" (detail_*) átirányítása,
  // azt részesítjük előnyben a találati csoport (épület) helye helyett
  private registrationTarget(program?: ProgramEvent): { mapId: string; areaId: string; areaName?: string } | null {
    if (program?.registration_map_id && program?.registration_area_id) {
      return { mapId: program.registration_map_id, areaId: program.registration_area_id, areaName: program.registration_stand_name };
    }
    if (program?.detail_map_id && program?.detail_area_id) {
      return { mapId: program.detail_map_id, areaId: program.detail_area_id, areaName: program.detail_stand_name };
    }
    return null;
  }

  // Enter: az első találat kiválasztása
  selectFirstResult() {
    if (this.results.length === 0) {
      return;
    }
    const first = this.results[0];
    this.selectResult(first, first.matchedPrograms.length > 0 ? first.matchedPrograms[0] : undefined);
  }

  // ===== Beallitasok / kedvencek =====

  toggleSettings() {
    this.showSettingsMenu = !this.showSettingsMenu;
    this.showFavoritesMenu = false;
    this.showResults = false;
  }

  toggleFavorites() {
    this.showFavoritesMenu = !this.showFavoritesMenu;
    this.showSettingsMenu = false;
    this.showResults = false;
  }

  selectLanguage(lang: 'hu' | 'en') {
    this.languageChanged.emit(lang);
    this.showSettingsMenu = false;
  }

  // ===== Kedvencek (localStorage) - mostantol ESEMENYEKRE =====

  isFavorite(program: ProgramEvent): boolean {
    const key = this.programSearchService.programKey(program);
    return this.favorites.some(f => f.programKey === key);
  }

  toggleFavorite(group: SearchResultGroup, program: ProgramEvent) {
    const key = this.programSearchService.programKey(program);
    if (this.favorites.some(f => f.programKey === key)) {
      this.favorites = this.favorites.filter(f => f.programKey !== key);
      this.showToast(this.language === 'en' ? 'Removed from favorites' : 'Eltávolítva a kedvencekből');
    } else {
      const target = this.registrationTarget(program);
      this.favorites.push({
        programKey: key,
        name: program.name || '',
        englishName: program.english_name || '',
        mapId: target?.mapId || group.mapId,
        areaId: target?.areaId || group.areaId,
        areaName: target?.areaName || group.areaName
      });
      this.showToast(this.language === 'en' ? 'Added to favorites' : 'Hozzáadva a kedvencekhez');
    }
    this.saveFavorites();
  }

  removeFavorite(favorite: FavoriteEntry) {
    this.favorites = this.favorites.filter(f => f.programKey !== favorite.programKey);
    this.saveFavorites();
  }

  selectFavorite(favorite: FavoriteEntry) {
    // A popup kiemelesehez a program neve szukseges
    const program = { name: favorite.name, english_name: favorite.englishName } as ProgramEvent;
    this.areaSelected.emit({
      mapId: favorite.mapId || this.currentMapId || '',
      areaId: favorite.areaId,
      areaName: favorite.areaName,
      program: program
    });
    this.showFavoritesMenu = false;
  }

  private loadFavorites() {
    try {
      const parsed = JSON.parse(localStorage.getItem(this.FAVORITES_KEY) || '[]');
      // regi, epulet-alapu bejegyzesek kiszurese (nincs programKey)
      this.favorites = Array.isArray(parsed) ? parsed.filter((f: any) => f && f.programKey) : [];
    } catch {
      this.favorites = [];
    }
  }

  private saveFavorites() {
    localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(this.favorites));
  }

  // ===== Segedek =====

  showToast(message: string) {
    this.toastMessage = message;
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = setTimeout(() => { this.toastMessage = ''; }, 2500);
  }

  // Kattintas az eszkoztaron kivul: legordulok bezarasa
  @HostListener('document:click')
  onDocumentClick() {
    this.showResults = false;
    this.showSettingsMenu = false;
    this.showFavoritesMenu = false;
  }
}
