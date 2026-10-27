# Recon Portal — Enterprise Inbox MFE

Angular 18 standalone starter for a Gmail-inspired enterprise request mailbox. The inbox table uses AG Grid and currently runs on local sample data; Java microservice APIs are not connected yet.

## Requirements
- Node.js 20.11+ recommended for Angular 18
- npm (installed with Node.js)

## Run locally

```bash
git clone https://github.com/ddldmlproject-glitch/recon-portal.git
cd recon-portal
git checkout feature/enterprise-inbox
npm install
npm start
```

Open http://localhost:4200.

If you already cloned the repository, run `git fetch origin` and then `git checkout feature/enterprise-inbox` before `npm install`.

## Included
- Inbox, Starred, Snoozed, Important, Sent, Drafts, Spam and Trash navigation
- Animated unread notification indicator and count
- AG Grid with five sample requests, sorting, filtering, pagination and row selection
- Request detail drawer with demo star, approve and move-to-trash actions
- Confirmation before moving a record to Trash
- Responsive layout and reduced-motion support

## Notes
Actions are local demo state and reset on page reload. No API, database, authentication or live notification transport is connected. When Java endpoints are ready, add an Angular HttpClient-based InboxApiService and replace the sample data provider. Keep the inbox isolated when integrating with the host MFE so its existing header, routes, theme and DML/DDL features are not replaced.

## Build

```bash
npm run build
```
