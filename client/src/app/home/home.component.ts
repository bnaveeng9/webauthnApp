import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
currentComponent: string = ''; // Tracks which component to show

  // Method to toggle components
  showComponent(component: string) {
    this.currentComponent = component;
  }
}
