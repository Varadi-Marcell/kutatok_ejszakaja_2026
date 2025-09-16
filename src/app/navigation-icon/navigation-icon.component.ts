import { Component, Input } from '@angular/core';
import { NgIf } from "@angular/common";

@Component({
  selector: 'app-navigation-icon',
  standalone: true,
  imports: [
    NgIf
  ],
  templateUrl: './navigation-icon.component.html',
  styleUrl: './navigation-icon.component.scss'
})
export class NavigationIconComponent {

  @Input("header") header: string;

}
