# Life Record Keeper (In-Progress)

## Features
- Auth: signup with name, email verification, login with remember me, logout, forgot password, change password
- Routing: protected user routes, admin guard
- Categories: exactly three per user (Education, Career, Travel), auto-seeded, shown as tabs
- Records: list per category; Add Record modal with title, notes, start/end dates, highlight, tags
- Backend: Firebase Admin token verification, user derived from token; MongoDB models; CORS for Vite
- UX: loading states, clear errors, basic accessibility; CSS load fixed

## Tech Stack
- Client: React, React Router, Firebase Web SDK
- Server: Node, Express, Firebase Admin SDK, Mongoose/MongoDB
- Auth: Firebase Email/Password with email verification

## Development Notes
- Categories are fixed per user. Users cannot create categories.
- Auth state is set immediately on login; role/profile are fetched in the background.
- Add Record opens a modal; on save, the list refreshes.

## Quick Start

### Client
1. Create client/.env:

VITE_API_BASE=http://localhost:3000/api/v1
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_APP_ID=...

2. Install and run:

cd client
npm i
npm run dev

### Server
1. Create `server/.env`:
2. Provide Firebase Admin credentials:
- Download service account key 
- Save as `server/serviceAccount.life-record-keeper-a.json` (ignored by git).
  
Ensure `firebaseAdmin.js` loads from the JSON or env.

3. Install and run:
```bash
cd server
npm i
npm run dev   # nodemon

