# WebAuthn Backend (development)

Simple Express backend that provides WebAuthn registration and authentication endpoints using `@simplewebauthn/server`.

Endpoints:
- `POST /register/options` - body: `{ username }` -> returns registration options
- `POST /register/verify` - body: `{ username, attestation }` -> verify registration
- `POST /auth/options` - body: `{ username }` -> returns authentication options
- `POST /auth/verify` - body: `{ username, assertion }` -> verify authentication

Notes:
- This uses an in-memory store in `users.js`. Replace with a persistent DB for production.
- Default `origin` is `http://localhost:4200` and `rpID` is `localhost`. Adjust for your environment.

Quick start (PowerShell):

```powershell
cd backend
npm install
npm start
```

The server listens on port `4000` by default.
