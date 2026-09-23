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
});
