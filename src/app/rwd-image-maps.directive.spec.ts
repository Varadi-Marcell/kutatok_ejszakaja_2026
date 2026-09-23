import { ElementRef, Renderer2 } from '@angular/core';

import { RwdImageMaps } from './rwd-image-maps.directive';

describe('RwdImageMaps', () => {
  it('should create an instance', () => {
    const el = { nativeElement: document.createElement('img') } as ElementRef;
    const directive = new RwdImageMaps(el, null as unknown as Renderer2);
    expect(directive).toBeTruthy();
  });
});
