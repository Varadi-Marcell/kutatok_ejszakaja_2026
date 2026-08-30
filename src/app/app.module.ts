import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {CanvasComponent} from "./canvas/canvas/canvas.component";
import {SvgElementComponent} from "./canvas/svg-element/svg-element.component";
import {ProgramPopupComponent} from "./canvas/program-popup/program-popup.component";
import {MapToolbarComponent} from "./canvas/map-toolbar/map-toolbar.component";

@NgModule({
  declarations: [
    AppComponent,
    CanvasComponent,
    SvgElementComponent,
    ProgramPopupComponent,
    MapToolbarComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
