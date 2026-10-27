import { Component } from '@angular/core';
import { InboxComponent } from './features/inbox/inbox.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [InboxComponent],
  template: '<app-inbox></app-inbox>'
})
export class AppComponent {}
