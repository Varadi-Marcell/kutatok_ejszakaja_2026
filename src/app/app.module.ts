import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {RwdImageMaps} from "./rwd-image-maps.directive";
import {HttpClientModule} from "@angular/common/http";
import { CanvasComponent } from './canvas/canvas/canvas.component';
import { SvgElementComponent } from './canvas/svg-element/svg-element.component';
import { PanoramaViewerComponent } from './canvas/panorama-viewer/panorama-viewer/panorama-viewer.component';
import { MatListModule } from "@angular/material/list";
import { MatSidenavModule } from "@angular/material/sidenav";
import { CollapseModule } from "ngx-bootstrap/collapse";
import { TreeViewModule } from "@syncfusion/ej2-angular-navigations";
import { SlideIconComponent } from "./slide-icon/slide-icon.component";
import { NavigationIconComponent } from "./navigation-icon/navigation-icon.component";
import { FooterComponent } from "./footer/footer.component";
import { SidenavComponent } from "./canvas/sidenav/sidenav.component";
import { NgxSpinnerModule } from "ngx-spinner";
import { CustomCarouselComponent } from "./footer/custom-carousel/custom-carousel.component";
import { NavbarComponent } from "./canvas/navbar/navbar.component";
@NgModule({
  declarations: [
    AppComponent,
    RwdImageMaps,
    RwdImageMaps,
    CanvasComponent,
    SvgElementComponent,
    PanoramaViewerComponent,
    SidenavComponent,
    CustomCarouselComponent,
    FooterComponent,
    NavbarComponent

  ],
  imports: [
    BrowserModule,
    CollapseModule.forRoot(),
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    MatListModule,
    TreeViewModule,
    MatSidenavModule,
    SlideIconComponent,
    NavigationIconComponent,
    NgxSpinnerModule.forRoot({type: 'ball-scale-multiple'})

  ],
  providers: [],
  exports: [
    CustomCarouselComponent
  ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
