# Enterprise Inbox MFE — Implementation Plan

## Product intent

Build a standalone, enterprise-grade request mailbox inspired by common mail clients, not a pixel-for-pixel Gmail copy. The Inbox view uses AG Grid to display operational requests similar to the supplied request-management screenshot.

## Navigation

- Inbox
- Starred
- Snoozed
- Important
- Sent
- Drafts
- Spam
- Trash

Every folder must show records appropriate to that folder. Empty folders should show an explicit empty state rather than unrelated records.

## Header notification behavior

- Place a mail/inbox icon in the host application's top-right header area.
- Show a badge with the number of unread/new notifications.
- Animate the indicator only when the unread count increases or a new notification is detected; stop/reduce motion when the user opens the panel or marks items read.
- Include an accessible label and respect `prefers-reduced-motion`.
- For the initial demo, use sample state only. Do not imply that notifications are live from a backend.

## Inbox table

Use AG Grid with sample records (4–5) and columns that align with the screenshot:

- Request ID
- Action Tool
- Action Type
- Request Status
- Source Status
- Created By
- Details
- Comments
- Created Date
- Actioned By
- Action Comments

Provide sorting, filtering, pagination, row selection, and responsive horizontal/vertical scrolling. Selecting a row should open a request detail view or side panel.

## Demo actions

Support local-state interactions for read/unread, star/unstar, mark important, move to trash, and demo approval where appropriate. Confirm destructive actions before moving/deleting a request. Data is not persisted and is reset on reload unless local persistence is intentionally added.

## Engineering requirements

- Angular standalone components and typed TypeScript interfaces.
- Encapsulated inbox feature; do not alter existing DML/DDL behavior.
- Keep data access in a dedicated `InboxApiService`, initially backed by an in-memory mock/data provider.
- Keep the future API contract isolated so a Java microservice integration can replace the mock without rewriting the UI.
- Include loading, error, empty, and success states for future API integration.
- Avoid unnecessary new UI libraries; use dependencies already present in the host project where practical.
- Use the host MFE's header, route conventions, design tokens, and icon library during final integration.

## Future Java API integration

Once endpoint contracts are available, implement the relevant service methods for listing records, unread count, mark read/unread, star/important, move-to-trash, approve/reject, and notification updates. Select polling, Server-Sent Events, or WebSockets based on backend capability and operational requirements.

## Validation checklist

- All mailbox options filter correctly.
- Inbox displays 4–5 realistic sample records.
- AG Grid fills the available content area and scrolls to the bottom without clipping.
- Badge count is based on unread sample records.
- Animation is triggered by new/unread changes and respects reduced-motion preferences.
- Destructive actions require confirmation.
- UI adapts to small screens.
- Build and lint/test scripts pass before integration.
