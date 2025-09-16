import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CanvasComponent } from "./canvas/canvas/canvas.component";
import { PanoramaViewerComponent } from "./canvas/panorama-viewer/panorama-viewer/panorama-viewer.component";
import { SlideIconComponent } from "./slide-icon/slide-icon.component";

const routes: Routes = [
  {
    path: 'slide',
    component: SlideIconComponent
  },
  {
    path : 'canva',
    component: CanvasComponent
  },
  {
    path : '',
    component: PanoramaViewerComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
