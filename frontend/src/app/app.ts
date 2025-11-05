import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatComponent } from './app/chat/chat';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ChatComponent],
  template: `
    <div class="container">
      <div class="card">
        <div class="header">
        </div>
        <app-chat></app-chat>
      </div>
    </div>
  `,
})
export class AppComponent {}
