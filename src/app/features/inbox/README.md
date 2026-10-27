# Inbox feature folder — Citi MFE integration

This folder is intentionally isolated so it can be copied into another Angular application.

## Files

- `inbox.component.ts` — standalone Angular component, sample records, mailbox state, AG Grid configuration and demo actions.
- `inbox.component.css` — feature styles, responsive layout and notification animation.

## Copy into Citi MFE

Copy the complete `inbox` folder to:

`src/app/features/inbox/`

The component is standalone and can be imported directly; you do not need to declare it in an NgModule.

In the host component where the inbox should appear:

```ts
import { Component } from '@angular/core';
import { InboxComponent } from './features/inbox/inbox.component';

@Component({
  selector: 'app-some-host',
  standalone: true,
  imports: [InboxComponent],
  template: '<app-inbox></app-inbox>'
})
export class SomeHostComponent {}
```

Adjust the import path to match the host component's location. If your app uses NgModules, import the standalone component into the relevant module's `imports` array or into the standalone page component that renders it.

## Required dependencies

The host MFE must already have compatible Angular packages and AG Grid packages installed:

```bash
npm install ag-grid-angular ag-grid-community
```

This project currently uses AG Grid Community. Check the versions against the host application's Angular and AG Grid versions before installing or upgrading anything.

Ensure the host's global stylesheet imports AG Grid styles once:

```scss
@import 'ag-grid-community/styles/ag-grid.css';
@import 'ag-grid-community/styles/ag-theme-quartz.css';
```

If the host uses a different design system, adapt the colors and typography in `inbox.component.css` to its design tokens. The component includes its own demo header; when embedding it in the Citi MFE, remove or adapt that header if the host application already provides a global header.

## API integration later

The component currently uses five in-memory demo records. Actions reset when the page reloads and are not sent to a server. Before Java microservice integration, move data access behind an `InboxApiService` using Angular `HttpClient`, then replace local actions with service calls once the backend API contracts are defined.

## Demo behavior

Mailbox options: Inbox, Starred, Snoozed, Important, Sent, Drafts, Spam, and Trash. The grid includes sorting, filtering, pagination and row selection. Clicking a record opens its detail panel. Moving a record to Trash asks for confirmation.
