import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SlideIconComponent } from './slide-icon.component';

describe('SlideIconComponent', () => {
  let component: SlideIconComponent;
  let fixture: ComponentFixture<SlideIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SlideIconComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SlideIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
