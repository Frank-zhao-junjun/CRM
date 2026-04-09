# Frank's CRM Demo

A lightweight, browser-based Customer Relationship Management (CRM) demo system.

## Features

- **Dashboard** – Key metrics at a glance: total customers, active leads, revenue, and pending tasks
- **Customers** – Full customer list with search, status filter, add/edit/delete support
- **Leads Pipeline** – Kanban-style drag-and-drop pipeline with five stages: New → Contacted → Qualified → Proposal → Closed Won
- **Contacts** – Contact directory with search and add/edit/delete
- **Tasks** – Task tracker with priority levels, due dates, and one-click completion
- **Reports** – Bar charts for customer status breakdown, lead pipeline summary, and revenue by customer

## Getting Started

Open `index.html` directly in any modern browser – no server or build step required.

All data is stored in the browser's `localStorage` and pre-seeded with sample demo data on first load.

## Tech Stack

- Vanilla HTML / CSS / JavaScript (no frameworks or dependencies)
- Canvas API for charts
- localStorage for data persistence
