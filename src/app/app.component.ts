import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InboxComponent } from './features/inbox/inbox.component';
import { GroupingApprovalsComponent } from './features/grouping-approvals/grouping-approvals.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, InboxComponent, GroupingApprovalsComponent],
  template: `
    <div class="module-switcher">
      <button [class.active]="activeModule() === 'grouping'" (click)="activeModule.set('grouping')">Grouping &amp; Approvals</button>
      <button [class.active]="activeModule() === 'inbox'" (click)="activeModule.set('inbox')">Enterprise Inbox</button>
    </div>
    <app-grouping-approvals *ngIf="activeModule() === 'grouping'"></app-grouping-approvals>
    <app-inbox *ngIf="activeModule() === 'inbox'"></app-inbox>
  `,
  styles: [`
    .module-switcher{height:42px;display:flex;align-items:center;gap:6px;padding:0 18px;background:#10213d;border-bottom:1px solid #314766}
    .module-switcher button{height:29px;padding:0 12px;border:1px solid transparent;border-radius:6px;background:transparent;color:#b9c8df;font:600 11px Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer}
    .module-switcher button.active{background:#eaf0ff;color:#315fd0;border-color:#d7e2ff}
  `]
})
export class AppComponent {
  readonly activeModule = signal<'grouping' | 'inbox'>('grouping');
}