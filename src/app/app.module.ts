import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {CanvasComponent} from "./canvas/canvas/canvas.component";
import {SvgElementComponent} from "./canvas/svg-element/svg-element.component";

@NgModule({
  declarations: [
    AppComponent,
    CanvasComponent,
    SvgElementComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
