# Recon Portal — Enterprise Inbox MFE

Standalone Angular inbox/request-management feature designed to be integrated into the Recon Portal MFE later. The initial version uses local sample data; no Java API is required yet.

## Features

- Gmail-inspired mailbox navigation: Inbox, Starred, Snoozed, Important, Sent, Drafts, Spam, and Trash.
- Header notification indicator with unread badge and animation for new notifications.
- AG Grid request list with sorting, filtering, pagination, and row selection.
- Five sample request records for development/demo use.
- Request details and demo mailbox actions backed by local state.
- Responsive enterprise-oriented styling.

## Run locally

Prerequisites: Node.js LTS and npm.

```bash
git clone https://github.com/ddldmlproject-glitch/recon-portal.git
cd recon-portal
npm install
npm start
```

Open `http://localhost:4200` if that is the port configured by the Angular dev server. If the repository is currently empty, add the standalone project files from the `enterprise-inbox-starter.zip` starter before running these commands.

For a production build:

```bash
npm run build
```

## Current scope and backend integration

This is a UI-first implementation. Data and actions are local demo state and do not persist across reloads. There are no Java microservice APIs wired yet. Keep API access behind an `InboxApiService` using Angular `HttpClient`; when backend contracts are available, replace the sample-data implementation and connect read/unread, approval, star, trash, and notification updates to real endpoints.

For live notification delivery, choose polling, Server-Sent Events, or WebSockets based on the Java service capabilities. Do not treat the animated badge itself as evidence of a backend notification.

## MFE integration notes

Keep inbox components and styles encapsulated. When integrating into the host MFE, reuse the host header, routing conventions, theme tokens, and icon library rather than mounting a second application shell. Avoid modifying unrelated DML/DDL functionality.
