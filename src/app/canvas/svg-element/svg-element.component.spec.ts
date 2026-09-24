import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { SvgElementComponent } from './svg-element.component';

describe('SvgElementComponent', () => {
  let component: SvgElementComponent;
  let fixture: ComponentFixture<SvgElementComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SvgElementComponent],
      providers: [provideHttpClient()]
    });
    fixture = TestBed.createComponent(SvgElementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // A campus térképen (nagyterkep) alapból nincs badge/jelkulcs, de a
  // metadata.showBadges = true területeknél (pl. Könyvtár / KLM pont) megjelenik
  it('only shows map badges on the campus map for areas with metadata.showBadges', () => {
    component.config = {
      id: 'nagyterkep',
      name: 'Nagy Térkép',
      svgPath: 'assets/nagyterkep_jo.svg',
      viewBox: { x: 0, y: 0, width: 4997, height: 7087 },
      interactiveAreas: [
        {
          id: 'klm',
          name: 'Könyvtár, Levéltár és Múzeum',
          type: 'circle',
          coordinates: { cx: 2220.8, cy: 2762.3, r: 70 },
          metadata: { showBadges: true }
        },
        {
          id: 'emc-labor',
          name: 'Rejtő Ferenc EMC Laboratórium',
          type: 'circle',
          coordinates: { cx: 2742, cy: 630, r: 70 }
        }
      ]
    };
    component.areaFlags = new Map([
      ['klm', { en: true, access: true }],
      ['emc-labor', { en: false, access: true }]
    ]);

    const [klm, emc] = component.config.interactiveAreas;
    // A jelölt terület megkapja az EN + akadálymentesített badge-et...
    expect(component.getAreaBadges(klm).map(b => b.type)).toEqual(['en', 'access']);
    // ...a többi campus-terület viszont marad badge nélkül
    expect(component.getAreaBadges(emc)).toEqual([]);
    // és csak a ténylegesen kirajzolt badge-ekhez jelenik meg jelkulcs
    expect(component.getLegendLayout()).not.toBeNull();
  });

  it('keeps badges and legend off when no campus area opts in', () => {
    component.config = {
      id: 'nagyterkep',
      name: 'Nagy Térkép',
      svgPath: 'assets/nagyterkep_jo.svg',
      viewBox: { x: 0, y: 0, width: 4997, height: 7087 },
      interactiveAreas: [
        {
          id: 'emc-labor',
          name: 'Rejtő Ferenc EMC Laboratórium',
          type: 'circle',
          coordinates: { cx: 2742, cy: 630, r: 70 }
        }
      ]
    };
    component.areaFlags = new Map([['emc-labor', { en: false, access: true }]]);

    expect(component.getAreaBadges(component.config.interactiveAreas[0])).toEqual([]);
    expect(component.getLegendLayout()).toBeNull();
  });
});
